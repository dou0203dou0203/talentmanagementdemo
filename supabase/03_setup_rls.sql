-- ==============================================================================
-- セキュリティ強化（Row Level Security: RLS）セットアップスクリプト
-- ==============================================================================

-- 1. 既存の全開放ポリシー（開発用）をすべて削除する
DROP POLICY IF EXISTS "enable_all_users" ON users;
DROP POLICY IF EXISTS "enable_all_facilities" ON facilities;
DROP POLICY IF EXISTS "enable_all_occupations" ON occupations;
DROP POLICY IF EXISTS "enable_all_evaluations" ON evaluations;
DROP POLICY IF EXISTS "enable_all_eval_scores" ON evaluation_scores;
DROP POLICY IF EXISTS "enable_all_survey_periods" ON survey_periods;
DROP POLICY IF EXISTS "enable_all_surveys" ON surveys;
DROP POLICY IF EXISTS "enable_all_interviews" ON interview_logs;
DROP POLICY IF EXISTS "enable_all_aptitude" ON aptitude_tests;
DROP POLICY IF EXISTS "enable_all_qualifications" ON qualifications;
DROP POLICY IF EXISTS "enable_all_thanks_points" ON thanks_points;

-- 2. セキュリティ判定用関数（SECURITY DEFINER）を作成
-- これにより、RLS評価時の「無限ループ（usersテーブル自身への参照）」を安全に回避します。

-- 現在のJWTトークンからメールアドレスを取得
CREATE OR REPLACE FUNCTION auth_user_email()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'email';
$$;

-- ログインユーザー自身のIDを取得
CREATE OR REPLACE FUNCTION get_my_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id text;
  v_email text;
BEGIN
  v_email := auth_user_email();
  IF v_email IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_id FROM users WHERE email = v_email LIMIT 1;
  RETURN v_id;
END;
$$;

-- ログインユーザー自身のRoleを取得
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
  v_email text;
BEGIN
  v_email := auth_user_email();
  IF v_email IS NULL THEN RETURN NULL; END IF;
  SELECT role INTO v_role FROM users WHERE email = v_email LIMIT 1;
  RETURN v_role;
END;
$$;

-- ログインユーザーの施設IDを取得
CREATE OR REPLACE FUNCTION get_my_facility_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_fac text;
  v_email text;
BEGIN
  v_email := auth_user_email();
  IF v_email IS NULL THEN RETURN NULL; END IF;
  SELECT facility_id INTO v_fac FROM users WHERE email = v_email LIMIT 1;
  RETURN v_fac;
END;
$$;


-- ==============================================================================
-- 3. 各テーブルへの RLS ポリシー適用
-- ==============================================================================

-- -----------------------------------------------------
-- facilities (施設マスタ) & occupations (職種マスタ)
-- => システムにログインしている(authenticated)なら閲覧可能、編集はhr_adminのみ
-- -----------------------------------------------------
CREATE POLICY "facilities_select" ON facilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "facilities_all" ON facilities FOR ALL TO authenticated USING (get_my_role() = 'hr_admin');

CREATE POLICY "occupations_select" ON occupations FOR SELECT TO authenticated USING (true);
CREATE POLICY "occupations_all" ON occupations FOR ALL TO authenticated USING (get_my_role() = 'hr_admin');


-- -----------------------------------------------------
-- users (スタッフ情報)
-- => 閲覧: hr_adminは全員、facility_managerは同施設、staffは自分のみ
-- => 編集・登録等: hr_adminは全員、本人は自分の情報のみ一部更新可（フロントで制限）
-- -----------------------------------------------------

-- View
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated
USING (
  get_my_role() = 'hr_admin' 
  OR get_my_role() = 'corp_head'
  OR (get_my_role() = 'facility_manager' AND facility_id = get_my_facility_id())
  OR email = auth_user_email()
);

-- Insert
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated
WITH CHECK (
  get_my_role() = 'hr_admin' 
  OR email = auth_user_email() -- 初回登録用
);

-- Update
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated
USING (
  get_my_role() = 'hr_admin'
  OR email = auth_user_email()
);

-- Delete
CREATE POLICY "users_delete" ON users FOR DELETE TO authenticated
USING (get_my_role() = 'hr_admin');


-- -----------------------------------------------------
-- evaluations (評価), surveys (アンケート), interview_logs (面談), etc.
-- => 基本的に users テーブルと同じアクセス権限を適用
-- => 例) 面談記録は、自分が面談者か、対象者か、または上位管理者のみ見れる
-- -----------------------------------------------------

