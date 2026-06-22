-- 10_add_furigana_and_update_occupations.sql

-- 1. usersテーブルにフリガナカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS furigana TEXT;

-- 2. 職種マスタの更新
-- 「介護士」（occ-4）を削除し、「初任者研修」「実務者研修」を追加する
-- ※既に登録されているスタッフがocc-4を参照している場合は、エラーになるか、
-- もしくは事前に該当スタッフのoccupation_idを別の値（例：occ-16等）に更新しておく必要があります。

-- (オプション) 既存の「介護士」スタッフを「初任者研修」(occ-16)に変更する場合の例：
-- UPDATE users SET occupation_id = 'occ-16' WHERE occupation_id = 'occ-4';

-- 追加
INSERT INTO occupations (id, name) VALUES ('occ-16', '初任者研修') ON CONFLICT (id) DO NOTHING;
INSERT INTO occupations (id, name) VALUES ('occ-17', '実務者研修') ON CONFLICT (id) DO NOTHING;

-- 削除（参照しているレコードがない場合のみ成功します）
DELETE FROM occupations WHERE id = 'occ-4';
