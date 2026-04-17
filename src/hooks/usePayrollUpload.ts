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
      const res = await fetch(`${API_BASE}/api/payroll/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '処理に失敗しました' }));
        throw new Error(err.error);
      }

      const savedCount = parseInt(res.headers.get('X-Saved-Count') ?? '0', 10);
      const mappedCount = parseInt(res.headers.get('X-Mapped-Count') ?? '0', 10);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const filename = `payroll_${yearMonth}_tokenized.xlsx`;

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
