-- ==============================================
-- マイグレーション: users テーブルに新規カラム追加
-- auth_uid と追加の人事情報フィールド
-- ==============================================

-- auth_uid: Supabase Auth の UUID と紐付け
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_uid UUID;

-- 追加人事情報フィールド
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS health_check_date TEXT;

-- auth_uid にユニークインデックスを追加
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_uid ON users(auth_uid) WHERE auth_uid IS NOT NULL;

-- email にインデックスを追加（ログイン検索用）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