-- evaluations
CREATE POLICY "evaluations_select" ON evaluations FOR SELECT TO authenticated
USING (
  get_my_role() = 'hr_admin' 
  OR get_my_role() = 'corp_head'
  OR (get_my_role() = 'facility_manager' AND EXISTS(SELECT 1 FROM users u WHERE u.id = evaluations.user_id AND u.facility_id = get_my_facility_id()))
  OR user_id = get_my_id()
  OR evaluator_id = get_my_id()
);
CREATE POLICY "evaluations_all" ON evaluations FOR ALL TO authenticated
USING (get_my_role() = 'hr_admin' OR evaluator_id = get_my_id() OR user_id = get_my_id());

-- evaluation_scores
CREATE POLICY "evaluation_scores_all" ON evaluation_scores FOR ALL TO authenticated
USING (
  get_my_role() IN ('hr_admin', 'facility_manager')
  OR EXISTS (SELECT 1 FROM evaluations e WHERE e.id = evaluation_id AND (e.user_id = get_my_id() OR e.evaluator_id = get_my_id()))
);

-- survey_periods (共通データ)
CREATE POLICY "survey_periods_select" ON survey_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "survey_periods_all" ON survey_periods FOR ALL TO authenticated USING (get_my_role() = 'hr_admin');

-- surveys
CREATE POLICY "surveys_select" ON surveys FOR SELECT TO authenticated
USING (
  get_my_role() = 'hr_admin'
  OR get_my_role() = 'corp_head'
  OR (get_my_role() = 'facility_manager' AND EXISTS(SELECT 1 FROM users u WHERE u.id = surveys.user_id AND u.facility_id = get_my_facility_id()))
  OR user_id = get_my_id()
);
CREATE POLICY "surveys_insert" ON surveys FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'hr_admin' OR user_id = get_my_id());
CREATE POLICY "surveys_update" ON surveys FOR UPDATE TO authenticated USING (get_my_role() = 'hr_admin' OR user_id = get_my_id());
CREATE POLICY "surveys_delete" ON surveys FOR DELETE TO authenticated USING (get_my_role() = 'hr_admin');

-- interview_logs
CREATE POLICY "interviews_select" ON interview_logs FOR SELECT TO authenticated
USING (
  get_my_role() = 'hr_admin'
  OR get_my_role() = 'corp_head'
  OR (get_my_role() = 'facility_manager' AND EXISTS(SELECT 1 FROM users u WHERE u.id = interview_logs.user_id AND u.facility_id = get_my_facility_id()))
  OR user_id = get_my_id()
  OR interviewer_id = get_my_id()
);
CREATE POLICY "interviews_all" ON interview_logs FOR ALL TO authenticated
USING (get_my_role() = 'hr_admin' OR interviewer_id = get_my_id());

-- aptitude_tests, qualifications, thanks_points
CREATE POLICY "common_user_data_select" ON aptitude_tests FOR SELECT TO authenticated USING (get_my_role() IN ('hr_admin', 'corp_head') OR (get_my_role() = 'facility_manager' AND EXISTS(SELECT 1 FROM users u WHERE u.id = user_id AND u.facility_id = get_my_facility_id())) OR user_id = get_my_id());
CREATE POLICY "common_user_data_all" ON aptitude_tests FOR ALL TO authenticated USING (get_my_role() = 'hr_admin' OR user_id = get_my_id());

CREATE POLICY "qualifications_select" ON qualifications FOR SELECT TO authenticated USING (get_my_role() IN ('hr_admin', 'corp_head') OR (get_my_role() = 'facility_manager' AND EXISTS(SELECT 1 FROM users u WHERE u.id = user_id AND u.facility_id = get_my_facility_id())) OR user_id = get_my_id());
CREATE POLICY "qualifications_all" ON qualifications FOR ALL TO authenticated USING (get_my_role() = 'hr_admin' OR user_id = get_my_id());

CREATE POLICY "thanks_points_select" ON thanks_points FOR SELECT TO authenticated USING (get_my_role() IN ('hr_admin', 'corp_head') OR (get_my_role() = 'facility_manager' AND EXISTS(SELECT 1 FROM users u WHERE u.id = to_user_id AND u.facility_id = get_my_facility_id())) OR from_user_id = get_my_id() OR to_user_id = get_my_id());
CREATE POLICY "thanks_points_all" ON thanks_points FOR ALL TO authenticated USING (get_my_role() = 'hr_admin' OR from_user_id = get_my_id());

-- NOTE: Public/Anon roles remain fully blocked since we did not create policies for them!
-- Security setup is complete.
