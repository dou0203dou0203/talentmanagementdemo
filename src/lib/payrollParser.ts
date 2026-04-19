import * as pdfjsLib from 'pdfjs-dist';
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline';
import * as XLSX from 'xlsx';
import type { User } from '../types';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker();

const SAVE_ITEMS = new Set([
  '支給合計', '控除合計', '差引支給合計',
  '課税支給合計', '非課税支給合計', '社会保険料合計',
]);

/** すべてのスペース（全角・半角）を除去して比較用キーを作る */
function toMatchKey(name: string): string {
  return (name || '').replace(/[\s\u3000]+/g, '').trim();
}

/** 表示用に正規化 */
function normalizeName(name: string): string {
  return (name || '').replace(/\u3000/g, ' ').trim();
}

function maskName(name: string) {
  const normalized = normalizeName(name);
  if (!normalized) return '●●';
  return normalized.split(/[\s\u3000]+/).map(p => '●'.repeat(p.length)).join(' ');
}

/**
 * ユーザーリストから複数の照合キーを持つ辞書を構築する
 * - フルネーム（スペースなし）: "山田太郎"
 * - フルネーム（半角スペース）: "山田 太郎"
 * - 姓のみ（3文字以上の場合のみ、誤マッチ防止）
 */
function buildNameDictionary(users: User[]): Map<string, string> {
  const dict = new Map<string, string>();
  for (const u of users) {
    // スペースなしの完全一致キー
    dict.set(toMatchKey(u.name), u.id);
    // 正規化済み（半角スペース区切り）
    dict.set(normalizeName(u.name), u.id);
    // 姓のみ（3文字以上で、他のユーザーと被らない場合）
    const parts = u.name.replace(/\u3000/g, ' ').trim().split(/\s+/);
    if (parts.length > 0 && parts[0].length >= 3) {
      if (!dict.has(parts[0])) {
        dict.set(parts[0], u.id);
      }
    }
  }
  return dict;
}

/** PDFから抽出した名前を辞書で照合する */
function findUserId(pdfName: string, dict: Map<string, string>): string | undefined {
  // 1. スペースなし完全一致
  const key1 = toMatchKey(pdfName);
  if (dict.has(key1)) return dict.get(key1);
  // 2. 正規化済み一致
  const key2 = normalizeName(pdfName);
  if (dict.has(key2)) return dict.get(key2);
  // 3. 姓のみ一致（3文字以上）
  const surname = pdfName.replace(/[\s\u3000]+/g, '').slice(0, 3);
  if (surname.length >= 3 && dict.has(surname)) return dict.get(surname);
  return undefined;
}

/** 「従業員」行かどうかを判定（部分一致） */
function isEmployeeRow(label: string): boolean {
  const l = (label || '').replace(/[\s\u3000]+/g, '');
  return l.includes('従業員') || l.includes('氏名') || l.includes('社員');
}

