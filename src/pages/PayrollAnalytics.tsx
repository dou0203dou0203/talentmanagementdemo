import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line, ComposedChart
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#4cc9f0', '#f72585'];

export default function PayrollAnalytics() {
  const { permissions } = useAuth();
  const { users, facilities, occupations, payrollRecords, loading } = useData();
  
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  
  const [selectedFacilities, setSelectedFacilities] = useState<Set<string>>(new Set());
  const [selectedOccupations, setSelectedOccupations] = useState<Set<string>>(new Set());
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (facilities.length > 0 && selectedFacilities.size === 0) {
      setSelectedFacilities(new Set(facilities.map(f => f.id)));
    }
  }, [facilities]);

  useEffect(() => {
    if (occupations.length > 0 && selectedOccupations.size === 0) {
      setSelectedOccupations(new Set(occupations.map(o => o.id)));
    }
  }, [occupations]);
  
  const [activeTab, setActiveTab] = useState<'trend' | 'cross' | 'ratio' | 'table'>('trend');

  // 1. 初回マウント時、最新月に合わせて期間を勝手にセット（過去半年分など）＆全項目を抽出
  const availableItems = useMemo(() => {
    const itemSet = new Set<string>();
    payrollRecords.forEach(r => itemSet.add(r.item_name));
    return Array.from(itemSet).sort();
  }, [payrollRecords]);

  useEffect(() => {
    if (payrollRecords.length > 0 && availableItems.length > 0) {
      if (!startMonth && !endMonth) {
        // Find min and max months
        let min = payrollRecords[0].year_month;
        let max = payrollRecords[0].year_month;
        payrollRecords.forEach(r => {
          if (r.year_month < min) min = r.year_month;
          if (r.year_month > max) max = r.year_month;
        });
        setStartMonth(min);
        setEndMonth(max);
      }
      
      if (selectedItems.size === 0) {
        // デフォルトで「基本給」と「時間外系」などを選択しておく（あれば）
        // とりあえず全て選択してしまうと画面がカオスになるので、最初は支給合計などにしたいが
        // 分からないので上位5つ程度を選択
        const defaults = new Set<string>();
        // もしよくある項目があれば優先
        const priority = ['支給合計', '課税支給合計', '基本給', '時間外手当', '通勤手当'];
        availableItems.forEach(i => {
          if (priority.some(p => i.includes(p))) defaults.add(i);
        });
        // もしプライオリティがなければ最初の3つ
        if (defaults.size === 0) {
          availableItems.slice(0, 3).forEach(i => defaults.add(i));
        }
        setSelectedItems(defaults);
      }
    }
  }, [payrollRecords, availableItems]);

  const toggleItem = (item: string) => {
    const next = new Set(selectedItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setSelectedItems(next);
  };

  const selectAll = () => setSelectedItems(new Set(availableItems));
  const deselectAll = () => setSelectedItems(new Set());

  // 2. データのフィルタリング処理
  const filteredRecords = useMemo(() => {
    if (!startMonth || !endMonth) return [];
    
    // 対象スタッフセット (事業所・職種フィルタによる)
    const validUserIds = new Set<string>();
    users.forEach(u => {
      if (selectedFacilities.size > 0 && !selectedFacilities.has(u.facility_id)) return;
      if (selectedOccupations.size > 0 && !selectedOccupations.has(u.occupation_id)) return;
      validUserIds.add(u.id);
    });

    return payrollRecords.filter(r => {
      if (r.year_month < startMonth || r.year_month > endMonth) return false;
      if (!validUserIds.has(r.user_id)) return false;
      if (!selectedItems.has(r.item_name)) return false;
      return true;
    });
  }, [payrollRecords, users, selectedFacilities, selectedOccupations, startMonth, endMonth, selectedItems]);

  // ▼各グラフ用の集計データ生成ロジック▼
  // タブ1: 月別トレンド推移
  const trendData = useMemo(() => {
    const map = new Map<string, Record<string, number>>(); // year_month -> { item: amount }
    filteredRecords.forEach(r => {
      if (!map.has(r.year_month)) map.set(r.year_month, { month: r.year_month } as any);
      const row = map.get(r.year_month)!;
      row[r.item_name] = (row[r.item_name] || 0) + r.amount;
    });
    return Array.from(map.values()).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [filteredRecords]);

  // タブ2: 拠点・職種クロス分析ビュー (拠点別の項目合計)
  const crossFacilityData = useMemo(() => {
    const map = new Map<string, Record<string, number>>(); // facility_name -> { item: amount }
    const headcounts = new Map<string, Set<string>>(); // 計算用 (事業所 -> ユーザーSet)
    
    filteredRecords.forEach(r => {
      const u = users.find(x => x.id === r.user_id);
      const fName = u ? (facilities.find(f => f.id === u.facility_id)?.name || '未設定') : '未設定';
      
      if (!map.has(fName)) map.set(fName, { name: fName } as any);
      if (!headcounts.has(fName)) headcounts.set(fName, new Set());
      
      const row = map.get(fName)!;
      row[r.item_name] = (row[r.item_name] || 0) + r.amount;
      headcounts.get(fName)!.add(r.user_id);
    });

    // 1人あたり平均コストの算出
    const results = Array.from(map.values());
    results.forEach((row: any) => {
      const hCount = headcounts.get(row.name)!.size;
      let total = 0;
      selectedItems.forEach(item => { total += (row[item] || 0); });
      row['一人当たり平均 (合計/人数)'] = hCount > 0 ? Math.round(total / hCount) : 0;
      row._headcount = hCount;
    });
    return results.sort((a: any, b: any) => b['一人当たり平均 (合計/人数)'] - a['一人当たり平均 (合計/人数)']);
  }, [filteredRecords, users, facilities, selectedItems]);

  // タブ3: 個別スタッフ集計表
  const staffTableData = useMemo(() => {
    const map = new Map<string, Record<string, number>>(); // user_id -> { item: amount }
    filteredRecords.forEach(r => {
      if (!map.has(r.user_id)) map.set(r.user_id, {});
      const row = map.get(r.user_id)!;
      row[r.item_name] = (row[r.item_name] || 0) + r.amount;
    });
    
    const results = Array.from(map.entries()).map(([uid, items]) => {
      const u = users.find(x => x.id === uid);
      let total = 0;
      Object.values(items).forEach(v => total += v);
      return {
        id: uid,
        name: u?.name || '不明',
        facility: facilities.find(f => f.id === u?.facility_id)?.name || '-',
        occupation: occupations.find(o => o.id === u?.occupation_id)?.name || '-',
        items,
        total
      };
    });
    return results.sort((a, b) => b.total - a.total);
  }, [filteredRecords, users, facilities, occupations]);

  // スタッフ一覧が変わったら全選択状態にする
  const staffIdsStr = useMemo(() => staffTableData.map(r => r.id).join(','), [staffTableData]);
  useEffect(() => {
    setSelectedStaffIds(new Set(staffTableData.map(r => r.id)));
  }, [staffIdsStr]);

  // スタッフ合計の計算
  const tableTotals = useMemo(() => {
    const itemsTotal: Record<string, number> = {};
    let grandTotal = 0;
    Array.from(selectedItems).forEach(i => itemsTotal[i] = 0);
    
    staffTableData.forEach(row => {
      if (selectedStaffIds.has(row.id)) {
        Array.from(selectedItems).forEach(i => {
          itemsTotal[i] += (row.items[i] || 0);
        });
        grandTotal += row.total;
      }
    });
    return { itemsTotal, grandTotal };
  }, [staffTableData, selectedItems, selectedStaffIds]);

  const exportCSV = () => {
    const selectedItemsArr = Array.from(selectedItems);
    const headers = ['スタッフ名', '事業所', '職種', ...selectedItemsArr, '合計'];
    const rows = staffTableData.map(row => {
      const vals = selectedItemsArr.map(i => row.items[i] || 0);
      return [row.name, row.facility, row.occupation, ...vals, row.total].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_aggregate_${startMonth}_to_${endMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!permissions.canViewPayroll) {
    return <div style={{ padding: 20 }}>アクセス権限がありません。</div>;
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>データを読み込み中...</div>;
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <h2 className="page-title">給与データ 集計・分析</h2>
      <p className="page-subtitle">
        インポートした給与明細データを任意の期間・項目で集計し、経営判断や労務管理に役立てることができます。
      </p>

      {/* コントロールパネル */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">🔍 分析条件の設定</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">開始年月</label>
              <input type="month" className="form-input" value={startMonth} onChange={e => setStartMonth(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">終了年月</label>
              <input type="month" className="form-input" value={endMonth} onChange={e => setEndMonth(e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>拠点フィルタ (複数選択)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setSelectedFacilities(new Set(facilities.map(f => f.id)))} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて選択</button>
                <button type="button" onClick={() => setSelectedFacilities(new Set())} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて外す</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: '150px', overflowY: 'auto', padding: '8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              {facilities.length === 0 && <span style={{ color: '#94a3b8' }}>データがありません</span>}
              {facilities.map(f => (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedFacilities.has(f.id) ? '#eff6ff' : '#fff', border: `1px solid ${selectedFacilities.has(f.id) ? '#3b82f6' : '#cbd5e1'}`, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', color: selectedFacilities.has(f.id) ? '#1d4ed8' : '#334155' }}>
                  <input type="checkbox" checked={selectedFacilities.has(f.id)} onChange={() => {
                    const next = new Set(selectedFacilities);
                    if (next.has(f.id)) next.delete(f.id); else next.add(f.id);
                    setSelectedFacilities(next);
                  }} style={{ display: 'none' }} />
                  {f.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>職種フィルタ (複数選択)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setSelectedOccupations(new Set(occupations.map(o => o.id)))} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて選択</button>
                <button type="button" onClick={() => setSelectedOccupations(new Set())} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて外す</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: '150px', overflowY: 'auto', padding: '8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              {occupations.length === 0 && <span style={{ color: '#94a3b8' }}>データがありません</span>}
              {occupations.map(occ => (
                <label key={occ.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedOccupations.has(occ.id) ? '#eff6ff' : '#fff', border: `1px solid ${selectedOccupations.has(occ.id) ? '#3b82f6' : '#cbd5e1'}`, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', color: selectedOccupations.has(occ.id) ? '#1d4ed8' : '#334155' }}>
                  <input type="checkbox" checked={selectedOccupations.has(occ.id)} onChange={() => {
                    const next = new Set(selectedOccupations);
                    if (next.has(occ.id)) next.delete(occ.id); else next.add(occ.id);
                    setSelectedOccupations(next);
                  }} style={{ display: 'none' }} />
                  {occ.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>集計項目 (複数選択)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={selectAll} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて選択</button>
                <button type="button" onClick={deselectAll} className="btn" style={{ padding: '4px 8px', fontSize: 12 }}>すべて外す</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: '150px', overflowY: 'auto', padding: '8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              {availableItems.length === 0 && <span style={{ color: '#94a3b8' }}>データがありません</span>}
              {availableItems.map(item => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 4, background: selectedItems.has(item) ? '#eff6ff' : '#fff', border: `1px solid ${selectedItems.has(item) ? '#3b82f6' : '#cbd5e1'}`, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', color: selectedItems.has(item) ? '#1d4ed8' : '#334155' }}>
                  <input type="checkbox" checked={selectedItems.has(item)} onChange={() => toggleItem(item)} style={{ display: 'none' }} />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* タブ切り替え */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${activeTab === 'trend' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('trend')}>📈 月別トレンド（推移・検知）</button>
        <button className={`btn ${activeTab === 'cross' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('cross')}>🏢 拠点別分析（単価・比率）</button>
        <button className={`btn ${activeTab === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('table')}>📋 スタッフ別 集計表</button>
      </div>

      {/* 結果表示領域 */}
      <div className="card" style={{ minHeight: 400 }}>
        {filteredRecords.length === 0 ? (
          <div className="card-body" style={{ display: 'flex', height: 300, alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            指定された条件に一致するデータがありません
          </div>
        ) : (
          <div className="card-body">
            
            {/* タブ1: 期間トレンド推移 */}
            {activeTab === 'trend' && (
              <>
                <h3 className="card-title" style={{ marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>月別トレンド（支給推移）</h3>
                <div style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(val: any) => `¥${(val/10000).toFixed(0)}万`} />
                      <Tooltip formatter={(val: any) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val)} />
                      <Legend />
                      {Array.from(selectedItems).map((key, i) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="form-help" style={{ marginTop: 12 }}>
                  💡 <strong>異常検知ヒント:</strong> 特定の月だけ飛び抜けて積み上げグラフが高くなっている場合、残業代の急増や一時的な手当（賞与など）が発生している可能性があります。
                </div>
              </>
            )}

            {/* タブ2: 事業所別クロス分析 */}
            {activeTab === 'cross' && (
              <>
                <h3 className="card-title" style={{ marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>事業所別のコスト比較（事業所別・一人当たり）</h3>
                <div style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={crossFacilityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" tickFormatter={(val: any) => `¥${(val/10000).toFixed(0)}万`} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(val: any) => `¥${(val/10000).toFixed(0)}万`} />
                      <Tooltip formatter={(val: any) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val)} />
                      <Legend />
                      {Array.from(selectedItems).map((key, i) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} yAxisId="left" />
                      ))}
                      <Line type="monotone" dataKey="一人当たり平均 (合計/人数)" stroke="#ff0000" strokeWidth={3} yAxisId="right" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="form-help" style={{ marginTop: 12 }}>
                  💡 <strong>分析ヒント:</strong> 棒グラフ（左軸）は事業所全体のコスト合計を、<span style={{color:'red'}}>赤い折れ線（右軸）は「その事業所の一人当たりの平均金額」</span>を表しています。人数にかかわらず平均単価が高い事業所は、残業が慢性化しているか、ベテラン層が偏っている可能性があります。
                </div>
              </>
            )}

            {/* タブ3: 個別集計表 */}
            {activeTab === 'table' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="card-title">スタッフ別 集計表（指定期間合計）</h3>
                  <button onClick={exportCSV} className="btn btn-primary">CSVダウンロード</button>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                  <table className="table" style={{ whiteSpace: 'nowrap' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                      <tr>
                        <th style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 11, width: 40, textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={staffTableData.length > 0 && selectedStaffIds.size === staffTableData.length}
                            onChange={e => {
                              if (e.target.checked) setSelectedStaffIds(new Set(staffTableData.map(r => r.id)));
                              else setSelectedStaffIds(new Set());
                            }}
                          />
                        </th>
                        <th style={{ position: 'sticky', left: 40, background: '#f8fafc', zIndex: 11 }}>スタッフ名</th>
                        <th>事業所</th>
                        <th>職種</th>
                        {Array.from(selectedItems).map(i => <th key={i} style={{ textAlign: 'right' }}>{i}</th>)}
                        <th style={{ textAlign: 'right', color: '#1d4ed8' }}>選択項目合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffTableData.map(row => (
                        <tr key={row.id} style={{ opacity: selectedStaffIds.has(row.id) ? 1 : 0.5 }}>
                          <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedStaffIds.has(row.id)}
                              onChange={e => {
                                const next = new Set(selectedStaffIds);
                                if (e.target.checked) next.add(row.id); else next.delete(row.id);
                                setSelectedStaffIds(next);
                              }}
                            />
                          </td>
                          <td style={{ position: 'sticky', left: 40, background: '#fff', zIndex: 1, fontWeight: 'bold' }}>{row.name}</td>
                          <td>{row.facility}</td>
                          <td>{row.occupation}</td>
                          {Array.from(selectedItems).map(i => (
                            <td key={i} style={{ textAlign: 'right' }}>{new Intl.NumberFormat('ja-JP').format(row.items[i] || 0)}</td>
                          ))}
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1d4ed8' }}>{new Intl.NumberFormat('ja-JP').format(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ position: 'sticky', bottom: 0, background: '#eef2ff', zIndex: 10, fontWeight: 'bold' }}>
                      <tr>
                        <td colSpan={4} style={{ position: 'sticky', left: 0, background: '#eef2ff', zIndex: 11, textAlign: 'right', paddingRight: 16 }}>
                          選択スタッフ合計 ({selectedStaffIds.size}人)
                        </td>
                        {Array.from(selectedItems).map(i => (
                          <td key={i} style={{ textAlign: 'right', color: '#1d4ed8' }}>
                            {new Intl.NumberFormat('ja-JP').format(tableTotals.itemsTotal[i] || 0)}
                          </td>
                        ))}
                        <td style={{ textAlign: 'right', color: '#1d4ed8', fontSize: '1.1em' }}>
                          {new Intl.NumberFormat('ja-JP').format(tableTotals.grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
