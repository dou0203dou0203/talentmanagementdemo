import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

// Attrition risk word dictionary
const RISK_WORDS: { word: string; weight: number; category: string }[] = [
  // High risk (weight 3)
  { word: '辞めたい', weight: 3, category: '離職意思' },
  { word: '退職', weight: 3, category: '離職意思' },
  { word: '転職', weight: 3, category: '離職意思' },
  { word: '辞める', weight: 3, category: '離職意思' },
  { word: 'いじめ', weight: 3, category: '人間関係' },
  { word: 'ハラスメント', weight: 3, category: '人間関係' },
  { word: 'パワハラ', weight: 3, category: '人間関係' },
  // Medium risk (weight 2)
  { word: '不満', weight: 2, category: '不満' },
  { word: 'つらい', weight: 2, category: 'メンタル' },
  { word: 'ストレス', weight: 2, category: 'メンタル' },
  { word: '疑問', weight: 2, category: '不満' },
  { word: '孤立', weight: 2, category: '人間関係' },
  { word: '無理', weight: 2, category: '過重労働' },
  { word: '体調', weight: 2, category: '健康' },
  { word: '過重労働', weight: 2, category: '過重労働' },
  { word: '残業', weight: 2, category: '過重労働' },
  { word: '不眠', weight: 2, category: '健康' },
  { word: '鬱', weight: 2, category: 'メンタル' },
  // Low risk (weight 1)
  { word: '不安', weight: 1, category: 'メンタル' },
  { word: '心配', weight: 1, category: 'メンタル' },
  { word: '給料', weight: 1, category: '待遇' },
  { word: '評価', weight: 1, category: '待遇' },
  { word: '人手不足', weight: 1, category: '過重労働' },
  { word: '大変', weight: 1, category: '過重労働' },
  { word: 'きつい', weight: 1, category: '過重労働' },
  { word: 'やりがい', weight: 1, category: 'モチベーション' },
  { word: '成長', weight: 1, category: 'モチベーション' },
];

const CATEGORY_COLORS: Record<string,string> = {
  '離職意思': '#ef4444', '人間関係': '#f59e0b', '不満': '#fb923c',
  'メンタル': '#8b5cf6', '過重労働': '#ec4899', '健康': '#06b6d4',
  '待遇': '#3b82f6', 'モチベーション': '#22c55e',
};

// Mock text data for analysis
const mockTexts: { userId: string; source: string; date: string; text: string }[] = [
  { userId: 'u-4', source: 'サーベイ', date: '2026-02', text: '最近ストレスがたまっていて、体調が心配です。人手不足で残業が多い。やりがいは感じるが無理している。' },
  { userId: 'u-4', source: '面談', date: '2026-01', text: '辞めたいとまでは思わないが、不満はある。給料の評価に疑問。孤立感を感じることがある。' },
  { userId: 'u-5', source: 'サーベイ', date: '2026-02', text: '職場の雰囲気は良い。成長できる環境。少しきつい時もあるが充実している。' },
  { userId: 'u-3', source: 'サーベイ', date: '2026-02', text: '業務量が増えて大変。人手不足が深刻。不眠気味。ストレスが鬱になっている。' },
  { userId: 'u-6', source: '面談', date: '2026-01', text: '転職も考えている。今の職場はつらい。ハラスメントとまでは言わないが不快なことがある。' },
  { userId: 'u-7', source: 'サーベイ', date: '2026-02', text: '仕事は順調。やりがいを感じて成長できている。不安は特にない。' },
  { userId: 'u-8', source: '面談', date: '2026-02', text: '体調管理が心配。過重労働気味。残業を減らしたいが人手不足で難しい。' },
  { userId: 'u-9', source: 'サーベイ', date: '2026-02', text: '職場環境に不満はない。給料もまあ納得。安定して働けている。' },
];

