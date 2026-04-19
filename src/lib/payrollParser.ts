import * as pdfjsLib from 'pdfjs-dist';
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline';
import * as XLSX from 'xlsx';
import type { User } from '../types';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker();

const SAVE_ITEMS = new Set([
  '支給合計', '控除合計', '差引支給合計',
  '課税支給合計', '非課税支給合計', '社会保険料合計',
]);

function toMatchKey(name: string): string {
  return (name || '').replace(/[\s\u3000]+/g, '').trim();
}

function maskName(name: string) {
  const n = (name || '').replace(/\u3000/g, ' ').trim();
  if (!n) return '●●';
  return n.split(/[\s\u3000]+/).map(p => '●'.repeat(p.length)).join(' ');
}

/** 「従業員」行かどうかを判定（部分一致） */
function isEmployeeLabel(text: string): boolean {
  const l = (text || '').replace(/[\s\u3000]+/g, '');
  return l.includes('従業員') || l.includes('氏名') || l.includes('社員名');
}

/** 給与PDFに頻出するが人名ではない単語を除外 */
const EXCLUDED_WORDS = new Set([
  '番号', '合計', '番号合計', '従業員', '従業員番号', '氏名', '社員名',
  '支給', '控除', '差引', '課税', '非課税', '社会保険', '社会保険料',
  '支給合計', '控除合計', '差引支給合計', '課税支給合計', '非課税支給合計', '社会保険料合計',
  '基本給', '時間外', '通勤手当', '所得税', '住民税', '健康保険', '厚生年金',
  '雇用保険', '介護保険', '事業所', '部署', '役職', '総合計',
]);

function isExcludedWord(text: string): boolean {
  const key = text.replace(/[\s\u3000]+/g, '').trim();
  return EXCLUDED_WORDS.has(key);
}

/** 数字・記号のみ（従業員番号等）→ 名前ではない */
function isCodeOrNumber(text: string): boolean {
  return /^[\d\-.\s\/\\()（）]+$/.test(text.trim());
}

