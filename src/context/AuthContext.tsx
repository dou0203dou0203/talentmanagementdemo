import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { users, occupations, facilities } from '../data/mockData';
import type { User, UserRole, PermissionSet } from '../types';

interface AuthUser extends User {
    occupation_name: string;
    facility_name: string;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (email: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    isAuthenticated: boolean;
    permissions: PermissionSet;
    roleLabel: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch { /* ignore */ }
        return null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [user]);

    const login = (email: string, _password: string): { success: boolean; error?: string } => {
        const found = users.find((u) => u.email === email);
        if (!found) {
            return { success: false, error: 'メールアドレスが見つかりません' };
        }

        const occ = occupations.find((o) => o.id === found.occupation_id);
        const fac = facilities.find((f) => f.id === found.facility_id);

        setUser({
            ...found,
            occupation_name: occ?.name || '',
            facility_name: fac?.name || '',
        });

        return { success: true };
    };

    const logout = () => {
        setUser(null);
    };

    const permissions = user ? getPermissions(user.role) : defaultPermissions;
    const roleLabel = user ? getRoleLabel(user.role) : '';

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, permissions, roleLabel }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
