// ============================================
// タレントマネジメントシステム モックデータ
// ============================================
import type {
  Occupation,
  EvaluationTemplateItem,
  User,
  Evaluation,
  Survey,
  SurveyQuestion,
  SurveyPeriod,
  Facility,
  FacilityStaffingTarget,
} from '../types';

// --- 職種マスタ ---
export const occupations: Occupation[] = [
  { id: 'occ-1', name: '医師' },
  { id: 'occ-2', name: '看護師' },
  { id: 'occ-3', name: '理学療法士（PT）' },
  { id: 'occ-4', name: '介護福祉士' },
  { id: 'occ-5', name: '事務職' },
];

// --- 施設マスタ ---
export const facilities: Facility[] = [
  { id: 'fac-1', name: '中央病院', type: '病院' },
  { id: 'fac-2', name: '駅前クリニック', type: 'クリニック' },
  { id: 'fac-3', name: 'さくら介護施設', type: '介護施設' },
  { id: 'fac-4', name: '東部クリニック', type: 'クリニック' },
  { id: 'fac-5', name: '本部', type: '本部' },
];

// --- ユーザー ---
export const users: User[] = [
  { id: 'u-1', name: '田中太郎', email: 'tanaka@example.com', role: 'admin', occupation_id: 'occ-5', facility_id: 'fac-5', status: 'active', evaluator_id: null },
  { id: 'u-2', name: '鈴木花子', email: 'suzuki@example.com', role: 'manager', occupation_id: 'occ-2', facility_id: 'fac-1', status: 'active', evaluator_id: 'u-1' },
  { id: 'u-3', name: '佐藤健一', email: 'sato@example.com', role: 'staff', occupation_id: 'occ-1', facility_id: 'fac-1', status: 'active', evaluator_id: 'u-2' },
  { id: 'u-4', name: '山田美咲', email: 'yamada@example.com', role: 'staff', occupation_id: 'occ-2', facility_id: 'fac-2', status: 'active', evaluator_id: 'u-2' },
  { id: 'u-5', name: '高橋誠', email: 'takahashi@example.com', role: 'staff', occupation_id: 'occ-3', facility_id: 'fac-1', status: 'active', evaluator_id: 'u-2' },
  { id: 'u-6', name: '伊藤裕子', email: 'ito@example.com', role: 'staff', occupation_id: 'occ-4', facility_id: 'fac-3', status: 'active', evaluator_id: 'u-1' },
  { id: 'u-7', name: '渡辺大輔', email: 'watanabe@example.com', role: 'staff', occupation_id: 'occ-2', facility_id: 'fac-3', status: 'leave', evaluator_id: 'u-1' },
  { id: 'u-8', name: '中村あゆみ', email: 'nakamura@example.com', role: 'staff', occupation_id: 'occ-4', facility_id: 'fac-3', status: 'active', evaluator_id: 'u-6' },
  { id: 'u-9', name: '小林正樹', email: 'kobayashi@example.com', role: 'manager', occupation_id: 'occ-1', facility_id: 'fac-4', status: 'active', evaluator_id: 'u-1' },
  { id: 'u-10', name: '加藤明美', email: 'kato@example.com', role: 'staff', occupation_id: 'occ-2', facility_id: 'fac-4', status: 'active', evaluator_id: 'u-9' },
];

// --- 評価テンプレート ---
export const evaluationTemplateItems: EvaluationTemplateItem[] = [
  { id: 'et-1', occupation_id: 'occ-1', category: '診療スキル', question: '的確な診断能力', sort_order: 1 },
  { id: 'et-2', occupation_id: 'occ-1', category: '診療スキル', question: '治療計画の立案力', sort_order: 2 },
  { id: 'et-3', occupation_id: 'occ-1', category: 'コミュニケーション', question: '患者説明のわかりやすさ', sort_order: 3 },
  { id: 'et-4', occupation_id: 'occ-2', category: '看護スキル', question: '基本看護技術の遂行', sort_order: 1 },
  { id: 'et-5', occupation_id: 'occ-2', category: '看護スキル', question: '患者観察力', sort_order: 2 },
  { id: 'et-6', occupation_id: 'occ-2', category: 'チームワーク', question: '多職種連携', sort_order: 3 },
  { id: 'et-7', occupation_id: 'occ-3', category: 'リハビリ技術', question: '運動療法の実施力', sort_order: 1 },
  { id: 'et-8', occupation_id: 'occ-3', category: 'リハビリ技術', question: '治療プログラム作成', sort_order: 2 },
  { id: 'et-9', occupation_id: 'occ-4', category: '介護スキル', question: '日常生活支援の質', sort_order: 1 },
  { id: 'et-10', occupation_id: 'occ-4', category: '介護スキル', question: '認知症ケア', sort_order: 2 },
  { id: 'et-11', occupation_id: 'occ-5', category: '事務処理', question: '正確な書類処理', sort_order: 1 },
  { id: 'et-12', occupation_id: 'occ-5', category: '事務処理', question: 'スケジュール管理能力', sort_order: 2 },
];

