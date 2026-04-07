// ============================================
// さくらの樹グループ タレントマネジメントシステム 型定義
// ============================================

// --- ロール & ステータス ---
export type UserRole = 'hr_admin' | 'corp_head' | 'facility_manager' | 'staff';
export type UserStatus = 'active' | 'inactive' | 'leave';
export type EvaluationStatus = 'draft' | 'submitted' | 'approved';
export type FacilityType = '病院' | 'クリニック' | '介護施設' | '本部' | '訪問看護' | '訪問介護' | 'ケアプランセンター';
export type EmploymentType = '常勤' | '非常勤' | 'パート' | '派遣' | '契約';
export type WorkPattern = '日勤のみ' | '夜勤あり' | '交代制' | '変則勤務' | 'フレックス';

// --- 組織 ---
export interface Occupation {
  id: string;
  name: string;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  corporation?: string; // 所属法人名
}

export interface FacilityStaffingTarget {
  id: string;
  facility_id: string;
  occupation_id: string;
  target_count: number;
}

// --- ユーザー（基本情報拡張） ---
export interface Qualification {
  name: string;
  acquired_date: string;
  expiry_date?: string;
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
  // 拡張フィールド
  gender?: string;              // 性別
  birth_date?: string;
  hire_date?: string;
  position?: string;            // 役職
  employment_type?: EmploymentType;
  work_pattern?: WorkPattern;
  qualifications?: Qualification[];
  corporation?: string;         // 所属法人
  address?: string;             // 住所
  phone?: string;               // 連絡先
  notes?: string;               // 備考
  health_check_date?: string;   // 健康診断時期
  resignation_date?: string;    // 離職日
  resignation_reason?: string;  // 離職理由
  auth_uid?: string;            // Supabase Auth UUID
  master_user_id?: string;      // 主務アカウントのID（サブアカウントの場合のみ）
}

// --- 評価 ---
export interface EvaluationTemplateItem {
  id: string;
  occupation_id: string;
  category: string;
  question: string;
  sort_order: number;
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

// --- サーベイ ---
export interface Survey {
  id: string;
  user_id: string;
  period_id: string;
  mental_score: number;
  motivation_score: number;
  survey_date: string;
  answers?: SurveyAnswer[];
  free_comment?: string;
  submitted: boolean;
}

export interface SurveyAnswer {
  question_id: string;
  score: number;
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

// --- 人事情報（HR権限） ---
export interface TransferHistory {
  id: string;
  user_id: string;
  date: string;
  from_facility: string;
  to_facility: string;
  reason: string;
}

export interface PromotionHistory {
  id: string;
  user_id: string;
  date: string;
  from_position: string;
  to_position: string;
  type: '昇格' | '降格' | '役職変更';
}

export interface SalaryHistory {
  id: string;
  user_id: string;
  date: string;
  change_type: '昇給' | '降給' | '初任給' | '契約更新';
  salary_range: string; // e.g. "A3" "B2"
  note: string;
}

export interface PayrollRecord {
  id: string;
  user_id: string;
  year_month: string;      // e.g. "2024-04"
  base_salary: number;     // 基本給
  allowances: number;      // 手当合計
  deductions: number;      // 控除合計
  net_pay: number;         // 差引支給額
  details_json?: string;   // 手当や控除の詳細情報JSON文字列
  created_at?: string;
}

// --- 権限ヘルパー型 ---
export interface PermissionSet {
  canViewAllStaff: boolean;
  canEditEvaluation: boolean;
  canViewHRInfo: boolean;
  canViewOwnOnly: boolean;
  canViewFacility: boolean;
  canViewCorporation: boolean;
  canEditStaff: boolean;
  canEditInterviews: boolean;
}
