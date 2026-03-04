// ============================================
// タレントマネジメントシステム 型定義
// ============================================

export type UserRole = 'admin' | 'manager' | 'staff';
export type UserStatus = 'active' | 'inactive' | 'leave';
export type EvaluationStatus = 'draft' | 'submitted' | 'approved';
export type FacilityType = '病院' | 'クリニック' | '介護施設' | '本部';

export interface Occupation {
  id: string;
  name: string;
}

export interface EvaluationTemplateItem {
  id: string;
  occupation_id: string;
  category: string;
  question: string;
  sort_order: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  occupation_id: string;
  facility_id: string;
  status: UserStatus;
  evaluator_id: string | null;
  avatar?: string;
}

export interface EvaluationScore {
  item_id: string;
  score: number; // 1-5
  comment: string;
}

export interface Evaluation {
  id: string;
  user_id: string;
  evaluator_id: string;
  period: string;
  status: EvaluationStatus;
  scores: EvaluationScore[];
  overall_comment: string;
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  user_id: string;
  period_id: string;
  mental_score: number;    // 1-100
  motivation_score: number; // 1-100
  survey_date: string;
  answers?: SurveyAnswer[];
  free_comment?: string;
  submitted: boolean;
}

export interface SurveyAnswer {
  question_id: string;
  score: number; // 1-5
}

export type SurveyCategory = '仕事満足度' | '人間関係' | '健康状態' | 'キャリア展望' | 'ワークライフバランス';

export interface SurveyQuestion {
  id: string;
  category: SurveyCategory;
  question: string;
  sort_order: number;
}

export type SurveyPeriodStatus = 'scheduled' | 'active' | 'closed';

export interface SurveyPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: SurveyPeriodStatus;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
}

export interface FacilityStaffingTarget {
  id: string;
  facility_id: string;
  occupation_id: string;
  target_count: number;
}


// --- 面談記録 ---
export type InterviewType = '定期面談' | '1on1' | 'フォローアップ' | 'キャリア面談' | 'その他';

export interface InterviewLog {
  id: string;
  user_id: string;
  interviewer_id: string;
  date: string;
  type: InterviewType;
  summary: string;
  details: string;
  mood: 1 | 2 | 3 | 4 | 5;
  action_items: string[];
  created_at: string;
}

// --- 適性検査 ---
export type AptitudeTestType = 'ストレス耐性' | 'コミュニケーション' | 'リーダーシップ' | '感情のコントロール' | 'サポーティブ' | '総合適性';

export interface AptitudeTestScore {
  category: string;
  score: number;
  max_score: number;
}

export interface AptitudeTest {
  id: string;
  user_id: string;
  test_date: string;
  test_type: AptitudeTestType;
  scores: AptitudeTestScore[];
  overall_comment: string;
}
