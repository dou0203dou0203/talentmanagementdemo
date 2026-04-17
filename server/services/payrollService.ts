import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';

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

async function fetchNameToId(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('users').select('id, name');
  if (error) throw new Error(`Supabase取得エラー: ${error.message}`);
  return Object.fromEntries(data.map(r => [normalizeName(r.name), r.id]));
}

async function extractRowsFromPdf(pdfBuffer: Buffer) {
  const { text } = await pdfParse(pdfBuffer);

  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
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

  return rows;
}

function tokenize(rows: any[][], nameToId: Record<string, string>) {
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
  return { tokenized, colToUserId };
}

function buildExcel(rows: any[][]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 24 }, ...Array(10).fill({ wch: 14 })];
  XLSX.utils.book_append_sheet(wb, ws, '支給控除一覧');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function saveToSupabase(supabase: SupabaseClient, rows: any[][], colToUserId: Record<number, string>, yearMonth: string) {
  const records = [];
  for (const row of rows) {
    const item = (row[0] || '').replace(/\n/g, '').trim();
    if (!SAVE_ITEMS.has(item)) continue;
    for (const [colIdxStr, userId] of Object.entries(colToUserId)) {
      const colIdx = parseInt(colIdxStr, 10);
      const raw = row[colIdx];
      const amount = raw ? parseFloat(String(raw).replace(/[,\s]/g, '')) : null;
      if (amount !== null && !isNaN(amount)) {
        records.push({ user_id: userId, year_month: yearMonth, item_name: item, amount });
      }
    }
  }
  if (!records.length) return 0;

  const { error } = await supabase
    .from('payroll_records')
    .upsert(records, { onConflict: 'user_id,year_month,item_name' });
  if (error) throw new Error(`Supabase保存エラー: ${error.message}`);
  return records.length;
}

export async function processPayroll(pdfBuffer: Buffer, yearMonth: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
     throw new Error("Supabase credentials not fully configured on server.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const nameToId = await fetchNameToId(supabase);
  const rows = await extractRowsFromPdf(pdfBuffer);
  const { tokenized, colToUserId } = tokenize(rows, nameToId);
  const excelBuffer = buildExcel(tokenized);
  const savedCount = await saveToSupabase(supabase, rows, colToUserId, yearMonth);

  return { excelBuffer, savedCount, mappedCount: Object.keys(colToUserId).length };
}
