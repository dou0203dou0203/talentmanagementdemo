import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminAccount {
    email: string;
    password: string;
    name: string;
}

const INITIAL_ADMINS: AdminAccount[] = [
    { email: 'dosaka@sakuranoki-group.com', password: 'Sakuranoki1', name: '大坂' },
    { email: 'mitsue@sakuranoki-group.com', password: 'Sakuranoki1', name: '三枝' },
    { email: 'hasegawa2@st-sakura.com', password: 'Sakuranoki1', name: '長谷川' },
    { email: 'matsuura@st-sakura.com', password: 'Sakuranoki1', name: '松浦' },
];

interface Result {
    email: string;
    status: 'success' | 'error' | 'pending';
    message: string;
}

export default function AdminSetup() {
    const [results, setResults] = useState<Result[]>([]);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);

    if (!isSupabaseConfigured()) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h2>⚠️ Supabase未設定</h2>
                <p>管理者セットアップにはSupabase接続が必要です。</p>
            </div>
        );
    }

    // STEP 1: Register users in users table only (no signUp - avoids session lock issues)
    const ensureUsersTable = async () => {
        setRunning(true);
        const newResults: Result[] = [];

        for (const admin of INITIAL_ADMINS) {
            try {
                // Check if user already exists in users table
                const { data: existing } = await supabase
                    .from('users')
                    .select('id, role')
                    .eq('email', admin.email)
                    .maybeSingle();

                if (existing) {
                    if (existing.role === 'hr_admin') {
                        newResults.push({ email: admin.email, status: 'success', message: '✅ 既にhr_adminとして登録済み' });
                    } else {
                        // Update role to hr_admin
                        const { error: updateErr } = await supabase
                            .from('users')
                            .update({ role: 'hr_admin' })
                            .eq('email', admin.email);
                        if (updateErr) {
                            newResults.push({ email: admin.email, status: 'error', message: `ロール更新失敗: ${updateErr.message}` });
                        } else {
                            newResults.push({ email: admin.email, status: 'success', message: '✅ ロールをhr_adminに更新' });
                        }
                    }
                } else {
                    // Insert new user record
                    const uid = 'u-admin-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
                    const { error: insertErr } = await supabase.from('users').insert({
                        id: uid,
                        name: admin.name,
                        email: admin.email,
                        role: 'hr_admin',
                        occupation_id: 'occ-1',
                        facility_id: 'fac-1',
                        status: 'active',
                        evaluator_id: null,
                    });

                    if (insertErr) {
                        newResults.push({ email: admin.email, status: 'error', message: `users挿入失敗: ${insertErr.message}` });
                    } else {
                        newResults.push({ email: admin.email, status: 'success', message: `✅ usersテーブルに挿入完了 (${uid.slice(0,12)}...)` });
                    }
                }
            } catch (e: any) {
                newResults.push({ email: admin.email, status: 'error', message: e.message || 'Unknown error' });
            }

            setResults([...newResults]);
        }

        setRunning(false);
        return newResults;
    };

    // STEP 2: Register in Supabase Auth one at a time (separate step to avoid conflicts)
    const registerAuth = async (admin: AdminAccount): Promise<Result> => {
        try {
            // Sign out first to avoid session conflicts
            await supabase.auth.signOut();
            await new Promise(r => setTimeout(r, 500));

            const { error } = await supabase.auth.signUp({
                email: admin.email,
                password: admin.password,
                options: { data: { name: admin.name } },
            });

            if (error) {
                if (error.message?.includes('already registered')) {
                    return { email: admin.email, status: 'success', message: '✅ 既にAuth登録済み' };
                }
                return { email: admin.email, status: 'error', message: error.message };
            }
            return { email: admin.email, status: 'success', message: '✅ Auth登録完了' };
        } catch (e: any) {
            return { email: admin.email, status: 'error', message: e.message };
        }
    };

    const runSetup = async () => {
        // Step 1: Ensure all users exist in the users table
        const tableResults = await ensureUsersTable();

        // Step 2: Register in Auth one at a time
        const authResults: Result[] = [];
        for (const admin of INITIAL_ADMINS) {
            const r = await registerAuth(admin);
            authResults.push(r);
            // Wait between registrations to avoid rate limits
            await new Promise(res => setTimeout(res, 3000));
        }

        // Combine results
        const combined: Result[] = INITIAL_ADMINS.map((admin, i) => {
            const table = tableResults[i];
            const auth = authResults[i];
            const tableOk = table?.status === 'success';
            const authOk = auth?.status === 'success';

            if (tableOk && authOk) {
                return { email: admin.email, status: 'success' as const, message: `DB: ${table.message} / Auth: ${auth.message}` };
            } else if (tableOk) {
                return { email: admin.email, status: 'error' as const, message: `DB: OK / Auth失敗: ${auth?.message || '不明'}` };
            } else {
                return { email: admin.email, status: 'error' as const, message: `DB失敗: ${table?.message || '不明'}` };
            }
        });

        setResults(combined);
        setDone(true);

        // Sign out after setup
        await supabase.auth.signOut();
    };

    return (
        <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, fontFamily: 'var(--font-family)' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <span style={{ fontSize: '3rem' }}>🔧</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 8 }}>初期管理者セットアップ</h1>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 8 }}>
                    4名の管理者アカウントをSupabase Authに登録し、hr_admin権限を付与します。
                </p>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>📋 登録予定アカウント</h3>
                {INITIAL_ADMINS.map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < INITIAL_ADMINS.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{a.email}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, background: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }}>hr_admin</span>
                    </div>
                ))}
            </div>

            {results.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>📊 実行結果</h3>
                    {results.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4, borderRadius: 8, background: r.status === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${r.status === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                            <span>{r.status === 'success' ? '✅' : '❌'}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.email}</div>
                                <div style={{ fontSize: '0.75rem', color: r.status === 'success' ? '#16a34a' : '#dc2626' }}>{r.message}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!done && (
                <button
                    onClick={runSetup}
                    disabled={running}
                    style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: running ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: running ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    {running ? '⏳ セットアップ中（約20秒）...' : '🚀 セットアップ実行'}
                </button>
            )}

            {done && (
                <div style={{ textAlign: 'center', padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <p style={{ fontWeight: 600, color: '#16a34a' }}>✅ セットアップ完了</p>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>ログインページに戻って管理者アカウントでログインしてください。</p>
                    <a href={import.meta.env.BASE_URL + 'login'} style={{ display: 'inline-block', marginTop: 12, padding: '8px 24px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>ログインページへ</a>
                </div>
            )}
        </div>
    );
}