export async function processPayrollFrontend(file: File, yearMonth: string, users: User[]) {
  const nameDict = buildNameDictionary(users);
  console.log('[Payroll] 照合辞書を構築:', nameDict.size, 'キー,', users.length, 'ユーザー');

  // 1. Read PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

  const allRows: any[][] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as any[];

    // Y座標（降順）→ X座標（昇順）でソート
    items.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 2) return yB - yA;
      return a.transform[4] - b.transform[4];
    });

    // 行ごとにグループ化
    const lineGroups: any[][] = [];
    let currentLine: any[] = [];
    let lastY = -1;
    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== -1 && Math.abs(lastY - y) > 2) {
        if (currentLine.length > 0) lineGroups.push(currentLine);
        currentLine = [];
      }
      currentLine.push(item);
      lastY = y;
    }
    if (currentLine.length > 0) lineGroups.push(currentLine);

    // 各行内で、X開始座標の差分を見てセル分割する
    for (const lineItems of lineGroups) {
      if (lineItems.length <= 1) {
        const text = lineItems[0]?.str?.trim();
        if (text) allRows.push([text]);
        continue;
      }

      // 全テキスト断片間のX開始座標の差分を収集
      const xGaps: number[] = [];
      for (let j = 1; j < lineItems.length; j++) {
        const gap = lineItems[j].transform[4] - lineItems[j - 1].transform[4];
        xGaps.push(gap);
      }

      // 動的閾値: ギャップをソートし、中央値の3倍を閾値とする
      // （列間の距離は文字間の距離の数倍以上あるはず）
      const sortedGaps = [...xGaps].sort((a, b) => a - b);
      const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] || 10;
      const threshold = Math.max(medianGap * 2.5, 20); // 最低20pt

      const cells: string[] = [];
      let cellText = lineItems[0].str;
      for (let j = 1; j < lineItems.length; j++) {
        const xGap = lineItems[j].transform[4] - lineItems[j - 1].transform[4];
        if (xGap >= threshold) {
          // 新しい列
          cells.push(cellText.trim());
          cellText = '';
        } else if (xGap > 2) {
          // 同じセル内だが少しスペースあり → 半角スペース挿入
          cellText += ' ';
        }
        cellText += lineItems[j].str;
      }
      if (cellText.trim()) cells.push(cellText.trim());
      if (cells.length > 0) allRows.push(cells);
    }
  }

  // 旧形式のrows互換（allRowsがそのままrows）
  const rows = allRows;

  console.log('[Payroll] PDF解析完了:', rows.length, '行');
  // デバッグ: 最初の10行のセル構造を出力
  rows.slice(0, 10).forEach((row, i) => {
    console.log(`[Payroll] 行${i}: [${row.length}列]`, row.map((c: any) => `"${c}"`).join(' | '));
  });

  // 3. Tokenize — 従業員行を探して名前照合
  const colToUserId: Record<number, string> = {};
  const unmatchedNames: string[] = [];
  const tokenized = rows.map(row => {
    const newRow = [...row];
    if (isEmployeeRow(row[0] as string)) {
      console.log('[Payroll] 従業員行を検出:', row.slice(1));
      for (let i = 1; i < row.length; i++) {
        const rawName = (row[i] as string || '').trim();
        // スキップ: 空、ハイフンのみ、数字・記号だけの値（従業員番号など）
        if (!rawName || rawName === '-') continue;
        // 数字・ハイフン・ドット・スラッシュのみで構成 → 従業員番号・コード類
        if (/^[\d\-.\s\/\\]+$/.test(rawName)) continue;
        // 日本語文字（漢字・ひらがな・カタカナ）を1文字も含まない → 名前ではない
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(rawName)) continue;
        const userId = findUserId(rawName, nameDict);
        if (userId) {
          colToUserId[i] = userId;
          newRow[i] = `UID:${userId}`;
          console.log(`[Payroll] ✅ マッチ: "${rawName}" → ${userId}`);
        } else {
          newRow[i] = maskName(rawName);
          unmatchedNames.push(rawName);
          console.log(`[Payroll] ❌ 未マッチ: "${rawName}"`);
        }
      }
    }
    return newRow;
  });

  console.log('[Payroll] 紐づけ結果:', Object.keys(colToUserId).length, '名マッチ,', unmatchedNames.length, '名未マッチ');
  if (unmatchedNames.length > 0) {
    console.log('[Payroll] 未マッチの名前一覧:', unmatchedNames);
  }

  // 4. Build Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(tokenized);
  ws['!cols'] = [{ wch: 24 }, ...Array(10).fill({ wch: 14 })];
  XLSX.utils.book_append_sheet(wb, ws, '支給控除一覧');
  
  const excelArray = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const excelBlob = new Blob([excelArray], { type: 'application/octet-stream' });
  const downloadUrl = URL.createObjectURL(excelBlob);

  // 5. Extract Records for DB
  const dbRecords: { user_id: string; year_month: string; item_name: string; amount: number }[] = [];
  for (const row of rows) {
    const item = (row[0] || '').replace(/\n/g, '').trim();
    if (!SAVE_ITEMS.has(item)) continue;
    for (const [colIdxStr, userId] of Object.entries(colToUserId)) {
      const colIdx = parseInt(colIdxStr, 10);
      const raw = row[colIdx];
      const amount = raw ? parseFloat(String(raw).replace(/[,\s]/g, '')) : null;
      if (amount !== null && !isNaN(amount)) {
        dbRecords.push({ user_id: userId, year_month: yearMonth, item_name: item, amount });
      }
    }
  }

  return { downloadUrl, dbRecords, mappedCount: Object.keys(colToUserId).length, unmatchedNames };
}
