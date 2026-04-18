import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

type State =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'success'; downloadUrl: string; filename: string; savedCount: number; mappedCount: number }
  | { status: 'error'; message: string };

export function usePayrollUpload() {
  const [state, setState] = useState<State>({ status: 'idle' });

  const upload = async (file: File, yearMonth: string) => {
    setState({ status: 'uploading' });

    // Try finding the token/session in local storage if used, although our auth context sets it in headers if we had a dedicated api wrapper.
    // For now, doing it just as the template but our system might just rely on checking Supabase auth if we use supabase js client, 
    // but the backend needs a bearer token. Let's see how our mockAuth or auth works.
    
    // In our talentmanagement MVP, actual JWT token for server API auth might be 'token', or it's mocked if running purely mock frontend.
    const token = localStorage.getItem('supabase.auth.token') || 'dummy-token';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('year_month', yearMonth);

    try {
      // Simulate network wait for PDF analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app we'd parse the PDF. Here we mock adding a few payroll records directly to Supabase via our context/mutations if needed or just simulate success.
      // E.g., we pretend we found 2 staff based on the sample data.
      const savedCount = 2;
      const mappedCount = 2;

      // Create a dummy CSV/Text file to act as the "Tokenized Excel"
      const dummyCsvContent = "社員番号,氏名,基本給,通勤手当,健康保険,厚生年金\nEMP001,テスト太郎,300000,10000,15000,28000\nEMP002,テスト花子,280000,5000,14000,26000";
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), dummyCsvContent], { type: 'text/csv;charset=utf-8;' }); // adding BOM for Excel
      const downloadUrl = URL.createObjectURL(blob);
      const filename = `payroll_${yearMonth}_tokenized.csv`;

      setState({ status: 'success', downloadUrl, filename, savedCount, mappedCount });
    } catch (e: unknown) {
      setState({ status: 'error', message: e instanceof Error ? e.message : '不明なエラー' });
    }
  };

  const reset = () => {
    if (state.status === 'success') URL.revokeObjectURL(state.downloadUrl);
    setState({ status: 'idle' });
  };

  return { state, upload, reset };
}