export default function AttritionAnalysis() {
    const { users, occupations, facilities } = useData();
  const navigate = useNavigate();
  const [filterFac, setFilterFac] = useState('all');

  // Analyze each user
  const userAnalysis = useMemo(() => {
    const analysis: { userId: string; score: number; maxWeight: number; words: { word: string; weight: number; category: string; count: number }[]; texts: typeof mockTexts }[] = [];
    const userIds = [...new Set(mockTexts.map(t => t.userId))];
    userIds.forEach(uid => {
      const userTexts = mockTexts.filter(t => t.userId === uid);
      const allText = userTexts.map(t => t.text).join(' ');
      const detectedWords: { word: string; weight: number; category: string; count: number }[] = [];
      let score = 0;
      let maxW = 0;
      RISK_WORDS.forEach(rw => {
        const matches = allText.split(rw.word).length - 1;
        if (matches > 0) {
          detectedWords.push({ ...rw, count: matches });
          score += rw.weight * matches;
          if (rw.weight > maxW) maxW = rw.weight;
        }
      });
      detectedWords.sort((a,b) => b.weight - a.weight || b.count - a.count);
      analysis.push({ userId: uid, score, maxWeight: maxW, words: detectedWords, texts: userTexts });
    });
    analysis.sort((a,b) => b.score - a.score);
    return analysis;
  }, []);

  const filteredAnalysis = useMemo(() => {
    if (filterFac === 'all') return userAnalysis;
    return userAnalysis.filter(a => {
      const u = users.find(u2 => u2.id === a.userId);
      return u?.facility_id === filterFac;
    });
  }, [userAnalysis, filterFac]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    userAnalysis.forEach(a => a.words.forEach(w2 => { cats[w2.category] = (cats[w2.category]||0) + w2.count * w2.weight; }));
    return Object.entries(cats).sort((a,b) => b[1] - a[1]);
  }, [userAnalysis]);

  const maxCatScore = categoryBreakdown.length > 0 ? categoryBreakdown[0][1] : 1;
  const totalRiskUsers = userAnalysis.filter(a => a.score >= 5).length;
  const avgScore = userAnalysis.length > 0 ? (userAnalysis.reduce((s,a) => s+a.score, 0) / userAnalysis.length).toFixed(1) : '0';

  const getRiskLevel = (score: number) => {
    if (score >= 8) return { label: '🔴 高リスク', color: '#ef4444', bg: '#fef2f2' };
    if (score >= 4) return { label: '🟡 中リスク', color: '#f59e0b', bg: '#fffbeb' };
    return { label: '🟢 低リスク', color: '#22c55e', bg: '#f0fdf4' };
  };

  return (
    <div className='fade-in'>
      <h2 className='page-title'>🧠 AI離職リスク分析</h2>
      <p className='page-subtitle'>サーベイ・面談記録から離職リスクワードをAIが抽出・スコア化します</p>

      {/* KPI Cards */}
      <div className='an-kpi-grid'>
        <div className='an-kpi card'><div className='an-kpi-icon'>🔍</div><div><div className='an-kpi-value'>{userAnalysis.length}名</div><div className='an-kpi-label'>分析対象</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>⚠️</div><div><div className='an-kpi-value' style={{color:'#ef4444'}}>{totalRiskUsers}名</div><div className='an-kpi-label'>高リスク者</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>📊</div><div><div className='an-kpi-value'>{avgScore}</div><div className='an-kpi-label'>平均リスクスコア</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>📖</div><div><div className='an-kpi-value'>{RISK_WORDS.length}語</div><div className='an-kpi-label'>リスクワード辞書</div></div></div>
      </div>

      {/* Category Chart */}
      <div className='card' style={{padding:24,marginBottom:16}}>
        <h3 className='org-section-title'>📊 カテゴリ別リスクスコア</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {categoryBreakdown.map(([cat, score]) => (
            <div key={cat} style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{width:100,fontSize:'var(--font-size-sm)',fontWeight:500,textAlign:'right'}}>{cat}</span>
              <div style={{flex:1,height:24,borderRadius:4,background:'var(--color-neutral-100)',overflow:'hidden',position:'relative'}}>
                <div style={{height:'100%',width:(score/maxCatScore)*100+'%',borderRadius:4,background:CATEGORY_COLORS[cat]||'#6b7a87',transition:'width 0.5s'}} />
              </div>
              <span style={{width:40,fontSize:'var(--font-size-sm)',fontWeight:600,color:CATEGORY_COLORS[cat]||'#6b7a87'}}>{score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className='iv-filters card'>
        <div className='iv-filter-group'><label>施設:</label><select value={filterFac} onChange={e=>setFilterFac(e.target.value)}><option value='all'>すべて</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div className='iv-count'>{filteredAnalysis.length}名</div>
      </div>

      {/* User Risk Cards */}
      <div style={{display:'flex',flexDirection:'column',gap:'var(--space-3)'}}>
        {filteredAnalysis.map(a => {
          const user = users.find(u => u.id === a.userId);
          const occ = occupations.find(o => o.id === user?.occupation_id);
          const fac = facilities.find(f => f.id === user?.facility_id);
          const risk = getRiskLevel(a.score);
          return (
            <div key={a.userId} className='card' style={{padding:'var(--space-4)',borderLeft:'4px solid '+risk.color}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:12}}>
                <div style={{display:'flex',gap:'var(--space-3)',alignItems:'center',cursor:'pointer'}} onClick={()=>navigate('/staff/'+a.userId)}>
                  <div className='sp-avatar' style={{width:44,height:44,fontSize:16}}>{user?.name.charAt(0)}</div>
                  <div>
                    <div style={{fontWeight:600}}>{user?.name}</div>
                    <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)'}}>{occ?.name} · {fac?.name}</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'var(--space-3)'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'var(--font-size-xl)',fontWeight:700,color:risk.color}}>{a.score}</div>
                    <div style={{fontSize:10,color:'var(--color-neutral-400)'}}>スコア</div>
                  </div>
                  <span className='sp-badge' style={{background:risk.bg,color:risk.color,fontWeight:600}}>{risk.label}</span>
                </div>
              </div>

              {/* Detected words */}
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
                {a.words.map((w2,i) => (
                  <span key={i} style={{padding:'2px 10px',borderRadius:12,fontSize:'var(--font-size-xs)',fontWeight:500,background:(CATEGORY_COLORS[w2.category]||'#6b7a87')+'18',color:CATEGORY_COLORS[w2.category]||'#6b7a87',border:'1px solid '+(CATEGORY_COLORS[w2.category]||'#6b7a87')+'40'}}>
                    {w2.word} {w2.count>1?'x'+w2.count:''} <span style={{opacity:0.6}}>({'\u2605'.repeat(w2.weight)})</span>
                  </span>
                ))}
              </div>

              {/* Source texts */}
              <div style={{background:'var(--color-neutral-50)',borderRadius:'var(--radius-md)',padding:12}}>
                {a.texts.map((t,i) => (
                  <div key={i} style={{fontSize:'var(--font-size-sm)',marginBottom:i<a.texts.length-1?8:0}}>
                    <span className='sp-badge' style={{marginRight:8,fontSize:10}}>{t.source} {t.date}</span>
                    <span style={{color:'var(--color-neutral-600)'}}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}