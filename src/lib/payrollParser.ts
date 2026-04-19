import * as pdfjsLib from 'pdfjs-dist';
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline';
import * as XLSX from 'xlsx';
import type { User } from '../types';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker();

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

function maskName(name: string): string {
  const n = (name || '').replace(/\u3000/g, ' ').trim();
  if (!n) return '●●';
  return n.split(/[\s\u3000]+/).map(p => '●'.repeat(p.length)).join(' ');
}

// =========================================================================
// ページ単位でPDFを解析
// =========================================================================
interface TextItem { str: string; x: number; }
interface PageLine { items: TextItem[]; }
interface PageData { lines: PageLine[]; }

async function extractPages(pdf: any): Promise<PageData[]> {
  const pages: PageData[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as any[];

    items.sort((a: any, b: any) => {
      const yA = a.transform[5], yB = b.transform[5];
      if (Math.abs(yA - yB) > 2) return yB - yA;
      return a.transform[4] - b.transform[4];
    });

    // 行ごとにグループ化（Y座標が近い → 同じ行）
    const lines: PageLine[] = [];
    let currentItems: TextItem[] = [];
    let lastY = -1;
    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== -1 && Math.abs(lastY - y) > 2) {
        if (currentItems.length > 0) lines.push({ items: currentItems });
        currentItems = [];
      }
      if (item.str.trim()) currentItems.push({ str: item.str, x: item.transform[4] });
      lastY = y;
    }
    if (currentItems.length > 0) lines.push({ items: currentItems });
    pages.push({ lines });
  }
  return pages;
}