// --- 評価データ ---
export const evaluations: Evaluation[] = [
  {
    id: 'ev-1', user_id: 'u-3', evaluator_id: 'u-2', period: '2025年度 上期',
    status: 'approved',
    scores: [
      { item_id: 'et-1', score: 4, comment: '高い診断精度' },
      { item_id: 'et-2', score: 3, comment: '改善の余地あり' },
      { item_id: 'et-3', score: 5, comment: '非常にわかりやすい' },
    ],
    overall_comment: '全体的に良好なパフォーマンス', created_at: '2025-09-15', updated_at: '2025-09-20',
  },
  {
    id: 'ev-2', user_id: 'u-4', evaluator_id: 'u-2', period: '2025年度 上期',
    status: 'submitted',
    scores: [
      { item_id: 'et-4', score: 4, comment: '丁寧なケア' },
      { item_id: 'et-5', score: 4, comment: '細かな変化に気づく' },
      { item_id: 'et-6', score: 3, comment: '積極性に期待' },
    ],
    overall_comment: '安定した看護業務', created_at: '2025-09-18', updated_at: '2025-09-18',
  },
  {
    id: 'ev-3', user_id: 'u-5', evaluator_id: 'u-2', period: '2025年度 上期',
    status: 'draft',
    scores: [
      { item_id: 'et-7', score: 5, comment: '優秀' },
      { item_id: 'et-8', score: 4, comment: '工夫がみられる' },
    ],
    overall_comment: '', created_at: '2025-10-01', updated_at: '2025-10-01',
  },
];

// --- サーベイ設問 ---
export const surveyQuestions: SurveyQuestion[] = [
  { id: 'sq-1', category: '仕事満足度', question: '日々の業務にやりがいを感じていますか？', sort_order: 1 },
  { id: 'sq-2', category: '仕事満足度', question: '自分のスキルが活かせる環境ですか？', sort_order: 2 },
  { id: 'sq-3', category: '人間関係', question: '上司との関係は良好ですか？', sort_order: 3 },
  { id: 'sq-4', category: '人間関係', question: '同僚との協力体制に満足していますか？', sort_order: 4 },
  { id: 'sq-5', category: '健康状態', question: '十分な睡眠を取れていますか？', sort_order: 5 },
  { id: 'sq-6', category: '健康状態', question: '身体的な疲労を感じていませんか？', sort_order: 6 },
  { id: 'sq-7', category: 'キャリア展望', question: '将来のキャリアに希望を持てていますか？', sort_order: 7 },
  { id: 'sq-8', category: 'キャリア展望', question: '成長の機会が十分にありますか？', sort_order: 8 },
  { id: 'sq-9', category: 'ワークライフバランス', question: '仕事と私生活のバランスは取れていますか？', sort_order: 9 },
  { id: 'sq-10', category: 'ワークライフバランス', question: '休暇を十分に取得できていますか？', sort_order: 10 },
];

// --- サーベイ配信期間 ---
export const surveyPeriods: SurveyPeriod[] = [
  { id: 'sp-1', name: '2025年4月サーベイ', start_date: '2025-04-01', end_date: '2025-04-15', status: 'closed' },
  { id: 'sp-2', name: '2025年5月サーベイ', start_date: '2025-05-01', end_date: '2025-05-15', status: 'closed' },
  { id: 'sp-3', name: '2025年6月サーベイ', start_date: '2025-06-01', end_date: '2025-06-15', status: 'closed' },
  { id: 'sp-4', name: '2025年7月サーベイ', start_date: '2025-07-01', end_date: '2025-07-15', status: 'closed' },
  { id: 'sp-5', name: '2025年8月サーベイ', start_date: '2025-08-01', end_date: '2025-08-15', status: 'closed' },
  { id: 'sp-6', name: '2025年9月サーベイ', start_date: '2025-09-01', end_date: '2025-09-15', status: 'closed' },
  { id: 'sp-7', name: '2025年10月サーベイ', start_date: '2025-10-01', end_date: '2025-10-15', status: 'closed' },
  { id: 'sp-8', name: '2025年11月サーベイ', start_date: '2025-11-01', end_date: '2025-11-15', status: 'closed' },
  { id: 'sp-9', name: '2025年12月サーベイ', start_date: '2025-12-01', end_date: '2025-12-15', status: 'active' },
];

