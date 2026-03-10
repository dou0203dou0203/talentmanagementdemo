import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { users, facilities } from '../data/mockData';
import type { AptitudeTestScore } from '../types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Question { id: string; category: string; text: string; }

const CATEGORIES = [
  { key: 'ストレス耐性', icon: '🧘', color: '#ef4444' },
  { key: 'コミュニケーション', icon: '💬', color: '#3b82f6' },
  { key: 'リーダーシップ', icon: '👑', color: '#f59e0b' },
  { key: '感情のコントロール', icon: '🎭', color: '#8b5cf6' },
  { key: 'サポーティブ', icon: '🤝', color: '#10b981' },
  { key: '総合適性', icon: '🌟', color: '#0d9e9e' },
];

const QUESTIONS: Question[] = [
  { id:'q1', category:'ストレス耐性', text:'予定外の業務変更があっても冷静に対応できる' },
  { id:'q2', category:'ストレス耐性', text:'失敗した時に気持ちを素早く切り替えられる' },
  { id:'q3', category:'ストレス耐性', text:'忙しい状況でも蒽てずに優先順位をつけられる' },
  { id:'q4', category:'ストレス耐性', text:'プレッシャーのかかる場面でも結果を出せる' },
  { id:'q5', category:'ストレス耐性', text:'困難な状況を成長の機会と捕らえられる' },
  { id:'q6', category:'コミュニケーション', text:'相手の気持ちを考えて言葉を選ぶことができる' },
  { id:'q7', category:'コミュニケーション', text:'チーム内で自分の意見をわかりやすく伝えられる' },
  { id:'q8', category:'コミュニケーション', text:'相手の話を最後までしっかり聴くことができる' },
  { id:'q9', category:'コミュニケーション', text:'異なる立場の人とも円滑にコミュニケーションがとれる' },
  { id:'q10', category:'コミュニケーション', text:'必要な情報を適切なタイミングで共有できる' },
  { id:'q11', category:'リーダーシップ', text:'メンバーの強みを見つけて活かすことができる' },
  { id:'q12', category:'リーダーシップ', text:'困難な状況でもチームに方向性を示せる' },
  { id:'q13', category:'リーダーシップ', text:'責任を持って意思決定ができる' },
  { id:'q14', category:'リーダーシップ', text:'チームのモチベーションを高める働きかけができる' },
  { id:'q15', category:'リーダーシップ', text:'目標達成に向けて計画を立て実行できる' },
  { id:'q16', category:'感情のコントロール', text:'イライラした時に自分を落ち着かせる方法を持っている' },
  { id:'q17', category:'感情のコントロール', text:'感情的にならず冷静に議論できる' },
  { id:'q18', category:'感情のコントロール', text:'批判を受けても建設的に受け止められる' },
  { id:'q19', category:'感情のコントロール', text:'不安や緊張を適切にコントロールできる' },
  { id:'q20', category:'感情のコントロール', text:'感情の起伏に振り回されず安定した行動がとれる' },
  { id:'q21', category:'サポーティブ', text:'困っている同僚に自ら声をかけることができる' },
  { id:'q22', category:'サポーティブ', text:'後輩の成長を喜び、積極的にサポートできる' },
  { id:'q23', category:'サポーティブ', text:'チームの雰囲気を良くするために行動できる' },
  { id:'q24', category:'サポーティブ', text:'他の人の負担を理解し、協力を申し出られる' },
  { id:'q25', category:'サポーティブ', text:'感謝の気持ちを素直に伝えることができる' },
  { id:'q26', category:'総合適性', text:'新しいことに挑戦するのが好きだ' },
  { id:'q27', category:'総合適性', text:'自分の強みと弱みを理解している' },
  { id:'q28', category:'総合適性', text:'継続的に学び・成長しようとする姿勢がある' },
  { id:'q29', category:'総合適性', text:'護理・医療の仕事にやりがいを感じている' },
  { id:'q30', category:'総合適性', text:'将来のキャリアについて前向きに考えられる' },
];