// =========================================================================
// メイン処理
// =========================================================================
export async function processPayrollFrontend(file: File, yearMonth: string, users: User[]) {
  // 1. ユーザー名辞書
  const nameList = users.map(u => ({ key: toMatchKey(u.name), name: u.name, id: u.id }))
    .filter(e => e.key.length >= 2 && !isExcludedWord(e.key));
  // 長い名前を先にマッチ（部分一致の衝突防止）
  nameList.sort((a, b) => b.key.length - a.key.length);

  console.log('[Payroll] ユーザー数:', users.length, ', 照合エントリ:', nameList.length);

  // 2. PDF解析（ページ単位）
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const pages = await extractPages(pdf);
  console.log('[Payroll] ページ数:', pages.length);

  // 3. ページごとに処理
  const allDbRecords: { user_id: string; year_month: string; item_name: string; amount: number }[] = [];
  const allMatchedUsers: { name: string; id: string }[] = [];
  const allUnmatchedNames: string[] = [];
  const usedUserIds = new Set<string>();

  // Excel用の全行データ
  const excelRows: string[][] = [];
  // 従業員行のExcel行インデックスを記録
  const employeeExcelRowIndices: number[] = [];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    console.log(`[Payroll] === ページ ${pageIdx + 1} (${page.lines.length} 行) ===`);

    // (A) 従業員行を見つけて、名前を順番に抽出
    type NameSlot = { userId: string; name: string; order: number };
    const nameSlots: NameSlot[] = [];
    let employeeLineLocalIdx = -1;

    for (let li = 0; li < page.lines.length; li++) {
      const line = page.lines[li];
      const firstItem = line.items[0]?.str || '';
      if (!isEmployeeLabel(firstItem)) continue;
      employeeLineLocalIdx = li;

      // 行のフルテキスト（スペース除去）を作成
      let fullText = line.items.map(it => toMatchKey(it.str)).join('');

      // 除外語を除去（同じ長さの□に置換）
      for (const ew of EXCLUDED_WORDS) {
        fullText = fullText.replaceAll(ew, '□'.repeat(ew.length));
      }

      console.log(`[Payroll] 従業員行(行${li}):`, fullText);

      // 登録ユーザー名を検索（見つかった順番で記録）
      let order = 0;
      for (const entry of nameList) {
        if (usedUserIds.has(entry.id)) continue;
        const idx = fullText.indexOf(entry.key);
        if (idx === -1) continue;

        nameSlots.push({ userId: entry.id, name: entry.name, order: idx });
        usedUserIds.add(entry.id);
        fullText = fullText.slice(0, idx) + '□'.repeat(entry.key.length) + fullText.slice(idx + entry.key.length);
        order++;
      }

      // 未マッチの日本語テキストを収集
      const leftover = fullText.replace(/□/g, '').replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '').trim();
      if (leftover.length > 0) {
        allUnmatchedNames.push(leftover);
        console.log(`[Payroll] ❌ 未マッチ (P${pageIdx + 1}): "${leftover}"`);
      }

      break; // このページの従業員行は1つだけ
    }

    // 出現位置（idx）でソート → 左から右の順番
    nameSlots.sort((a, b) => a.order - b.order);

    for (const ns of nameSlots) {
      console.log(`[Payroll] ✅ P${pageIdx + 1}: "${ns.name}" → ${ns.userId}`);
      allMatchedUsers.push({ name: ns.name, id: ns.userId });
    }

    // (B) データ行から数値を順番に抽出し、nameSlots と順番でマッチ
    for (const line of page.lines) {
      const label = toMatchKey(line.items[0]?.str || '');
      if (!SAVE_ITEMS.has(label)) continue;

      // 数値アイテムだけをX位置順に収集
      const numValues: number[] = [];
      for (const item of line.items.slice(1)) {
        const numStr = item.str.replace(/[,\s]/g, '');
        const val = parseFloat(numStr);
        if (!isNaN(val)) numValues.push(val);
      }

      // 順番でマッチ: i番目の名前 ↔ i番目の数値
      for (let i = 0; i < Math.min(nameSlots.length, numValues.length); i++) {
        allDbRecords.push({
          user_id: nameSlots[i].userId,
          year_month: yearMonth,
          item_name: label,
          amount: numValues[i],
        });
      }
    }

    // (C) Excel用データを蓄積
    for (let li = 0; li < page.lines.length; li++) {
      const line = page.lines[li];
      const cells = line.items.map(it => it.str.trim()).filter(Boolean);
      const excelRowIdx = excelRows.length;

      // 従業員行ならインデックスを記録
      if (li === employeeLineLocalIdx) {
        employeeExcelRowIndices.push(excelRowIdx);
      }
      excelRows.push(cells);
    }
  }

  console.log('[Payroll] 全ページ合計:', allMatchedUsers.length, '名マッチ,', allDbRecords.length, 'DBレコード');

  // 4. Excel の従業員行だけマスキング
  const empRowSet = new Set(employeeExcelRowIndices);
  for (let r = 0; r < excelRows.length; r++) {
    if (!empRowSet.has(r)) continue;
    const row = excelRows[r];
    for (let c = 0; c < row.length; c++) {
      const cellKey = toMatchKey(row[c]);
      if (!cellKey) continue;
      // マッチ済みユーザー → UID
      const mu = allMatchedUsers.find(u => cellKey.includes(toMatchKey(u.name)));
      if (mu) { row[c] = `UID:${mu.id}`; continue; }
      // 従業員行内の未マッチ日本語 → マスキング
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(row[c]) && !isEmployeeLabel(row[c]) && !isExcludedWord(row[c])) {
        row[c] = maskName(row[c]);
      }
    }
  }

  // 5. Excelファイル生成
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  ws['!cols'] = [{ wch: 24 }, ...Array(10).fill({ wch: 14 })];
  XLSX.utils.book_append_sheet(wb, ws, '支給控除一覧');
  const excelArray = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const excelBlob = new Blob([excelArray], { type: 'application/octet-stream' });
  const downloadUrl = URL.createObjectURL(excelBlob);

  return { downloadUrl, dbRecords: allDbRecords, mappedCount: allMatchedUsers.length, unmatchedNames: allUnmatchedNames };
}
