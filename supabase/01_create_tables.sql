-- ==============================================
-- さくらの樹グループ タレントマネジメントシステム
-- Supabase テーブル作成SQL
-- ==============================================

-- 1. 職種マスタ
CREATE TABLE IF NOT EXISTS occupations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 2. 施設マスタ
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '病院',
  corporation TEXT
);

-- 3. 人員配置基準
CREATE TABLE IF NOT EXISTS facility_staffing_targets (
  id TEXT PRIMARY KEY,
  facility_id TEXT REFERENCES facilities(id),
  occupation_id TEXT REFERENCES occupations(id),
  target_count INTEGER NOT NULL DEFAULT 0
);

-- 4. スタッフ
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff',
  occupation_id TEXT REFERENCES occupations(id),
  facility_id TEXT REFERENCES facilities(id),
  status TEXT NOT NULL DEFAULT 'active',
  evaluator_id TEXT,
  birth_date DATE,
  hire_date DATE,
  position TEXT,
  employment_type TEXT,
  work_pattern TEXT,
  corporation TEXT,
  resignation_date DATE,
  resignation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 資格
CREATE TABLE IF NOT EXISTS qualifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  acquired_date DATE NOT NULL,
  expiry_date DATE
);

-- 6. 評価テンプレート
CREATE TABLE IF NOT EXISTS evaluation_template_items (
  id TEXT PRIMARY KEY,
  occupation_id TEXT REFERENCES occupations(id),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 7. 評価
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  evaluator_id TEXT,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  overall_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 評価スコア
CREATE TABLE IF NOT EXISTS evaluation_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id TEXT REFERENCES evaluations(id) ON DELETE CASCADE,
  item_id TEXT,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  comment TEXT
);

-- 9. サーベイ設問
CREATE TABLE IF NOT EXISTS survey_questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  survey_type TEXT DEFAULT 'regular'
);

-- 10. サーベイ期間
CREATE TABLE IF NOT EXISTS survey_periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
);

-- 11. サーベイ回答
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  period_id TEXT REFERENCES survey_periods(id),
  mental_score INTEGER,
  motivation_score INTEGER,
  survey_date DATE,
  free_comment TEXT,
  submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. サーベイ個別回答
CREATE TABLE IF NOT EXISTS survey_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id TEXT REFERENCES surveys(id) ON DELETE CASCADE,
  question_id TEXT,
  score INTEGER CHECK (score BETWEEN 1 AND 5)
);

-- 13. 面談記録
CREATE TABLE IF NOT EXISTS interview_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  interviewer_id TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  summary TEXT,
  details TEXT,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  action_items JSONB DEFAULT '[]',
  future_tasks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. 適性検査
CREATE TABLE IF NOT EXISTS aptitude_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  test_date DATE NOT NULL,
  test_type TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '[]',
  overall_comment TEXT
);

-- 15. 異動履歴
CREATE TABLE IF NOT EXISTS transfer_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  date DATE NOT NULL,
  from_facility TEXT,
  to_facility TEXT,
  reason TEXT
);

-- 16. 昇格履歴
CREATE TABLE IF NOT EXISTS promotion_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  date DATE NOT NULL,
  from_position TEXT,
  to_position TEXT,
  type TEXT NOT NULL
);

-- 17. 給与履歴
CREATE TABLE IF NOT EXISTS salary_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  date DATE NOT NULL,
  change_type TEXT NOT NULL,
  salary_range TEXT,
  note TEXT
);

-- 18. ありがとうポイント
CREATE TABLE IF NOT EXISTS thanks_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id TEXT REFERENCES users(id),
  to_user_id TEXT REFERENCES users(id),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- RLS (Row Level Security) 有効化
-- ==============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_staffing_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE thanks_points ENABLE ROW LEVEL SECURITY;

-- 全テーブルに一時的な全アクセスポリシー（開発用）
-- 本番ではロールベースポリシーに置き換えること
CREATE POLICY "enable_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_occupations" ON occupations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_facilities" ON facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_facility_staffing_targets" ON facility_staffing_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_qualifications" ON qualifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_evaluation_template_items" ON evaluation_template_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_evaluation_scores" ON evaluation_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_survey_questions" ON survey_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_survey_periods" ON survey_periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_surveys" ON surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_survey_answers" ON survey_answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_interview_logs" ON interview_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_aptitude_tests" ON aptitude_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_transfer_history" ON transfer_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_promotion_history" ON promotion_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_salary_history" ON salary_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enable_all_thanks_points" ON thanks_points FOR ALL USING (true) WITH CHECK (true);

-- テーブル作成完了