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

/** 従業員番号パターン（00-101, 01-003 等）→ 読み取りから除外 */
function isEmployeeNumber(text: string): boolean {
  const t = text.trim();
  // 数字-数字 のパターン（00-101, 1-23, 01-003 等）
  if (/^\d{1,4}[\-ー]\d{1,4}$/.test(t)) return true;
  // No. や # 付きのコード
  if (/^(No\.?|#)\s*\d+$/i.test(t)) return true;
  return false;
}

// =========================================================================
// Step 1: PDFからテキストアイテムをページ→行→アイテムで抽出
// =========================================================================
interface TItem { str: string; x: number; }
interface TRow { items: TItem[]; }

async function extractPageRows(pdf: any): Promise<TRow[][]> {
  const allPages: TRow[][] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as any[];

    // Y降順 → X昇順 ソート
    items.sort((a: any, b: any) => {
      const yA = a.transform[5], yB = b.transform[5];
      if (Math.abs(yA - yB) > 2) return yB - yA;
      return a.transform[4] - b.transform[4];
    });

    const rows: TRow[] = [];
    let curItems: TItem[] = [];
    let lastY = -1;
    for (const it of items) {
      const y = it.transform[5];
      if (lastY !== -1 && Math.abs(lastY - y) > 2) {
        if (curItems.length > 0) rows.push({ items: curItems });
        curItems = [];
      }
      if (it.str.trim() && !isEmployeeNumber(it.str)) curItems.push({ str: it.str, x: it.transform[4] });
      lastY = y;
    }
    if (curItems.length > 0) rows.push({ items: curItems });
    allPages.push(rows);
  }
  return allPages;
}

// =========================================================================
// Step 2: 列構造を検出し、2Dグリッドを構築（空白セルを保持）
// =========================================================================
/**
 * ページ内の全アイテムのX座標を集めてクラスタリングし、
 * 列の境界（各列の代表X値）を決定する。
 */
function detectColumns(rows: TRow[], expectedColsHint?: number): number[] {
  if (rows.length === 0) return [];

  // Step 1: データ行から「期待される列数」と「列間隔」を分析
  const dataGaps: number[] = [];
  const itemCounts: number[] = [];
  for (const row of rows) {
    const numericItems = row.items.filter(it => /[\d,]+/.test(it.str) && parseFloat(it.str.replace(/[,\s]/g, '')) > 0);
    if (numericItems.length >= 2) {
      itemCounts.push(row.items.length);
      const sorted = [...numericItems].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        dataGaps.push(sorted[i].x - sorted[i - 1].x);
      }
    }
  }

  // 期待列数: 外部指定があればそれを使用、なければデータ行の最頻値
  let expectedCols = expectedColsHint || 0;
  if (expectedCols === 0 && itemCounts.length > 0) {
    const freq = new Map<number, number>();
    for (const n of itemCounts) freq.set(n, (freq.get(n) || 0) + 1);
    let maxFreq = 0;
    for (const [n, f] of freq) { if (f > maxFreq) { maxFreq = f; expectedCols = n; } }
  }

  let colSpacing = 50;
  if (dataGaps.length > 0) {
    dataGaps.sort((a, b) => a - b);
    colSpacing = dataGaps[Math.floor(dataGaps.length / 2)];
  }
  const CLUSTER_THRESHOLD = Math.max(colSpacing * 0.4, 10);
  console.log(`[Payroll] 列間隔中央値: ${colSpacing.toFixed(1)}pt, 閾値: ${CLUSTER_THRESHOLD.toFixed(1)}pt, 期待列数: ${expectedCols}`);

  // Step 2: 全アイテムのX座標をクラスタリング
  const allX: number[] = [];
  for (const row of rows) {
    for (const item of row.items) allX.push(item.x);
  }
  if (allX.length === 0) return [];

  allX.sort((a, b) => a - b);
  let clusters: number[][] = [[allX[0]]];

  for (let i = 1; i < allX.length; i++) {
    const lastCluster = clusters[clusters.length - 1];
    const clusterCenter = lastCluster[Math.floor(lastCluster.length / 2)];
    if (allX[i] - clusterCenter <= CLUSTER_THRESHOLD) {
      lastCluster.push(allX[i]);
    } else {
      clusters.push([allX[i]]);
    }
  }

  // Step 3: クラスタ数が期待列数より多い場合、最も近いクラスタ同士を統合
  if (expectedCols > 0) {
    while (clusters.length > expectedCols) {
      // 隣接クラスタ間の距離を計算し、最小の間隔を見つける
      let minGap = Infinity;
      let mergeIdx = 0;
      for (let i = 1; i < clusters.length; i++) {
        const prevCenter = clusters[i - 1][Math.floor(clusters[i - 1].length / 2)];
        const currCenter = clusters[i][Math.floor(clusters[i].length / 2)];
        const gap = currCenter - prevCenter;
        if (gap < minGap) { minGap = gap; mergeIdx = i; }
      }
      // 統合
      clusters[mergeIdx - 1] = [...clusters[mergeIdx - 1], ...clusters[mergeIdx]];
      clusters.splice(mergeIdx, 1);
    }
  }

  const colPositions = clusters.map(c => c[Math.floor(c.length / 2)]);
  console.log(`[Payroll] 最終列数: ${colPositions.length}`);
  return colPositions;
}