// --- サーベイ回答 ---
export const surveys: Survey[] = [
  { id: 'sv-1', user_id: 'u-3', period_id: 'sp-1', mental_score: 72, motivation_score: 78, survey_date: '2025-04-10', submitted: true },
  { id: 'sv-2', user_id: 'u-3', period_id: 'sp-3', mental_score: 68, motivation_score: 72, survey_date: '2025-06-08', submitted: true },
  { id: 'sv-3', user_id: 'u-3', period_id: 'sp-5', mental_score: 60, motivation_score: 65, survey_date: '2025-08-12', submitted: true },
  { id: 'sv-4', user_id: 'u-3', period_id: 'sp-7', mental_score: 45, motivation_score: 50, survey_date: '2025-10-05', submitted: true },
  { id: 'sv-5', user_id: 'u-4', period_id: 'sp-1', mental_score: 85, motivation_score: 82, survey_date: '2025-04-12', submitted: true },
  { id: 'sv-6', user_id: 'u-4', period_id: 'sp-3', mental_score: 80, motivation_score: 78, survey_date: '2025-06-10', submitted: true },
  { id: 'sv-7', user_id: 'u-4', period_id: 'sp-5', mental_score: 75, motivation_score: 73, survey_date: '2025-08-08', submitted: true },
  { id: 'sv-8', user_id: 'u-4', period_id: 'sp-7', mental_score: 70, motivation_score: 68, survey_date: '2025-10-11', submitted: true },
  { id: 'sv-9', user_id: 'u-5', period_id: 'sp-1', mental_score: 90, motivation_score: 88, survey_date: '2025-04-05', submitted: true },
  { id: 'sv-10', user_id: 'u-5', period_id: 'sp-3', mental_score: 88, motivation_score: 85, survey_date: '2025-06-07', submitted: true },
  { id: 'sv-11', user_id: 'u-5', period_id: 'sp-5', mental_score: 85, motivation_score: 82, survey_date: '2025-08-10', submitted: true },
  { id: 'sv-12', user_id: 'u-5', period_id: 'sp-7', mental_score: 82, motivation_score: 80, survey_date: '2025-10-09', submitted: true },
  { id: 'sv-13', user_id: 'u-6', period_id: 'sp-1', mental_score: 65, motivation_score: 70, survey_date: '2025-04-11', submitted: true },
  { id: 'sv-14', user_id: 'u-6', period_id: 'sp-3', mental_score: 58, motivation_score: 55, survey_date: '2025-06-14', submitted: true },
  { id: 'sv-15', user_id: 'u-6', period_id: 'sp-5', mental_score: 42, motivation_score: 40, survey_date: '2025-08-09', submitted: true },
  { id: 'sv-16', user_id: 'u-6', period_id: 'sp-7', mental_score: 35, motivation_score: 30, survey_date: '2025-10-13', submitted: true },
  { id: 'sv-17', user_id: 'u-10', period_id: 'sp-5', mental_score: 78, motivation_score: 80, survey_date: '2025-08-07', submitted: true },
  { id: 'sv-18', user_id: 'u-10', period_id: 'sp-7', mental_score: 75, motivation_score: 76, survey_date: '2025-10-10', submitted: true },
];

// --- 人員配置目標 ---
export const facilityStaffingTargets: FacilityStaffingTarget[] = [
  { id: 'fst-1', facility_id: 'fac-1', occupation_id: 'occ-1', target_count: 3 },
  { id: 'fst-2', facility_id: 'fac-1', occupation_id: 'occ-2', target_count: 5 },
  { id: 'fst-3', facility_id: 'fac-1', occupation_id: 'occ-3', target_count: 2 },
  { id: 'fst-4', facility_id: 'fac-2', occupation_id: 'occ-1', target_count: 2 },
  { id: 'fst-5', facility_id: 'fac-2', occupation_id: 'occ-2', target_count: 3 },
  { id: 'fst-6', facility_id: 'fac-3', occupation_id: 'occ-2', target_count: 3 },
  { id: 'fst-7', facility_id: 'fac-3', occupation_id: 'occ-4', target_count: 4 },
  { id: 'fst-8', facility_id: 'fac-4', occupation_id: 'occ-1', target_count: 2 },
  { id: 'fst-9', facility_id: 'fac-4', occupation_id: 'occ-2', target_count: 3 },
];
