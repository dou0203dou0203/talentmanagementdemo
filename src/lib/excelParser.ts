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
  return (s || '').toString().replace(/[\s\u3000]+/g, '').trim();
}

function isEmployeeLabel(text: string): boolean {
  const l = toMatchKey(text);
  return l.includes('従業員') || l.includes('氏名') || l.includes('社員名');
}

function isExcludedWord(text: string): boolean {
  return EXCLUDED_WORDS.has(toMatchKey(text));
}

export async function processExcelBuffer(buffer: ArrayBuffer, yearMonth: string, users: User[]) {
  // 1. ユーザー辞書を作成
  const nameList = users.map(u => ({ key: toMatchKey(u.name), name: u.name, id: u.id }))
    .filter(e => e.key.length >= 2 && !isExcludedWord(e.key));
  nameList.sort((a, b) => b.key.length - a.key.length);

  // 2. Excelファイルを読み込む
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  
  // シートを二次元配列に変換（空セルは空文字にする）
  const grid = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

  const allDbRecords: { user_id: string; year_month: string; item_name: string; amount: number }[] = [];
  const allMatchedUsers: { name: string; id: string }[] = [];
  const allUnmatchedNames: string[] = [];
  const usedUserIds = new Set<string>();

  // (A) 従業員行を特定し、列ごとにユーザーをマッピング
  const colToUserId: Record<number, string> = {};

  for (let r = 0; r < grid.length; r++) {
    const rowHeader = (grid[r][0] || '').toString();
    if (!isEmployeeLabel(rowHeader)) continue;
    console.log(`[Excel Parser] 従業員行発見: 行${r}`);

    for (let c = 1; c < grid[r].length; c++) {
      const cellText = (grid[r][c] || '').toString().trim();
      if (!cellText || cellText === '-') continue;

      // 除外チェック
      if (isExcludedWord(cellText)) continue;
      if (/^[\d\-.\s\/\\()（）]+$/.test(cellText)) continue;
      
      const cellKey = toMatchKey(cellText);
      let matched = false;
      for (const entry of nameList) {
        if (usedUserIds.has(entry.id)) continue;
        if (cellKey.includes(entry.key) || entry.key.includes(cellKey)) {
          colToUserId[c] = entry.id;
          usedUserIds.add(entry.id);
          allMatchedUsers.push({ name: entry.name, id: entry.id });
          console.log(`[Excel Parser] ✅ 列${c}: "${cellText}" → ${entry.name}`);
          matched = true;
          break;
        }
      }
      if (!matched) {
        allUnmatchedNames.push(cellText);
        console.log(`[Excel Parser] ❌ 列${c}: "${cellText}" (未マッチ)`);
      }
    }
    // 最初の従業員行だけでマッピング完了とする（サンプル表構造ベース）
    break; 
  }

  // (B) データ行からDBレコードを抽出
  for (let r = 0; r < grid.length; r++) {
    const label = toMatchKey((grid[r][0] || '').toString());
    if (!SAVE_ITEMS.has(label)) continue;

    for (const [colStr, userId] of Object.entries(colToUserId)) {
      const colIdx = parseInt(colStr, 10);
      const cellVal = (grid[r][colIdx] || '').toString().replace(/[,\s]/g, '');
      const amount = parseFloat(cellVal);
      if (!isNaN(amount)) {
        allDbRecords.push({ user_id: userId, year_month: yearMonth, item_name: label, amount });
      }
    }
  }

  // 今回はExcelをそのまま保存するので、Excel再生成は不要ですが、一応ファイルはそのまま返します
  const excelBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const downloadUrl = URL.createObjectURL(excelBlob);

  return { downloadUrl, dbRecords: allDbRecords, mappedCount: allMatchedUsers.length, unmatchedNames: allUnmatchedNames };
}
