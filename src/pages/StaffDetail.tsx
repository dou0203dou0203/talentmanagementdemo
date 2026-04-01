import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Line, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend } from 'chart.js';
import { userMutations } from '../lib/saveHelper';
import type { InterviewLog, InterviewType } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend);

type TabKey = 'survey' | 'interviews' | 'aptitude' | 'ai' | 'hr';
const MOOD_ICONS = ['😫','😟','😐','🙂','😊'];
const INT_ICONS: Record<InterviewType,string> = {'定期面談':'📅','1on1':'🤝','フォローアップ':'🔄','キャリア面談':'🎯','その他':'📝'};

export default function StaffDetail() {
    const { users, facilities, occupations, surveys, interviewLogs: initialLogs, aptitudeTests, updateUser } = useData();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('survey');
  const [interviewLogs, setInterviewLogs] = useState<InterviewLog[]>([...initialLogs]);
  const [showAdd, setShowAdd] = useState(false);
  const [nw, setNw] = useState({type:'定期面談' as InterviewType, summary:'', details:'', mood:3 as 1|2|3|4|5, action_items:''});
  const user = users.find(u=>u.id===userId);
  const fac = facilities.find(f=>f.id===user?.facility_id);
  const occ = occupations.find(o=>o.id===user?.occupation_id);
  const uSurveys = useMemo(()=>surveys.filter((s: any)=>s.user_id===userId).sort((a,b)=>new Date(a.survey_date).getTime()-new Date(b.survey_date).getTime()),[userId]);
  const uLogs = useMemo(()=>interviewLogs.filter(l=>l.user_id===userId).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()),[userId,interviewLogs]);
  const uApt = useMemo(()=>aptitudeTests.filter(t=>t.user_id===userId),[userId]);
  if(!user) return(<div className='fade-in' style={{textAlign:'center',padding:'var(--space-12)'}}><span style={{fontSize:'3rem'}}>🔍</span><h2>スタッフが見つかりません</h2><button className='btn btn-primary' onClick={()=>navigate('/')}>ダッシュボードへ戻る</button></div>);
  const trendData = useMemo(()=>({labels:uSurveys.map((s: any)=>{const d=new Date(s.survey_date);return d.getFullYear()+'/'+(d.getMonth()+1);}),datasets:[{label:'メンタルスコア',data:uSurveys.map((s: any)=>s.mental_score),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:0.4,pointRadius:5},{label:'モチベーション',data:uSurveys.map((s: any)=>s.motivation_score),borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.1)',fill:true,tension:0.4,pointRadius:5}]}),[uSurveys]);
  const aptRadar = useMemo(()=>{if(uApt.length===0)return null;const l=uApt[0];return{labels:l.scores.map((s: any)=>s.category),datasets:[{label:user.name,data:l.scores.map((s: any)=>s.score),backgroundColor:'rgba(13,158,158,0.2)',borderColor:'rgba(13,158,158,0.8)',borderWidth:2,pointBackgroundColor:'rgba(13,158,158,1)',pointRadius:4}]};},[uApt,user]);
  const aiAdvice = useMemo(()=>{
    const adv: {icon:string;title:string;description:string;priority:'high'|'medium'|'low';actions:string[]}[]=[];
    if(uSurveys.length>=2){const r=uSurveys.slice(-3);const mt=r.length>=2?r[r.length-1].mental_score-r[0].mental_score:0;const vt=r.length>=2?r[r.length-1].motivation_score-r[0].motivation_score:0;const lm=r[r.length-1].mental_score;const lv=r[r.length-1].motivation_score;
      if(mt<-15)adv.push({icon:'🚨',title:'メンタルスコアが急降下',description:'メンタルが'+Math.abs(Math.round(mt))+'ポイント低下。早急なフォローが必要です。',priority:'high',actions:['1on1面談を週次で実施','業務負荷の見直し','産業医面談の推薦']});
      else if(mt<-5)adv.push({icon:'⚡',title:'メンタルが低下傾向',description:'予防的なケアを推薦します。',priority:'medium',actions:['定期的な声かけ強化','業務優先順位のサポート','リフレッシュ休暇の勧奨']});
      if(vt<-15)adv.push({icon:'📉',title:'モチベーション急降下',description:'モチベが'+Math.abs(Math.round(vt))+'ポイント低下。キャリア面談が有効です。',priority:'high',actions:['キャリア面談を実施','新PJへの参加機会','スキルアップ研修の案内']});
      if(lm<40)adv.push({icon:'❤️',title:'メンタルが低水準',description:'メンタル('+lm+'点)が警戒ライン以下です。',priority:'high',actions:['即時の個別面談','メンタルヘルス相談窓口の案内','業務量の一時調整']});
      if(lv>=80&&mt>=0)adv.push({icon:'🌟',title:'良好な状態',description:'スコアは安定しており良好です。',priority:'low',actions:['定期的な承認','新たな挑戦機会','メンター役割の検討']});
    }
    const rl=uLogs.filter(l=>{const d=new Date(l.date);const a=new Date();a.setMonth(a.getMonth()-6);return d>=a;});
    if(rl.length===0)adv.push({icon:'💬',title:'面談が未実施',description:'最近の面談記録がありません。',priority:'medium',actions:['1on1を今週中に設定','定期面談の確立']});
    else if(rl.length<=1)adv.push({icon:'📅',title:'面談頻度が低め',description:'過去6ヶ月で'+rl.length+'回のみ。',priority:'medium',actions:['月次1on1の定例化','声かけを増やす']});
    if(uApt.length>0){const a=uApt[0];const lo=a.scores.filter((s: any)=>s.score<50);const hi=a.scores.filter((s: any)=>s.score>=80);
      const am: Record<string,string[]>={'ストレス耐性':['ストレスマネジメント研修','リラクゼーション技法の指導'],'コミュニケーション':['コミュニケーション研修','ペアワーク機会を増やす'],'リーダーシップ':['小規模PJリーダーを任せる','リーダーシップ研修'],'感情のコントロール':['アンガーマネジメント研修','マインドフルネス'],'サポーティブ':['チームビルディング活動','後輩指導の機会提供']};
      lo.forEach((s: any)=>adv.push({icon:'🧪',title:'適性検査: '+s.category+'が低め',description:s.category+'のスコアが'+s.score+'点。強化を検討。',priority:'medium',actions:am[s.category]||['専門研修を推薦']}));
      if(hi.length>0)adv.push({icon:'💪',title:'強みを活かす',description:hi.map((s: any)=>s.category).join('・')+'が強みです。',priority:'low',actions:['強みを活かせるPJへのアサイン','メンタリング役割']});
    }
    if(adv.length===0)adv.push({icon:'✅',title:'憸念事項なし',description:'大きなリスクは検出されていません。',priority:'low',actions:['定期面談の継続','サーベイ回答の促進']});
    return adv.sort((a,b)=>{const o: Record<string,number>={high:0,medium:1,low:2};return o[a.priority]-o[b.priority];});
  },[uSurveys,uLogs,uApt]);
  const handleAdd = () => {
    const log: InterviewLog = { id:'int-'+Date.now(), user_id:userId!, interviewer_id:'u-1', date:new Date().toISOString().split('T')[0], type:nw.type, summary:nw.summary, details:nw.details, mood:nw.mood, action_items:nw.action_items.split('\n').filter(Boolean), created_at:new Date().toISOString().split('T')[0] };
    setInterviewLogs(p=>[...p,log]);
    setNw({type:'定期面談' as InterviewType,summary:'',details:'',mood:3 as 1|2|3|4|5,action_items:''});
    setShowAdd(false);
  };

  const cOpts = {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top' as const,labels:{font:{family:"'Inter','Noto Sans JP',sans-serif",size:12},usePointStyle:true}}},scales:{y:{min:0,max:100,grid:{color:'rgba(0,0,0,0.04)'}},x:{grid:{display:false}}}};
  const rOpts = {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{min:0,max:100,ticks:{stepSize:20,font:{size:10},backdropColor:'transparent'},pointLabels:{font:{family:"'Inter','Noto Sans JP',sans-serif",size:11}},grid:{color:'rgba(0,0,0,0.06)'}}}};
  const pCols: Record<string,string> = {high:'var(--color-danger)',medium:'var(--color-warning)',low:'var(--color-success)'};
  const pBgs: Record<string,string> = {high:'var(--color-danger-bg)',medium:'var(--color-warning-bg)',low:'var(--color-success-bg)'};
  const pLbls: Record<string,string> = {high:'緊急',medium:'注意',low:'良好'};

  return (
    <div className='fade-in'>
      <div style={{display:'flex',alignItems:'center',gap:'var(--space-4)',marginBottom:'var(--space-6)',flexWrap:'wrap'}}>
        <button className='btn btn-secondary btn-sm' onClick={()=>navigate('/')}>← 戻る</button>
        <div style={{width:56,height:56,borderRadius:'var(--radius-full)',background:'linear-gradient(135deg,var(--color-primary-400),var(--color-accent-400))',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'var(--font-size-xl)',flexShrink:0}}>{user.name.charAt(0)}</div>
        <div><h2 className='page-title' style={{marginBottom:0}}>{user.name}</h2><p className='page-subtitle' style={{margin:0}}>{fac?.name} / {occ?.name}{user.status==='leave'&&<span className='badge badge-danger' style={{marginLeft:'var(--space-2)'}}>休職中</span>}</p></div>
        {uSurveys.length>0&&<div style={{marginLeft:'auto',textAlign:'right'}}><div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)'}}>最新スコア</div><div style={{fontSize:'var(--font-size-xl)',fontWeight:700}}>M:{uSurveys[uSurveys.length-1].mental_score} / V:{uSurveys[uSurveys.length-1].motivation_score}</div></div>}
      </div>
      <div className='stats-grid'>
        <div className='stat-card'><div className='stat-card-icon' style={{background:'var(--color-primary-50)',color:'var(--color-primary-500)'}}>📊</div><div className='stat-card-value'>{uSurveys.length}</div><div className='stat-card-label'>サーベイ回答数</div></div>
        <div className='stat-card'><div className='stat-card-icon' style={{background:'var(--color-accent-50)',color:'var(--color-accent-500)'}}>📝</div><div className='stat-card-value'>{uLogs.length}</div><div className='stat-card-label'>面談記録</div></div>
        <div className='stat-card'><div className='stat-card-icon' style={{background:'var(--color-info-bg)',color:'var(--color-info)'}}>🧪</div><div className='stat-card-value'>{uApt.length}</div><div className='stat-card-label'>適性検査</div></div>
        <div className='stat-card'><div className='stat-card-icon' style={{background:pBgs[aiAdvice[0]?.priority||'low'],color:pCols[aiAdvice[0]?.priority||'low']}}>🤖</div><div className='stat-card-value'>{aiAdvice.filter(a=>a.priority==='high').length}</div><div className='stat-card-label'>緊急アドバイス</div></div>
      </div>

      {/* Staff Selector */}
      <div className='card' style={{marginBottom:'var(--space-5)',padding:'var(--space-3) var(--space-4)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'var(--space-3)',flexWrap:'wrap'}}>
          <label style={{fontWeight:600,fontSize:'var(--font-size-sm)',whiteSpace:'nowrap'}}>👥 スタッフ選択:</label>
          <select className='form-select' value={userId} onChange={(e)=>navigate('/staff/'+e.target.value)} style={{flex:1,minWidth:200}}>
            {users.map(u=>(<option key={u.id} value={u.id}>{u.name} - {facilities.find(f=>f.id===u.facility_id)?.name}</option>))}
          </select>
        </div>
      </div>
      <div className='tab-nav'>
        <button className={'tab-item '+(activeTab==='survey'?'active':'')} onClick={()=>setActiveTab('survey')}>📊 スコア推移</button>
        <button className={'tab-item '+(activeTab==='interviews'?'active':'')} onClick={()=>setActiveTab('interviews')}>📝 面談記録</button>
        <button className={'tab-item '+(activeTab==='aptitude'?'active':'')} onClick={()=>setActiveTab('aptitude')}>🧪 適性検査</button>
        <button className={'tab-item '+(activeTab==='ai'?'active':'')} onClick={()=>setActiveTab('ai')}>🤖 AIアドバイス</button>
        <button className={'tab-item '+(activeTab==='hr'?'active':'')} onClick={()=>setActiveTab('hr')}>💼 人事情報</button>
      </div>
      {activeTab==='survey'&&(<div className='card'><div className='card-header'><h3 className='card-title'>📈 スコア推移</h3></div><div className='card-body'>{uSurveys.length>0?(<div className='chart-container'><Line data={trendData} options={cOpts}/></div>):(<div style={{textAlign:'center',padding:'var(--space-8)',color:'var(--color-neutral-400)'}}>サーベイデータがありません</div>)}</div></div>)}
      {activeTab==='interviews'&&(<div>
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'var(--space-4)'}}><button className='btn btn-primary' onClick={()=>setShowAdd(true)}>➕ 面談記録を追加</button></div>
        {showAdd&&(<div className='card' style={{marginBottom:'var(--space-5)',borderColor:'var(--color-primary-200)',borderStyle:'dashed'}}><div className='card-header'><h3 className='card-title'>➕ 新しい面談記録</h3></div><div className='card-body'>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'var(--space-4)'}}>
            <div className='form-group'><label className='form-label'>面談種別</label><select className='form-select' value={nw.type} onChange={e=>setNw(p=>({...p,type:e.target.value as InterviewType}))}><option>定期面談</option><option>1on1</option><option>フォローアップ</option><option>キャリア面談</option><option>その他</option></select></div>
            <div className='form-group'><label className='form-label'>印象</label><div style={{display:'flex',gap:'var(--space-2)'}}>{MOOD_ICONS.map((icon,i)=>(<button key={i} className={'survey-mood-btn '+(nw.mood===i+1?'active':'')} onClick={()=>setNw(p=>({...p,mood:(i+1) as 1|2|3|4|5}))} style={{fontSize:'1.5rem',padding:'4px 8px'}}>{icon}</button>))}</div></div>
          </div>
          <div className='form-group'><label className='form-label'>概要</label><input type='text' className='form-input' placeholder='面談の概要を入力' value={nw.summary} onChange={e=>setNw(p=>({...p,summary:e.target.value}))}/></div>
          <div className='form-group'><label className='form-label'>詳細メモ</label><textarea className='form-textarea' rows={3} placeholder='面談の詳細を記録' value={nw.details} onChange={e=>setNw(p=>({...p,details:e.target.value}))}/></div>
          <div className='form-group'><label className='form-label'>アクションアイテム（改行区切り）</label><textarea className='form-textarea' rows={2} placeholder='アクションアイテムを入力' value={nw.action_items} onChange={e=>setNw(p=>({...p,action_items:e.target.value}))}/></div>
          <div style={{display:'flex',gap:'var(--space-3)'}}><button className='btn btn-primary' onClick={handleAdd} disabled={!nw.summary.trim()}>保存する</button><button className='btn btn-secondary' onClick={()=>setShowAdd(false)}>キャンセル</button></div>
        </div></div>)}
        {uLogs.length===0?(<div className='card'><div className='card-body' style={{textAlign:'center',color:'var(--color-neutral-400)',padding:'var(--space-8)'}}>面談記録がありません</div></div>):(
          uLogs.map((log)=>(<div key={log.id} className='card' style={{marginBottom:'var(--space-4)'}}>
            <div className='card-header'><div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}><span>{INT_ICONS[log.type]||'📝'}</span><h3 className='card-title' style={{fontSize:'var(--font-size-sm)'}}>{log.summary}</h3></div><div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}><span className='badge badge-neutral'>{log.type}</span><span style={{fontSize:'1.2rem'}}>{MOOD_ICONS[(log.mood||3)-1]}</span><span style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)'}}>{log.date}</span></div></div>
            <div className='card-body' style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)'}}><p style={{lineHeight:'var(--line-height-relaxed)'}}>{log.details}</p>{log.action_items.length>0&&(<div style={{marginTop:'var(--space-3)',padding:'var(--space-3)',background:'var(--color-neutral-50)',borderRadius:'var(--radius-md)',borderLeft:'3px solid var(--color-primary-400)'}}><div style={{fontWeight:600,fontSize:'var(--font-size-xs)',marginBottom:'var(--space-1)',color:'var(--color-primary-600)'}}>🎯 アクションアイテム</div>{log.action_items.map((item,j)=>(<div key={j} style={{fontSize:'var(--font-size-xs)',padding:'2px 0'}}>• {item}</div>))}</div>)}</div>
          </div>))
        )}
      </div>)}
      {activeTab==='aptitude'&&(<div><div style={{display:'flex',justifyContent:'flex-end',marginBottom:'var(--space-4)'}}><button className='btn btn-primary' onClick={()=>navigate('/aptitude/test')}>🧪 新しい検査を実施</button></div>{uApt.length===0?(<div className='card'><div className='card-body' style={{textAlign:'center',color:'var(--color-neutral-400)',padding:'var(--space-8)'}}>適性検査データがありません</div></div>):(<div className='grid-2'>
        <div className='card'><div className='card-header'><h3 className='card-title'>🕸️ スコアレーダー</h3></div><div className='card-body'>{aptRadar&&<div style={{height:320}}><Radar data={aptRadar} options={rOpts}/></div>}</div></div>
        <div className='card'><div className='card-header'><h3 className='card-title'>📋 詳細スコア</h3><span style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)'}}>検査日: {uApt[0].test_date}</span></div><div className='card-body'>{uApt[0].scores.map((s: any)=>(<div key={s.category} style={{display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'var(--space-3) 0',borderBottom:'1px solid var(--color-neutral-100)'}}><span style={{fontSize:'var(--font-size-sm)',flex:1,fontWeight:500}}>{s.category}</span><div style={{width:120,height:8,borderRadius:4,background:'var(--color-neutral-100)',overflow:'hidden'}}><div style={{width:s.score+'%',height:'100%',borderRadius:4,background:s.score>=70?'var(--color-success)':s.score>=50?'var(--color-warning)':'var(--color-danger)',transition:'width 0.5s'}}/></div><span style={{fontSize:'var(--font-size-sm)',fontWeight:700,width:40,textAlign:'right',color:s.score>=70?'var(--color-success)':s.score>=50?'var(--color-warning)':'var(--color-danger)'}}>{s.score}</span></div>))}<div style={{marginTop:'var(--space-4)',padding:'var(--space-3)',background:'var(--color-neutral-50)',borderRadius:'var(--radius-md)',fontSize:'var(--font-size-sm)',fontStyle:'italic',color:'var(--color-neutral-600)'}}>💬 {uApt[0].overall_comment}</div></div></div>
      </div>)}</div>)}
      {activeTab==='ai'&&(<div>
        <div style={{padding:'var(--space-4) var(--space-5)',background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(13,158,158,0.08))',borderRadius:'var(--radius-lg)',marginBottom:'var(--space-6)',border:'1px solid rgba(99,102,241,0.15)'}}><div style={{display:'flex',alignItems:'center',gap:'var(--space-2)',fontWeight:600,marginBottom:'var(--space-1)'}}>🤖 AIアドバイスエンジン</div><div style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)'}}>サーベイ推移・面談記録・適性検査のデータを分析し、{user.name}さんへの最適なアプローチを提案します。</div></div>
        {aiAdvice.map((a,i)=>(<div key={i} className='card' style={{marginBottom:'var(--space-4)',borderLeft:'4px solid '+pCols[a.priority]}}>
          <div className='card-header'><div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}><span style={{fontSize:'var(--font-size-xl)'}}>{a.icon}</span><h3 className='card-title'>{a.title}</h3></div><span className='badge' style={{background:pBgs[a.priority],color:pCols[a.priority]}}>{pLbls[a.priority]}</span></div>
          <div className='card-body'><p style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)',marginBottom:'var(--space-4)',lineHeight:'var(--line-height-relaxed)'}}>{a.description}</p><div style={{padding:'var(--space-3) var(--space-4)',background:'var(--color-neutral-50)',borderRadius:'var(--radius-md)'}}><div style={{fontWeight:600,fontSize:'var(--font-size-xs)',color:'var(--color-primary-600)',marginBottom:'var(--space-2)'}}>💡 推奨アクション</div>{a.actions.map((act,j)=>(<div key={j} style={{display:'flex',alignItems:'center',gap:'var(--space-2)',fontSize:'var(--font-size-sm)',padding:'3px 0'}}><span style={{color:'var(--color-primary-400)'}}>▶</span> {act}</div>))}</div></div>
        </div>))}
      </div>)}
      {activeTab==='hr'&&(<HrInfoTab user={user} fac={fac} occ={occ} facilities={facilities} occupations={occupations} updateUser={updateUser} />)}
    </div>
  );
}

