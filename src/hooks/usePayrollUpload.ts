import { useState } from 'react';
import { processPayrollFrontend } from '../lib/payrollParser';
import { supabase } from '../lib/supabase';



type State =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'success'; downloadUrl: string; filename: string; savedCount: number; mappedCount: number }
  | { status: 'error'; message: string };

export function usePayrollUpload() {
  const [state, setState] = useState<State>({ status: 'idle' });

  const upload = async (file: File, yearMonth: string, users: any[]) => {
    setState({ status: 'uploading' });

    try {
      // Execute frontend parsing and masking
      const { downloadUrl, dbRecords, mappedCount } = await processPayrollFrontend(file, yearMonth, users);

      // Save records to Supabase directly
      let savedCount = 0;
      if (dbRecords.length > 0) {
        const { error } = await supabase.from('payroll_records').upsert(dbRecords, { onConflict: 'user_id,year_month,item_name' });
        if (error) throw new Error(`保存エラー: ${error.message}`);
        savedCount = dbRecords.length;
      }

      const filename = `payroll_${yearMonth}_tokenized.xlsx`;
      setState({ status: 'success', downloadUrl, filename, savedCount, mappedCount });
    } catch (e: unknown) {
      console.error(e);
      setState({ status: 'error', message: e instanceof Error ? e.message : '不明なエラーが発生しました' });
    }
  };

  const reset = () => {
    if (state.status === 'success') URL.revokeObjectURL(state.downloadUrl);
    setState({ status: 'idle' });
  };

  return { state, upload, reset };
}
