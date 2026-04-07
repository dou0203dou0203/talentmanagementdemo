import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import { payrollMutations } from '../lib/mutations';
import type { PayrollRecord } from '../types';

interface ParsedRow {
  staffName: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  details: any;
}

interface MatchResult extends ParsedRow {
  userId: string;
  matchedName: string;
  confidence: 'high' | 'low' | 'none';
}

export default function PayrollImport() {
  const { users, addPayrollRecords } = useData();
  const { permissions } = useAuth();
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isEditingKey, setIsEditingKey] = useState(!localStorage.getItem('gemini_api_key'));
  const [yearMonth, setYearMonth] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!permissions.canEditEvaluation && !permissions.canViewHRInfo) {
    return <div style={{ padding: 20 }}>アクセス権限がありません。</div>;
  }

  const saveApiKey = () => {
    if (!apiKey) return;
    localStorage.setItem('gemini_api_key', apiKey);
    setIsEditingKey(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file || !yearMonth || !apiKey) {
      alert('ファイル、対象年月、APIキーがすべて設定されているか確認してください。');
      return;
    }
    
    setIsProcessing(true);
    setResults(null);
    try {
      setProcessStatus('ファイルを読み込んでいます...');
      
      let promptContent: any[] = [];
      const promptText = `
あなたは優秀な人事アシスタントです。提供された給与支給控除一覧（文字列 または PDF）から、スタッフごとの給与情報を抽出してください。
必ず以下のJSON形式の配列のみを出力してください（Markdownの\`\`\`json などは不要です。純粋なJSON配列だけを返してください）。

[
  {
    "staffName": "氏名",
    "baseSalary": 200000,
    "allowances": 50000,
    "deductions": 30000,
    "netPay": 220000,
    "details": { "残業手当": 30000, "交通費": 20000, "健保": ... }
  }
]

- 氏名の途中のスペースは削除して詰めてください。
- 数値は必ず数値型（カンマなし）にしてください。
- 誰のデータかわからない行（合計行など）は除外してください。
`;

      if (file.type === 'application/pdf') {
        // Read PDF as base64
        setProcessStatus('PDFをGeminiに送信しています...');
        const base64Str = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });

        promptContent = [
          promptText,
          { inlineData: { data: base64Str, mimeType: 'application/pdf' } }
        ];
      } else {
        // Read Excel as CSV text via SheetJS
        setProcessStatus('Excelを解析してテキスト化しています...');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        // Use the first sheet or combine all sheets
        let csvText = '';
        for (const sheetName of workbook.SheetNames) {
          csvText += `\n--- Sheet: ${sheetName} ---\n`;
          csvText += XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        }
        
        promptContent = [
          promptText,
          `以下がファイルの内容（CSV形式）です:\n${csvText}`
        ];
      }

      setProcessStatus('AIが給与データを抽出しています（約10〜30秒お待ち下さい）...');
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });
      const result = await model.generateContent(promptContent);
      const responseText = result.response.text();
      
      let parsedData: ParsedRow[] = [];
      try {
        parsedData = JSON.parse(responseText.trim());
      } catch (e) {
        console.error('JSON Parse Error:', responseText);
        throw new Error('AIが不正な形式のデータを返しました。');
      }

      setProcessStatus('スタッフとの紐付けを行っています...');
      
      // Matching Logic
      const matchedData: MatchResult[] = parsedData.map(row => {
        const cleanName = row.staffName.replace(/\s+/g, '');
        // Exact match
        let matchedUser = users.find(u => u.name.replace(/\s+/g, '') === cleanName);
        let confidence: 'high'|'low'|'none' = matchedUser ? 'high' : 'none';
        
        // Very basic fuzzy match (includes)
        if (!matchedUser) {
          matchedUser = users.find(u => 
            u.name.replace(/\s+/g, '').includes(cleanName) || 
            cleanName.includes(u.name.replace(/\s+/g, ''))
          );
          if (matchedUser) confidence = 'low';
        }

        return {
          ...row,
          userId: matchedUser?.id || '',
          matchedName: matchedUser?.name || '不明',
          confidence
        };
      });

      setResults(matchedData);

    } catch (e: any) {
      alert(`処理に失敗しました: ${e.message}`);
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  const handleSave = async () => {
    if (!results) return;
    
    // Filter out rows with no matching user
    const validRecords = results.filter(r => r.userId);
    if (validRecords.length === 0) {
      alert('保存可能なデータがありません。');
      return;
    }

    if (!confirm(`${validRecords.length}件の給与レコードを保存します。よろしいですか？`)) return;

    setIsSaving(true);
    const payloads = validRecords.map(r => ({
      id: `pr-${r.userId}-${yearMonth}`,
      user_id: r.userId,
      year_month: yearMonth,
      base_salary: r.baseSalary || 0,
      allowances: r.allowances || 0,
      deductions: r.deductions || 0,
      net_pay: r.netPay || 0,
      details_json: r.details || {}
    }));

    const res = await payrollMutations.addRecords(payloads);
    if (res.success) {
      // Mock DataContext addition for instant state update
      addPayrollRecords(payloads as PayrollRecord[]);
      alert('保存が完了しました！');
      setResults(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      alert('保存に失敗しました: ' + res.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <h2 className="page-title">給与データAI自動取込</h2>
      <p className="page-subtitle">
        毎月の給与一覧（Excel/CSV/PDF）をGemini AIが自動解析し、スタッフと紐付けてデータベースに蓄積します。
      </p>

      {/* Gemini API Key Config */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #4f46e5' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Gemini API キー設定</h3>
            {!isEditingKey && (
              <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setIsEditingKey(true)}>
                キーを変更
              </button>
            )}
          </div>
          
          {isEditingKey ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                type="password" 
                className="form-input" 
                placeholder="AIzaSy..." 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={saveApiKey}>保存（ブラウザ内）</button>
            </div>
          ) : (
            <div style={{ color: '#16a34a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ APIキーがブラウザに設定されています
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
         <div className="card-body">
           <div className="grid-2">
             <div className="form-group">
               <label className="form-label">対象年月</label>
               <input 
                 type="month" 
                 className="form-input" 
                 value={yearMonth} 
                 onChange={e => setYearMonth(e.target.value)} 
               />
             </div>
             <div className="form-group">
               <label className="form-label">アップロードするファイル</label>
               <input 
                 type="file" 
                 accept=".xlsx,.xls,.csv,.pdf" 
                 className="form-input" 
                 onChange={handleFileChange}
                 ref={fileInputRef}
                 style={{ padding: '8px' }}
               />
               <p className="form-help">ExcelまたはPDFファイルに対応しています。</p>
             </div>
           </div>

           <div style={{ marginTop: 24, textAlign: 'right' }}>
             <button 
                className="btn btn-primary" 
                disabled={isProcessing || !file || !yearMonth || !apiKey}
                onClick={handleProcess}
                style={{ minWidth: 200 }}
             >
               {isProcessing ? '処理中...' : 'AIで解析・紐付けを実行 ✨'}
             </button>
           </div>
           
           {isProcessing && (
             <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8, textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>
                <span className="spinner" style={{ marginRight: 8 }}>🔄</span>
                {processStatus}
             </div>
           )}
         </div>
      </div>

      {results && (
        <div className="card fade-in">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">解析・紐付け結果一覧</h3>
            <span className="badge badge-primary">{results.length}件のデータ</span>
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>解析された氏名</th>
                    <th>紐付いたスタッフ（DB）</th>
                    <th>一致度</th>
                    <th>基本給</th>
                    <th>手当計</th>
                    <th>控除計</th>
                    <th>差引支給額（手取）</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.staffName}</td>
                      <td>
                        {r.userId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar" style={{ width: 24, height: 24 }}>{r.matchedName.charAt(0)}</div>
                            <span style={{ fontWeight: 500 }}>{r.matchedName}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#dc2626' }}>（登録なし）</span>
                        )}
                      </td>
                      <td>
                        {r.confidence === 'high' && <span className="badge badge-success">完全一致</span>}
                        {r.confidence === 'low' && <span className="badge badge-warning" title="名字のみ等で部分一致した可能性があります">部分一致</span>}
                        {r.confidence === 'none' && <span className="badge badge-danger">一致なし</span>}
                      </td>
                      <td>¥{r.baseSalary?.toLocaleString() || 0}</td>
                      <td>¥{r.allowances?.toLocaleString() || 0}</td>
                      <td>¥{r.deductions?.toLocaleString() || 0}</td>
                      <td style={{ fontWeight: 600, color: '#2563eb' }}>¥{r.netPay?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: '#fef3c7', borderRadius: 8, borderLeft: '4px solid #f59e0b', fontSize: '0.9rem' }}>
              <strong>確認：</strong> 上記の内容でデータベースに保存します。「一致なし」のデータはスキップされます。
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '12px 32px', fontSize: '1.1rem' }}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '上記の内容でデータベースに保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