const SCALE_LABELS = ['全く当てはまらない', 'あまり当てはまらない', 'どちらとも言えない', 'やや当てはまる', '非常に当てはまる'];
const SCALE_ICONS = ['🟥', '🟧', '🟨', '🟩', '🟦'];

type Step = 'select' | 'test' | 'result';

export default function AptitudeTestForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentCatIdx, setCurrentCatIdx] = useState(0);

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedFac = facilities.find(f => f.id === selectedUser?.facility_id);

  const catQuestions = useMemo(() => {
    return CATEGORIES.map(c => ({ ...c, questions: QUESTIONS.filter(q => q.category === c.key) }));
  }, []);

  const currentCat = catQuestions[currentCatIdx];
  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);
  const catAnswered = currentCat?.questions.every(q => answers[q.id] !== undefined) || false;
  const progress = Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);
  const scores: AptitudeTestScore[] = useMemo(() => {
    if (!allAnswered) return [];
    return CATEGORIES.map(c => {
      const qs = QUESTIONS.filter(q => q.category === c.key);
      const total = qs.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
      return { category: c.key, score: Math.round((total / (qs.length * 5)) * 100), max_score: 100 };
    });
  }, [answers, allAnswered]);

  const generateComment = (sc: AptitudeTestScore[]) => {
    if (sc.length === 0) return '';
    const high = sc.filter(s => s.score >= 80).map(s => s.category);
    const low = sc.filter(s => s.score < 50).map(s => s.category);
    const avg = Math.round(sc.reduce((s, x) => s + x.score, 0) / sc.length);
    let comment = '';
    if (high.length > 0) comment += high.join('・') + 'が特に優れています。';
    if (low.length > 0) comment += low.join('・') + 'は今後の強化ポイントです。';
    if (avg >= 80) comment += '全体的に非常に高い適性を示しています。';
    else if (avg >= 60) comment += 'バランスのとれた結果です。';
    else comment += '総合的なサポートプログラムの検討を推奨します。';
    return comment;
  };

  const radarData = useMemo(() => {
    if (scores.length === 0) return null;
    return {
      labels: scores.map(s => s.category),
      datasets: [{ label: selectedUser?.name || '', data: scores.map(s => s.score), backgroundColor: 'rgba(13,158,158,0.2)', borderColor: 'rgba(13,158,158,0.8)', borderWidth: 2, pointBackgroundColor: 'rgba(13,158,158,1)', pointRadius: 5 }],
    };
  }, [scores, selectedUser]);

  const rOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, ticks: { stepSize: 20, font: { size: 10 }, backdropColor: 'transparent' }, pointLabels: { font: { family: "'Inter','Noto Sans JP',sans-serif", size: 12 } }, grid: { color: 'rgba(0,0,0,0.06)' } } } };
  return (
    <div className='fade-in'>
      <h2 className='page-title'>🧪 適性検査実施</h2>
      <p className='page-subtitle'>スタッフの適性を評価する30問の検査を実施します。</p>

      {step !== 'select' && (
        <div style={{marginBottom:'var(--space-5)'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)',marginBottom:'var(--space-1)'}}>
            <span>進捗: {Object.keys(answers).length}/{QUESTIONS.length}問</span><span>{progress}%</span>
          </div>
          <div style={{height:8,borderRadius:4,background:'var(--color-neutral-100)',overflow:'hidden'}}>
            <div style={{width:progress+'%',height:'100%',borderRadius:4,background:'linear-gradient(90deg,var(--color-primary-400),var(--color-accent-400))',transition:'width 0.4s'}} />
          </div>
        </div>)}

      {step === 'select' && (
        <div className='card'>
          <div className='card-header'><h3 className='card-title'>👤 対象スタッフを選択</h3></div>
          <div className='card-body'>
            <div className='form-group'>
              <label className='form-label'>スタッフ名</label>
              <select className='form-select' value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                <option value=''>選択してください...</option>
                {users.filter(u=>u.status==='active').map(u => (<option key={u.id} value={u.id}>{u.name} - {facilities.find(f=>f.id===u.facility_id)?.name}</option>))}
              </select>
            </div>
            {selectedUser && (
              <div style={{padding:'var(--space-3)',background:'var(--color-primary-50)',borderRadius:'var(--radius-md)',marginTop:'var(--space-3)',display:'flex',alignItems:'center',gap:'var(--space-3)'}}>
                <div style={{width:48,height:48,borderRadius:'var(--radius-full)',background:'linear-gradient(135deg,var(--color-primary-400),var(--color-accent-400))',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'var(--font-size-lg)'}}>{selectedUser.name.charAt(0)}</div>
                <div><div style={{fontWeight:600}}>{selectedUser.name}</div><div style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-500)'}}>{selectedFac?.name}</div></div>
              </div>)}
            <button className='btn btn-primary' style={{marginTop:'var(--space-4)'}} disabled={!selectedUserId} onClick={() => setStep('test')}>検査を開始する →</button>
          </div>
        </div>)}

      {step === 'test' && currentCat && (
        <div>
          <div style={{display:'flex',gap:'var(--space-2)',marginBottom:'var(--space-4)',flexWrap:'wrap'}}>
            {catQuestions.map((c, idx) => {
              const done = c.questions.every(q => answers[q.id] !== undefined);
              return (<button key={c.key} onClick={() => setCurrentCatIdx(idx)} style={{padding:'var(--space-2) var(--space-3)',borderRadius:'var(--radius-md)',border:idx===currentCatIdx?'2px solid var(--color-primary-400)':'2px solid var(--color-neutral-200)',background:idx===currentCatIdx?'var(--color-primary-50)':'#fff',cursor:'pointer',fontSize:'var(--font-size-xs)',fontWeight:idx===currentCatIdx?600:400,display:'flex',alignItems:'center',gap:'var(--space-1)',transition:'all 0.2s'}}>
                <span>{c.icon}</span><span>{c.key}</span>{done && <span>✅</span>}
              </button>);
            })}
          </div>
          <div className='card' style={{borderTop:'4px solid ' + currentCat.color}}>
            <div className='card-header'><div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}><span style={{fontSize:'var(--font-size-xl)'}}>{currentCat.icon}</span><h3 className='card-title'>{currentCat.key}</h3></div><span className='badge badge-neutral'>{currentCat.questions.filter(q=>answers[q.id]!==undefined).length}/{currentCat.questions.length}問回答</span></div>
            <div className='card-body'>
              {currentCat.questions.map((q, qi) => (
                <div key={q.id} style={{padding:'var(--space-4)',borderBottom:qi<currentCat.questions.length-1?'1px solid var(--color-neutral-100)':'none'}}>
                  <div style={{fontWeight:500,fontSize:'var(--font-size-sm)',marginBottom:'var(--space-3)',color:'var(--color-neutral-700)'}}>{qi+1}. {q.text}</div>
                  <div style={{display:'flex',gap:'var(--space-2)',flexWrap:'wrap'}}>
                    {SCALE_LABELS.map((label, si) => (
                      <button key={si} onClick={() => setAnswers(p => ({...p, [q.id]: si+1}))} style={{flex:'1 1 0',minWidth:80,padding:'var(--space-2) var(--space-1)',borderRadius:'var(--radius-md)',border:answers[q.id]===si+1?'2px solid var(--color-primary-400)':'2px solid var(--color-neutral-200)',background:answers[q.id]===si+1?'var(--color-primary-50)':'#fff',cursor:'pointer',fontSize:'var(--font-size-xs)',textAlign:'center',transition:'all 0.15s',display:'flex',flexDirection:'column' as const,alignItems:'center',gap:2}}>
                        <span style={{fontSize:'var(--font-size-lg)'}}>{SCALE_ICONS[si]}</span><span>{label}</span>
                      </button>))}
                  </div>
                </div>))}
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:'var(--space-4)'}}>
            <button className='btn btn-secondary' onClick={() => currentCatIdx > 0 ? setCurrentCatIdx(currentCatIdx-1) : setStep('select')}>← {currentCatIdx > 0 ? '前のカテゴリ' : '戻る'}</button>
            {currentCatIdx < catQuestions.length - 1 ? (<button className='btn btn-primary' disabled={!catAnswered} onClick={() => setCurrentCatIdx(currentCatIdx+1)}>次のカテゴリ →</button>) : (<button className='btn btn-primary' disabled={!allAnswered} onClick={() => setStep('result')}>結果を見る 📊</button>)}
          </div>
        </div>)}
      {step === 'result' && radarData && (
        <div>
          <div style={{padding:'var(--space-4) var(--space-5)',background:'linear-gradient(135deg,rgba(13,158,158,0.08),rgba(99,102,241,0.08))',borderRadius:'var(--radius-lg)',marginBottom:'var(--space-6)',border:'1px solid rgba(13,158,158,0.15)'}}>
            <div style={{fontWeight:600,marginBottom:'var(--space-1)'}}>✅ 検査完了 - {selectedUser?.name}さんの結果</div>
            <div style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)'}}>全{QUESTIONS.length}問の回答からスコアを算出しました。</div>
          </div>
          <div className='grid-2'>
            <div className='card'>
              <div className='card-header'><h3 className='card-title'>🕸️ スコアレーダー</h3></div>
              <div className='card-body'><div style={{height:320}}><Radar data={radarData} options={rOpts} /></div></div>
            </div>
            <div className='card'>
              <div className='card-header'><h3 className='card-title'>📋 カテゴリ別スコア</h3></div>
              <div className='card-body'>
                {scores.map((s, idx) => (
                  <div key={s.category} style={{display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'var(--space-3) 0',borderBottom:idx<scores.length-1?'1px solid var(--color-neutral-100)':'none'}}>
                    <span style={{fontSize:'var(--font-size-lg)'}}>{CATEGORIES.find(c=>c.key===s.category)?.icon}</span>
                    <span style={{fontSize:'var(--font-size-sm)',flex:1,fontWeight:500}}>{s.category}</span>
                    <div style={{width:120,height:8,borderRadius:4,background:'var(--color-neutral-100)',overflow:'hidden'}}><div style={{width:s.score+'%',height:'100%',borderRadius:4,background:s.score>=70?'var(--color-success)':s.score>=50?'var(--color-warning)':'var(--color-danger)',transition:'width 0.5s'}} /></div>
                    <span style={{fontSize:'var(--font-size-sm)',fontWeight:700,width:40,textAlign:'right',color:s.score>=70?'var(--color-success)':s.score>=50?'var(--color-warning)':'var(--color-danger)'}}>{s.score}</span>
                  </div>))}
              </div>
            </div>
          </div>
          <div className='card' style={{marginTop:'var(--space-5)'}}>
            <div className='card-header'><h3 className='card-title'>💬 総合コメント</h3></div>
            <div className='card-body'>
              <p style={{fontSize:'var(--font-size-sm)',lineHeight:'var(--line-height-relaxed)',color:'var(--color-neutral-600)'}}>{generateComment(scores)}</p>
              <div style={{marginTop:'var(--space-4)',display:'flex',alignItems:'center',gap:'var(--space-3)'}}>
                <div style={{fontSize:'var(--font-size-3xl)',fontWeight:700,color:'var(--color-primary-500)'}}>{Math.round(scores.reduce((s,x)=>s+x.score,0)/scores.length)}</div>
                <div><div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)'}}>総合スコア</div><div style={{fontSize:'var(--font-size-sm)',fontWeight:600}}>/100点</div></div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:'var(--space-3)',marginTop:'var(--space-5)',flexWrap:'wrap'}}>
            <button className='btn btn-primary' onClick={() => navigate('/staff/' + selectedUserId)}>👤 スタッフ詳細へ</button>
            <button className='btn btn-secondary' onClick={() => { setStep('select'); setAnswers({}); setCurrentCatIdx(0); setSelectedUserId(''); }}>🔄 別のスタッフで実施</button>
          </div>
        </div>)}
    </div>
  );
}