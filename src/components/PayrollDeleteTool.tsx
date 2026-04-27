import { useState } from 'react';
import { useData } from '../context/DataContext';
import { payrollMutations } from '../lib/mutations';

export const PayrollDeleteTool = () => {
  const { users, facilities } = useData();
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const [facilityId, setFacilityId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleDelete = async () => {
    if (!yearMonth) {
      alert('対象年月を選択してください。');
      return;
    }

    let targetDesc = `【${yearMonth}】の給与データ`;
    if (userId) {
      const u = users.find(x => x.id === userId);
      targetDesc += ` (スタッフ: ${u?.name || userId})`;
    } else if (facilityId) {
      const f = facilities.find(x => x.id === facilityId);
      targetDesc += ` (事業所: ${f?.name || facilityId})`;
    } else {
      targetDesc += ` (全事業所・全スタッフ)`;
    }

    if (!window.confirm(`⚠️ 警告: 以下のデータを完全に削除します。\n\n${targetDesc}\n\nよろしいですか？`)) {
      return;
    }

    setIsDeleting(true);
    setResultMsg(null);

    const res = await payrollMutations.deletePayrollRecords(yearMonth, facilityId || undefined, userId || undefined);
    
    setIsDeleting(false);
    if (res.success) {
      setResultMsg({ type: 'success', text: `削除が完了しました。（${res.deletedCount || 0}件のデータを取り消しました）` });
    } else {
      setResultMsg({ type: 'error', text: `削除に失敗しました: ${res.error}` });
    }
  };

  const filteredUsers = facilityId ? users.filter(u => u.facility_id === facilityId) : users;

  return (
    <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', background: '#fef2f2', marginTop: 'var(--space-4)' }}>
      <h4 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-md)', color: '#b91c1c' }}>⚠️ 給与データの取り消し（一括削除）</h4>
      <p className="form-help" style={{ marginBottom: 'var(--space-3)', color: '#991b1b' }}>
        間違えてインポートしてしまった場合や、一部のデータがズレてしまった場合に、対象のデータを削除してやり直すことができます。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: '#7f1d1d' }}>対象年月 (必須)</label>
          <input
            type="month"
            className="form-input"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: '#7f1d1d' }}>事業所で絞り込む (任意)</label>
          <select className="form-select" value={facilityId} onChange={e => { setFacilityId(e.target.value); setUserId(''); }}>
            <option value="">すべての事業所</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: '#7f1d1d' }}>スタッフで絞り込む (任意)</label>
          <select className="form-select" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">すべてのスタッフ</option>
            {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || !yearMonth}
        className="btn"
        style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none' }}
      >
        {isDeleting ? '削除の中...' : '指定した条件のデータを削除'}
      </button>

      {resultMsg && (
        <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: resultMsg.type === 'success' ? '#dcfce3' : '#fee2e2', color: resultMsg.type === 'success' ? '#166534' : '#991b1b', fontSize: 'var(--font-size-sm)' }}>
          {resultMsg.text}
        </div>
      )}
    </div>
  );
};
