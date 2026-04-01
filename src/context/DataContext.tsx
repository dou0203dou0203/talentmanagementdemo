import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import * as mock from '../data/mockData';
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
  source: 'mock' | 'supabase';
}

interface DataState extends DataOnly {
  addUsers: (newUsers: User[]) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
}

const defaultData: DataOnly = {
  users: mock.users,
  facilities: mock.facilities,
  occupations: mock.occupations,
  evaluations: mock.evaluations,
  surveys: mock.surveys,
  surveyQuestions: mock.surveyQuestions,
  surveyPeriods: mock.surveyPeriods,
  facilityStaffingTargets: mock.facilityStaffingTargets,
  interviewLogs: mock.interviewLogs,
  aptitudeTests: mock.aptitudeTests,
  loading: false,
  source: 'mock',
};

const DataContext = createContext<DataState>({
  ...defaultData,
  addUsers: () => {},
  updateUser: () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataOnly>({
    ...defaultData,
    loading: true,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }
    loadFromSupabase();
  }, []);

  const loadFromSupabase = async () => {
    try {
      const [usersRes, facRes, occRes, evRes, svRes, sqRes, spRes, fstRes, ilRes, atRes] = await Promise.all([
        supabase.from('users').select('id, name, email, role, occupation_id, facility_id, status, evaluator_id, birth_date, hire_date, position, employment_type, work_pattern, corporation, resignation_date, resignation_reason'),
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
        users: (usersRes.data as User[]) || mock.users,
        facilities: (facRes.data as Facility[]) || mock.facilities,
        occupations: (occRes.data as Occupation[]) || mock.occupations,
        evaluations: evaluations.length > 0 ? evaluations : mock.evaluations,
        surveys: (svRes.data as Survey[]) || mock.surveys,
        surveyQuestions: (sqRes.data as SurveyQuestion[]) || mock.surveyQuestions,
        surveyPeriods: (spRes.data as SurveyPeriod[]) || mock.surveyPeriods,
        facilityStaffingTargets: (fstRes.data as FacilityStaffingTarget[]) || mock.facilityStaffingTargets,
        interviewLogs: interviewLogs.length > 0 ? interviewLogs : mock.interviewLogs,
        aptitudeTests: aptitudeTests.length > 0 ? aptitudeTests : mock.aptitudeTests,
        loading: false,
        source: 'supabase',
      });

      console.log('\u2705 Supabaseからデータを取得しました');
    } catch (err) {
      console.warn('Supabaseデータ取得失敗、mockDataで継続:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const addUsers = (newUsers: User[]) => {
    setData(prev => ({ ...prev, users: [...prev.users, ...newUsers] }));
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
  };

  const value = useMemo<DataState>(() => ({
    ...data,
    addUsers,
    updateUser,
  }), [data]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
