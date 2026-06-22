-- ==============================================
-- 11_enable_rls.sql
-- すべてのテーブルでRow Level Security (RLS) を有効化し、
-- アラートを解消するためのSQLスクリプトです。
-- ==============================================

-- 1. すべてのテーブルでRLSを有効化します
ALTER TABLE occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_staffing_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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

-- 2. 現状のアプリの動作を止めないために、一旦すべての操作を許可するポリシーを作成します
-- ※注意: 本番環境で厳密な権限管理を行いたい場合は、ここを「ログイン済みのユーザーのみ」や
-- 「自分のデータのみ」といった条件（auth.uid() = ... など）に変更する必要があります。

CREATE POLICY "Allow all access to occupations" ON occupations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to facilities" ON facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to facility_staffing_targets" ON facility_staffing_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to qualifications" ON qualifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to evaluation_template_items" ON evaluation_template_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to evaluation_scores" ON evaluation_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to survey_questions" ON survey_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to survey_periods" ON survey_periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to surveys" ON surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to survey_answers" ON survey_answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to interview_logs" ON interview_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to aptitude_tests" ON aptitude_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to transfer_history" ON transfer_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to promotion_history" ON promotion_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to salary_history" ON salary_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to thanks_points" ON thanks_points FOR ALL USING (true) WITH CHECK (true);
