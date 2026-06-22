-- 10_add_furigana_and_update_occupations.sql

-- 1. usersテーブルにフリガナカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS furigana TEXT;

-- 2. 新しい職種を追加
INSERT INTO occupations (id, name) VALUES ('occ-16', '初任者研修') ON CONFLICT (id) DO NOTHING;
INSERT INTO occupations (id, name) VALUES ('occ-17', '実務者研修') ON CONFLICT (id) DO NOTHING;

-- 3. 「介護士」（occ-4）の参照を「初任者研修」（occ-16）に一括更新して関連エラーを防ぐ
-- スタッフ情報の更新
UPDATE users SET occupation_id = 'occ-16' WHERE occupation_id = 'occ-4';

-- 人員配置基準の更新（もし存在すれば）
UPDATE facility_staffing_targets SET occupation_id = 'occ-16' WHERE occupation_id = 'occ-4';

-- 評価テンプレートの更新（もし存在すれば）
UPDATE evaluation_template_items SET occupation_id = 'occ-16' WHERE occupation_id = 'occ-4';

-- 4. 「介護士」を削除
DELETE FROM occupations WHERE id = 'occ-4';
