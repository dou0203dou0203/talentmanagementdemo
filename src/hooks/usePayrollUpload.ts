import { useState } from 'react';
import { processPayrollFrontend } from '../lib/payrollParser';
import { processExcelBuffer } from '../lib/excelParser';
import { supabase } from '../lib/supabase';



type State =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'success'; downloadUrl: string; filename: string; savedCount: number; mappedCount: number; unmatchedNames: string[] }
  | { status: 'error'; message: string };

export function usePayrollUpload() {
  const [state, setState] = useState<State>({ status: 'idle' });

  const upload = async (file: File, yearMonth: string, users: any[]) => {
    setState({ status: 'uploading' });

    try {
      // Execute frontend parsing and masking
      const { downloadUrl, dbRecords, mappedCount, unmatchedNames } = await processPayrollFrontend(file, yearMonth, users);

      // Save records to Supabase directly
      let savedCount = 0;
      if (dbRecords.length > 0) {
        // 重複を除去（同一 user_id + year_month + item_name は最後の値を採用）
        const deduped = Object.values(
          Object.fromEntries(
            dbRecords.map(r => [`${r.user_id}__${r.year_month}__${r.item_name}`, r])
          )
        );
        const { error } = await supabase.from('payroll_records').upsert(deduped, { onConflict: 'user_id,year_month,item_name' });
        if (error) throw new Error(`保存エラー: ${error.message}`);
        savedCount = deduped.length;
      }

      const filename = `payroll_${yearMonth}_tokenized.xlsx`;
      setState({ status: 'success', downloadUrl, filename, savedCount, mappedCount, unmatchedNames: unmatchedNames || [] });
    } catch (e: unknown) {
      console.error(e);
      setState({ status: 'error', message: e instanceof Error ? e.message : '不明なエラーが発生しました' });
    }
  };

  const uploadExcelBuffer = async (buffer: ArrayBuffer, yearMonth: string, users: any[]) => {
    setState({ status: 'uploading' });

    try {
      const { downloadUrl, dbRecords, mappedCount, unmatchedNames } = await processExcelBuffer(buffer, yearMonth, users);

      let savedCount = 0;
      if (dbRecords.length > 0) {
        const deduped = Object.values(
          Object.fromEntries(
            dbRecords.map(r => [`${r.user_id}__${r.year_month}__${r.item_name}`, r])
          )
        );
        const { error } = await supabase.from('payroll_records').upsert(deduped, { onConflict: 'user_id,year_month,item_name' });
        if (error) throw new Error(`保存エラー: ${error.message}`);
        savedCount = deduped.length;
      }

      const filename = `payroll_${yearMonth}_import.xlsx`;
      setState({ status: 'success', downloadUrl, filename, savedCount, mappedCount, unmatchedNames: unmatchedNames || [] });
    } catch (e: unknown) {
      console.error(e);
      setState({ status: 'error', message: e instanceof Error ? e.message : '不明なエラーが発生しました' });
    }
  };

  const reset = () => {
    if (state.status === 'success') URL.revokeObjectURL(state.downloadUrl);
    setState({ status: 'idle' });
  };

  return { state, upload, uploadExcelBuffer, reset };
}
