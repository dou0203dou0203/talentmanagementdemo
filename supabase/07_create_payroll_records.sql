-- 給与支給控除一覧（AI自動取り込み結果）のテーブル作成
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    year_month TEXT NOT NULL, -- e.g., '2024-04'
    base_salary INTEGER NOT NULL DEFAULT 0,
    allowances INTEGER NOT NULL DEFAULT 0,
    deductions INTEGER NOT NULL DEFAULT 0,
    net_pay INTEGER NOT NULL DEFAULT 0,
    details_json JSONB, -- 手当や控除の詳細情報
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS設定 (Row Level Security)
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- Select ポリシー
-- adminロール（hr_admin, facility_manager等）は全て閲覧可能
-- 一般スタッフは自分自身のデータのみ閲覧可能
CREATE POLICY "Enable read access for all to payroll_records"
    ON public.payroll_records FOR SELECT
    USING (
        auth.uid() IN (SELECT auth_uid FROM users WHERE role IN ('hr_admin', 'corp_head', 'facility_manager'))
        OR user_id IN (SELECT id FROM users WHERE auth_uid = auth.uid())
    );

-- Insert ポリシー
-- hr_admin のみ作成可能
CREATE POLICY "Enable insert access for hr_admin to payroll_records"
    ON public.payroll_records FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT auth_uid FROM users WHERE role = 'hr_admin')
    );

-- Update ポリシー
-- hr_admin のみ更新可能
CREATE POLICY "Enable update access for hr_admin to payroll_records"
    ON public.payroll_records FOR UPDATE
    USING (
        auth.uid() IN (SELECT auth_uid FROM users WHERE role = 'hr_admin')
    );

-- index for performance
CREATE INDEX IF NOT EXISTS idx_payroll_records_user_id ON public.payroll_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_year_month ON public.payroll_records(year_month);
