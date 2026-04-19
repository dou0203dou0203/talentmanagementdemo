import * as pdfjsLib from 'pdfjs-dist';
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline';
import * as XLSX from 'xlsx';
import type { User } from '../types';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker();

const SAVE_ITEMS = new Set([
  '支給合計', '控除合計', '差引支給合計',
  '課税支給合計', '非課税支給合計', '社会保険料合計',
]);

function normalizeName(name: string) {
  return (name || '').replace(/\u3000/g, ' ').trim();
}

function maskName(name: string) {
  return name.split(' ').map(p => '●'.repeat(p.length)).join(' ');
}

export async function processPayrollFrontend(file: File, yearMonth: string, users: User[]) {
  const nameToId = Object.fromEntries(users.map(u => [normalizeName(u.name), u.id]));

  // 1. Read PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as any[];

    // Sort items by Y (descending) then X (ascending)
    // to reconstruct lines reliably.
    items.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 2) return yB - yA;
      return a.transform[4] - b.transform[4];
    });

    let lastY = -1;
    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== -1 && Math.abs(lastY - y) > 2) {
        fullText += '\n';
      }
      // Inject some spacing to simulate tab/double space parsing
      fullText += item.str + '  ';
      lastY = y;
    }
    fullText += '\n';
  }

  // 2. Parse lines
  const lines = fullText.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const rows: any[][] = [];
  let currentItem: string | null = null;
  let currentValues: string[] = [];

  for (const line of lines) {
    const parts = line.split(/\s{2,}|\t/);
    if (parts.length >= 2) {
      if (currentItem) rows.push([currentItem, ...currentValues]);
      currentItem = parts[0];
      currentValues = parts.slice(1);
    } else if (currentItem) {
      currentValues.push(...parts);
    }
  }
  if (currentItem) rows.push([currentItem, ...currentValues]);

  // 3. Tokenize
  const colToUserId: Record<number, string> = {};
  const tokenized = rows.map(row => {
    const newRow = [...row];
    if (row[0] === '従業員') {
      for (let i = 1; i < row.length; i++) {
        const name = normalizeName(row[i] as string);
        if (!name || name === '-') continue;
        const userId = nameToId[name];
        if (userId) {
          colToUserId[i] = userId;
          newRow[i] = `UID:${userId}`;
        } else {
          newRow[i] = maskName(name);
        }
      }
    }
    return newRow;
  });

  // 4. Build Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(tokenized);
  ws['!cols'] = [{ wch: 24 }, ...Array(10).fill({ wch: 14 })];
  XLSX.utils.book_append_sheet(wb, ws, '支給控除一覧');
  
  // Create Blob URL for download
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

  return { downloadUrl, dbRecords, mappedCount: Object.keys(colToUserId).length };
}
