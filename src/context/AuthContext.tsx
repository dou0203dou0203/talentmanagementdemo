import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { users as mockUsers, occupations, facilities } from '../data/mockData';
import type { User, UserRole, PermissionSet } from '../types';
import type { Session, AuthError } from '@supabase/supabase-js';

interface AuthUser extends User {
    occupation_name: string;
    facility_name: string;
}

interface AuthContextType {
    user: AuthUser | null;
    session: Session | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    permissions: PermissionSet;
    roleLabel: string;
    isLoading: boolean;
    isSupabaseAuth: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'talent_auth_user';

function getPermissions(role: UserRole): PermissionSet {
    switch (role) {
        case 'hr_admin':
            return { canViewAllStaff: true, canEditEvaluation: true, canViewHRInfo: true, canViewOwnOnly: false, canViewFacility: true, canViewCorporation: true, canEditStaff: true, canEditInterviews: true };
        case 'corp_head':
            return { canViewAllStaff: false, canEditEvaluation: false, canViewHRInfo: false, canViewOwnOnly: false, canViewFacility: true, canViewCorporation: true, canEditStaff: false, canEditInterviews: false };
        case 'facility_manager':
            return { canViewAllStaff: false, canEditEvaluation: true, canViewHRInfo: false, canViewOwnOnly: false, canViewFacility: true, canViewCorporation: false, canEditStaff: false, canEditInterviews: false };
        case 'staff':
        default:
            return { canViewAllStaff: false, canEditEvaluation: false, canViewHRInfo: false, canViewOwnOnly: true, canViewFacility: false, canViewCorporation: false, canEditStaff: false, canEditInterviews: false };
    }
}

function getRoleLabel(role: UserRole): string {
    switch (role) {
        case 'hr_admin': return '人事本部';
        case 'corp_head': return '法人責任者';
        case 'facility_manager': return '事業所管理者';
        case 'staff': return '一般職員';
        default: return 'スタッフ';
    }
}

const defaultPermissions: PermissionSet = {
    canViewAllStaff: false, canEditEvaluation: false, canViewHRInfo: false,
    canViewOwnOnly: true, canViewFacility: false, canViewCorporation: false,
    canEditStaff: false, canEditInterviews: false,
};

// Build AuthUser from a User record
function buildAuthUser(found: User): AuthUser {
    const occ = occupations.find((o) => o.id === found.occupation_id);
    const fac = facilities.find((f) => f.id === found.facility_id);
    return {
        ...found,
        occupation_name: occ?.name || '',
        facility_name: fac?.name || '',
    };
}

// Translate Supabase auth errors to Japanese
function translateAuthError(error: AuthError): string {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません';
    if (msg.includes('email not confirmed')) return 'メールアドレスが確認されていません';
    if (msg.includes('user already registered')) return 'このメールアドレスは既に登録されています';
    if (msg.includes('password') && msg.includes('least')) return 'パスワードは6文字以上で入力してください';
    if (msg.includes('rate limit')) return 'リクエストが多すぎます。しばらくお待ちください';
    if (msg.includes('signup is disabled')) return '新規登録は現在無効になっています';
    return error.message || '認証エラーが発生しました';
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const useSupabase = isSupabaseConfigured();

    // Look up user profile from users table (direct REST to avoid auth lock conflicts)
    const findUserProfile = useCallback(async (email: string, _authUid?: string): Promise<User | null> => {
        if (useSupabase) {
            try {
                const url = import.meta.env.VITE_SUPABASE_URL;
                const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
                const columns = 'id,name,email,role,occupation_id,facility_id,status,evaluator_id,birth_date,hire_date,position,employment_type,work_pattern,corporation,resignation_date,resignation_reason';
                const res = await fetch(
                    `${url}/rest/v1/users?select=${columns}&email=eq.${encodeURIComponent(email)}&limit=1`,
                    { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
                );
                if (res.ok) {
                    const rows = await res.json();
                    console.log('[Auth] findUserProfile:', email, 'role:', rows[0]?.role);
                    if (rows.length > 0) return rows[0] as User;
                } else {
                    console.warn('[Auth] findUserProfile HTTP error:', res.status);
                }
            } catch (e) {
                console.warn('[Auth] findUserProfile exception:', e);
            }
        }
        // Fallback to mock data
        return mockUsers.find(u => u.email === email) || null;
    }, [useSupabase]);

    // Initialize: check existing session
    useEffect(() => {
        if (!useSupabase) {
            // Mock mode: restore from localStorage
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) setUser(JSON.parse(stored));
            } catch { /* ignore */ }
            setIsLoading(false);
            return;
        }

        // Supabase mode: use only onAuthStateChange to avoid Lock conflicts
        // (calling getSession + onAuthStateChange simultaneously causes "Lock broken by steal")
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('[Auth] onAuthStateChange:', event);
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setIsLoading(false);
            } else if (newSession?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
                setSession(newSession);
                try {
                    const profile = await findUserProfile(
                        newSession.user.email || '',
                        newSession.user.id
                    );
                    if (profile) {
                        setUser(buildAuthUser(profile));
                    } else {
                        // User exists in Auth but not in users table - create minimal profile
                        const tempUser: AuthUser = {
                            id: newSession.user.id,
                            name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || 'ユーザー',
                            email: newSession.user.email || '',
                            role: 'staff',
                            occupation_id: 'occ-1',
                            facility_id: 'fac-1',
                            status: 'active',
                            evaluator_id: null,
                            auth_uid: newSession.user.id,
                            occupation_name: '',
                            facility_name: '',
                        };
                        setUser(tempUser);
                    }
                } catch (e) {
                    console.warn('[Auth] Profile lookup failed:', e);
                }
                setIsLoading(false);
            }
        });

        // If no session event fires within 3 seconds, mark as loaded (no session)
        const timeout = setTimeout(() => setIsLoading(false), 3000);

        return () => { clearTimeout(timeout); subscription.unsubscribe(); };
    }, [useSupabase, findUserProfile]);

    // Persist mock auth user to localStorage
    useEffect(() => {
        if (!useSupabase) {
            if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            else localStorage.removeItem(STORAGE_KEY);
        }
    }, [user, useSupabase]);

    // === Login ===
    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        if (!useSupabase) {
            // Mock mode fallback
            const found = mockUsers.find((u) => u.email === email);
            if (!found) return { success: false, error: 'メールアドレスが見つかりません' };
            setUser(buildAuthUser(found));
            return { success: true };
        }

        // Supabase Auth - only authenticate, profile loading is handled by onAuthStateChange
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: translateAuthError(error) };

        return { success: true };
    };

    // === Signup ===
    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
        if (!useSupabase) {
            return { success: false, error: 'デモモードでは新規登録できません' };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });

        if (error) return { success: false, error: translateAuthError(error) };
        if (!data.user) return { success: false, error: '登録に失敗しました' };

        // Create user record in users table (default role: staff)
        try {
            await supabase.from('users').insert({
                id: 'u-' + Date.now(),
                name,
                email,
                role: 'staff',
                occupation_id: 'occ-1',
                facility_id: 'fac-1',
                status: 'active',
                evaluator_id: null,
            });
        } catch (e) {
            console.warn('ユーザープロフィール作成失敗:', e);
        }

        return { success: true };
    };

    // === Logout ===
    const logout = async () => {
        if (useSupabase) {
            await supabase.auth.signOut();
        }
        setUser(null);
        setSession(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const permissions = user ? getPermissions(user.role) : defaultPermissions;
    const roleLabel = user ? getRoleLabel(user.role) : '';

    return (
        <AuthContext.Provider value={{
            user, session, login, signup, logout,
            isAuthenticated: !!user,
            permissions, roleLabel, isLoading,
            isSupabaseAuth: useSupabase,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
