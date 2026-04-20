import * as XLSX from 'xlsx';
import type { User } from '../types';

const SAVE_ITEMS = new Set([
  '支給合計', '控除合計', '差引支給合計',
  '課税支給合計', '非課税支給合計', '社会保険料合計',
]);

const EXCLUDED_WORDS = new Set([
  '番号', '合計', '番号合計', '従業員', '従業員番号', '氏名', '社員名',
  '支給', '控除', '差引', '課税', '非課税', '社会保険', '社会保険料',
  '支給合計', '控除合計', '差引支給合計', '課税支給合計', '非課税支給合計', '社会保険料合計',
  '基本給', '時間外', '通勤手当', '所得税', '住民税', '健康保険', '厚生年金',
  '雇用保険', '介護保険', '事業所', '部署', '役職', '総合計',
]);

function toMatchKey(s: string): string {
  return (s || '').replace(/[\s\u3000]+/g, '').trim();
}

function isEmployeeLabel(text: string): boolean {
  const l = toMatchKey(text);
  return l.includes('従業員') || l.includes('氏名') || l.includes('社員名');
}

function isExcludedWord(text: string): boolean {
  return EXCLUDED_WORDS.has(toMatchKey(text));
}

// =========================================================================
// サーバーにPDFを送信し、pdfplumberで解析済みテーブルを受け取る
// =========================================================================
async function parsePdfViaServer(file: File): Promise<string[][][]> {
  const formData = new FormData();
  formData.append('file', file);

  // ローカル開発: Express経由、本番(XServer): PHP経由
  const apiUrl = import.meta.env.DEV
    ? 'http://localhost:3001/api/payroll/parse'
    : '/api/parse_payroll.php';
  const res = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'サーバーエラー' }));
    throw new Error(err.error || `サーバーエラー (${res.status})`);
  }

  const data = await res.json();
  console.log('[Payroll] pdfplumber解析結果:', data.totalPages, 'ページ,', data.totalRows, '行');
  return data.pages as string[][][];
}

// =========================================================================
// メイン処理
// =========================================================================
export async function processPayrollFrontend(file: File, yearMonth: string, users: User[]) {
  // 1. ユーザー辞書
  const nameList = users.map(u => ({ key: toMatchKey(u.name), name: u.name, id: u.id }))
    .filter(e => e.key.length >= 2 && !isExcludedWord(e.key));
  nameList.sort((a, b) => b.key.length - a.key.length);

  // 2. サーバーでPDF解析 → クリーンなテーブルデータを取得
  const pages = await parsePdfViaServer(file);

  const allDbRecords: { user_id: string; year_month: string; item_name: string; amount: number }[] = [];
  const allMatchedUsers: { name: string; id: string }[] = [];
  const allUnmatchedNames: string[] = [];
  const usedUserIds = new Set<string>();
  const excelRows: string[][] = [];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const grid = pages[pageIdx]; // すでに行×列の2D配列
    console.log(`[Payroll] === ページ ${pageIdx + 1} (${grid.length} 行 × ${grid[0]?.length || 0} 列) ===`);

    // デバッグ: 最初の3行
    grid.slice(0, 3).forEach((row, i) => {
      console.log(`[Payroll] 行${i}:`, row.map(c => c || '(空)').join(' | '));
    });

    // (A) 従業員行を特定し、列ごとにユーザーをマッピング
    const colToUserId: Record<number, string> = {};

    for (let r = 0; r < grid.length; r++) {
      if (!isEmployeeLabel(grid[r][0] || '')) continue;
      console.log(`[Payroll] 従業員行: 行${r}`);

      for (let c = 1; c < grid[r].length; c++) {
        const cellText = (grid[r][c] || '').trim();
        if (!cellText) continue;

        // 除外チェック
        if (isExcludedWord(cellText)) continue;
        if (/^[\d\-.\s\/\\()（）]+$/.test(cellText)) continue;
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(cellText)) continue;

        // 照合
        const cellKey = toMatchKey(cellText);
        let matched = false;
        for (const entry of nameList) {
          if (usedUserIds.has(entry.id)) continue;
          if (cellKey.includes(entry.key) || entry.key.includes(cellKey)) {
            colToUserId[c] = entry.id;
            usedUserIds.add(entry.id);
            allMatchedUsers.push({ name: entry.name, id: entry.id });
            console.log(`[Payroll] ✅ 列${c}: "${cellText}" → ${entry.name}`);
            matched = true;
            break;
          }
        }
        if (!matched) {
          allUnmatchedNames.push(cellText);
          console.log(`[Payroll] ❌ 列${c}: "${cellText}" (未マッチ)`);
        }
      }
      break; // 従業員行は1ページに1つ
    }

    // (B) データ行 → DBレコード抽出（列番号で正確にマッチ）
    for (let r = 0; r < grid.length; r++) {
      const label = toMatchKey(grid[r][0] || '');
      if (!SAVE_ITEMS.has(label)) continue;

      for (const [colStr, userId] of Object.entries(colToUserId)) {
        const colIdx = parseInt(colStr, 10);
        const cellVal = (grid[r][colIdx] || '').replace(/[,\s]/g, '');
        const amount = parseFloat(cellVal);
        if (!isNaN(amount)) {
          allDbRecords.push({ user_id: userId, year_month: yearMonth, item_name: label, amount });
        }
      }
    }

    // (C) Excel用データ
    for (const row of grid) {
      excelRows.push(row);
    }
  }

  console.log('[Payroll] 合計:', allMatchedUsers.length, '名マッチ,', allDbRecords.length, 'DBレコード');

  // 3. Excel生成
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  ws['!cols'] = excelRows[0]?.map(() => ({ wch: 16 })) || [];
  XLSX.utils.book_append_sheet(wb, ws, '支給控除一覧');
  const excelArray = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const excelBlob = new Blob([excelArray], { type: 'application/octet-stream' });
  const downloadUrl = URL.createObjectURL(excelBlob);

  return { downloadUrl, dbRecords: allDbRecords, mappedCount: allMatchedUsers.length, unmatchedNames: allUnmatchedNames };
}