/**
 * テキストアイテムを列位置に割り当てて、空白セル付きの2Dグリッドにする
 */
function buildGrid(rows: TRow[], colPositions: number[]): string[][] {
  const grid: string[][] = [];
  for (const row of rows) {
    const cells = new Array(colPositions.length).fill('');
    for (const item of row.items) {
      // 最も近い列を見つける
      let bestCol = 0;
      let bestDist = Math.abs(item.x - colPositions[0]);
      for (let c = 1; c < colPositions.length; c++) {
        const d = Math.abs(item.x - colPositions[c]);
        if (d < bestDist) { bestDist = d; bestCol = c; }
      }
      // 同一列に既にテキストがあれば結合（同じ列内の複数アイテム）
      if (cells[bestCol]) {
        cells[bestCol] += ' ' + item.str.trim();
      } else {
        cells[bestCol] = item.str.trim();
      }
    }
    grid.push(cells);
  }
  return grid;
}

// =========================================================================
// Step 3: メイン処理
// =========================================================================
export async function processPayrollFrontend(file: File, yearMonth: string, users: User[]) {
  // ユーザー辞書
  const nameList = users.map(u => ({ key: toMatchKey(u.name), name: u.name, id: u.id }))
    .filter(e => e.key.length >= 2 && !isExcludedWord(e.key));
  nameList.sort((a, b) => b.key.length - a.key.length);

  // PDF解析
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const allPages = await extractPageRows(pdf);

  const allDbRecords: { user_id: string; year_month: string; item_name: string; amount: number }[] = [];
  const allMatchedUsers: { name: string; id: string }[] = [];
  const allUnmatchedNames: string[] = [];
  const usedUserIds = new Set<string>();
  const allGrids: string[][][] = []; // ページごとのグリッド
  let page1ColCount = 0; // 1ページ目の列数を記録

  for (let pageIdx = 0; pageIdx < allPages.length; pageIdx++) {
    const pageRows = allPages[pageIdx];
    console.log(`[Payroll] === ページ ${pageIdx + 1} (${pageRows.length} 行) ===`);

    // (A) 列構造を検出 → 2Dグリッドに変換
    // 1ページ目の列数を基準として2ページ目以降に共有
    const colPositions = detectColumns(pageRows, pageIdx > 0 ? page1ColCount : undefined);
    if (pageIdx === 0) page1ColCount = colPositions.length;
    const grid = buildGrid(pageRows, colPositions);
    allGrids.push(grid);

    console.log(`[Payroll] 列数: ${colPositions.length}, 行数: ${grid.length}`);
    // デバッグ: 最初の3行を出力
    grid.slice(0, 3).forEach((row, i) => {
      console.log(`[Payroll] 行${i}:`, row.map(c => c || '(空)').join(' | '));
    });

    // (B) 従業員行を特定し、各列のユーザーIDをマッピング
    // colToUserId[列番号] = userId
    const colToUserId: Record<number, string> = {};

    for (let r = 0; r < grid.length; r++) {
      if (!isEmployeeLabel(grid[r][0])) continue;
      console.log(`[Payroll] 従業員行: 行${r}`);

      for (let c = 1; c < grid[r].length; c++) {
        const cellText = grid[r][c].trim();
        if (!cellText) continue; // 空白セルはスキップ

        // 除外語チェック
        const cellKey = toMatchKey(cellText);
        if (isExcludedWord(cellText)) continue;
        if (/^[\d\-.\s\/\\()（）]+$/.test(cellText)) continue;
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(cellText)) continue;

        // 登録ユーザーと照合
        let matched = false;
        for (const entry of nameList) {
          if (usedUserIds.has(entry.id)) continue;
          if (cellKey.includes(entry.key) || entry.key.includes(cellKey)) {
            colToUserId[c] = entry.id;
            usedUserIds.add(entry.id);
            allMatchedUsers.push({ name: entry.name, id: entry.id });
            console.log(`[Payroll] ✅ 列${c}: "${cellText}" → ${entry.name} (${entry.id})`);
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

    // (C) データ行からDBレコードを抽出（列番号で正確にマッチ）
    for (let r = 0; r < grid.length; r++) {
      const label = toMatchKey(grid[r][0]);
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
  }

  console.log('[Payroll] 合計:', allMatchedUsers.length, '名マッチ,', allDbRecords.length, 'DBレコード');

  // (D) 全ページのグリッドを結合してExcel出力
  const excelRows: string[][] = [];
  for (const grid of allGrids) {
    for (const row of grid) {
      excelRows.push(row);
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  // 列幅を設定
  ws['!cols'] = excelRows[0]?.map(() => ({ wch: 16 })) || [];
  XLSX.utils.book_append_sheet(wb, ws, '支給控除一覧');
  const excelArray = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const excelBlob = new Blob([excelArray], { type: 'application/octet-stream' });
  const downloadUrl = URL.createObjectURL(excelBlob);

  return { downloadUrl, dbRecords: allDbRecords, mappedCount: allMatchedUsers.length, unmatchedNames: allUnmatchedNames };
}