/** 日本語の人名らしいか */
function looksLikeJapaneseName(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

// =========================================================================
// PDFの各行を「テキストアイテム群」として構造化
// =========================================================================
interface LineData {
  items: { str: string; x: number }[];
  fullText: string; // 全結合（スペースなし）
}

function extractLines(pdf: any): Promise<LineData[]> {
  return (async () => {
    const lines: LineData[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const items = content.items as any[];

      items.sort((a: any, b: any) => {
        const yA = a.transform[5], yB = b.transform[5];
        if (Math.abs(yA - yB) > 2) return yB - yA;
        return a.transform[4] - b.transform[4];
      });

      let currentLine: { str: string; x: number }[] = [];
      let lastY = -1;
      for (const item of items) {
        const y = item.transform[5], x = item.transform[4];
        if (lastY !== -1 && Math.abs(lastY - y) > 2) {
          if (currentLine.length > 0) {
            lines.push({
              items: currentLine,
              fullText: currentLine.map(it => it.str).join(''),
            });
          }
          currentLine = [];
        }
        if (item.str.trim()) currentLine.push({ str: item.str, x });
        lastY = y;
      }
      if (currentLine.length > 0) {
        lines.push({
          items: currentLine,
          fullText: currentLine.map(it => it.str).join(''),
        });
      }
    }
    return lines;
  })();
}

// =========================================================================
// メイン処理
// =========================================================================
export async function processPayrollFrontend(file: File, yearMonth: string, users: User[]) {
  // 1. ユーザー名辞書（スペースなしキー → userId）
  const nameEntries = users
    .map(u => ({
      key: toMatchKey(u.name),
      name: u.name,
      id: u.id,
    }))
    .filter(e => e.key.length >= 2 && !isExcludedWord(e.key));
  // 長い名前を先に照合（部分一致で短い名前が先にマッチするのを防ぐ）
  nameEntries.sort((a, b) => b.key.length - a.key.length);
  console.log('[Payroll] ユーザー数:', users.length, ', 照合エントリ:', nameEntries.length);

  // 2. PDF解析
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const lines = await extractLines(pdf);
  console.log('[Payroll] 抽出行数:', lines.length);

  // 3. 従業員行を見つけて、X座標ベースでユーザーをマッピング
  //    - 従業員行のfullTextの中から既知のユーザー名を検索
  //    - 見つかった名前のX位置を記録
  type UserColumn = { userId: string; name: string; xCenter: number };
  const userColumns: UserColumn[] = [];
  const employeeLineIndices: number[] = [];
  const usedUserIds = new Set<string>();

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // 行の最初のテキストが従業員ラベルか確認
    if (!isEmployeeLabel(line.items[0]?.str || '')) continue;
    employeeLineIndices.push(li);

    // fullText（スペースなし）でユーザー名を検索
    let searchText = toMatchKey(line.fullText);
    // 除外語をサーチテキストから先に除去（誤マッチ防止）
    for (const ew of EXCLUDED_WORDS) {
      searchText = searchText.replaceAll(ew, '□'.repeat(ew.length));
    }
    console.log('[Payroll] 従業員行を発見 (行' + li + '):', searchText);

    // 名前をfullTextから検索し、元のアイテムのX位置にマッピング
    for (const entry of nameEntries) {
      if (usedUserIds.has(entry.id)) continue;
      const idx = searchText.indexOf(entry.key);
      if (idx === -1) continue;

      // fullText上の文字位置 → 元のアイテムのX座標を求める
      let charCount = 0;
      let nameX = 0;
      for (const item of line.items) {
        const itemKey = toMatchKey(item.str);
        if (charCount <= idx && idx < charCount + itemKey.length) {
          nameX = item.x;
          break;
        }
        charCount += itemKey.length;
      }

      userColumns.push({ userId: entry.id, name: entry.name, xCenter: nameX });
      usedUserIds.add(entry.id);
      // 検索テキストからマッチ部分を除去して再利用防止
      searchText = searchText.slice(0, idx) + '□'.repeat(entry.key.length) + searchText.slice(idx + entry.key.length);
      console.log(`[Payroll] ✅ マッチ: "${entry.name}" (x=${nameX.toFixed(0)})`);
    }
    // ※breakしない → 全ページの従業員行を処理する
  }

  // X位置でソート（左から右）
  userColumns.sort((a, b) => a.xCenter - b.xCenter);
  console.log('[Payroll] マッチしたユーザー:', userColumns.length, '名 (', employeeLineIndices.length, 'ページ分の従業員行)');

  // 未マッチの名前を検出（全従業員行を対象）
  const unmatchedNames: string[] = [];
  for (const eli of employeeLineIndices) {
    const line = lines[eli];
    let remaining = toMatchKey(line.fullText);
    for (const uc of userColumns) {
      remaining = remaining.replace(toMatchKey(uc.name), '');
    }
    remaining = remaining.replace(/従業員|氏名|社員名/g, '');
    const leftover = remaining.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '').trim();
    if (leftover.length > 0) {
      unmatchedNames.push(leftover);
      console.log(`[Payroll] ❌ 未マッチの残余テキスト (行${eli}): "${leftover}"`);
    }
  }

  // 4. X位置ゾーンを計算（各ユーザーに最も近い値をマッチさせる）
  function findUserByX(x: number): UserColumn | null {
    if (userColumns.length === 0) return null;
    let best = userColumns[0];
    let bestDist = Math.abs(x - best.xCenter);
    for (let i = 1; i < userColumns.length; i++) {
      const d = Math.abs(x - userColumns[i].xCenter);
      if (d < bestDist) { best = userColumns[i]; bestDist = d; }
    }
    return best;
  }

  // 5. データ行からDBレコードを抽出
  const dbRecords: { user_id: string; year_month: string; item_name: string; amount: number }[] = [];
  for (const line of lines) {
    // 行ラベル（最初のアイテム）がSAVE_ITEMSに該当するか
    const label = line.items[0]?.str?.trim() || '';
    if (!SAVE_ITEMS.has(label)) continue;

    // 数値アイテムを走査し、X座標で最寄りのユーザーに割り当て
    for (const item of line.items.slice(1)) {
      const numStr = item.str.replace(/[,\s]/g, '');
      const amount = parseFloat(numStr);
      if (isNaN(amount)) continue;

      const matched = findUserByX(item.x);
      if (matched) {
        dbRecords.push({
          user_id: matched.userId,
          year_month: yearMonth,
          item_name: label,
          amount,
        });
      }
    }
  }

  console.log('[Payroll] DBレコード:', dbRecords.length, '件');

  // 6. Excel生成（表示用）
  // シンプルなフラットテキスト → 2次元配列に変換
  const excelRows: string[][] = [];
  for (const line of lines) {
    const cells = line.items.map(it => it.str.trim()).filter(Boolean);
    excelRows.push(cells);
  }
  // 従業員行のみマスキング処理（他の行は一切触らない）
  const employeeRowSet = new Set(employeeLineIndices);
  for (let r = 0; r < excelRows.length; r++) {
    if (!employeeRowSet.has(r)) continue; // 従業員行以外はスキップ
    const row = excelRows[r];
    for (let c = 0; c < row.length; c++) {
      const cellKey = toMatchKey(row[c]);
      if (!cellKey || isCodeOrNumber(row[c])) continue;
      // マッチ済みユーザー → UID置換
      const matchedUser = userColumns.find(uc => cellKey.includes(toMatchKey(uc.name)));
      if (matchedUser) {
        row[c] = `UID:${matchedUser.userId}`;
        continue;
      }
      // 従業員行内で日本語を含み、ラベルでもない → 未マッチの人名としてマスキング
      if (looksLikeJapaneseName(row[c]) && !isEmployeeLabel(row[c]) && !isExcludedWord(row[c])) {
        row[c] = maskName(row[c]);
      }
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  ws['!cols'] = [{ wch: 24 }, ...Array(10).fill({ wch: 14 })];
  XLSX.utils.book_append_sheet(wb, ws, '支給控除一覧');

  const excelArray = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const excelBlob = new Blob([excelArray], { type: 'application/octet-stream' });
  const downloadUrl = URL.createObjectURL(excelBlob);

  return { downloadUrl, dbRecords, mappedCount: userColumns.length, unmatchedNames };
}
