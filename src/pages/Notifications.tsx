import { useState } from 'react';
import { useData } from '../context/DataContext';

const mockNotifications: Array<{
  id: string;
  type: string;
  icon: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  userId: string;
}> = [];

const typeConfig: Record<string,{label:string;color:string;bg:string}> = {
  alert: {label:'アラート',color:'#ef4444',bg:'#fef2f2'},
  eval: {label:'評価',color:'#3b82f6',bg:'#eff6ff'},
  interview: {label:'面談',color:'#8b5cf6',bg:'#f5f3ff'},
  survey: {label:'サーベイ',color:'#f59e0b',bg:'#fffbeb'},
  recruit: {label:'採用',color:'#10b981',bg:'#ecfdf5'},
  system: {label:'システム',color:'#6b7a87',bg:'#f8fafb'},
};

export default function Notifications() {
    const { users } = useData();
  const [filterType, setFilterType] = useState('all');
  const [notifications, setNotifications] = useState(mockNotifications);
  const types = Object.keys(typeConfig);
  const filtered = notifications.filter(n => filterType === 'all' || n.type === filterType);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({...n, read: true})));
  const toggleRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: !n.read} : n));

  return (
    <div className='fade-in'>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--space-5)'}}>
        <div><h2 className='page-title'>🔔 通知センター</h2><p className='page-subtitle'>未読 {unreadCount}件</p></div>
        {unreadCount > 0 && <button className='btn btn-secondary' onClick={markAllRead}>✓ すべて既読にする</button>}
      </div>

      <div className='iv-filters card'>
        <div className='iv-filter-group'><label>種別:</label><select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value='all'>すべて</option>{types.map(t=><option key={t} value={t}>{typeConfig[t].label}</option>)}</select></div>
        <div className='iv-count'>{filtered.length}件</div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'var(--space-3)'}}>
        {filtered.map(notif => {
          const tc = typeConfig[notif.type] || typeConfig.system;
          const user = notif.userId ? users.find(u => u.id === notif.userId) : null;
          return (
            <div key={notif.id} className='card' onClick={()=>toggleRead(notif.id)} style={{cursor:'pointer',padding:'var(--space-4)',borderLeft:'4px solid '+(notif.read?'transparent':tc.color),opacity:notif.read?0.7:1,transition:'all 0.2s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{display:'flex',gap:'var(--space-3)',alignItems:'flex-start'}}>
                  <span style={{fontSize:'var(--font-size-xl)'}}>{notif.icon}</span>
                  <div>
                    <div style={{display:'flex',gap:'var(--space-2)',alignItems:'center',marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:'var(--font-size-sm)'}}>{notif.title}</span>
                      <span className='sp-badge' style={{background:tc.bg,color:tc.color,fontSize:10}}>{tc.label}</span>
                      {!notif.read && <span style={{width:8,height:8,borderRadius:'50%',background:tc.color,display:'inline-block'}}/>}
                    </div>
                    <div style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)'}}>{notif.message}</div>
                    {user && <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-400)',marginTop:4}}>対象: {user.name}</div>}
                  </div>
                </div>
                <span style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-400)',whiteSpace:'nowrap'}}>{notif.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}