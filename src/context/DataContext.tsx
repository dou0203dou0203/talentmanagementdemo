import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { User, Facility, Occupation, Evaluation, Survey, SurveyQuestion, SurveyPeriod, FacilityStaffingTarget } from '../types';

interface DataOnly {
  users: User[];
  facilities: Facility[];
  occupations: Occupation[];
  evaluations: Evaluation[];
  surveys: Survey[];
  surveyQuestions: SurveyQuestion[];
  surveyPeriods: SurveyPeriod[];
  facilityStaffingTargets: FacilityStaffingTarget[];
  interviewLogs: any[];
  aptitudeTests: any[];
  loading: boolean;
  source: 'supabase' | 'none';
}

interface DataState extends DataOnly {
  addUsers: (newUsers: User[]) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUsers: (ids: string[]) => void;
  updateStaffingTarget: (facilityId: string, occupationId: string, targetCount: number) => void;
  reload: () => Promise<void>;
}

const emptyData: DataOnly = {
  users: [],
  facilities: [],
  occupations: [],
  evaluations: [],
  surveys: [],
  surveyQuestions: [],
  surveyPeriods: [],
  facilityStaffingTargets: [],
  interviewLogs: [],
  aptitudeTests: [],
  loading: true,
  source: 'none',
};

const DataContext = createContext<DataState>({
  ...emptyData,
  addUsers: () => {},
  updateUser: () => {},
  removeUsers: () => {},
  updateStaffingTarget: () => {},
  reload: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, session } = useAuth();
  const [data, setData] = useState<DataOnly>(emptyData);

  const loadFromSupabase = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const [usersRes, facRes, occRes, evRes, svRes, sqRes, spRes, fstRes, ilRes, atRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('facilities').select('*'),
        supabase.from('occupations').select('*'),
        supabase.from('evaluations').select('*, evaluation_scores(*)'),
        supabase.from('surveys').select('*'),
        supabase.from('survey_questions').select('*'),
        supabase.from('survey_periods').select('*'),
        supabase.from('facility_staffing_targets').select('*'),
        supabase.from('interview_logs').select('*'),
        supabase.from('aptitude_tests').select('*'),
      ]);

      // Map evaluations to include scores array
      const evaluations: Evaluation[] = (evRes.data || []).map((ev: any) => ({
        ...ev,
        scores: (ev.evaluation_scores || []).map((s: any) => ({
          item_id: s.item_id,
          score: s.score,
          comment: s.comment || '',
        })),
      }));

      // Map interview_logs action_items from JSONB to string[]
      const interviewLogs = (ilRes.data || []).map((il: any) => ({
        ...il,
        action_items: Array.isArray(il.action_items) ? il.action_items : [],
      }));

      // Map aptitude_tests scores from JSONB
      const aptitudeTests = (atRes.data || []).map((at: any) => ({
        ...at,
        scores: Array.isArray(at.scores) ? at.scores : [],
      }));

      setData({
        users: (usersRes.data as User[]) || [],
        facilities: (facRes.data as Facility[]) || [],
        occupations: (occRes.data as Occupation[]) || [],
        evaluations,
        surveys: (svRes.data as Survey[]) || [],
        surveyQuestions: (sqRes.data as SurveyQuestion[]) || [],
        surveyPeriods: (spRes.data as SurveyPeriod[]) || [],
        facilityStaffingTargets: (fstRes.data as FacilityStaffingTarget[]) || [],
        interviewLogs,
        aptitudeTests,
        loading: false,
        source: 'supabase',
      });

      console.log('✅ Supabaseからデータを取得しました',
        `users: ${usersRes.data?.length ?? 0}`,
        `facilities: ${facRes.data?.length ?? 0}`,
        `occupations: ${occRes.data?.length ?? 0}`,
      );
    } catch (err) {
      console.error('❌ Supabaseデータ取得失敗:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Load data when authentication state changes
  useEffect(() => {
    if (isAuthenticated && session) {
      loadFromSupabase();
    } else {
      // Not authenticated - clear data
      setData({ ...emptyData, loading: false });
    }
  }, [isAuthenticated, session, loadFromSupabase]);

  const addUsers = (newUsers: User[]) => {
    setData(prev => ({ ...prev, users: [...prev.users, ...newUsers] }));
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
  };

  const removeUsers = (ids: string[]) => {
    setData(prev => ({
      ...prev,
      users: prev.users.filter(u => !ids.includes(u.id)),
    }));
  };

  const updateStaffingTarget = (facilityId: string, occupationId: string, targetCount: number) => {
    setData(prev => {
      const existingIdx = prev.facilityStaffingTargets.findIndex(t => t.facility_id === facilityId && t.occupation_id === occupationId);
      const newTargets = [...prev.facilityStaffingTargets];
      if (existingIdx >= 0) {
        newTargets[existingIdx] = { ...newTargets[existingIdx], target_count: targetCount };
      } else {
        newTargets.push({ id: `fst-${facilityId}-${occupationId}`, facility_id: facilityId, occupation_id: occupationId, target_count: targetCount });
      }
      return { ...prev, facilityStaffingTargets: newTargets };
    });
  };

  const value = useMemo<DataState>(() => ({
    ...data,
    addUsers,
    updateUser,
    removeUsers,
    updateStaffingTarget,
    reload: loadFromSupabase,
  }), [data, loadFromSupabase]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