// ===== HrInfoTab Component with Edit Mode =====
import type { User, Facility, Occupation, Qualification } from '../types';

interface HrInfoTabProps {
  user: User;
  fac: Facility | undefined;
  occ: Occupation | undefined;
  facilities: Facility[];
  occupations: Occupation[];
  updateUser: (id: string, updates: Partial<User>) => void;
}

interface EditForm {
  name: string;
  gender: string;
  birth_date: string;
  facility_id: string;
  occupation_id: string;
  position: string;
  employment_type: string;
  address: string;
  phone: string;
  hire_date: string;
  qualifications_str: string;
  notes: string;
  health_check_date: string;
  status: string;
  resignation_date: string;
  resignation_reason: string;
}

function HrInfoTab({ user, fac, occ, facilities, occupations, updateUser }: HrInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const buildForm = (): EditForm => ({
    name: user.name || '',
    gender: user.gender || '',
    birth_date: user.birth_date || '',
    facility_id: user.facility_id || '',
    occupation_id: user.occupation_id || '',
    position: user.position || '',
    employment_type: user.employment_type || '',
    address: user.address || '',
    phone: user.phone || '',
    hire_date: user.hire_date || '',
    qualifications_str: user.qualifications?.map(q => q.name).join(', ') || '',
    notes: user.notes || '',
    health_check_date: user.health_check_date || '',
    status: user.status || 'active',
    resignation_date: user.resignation_date || '',
    resignation_reason: user.resignation_reason || '',
  });

  const [form, setForm] = useState<EditForm>(buildForm);
  const set = (key: keyof EditForm, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleEdit = () => {
    setForm(buildForm());
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(buildForm());
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const quals: Qualification[] = form.qualifications_str
      .split(/[,、]/)
      .map(q => ({ name: q.trim(), acquired_date: '' }))
      .filter(q => q.name);

    const updates: Partial<User> = {
      name: form.name.trim(),
      gender: form.gender.trim() || undefined,
      birth_date: form.birth_date.trim() || undefined,
      facility_id: form.facility_id,
      occupation_id: form.occupation_id,
      position: form.position.trim() || undefined,
      employment_type: (form.employment_type.trim() || undefined) as User['employment_type'],
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      hire_date: form.hire_date.trim() || undefined,
      qualifications: quals.length > 0 ? quals : undefined,
      notes: form.notes.trim() || undefined,
      health_check_date: form.health_check_date.trim() || undefined,
      status: form.status as User['status'],
      resignation_date: form.resignation_date.trim() || undefined,
      resignation_reason: form.resignation_reason.trim() || undefined,
    };

    // Update DataContext
    updateUser(user.id, updates);

    // Save to Supabase
    try {
      await userMutations.updateUser(user.id, {
        ...updates,
        qualifications: quals.length > 0 ? quals : null,
      });
    } catch (e) {
      console.warn('Supabase更新失敗:', e);
    }

    setSaving(false);
    setIsEditing(false);
    setToast('基本情報を更新しました');
    setTimeout(() => setToast(null), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-neutral-300)', fontSize: 'var(--font-size-sm)',
    background: '#fff', transition: 'border-color 0.15s',
  };

  const fieldCardStyle: React.CSSProperties = {
    padding: 'var(--space-3) var(--space-4)', background: 'var(--color-neutral-50)',
    borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
    gap: 'var(--space-3)', border: '1px solid var(--color-neutral-100)',
  };



  // View-mode display items
  const displayItems = [
    { label: '氏名', value: user.name, icon: '👤' },
    { label: '性別', value: user.gender || '未登録', icon: '🚻' },
    { label: '生年月日', value: user.birth_date || '未登録', icon: '🎂' },
    { label: '所属', value: fac?.name || '未登録', icon: '🏥' },
    { label: '職種', value: occ?.name || '未登録', icon: '💼' },
    { label: '役職', value: user.position || '未登録', icon: '🎖️' },
    { label: '雇用形態', value: user.employment_type || '未登録', icon: '📝' },
    { label: '住所', value: user.address || '未登録', icon: '🏠' },
    { label: '連絡先', value: user.phone || '未登録', icon: '📞' },
    { label: '雇用年月日', value: user.hire_date || '未登録', icon: '📅' },
    { label: '保有資格', value: user.qualifications?.map(q => q.name).join(', ') || '未登録', icon: '📜' },
    { label: '備考', value: user.notes || '—', icon: '📎' },
    { label: '健康診断時期', value: user.health_check_date || '未登録', icon: '🩺' },
  ];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 24px', background: 'var(--color-success)', color: '#fff', borderRadius: 'var(--radius-lg)', fontWeight: 600, boxShadow: 'var(--shadow-lg)', zIndex: 9999, animation: 'fadeIn 0.3s' }}>✅ {toast}</div>
      )}

      <div className='card' style={{ marginBottom: 'var(--space-5)' }}>
        <div className='card-header'>
          <h3 className='card-title'>📋 基本情報</h3>
          {!isEditing ? (
            <button className='btn btn-primary btn-sm' onClick={handleEdit}>✏️ 編集</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className='btn btn-primary btn-sm' onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? '⏳ 保存中...' : '💾 保存'}
              </button>
              <button className='btn btn-secondary btn-sm' onClick={handleCancel} disabled={saving}>✕ キャンセル</button>
            </div>
          )}
        </div>
        <div className='card-body'>
          {!isEditing ? (
            /* ===== View Mode ===== */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'var(--space-4)' }}>
              {displayItems.map((item, i) => (
                <div key={i} style={fieldCardStyle}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', wordBreak: 'break-word', color: item.value === '未登録' || item.value === '—' ? 'var(--color-neutral-400)' : 'var(--color-neutral-800)' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ===== Edit Mode ===== */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--space-4)' }}>
              {/* 氏名 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>👤 氏名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input type='text' style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder='氏名' />
              </div>
              {/* 性別 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>🚻 性別</label>
                <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value=''>未選択</option>
                  <option value='男性'>男性</option>
                  <option value='女性'>女性</option>
                  <option value='その他'>その他</option>
                </select>
              </div>
              {/* 生年月日 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>🎂 生年月日</label>
                <input type='date' style={inputStyle} value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
              </div>
              {/* 所属 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>🏥 所属</label>
                <select style={inputStyle} value={form.facility_id} onChange={e => set('facility_id', e.target.value)}>
                  {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              {/* 職種 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>💼 職種</label>
                <select style={inputStyle} value={form.occupation_id} onChange={e => set('occupation_id', e.target.value)}>
                  {occupations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              {/* 役職 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>🎖️ 役職</label>
                <input type='text' style={inputStyle} value={form.position} onChange={e => set('position', e.target.value)} placeholder='例: 一般、主任、課長' />
              </div>
              {/* 雇用形態 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>📝 雇用形態</label>
                <select style={inputStyle} value={form.employment_type} onChange={e => set('employment_type', e.target.value)}>
                  <option value=''>未選択</option>
                  <option value='常勤'>常勤</option>
                  <option value='非常勤'>非常勤</option>
                  <option value='パート'>パート</option>
                  <option value='派遣'>派遣</option>
                  <option value='契約'>契約</option>
                </select>
              </div>
              {/* 住所 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>🏠 住所</label>
                <input type='text' style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder='例: 大阪府大阪市...' />
              </div>
              {/* 連絡先 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>📞 連絡先</label>
                <input type='tel' style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder='例: 090-1234-5678' />
              </div>
              {/* 雇用年月日 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>📅 雇用年月日</label>
                <input type='date' style={inputStyle} value={form.hire_date} onChange={e => set('hire_date', e.target.value)} />
              </div>
              {/* 保有資格 */}
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>📜 保有資格（カンマ区切り）</label>
                <input type='text' style={inputStyle} value={form.qualifications_str} onChange={e => set('qualifications_str', e.target.value)} placeholder='例: 看護師免許, 介護福祉士' />
              </div>
              {/* 健康診断時期 */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>🩺 健康診断時期</label>
                <input type='text' style={inputStyle} value={form.health_check_date} onChange={e => set('health_check_date', e.target.value)} placeholder='例: 2025-10 or 毎年4月' />
              </div>
              {/* ステータス */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>📊 ステータス</label>
                <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value='active'>在籍</option>
                  <option value='leave'>休職中</option>
                  <option value='inactive'>退職</option>
                </select>
              </div>
              {/* 備考 - full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', display: 'block', marginBottom: 4 }}>📎 備考</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder='備考を入力...' />
              </div>
              {/* Resignation fields (shown when status is inactive) */}
              {form.status === 'inactive' && (<>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', display: 'block', marginBottom: 4 }}>📅 離職日</label>
                  <input type='date' style={{ ...inputStyle, borderColor: 'var(--color-danger)' }} value={form.resignation_date} onChange={e => set('resignation_date', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', display: 'block', marginBottom: 4 }}>💬 離職理由</label>
                  <input type='text' style={{ ...inputStyle, borderColor: 'var(--color-danger)' }} value={form.resignation_reason} onChange={e => set('resignation_reason', e.target.value)} placeholder='離職理由を入力' />
                </div>
              </>)}
            </div>
          )}
        </div>
      </div>

      {/* Resignation info (view-only for inactive, shown outside edit) */}
      {!isEditing && user.status === 'inactive' && (
        <div className='card' style={{ marginBottom: 'var(--space-5)', borderLeft: '4px solid var(--color-danger)' }}>
          <div className='card-header'><h3 className='card-title'>🚪 離職情報</h3></div>
          <div className='card-body'>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'var(--space-4)' }}>
              <div style={fieldCardStyle}>
                <span style={{ fontSize: '1.3rem' }}>📅</span>
                <div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginBottom: 2 }}>離職日</div><div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>{user.resignation_date || '未登録'}</div></div>
              </div>
              <div style={fieldCardStyle}>
                <span style={{ fontSize: '1.3rem' }}>💬</span>
                <div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginBottom: 2 }}>離職理由</div><div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>{user.resignation_reason || '未登録'}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 昇給履歴 */}
      <div className='card' style={{ marginBottom: 'var(--space-5)' }}>
        <div className='card-header'><h3 className='card-title'>💰 昇給履歴</h3></div>
        <div className='card-body'>
          <table className='sp-table'>
            <thead><tr><th>年月日</th><th>昇給額</th><th>備考</th></tr></thead>
            <tbody>
              {[
                { date: '2025-04-01', amount: '+15,000円', note: '定期昇給' },
                { date: '2024-04-01', amount: '+12,000円', note: '定期昇給' },
                { date: '2023-10-01', amount: '+20,000円', note: '役職手当追加' },
                { date: '2023-04-01', amount: '+10,000円', note: '定期昇給' },
                { date: '2022-04-01', amount: '+8,000円', note: '入社時' },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.date}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{r.amount}</td>
                  <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}