import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { payrollMutations } from '../lib/mutations';

export default function PayrollDataEditor() {
  const { permissions } = useAuth();
  const { users, facilities, occupations } = useData();
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  
  // 編集状態の管理: { recordId: newValue }
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // フィルタ状態の管理
  const [facilityId, setFacilityId] = useState<string>('');
  const [selectedOccupations, setSelectedOccupations] = useState<Set<string>>(new Set());

  // 職種の初期選択（全選択）
  useEffect(() => {
    if (occupations.length > 0 && selectedOccupations.size === 0) {
      setSelectedOccupations(new Set(occupations.map(o => o.id)));
    }
  }, [occupations]);

  const toggleOccupation = (id: string) => {
    const next = new Set(selectedOccupations);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOccupations(next);
  };
  const selectAllOccupations = () => setSelectedOccupations(new Set(occupations.map(o => o.id)));
  const deselectAllOccupations = () => setSelectedOccupations(new Set());

  // 権限チェック
  if (!permissions.canViewPayroll) {
    return <div style={{ padding: 20 }}>アクセス権限がありません。</div>;
  }

  // データの取得
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('year_month', yearMonth);
      
      setLoading(false);
      if (error) {
        console.error(error);
        alert('給与データの取得に失敗しました');
        return;
      }
      setRecords(data || []);
      setEditingValues({});
    }
    fetchData();
  }, [yearMonth]);

  // 行列データの構築 (行: スタッフ, 列: 手当項目)
  const { items, staffRows } = useMemo(() => {
    const itemSet = new Set<string>();
    const staffMap = new Map<string, any>(); // user_id -> { user, records: { item_name: record } }

    const validUserIds = new Set<string>();
    users.forEach(u => {
      if (facilityId && u.facility_id !== facilityId) return;
      if (!selectedOccupations.has(u.occupation_id)) return;
      validUserIds.add(u.id);
    });

    records.forEach(r => {
      if (!validUserIds.has(r.user_id)) return;
      
      itemSet.add(r.item_name);
      if (!staffMap.has(r.user_id)) {
        const u = users.find(x => x.id === r.user_id);
        staffMap.set(r.user_id, { user: u || { id: r.user_id, name: '不明なスタッフ' }, recordsMap: {} });
      }
      staffMap.get(r.user_id).recordsMap[r.item_name] = r;
    });

    // 表として表示するための配列化＋ソート
    const itemsArray = Array.from(itemSet).sort();
    const rowsArray = Array.from(staffMap.values()).sort((a, b) => a.user.name.localeCompare(b.user.name));
    return { items: itemsArray, staffRows: rowsArray };
  }, [records, users, facilityId, selectedOccupations]);

  // セルの値変更ハンドラ (ローカルステートのみ変更)
  const handleValueChange = (recordId: string, value: string) => {
    setEditingValues(prev => ({ ...prev, [recordId]: value }));
  };

  // 保存処理 (フォーカスが外れた時等)
  const handleSave = async (record: any) => {
    const newValStr = editingValues[record.id];
    if (newValStr === undefined) return; // 変更なし

    const newVal = parseFloat(newValStr);
    if (isNaN(newVal) || newVal === record.amount) {
      // 元に戻すか無効な値なら変更キャンセル
      setEditingValues(prev => {
        const copy = { ...prev };
        delete copy[record.id];
        return copy;
      });
      return;
    }

    // サーバーへ保存
    setSavingIds(prev => new Set(prev).add(record.id));
    const res = await payrollMutations.updatePayrollRecord(record.id, newVal);
    setSavingIds(prev => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });

    if (res.success) {
      // 成功したら records のローカル状態を更新し、editingValues から削除
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, amount: newVal } : r));
      setEditingValues(prev => {
        const copy = { ...prev };
        delete copy[record.id];
        return copy;
      });
    } else {
      alert('値の保存に失敗しました');
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <h2 className="page-title">給与データの閲覧・手動修正</h2>
      <p className="page-subtitle">
        インポート済みのデータを個別に確認・修正できます。セルをクリックして数字を書き換えると自動的に上書き保存されます。
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">🔍 絞り込み条件</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <div className="form-group" style={{ marginBottom: 0, width: 200 }}>
              <label className="form-label">対象年月</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="month"
                  className="form-input"
                  value={yearMonth}
                  onChange={e => setYearMonth(e.target.value)}
                />
                {loading && <div className="spinner" style={{ width: 24, height: 24 }} />}
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0, width: 200 }}>
              <label className="form-label">事業所フィルタ</label>
              <select className="form-select" value={facilityId} onChange={e => setFacilityId(e.target.value)}>
                <option value="">すべての事業所</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>職種フィルタ (複数選択)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={selectAllOccupations} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて選択</button>
                <button type="button" onClick={deselectAllOccupations} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて外す</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: '150px', overflowY: 'auto', padding: '8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              {occupations.length === 0 && <span style={{ color: '#94a3b8' }}>データがありません</span>}
              {occupations.map(occ => (
                <label key={occ.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedOccupations.has(occ.id) ? '#eff6ff' : '#fff', border: `1px solid ${selectedOccupations.has(occ.id) ? '#3b82f6' : '#cbd5e1'}`, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', color: selectedOccupations.has(occ.id) ? '#1d4ed8' : '#334155' }}>
                  <input type="checkbox" checked={selectedOccupations.has(occ.id)} onChange={() => toggleOccupation(occ.id)} style={{ display: 'none' }} />
                  {occ.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {staffRows.length === 0 && !loading ? (
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-neutral-500)' }}>
            この月には給与データがインポートされていません。
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1, minWidth: 150 }}>スタッフ名</th>
                  {items.map(item => (
                    <th key={item} style={{ textAlign: 'right' }}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffRows.map(({ user, recordsMap }) => (
                  <tr key={user.id}>
                    <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontWeight: 'bold' }}>
                      {user.name}
                    </td>
                    {items.map(item => {
                      const record = recordsMap[item];
                      if (!record) {
                        return <td key={item} style={{ color: '#aaa', textAlign: 'center' }}>-</td>;
                      }
                      
                      const isSaving = savingIds.has(record.id);
                      const isEditing = editingValues[record.id] !== undefined;
                      const displayVal = isEditing ? editingValues[record.id] : record.amount.toString();
                      const isChanged = isEditing && parseFloat(editingValues[record.id]) !== record.amount;

                      return (
                        <td key={item} style={{ padding: '4px 8px' }}>
                          <input
                            type="number"
                            value={displayVal}
                            onChange={(e) => handleValueChange(record.id, e.target.value)}
                            onBlur={() => handleSave(record)}
                            disabled={isSaving}
                            className={`form-input ${isChanged ? 'highlight-edit' : ''}`}
                            style={{ 
                              width: '100px', 
                              textAlign: 'right', 
                              padding: '4px',
                              background: isSaving ? '#f1f5f9' : (isChanged ? '#ffedd5' : '#fff'),
                              borderColor: isChanged ? '#f97316' : '#e2e8f0',
                              outline: 'none',
                              opacity: isSaving ? 0.7 : 1
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .highlight-edit:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
        }
      `}</style>
    </div>
  );
}
