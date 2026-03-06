import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { users, occupations, facilities } from '../data/mockData';
import type { User } from '../types';

interface AuthUser extends User {
    occupation_name: string;
    facility_name: string;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (email: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'talent_auth_user';

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

        // Demo: accept any password
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

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
