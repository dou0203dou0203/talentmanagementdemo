import { supabase, isSupabaseConfigured } from './supabase';

// Generic helper for Supabase mutations
async function mutate<T>(table: string, action: 'insert'|'update'|'upsert'|'delete', data: any, match?: Record<string,any>): Promise<{success:boolean;error?:string;data?:T}> {
  if (!isSupabaseConfigured()) {
    console.log('[Mock] ' + action + ' ' + table, data);
    return { success: true };
  }
  try {
    let query: any;
    if (action === 'insert') {
      query = supabase.from(table).insert(data);
    } else if (action === 'update' && match) {
      query = supabase.from(table).update(data);
      Object.entries(match).forEach(([k,v]) => { query = query.eq(k, v); });
    } else if (action === 'upsert') {
      query = supabase.from(table).upsert(data);
    } else if (action === 'delete' && match) {
      query = supabase.from(table).delete();
      Object.entries(match).forEach(([k,v]) => { query = query.eq(k, v); });
    }
    const { error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ===== Survey Operations =====
export const surveyMutations = {
  async submitSurvey(surveyData: {
    id: string; user_id: string; period_id: string;
    mental_score: number; motivation_score: number;
    survey_date: string; free_comment?: string; submitted: boolean;
  }, answers: { question_id: string; score: number }[]) {
    const res = await mutate('surveys', 'upsert', surveyData);
    if (!res.success) return res;
    // Insert answers
    if (answers.length > 0) {
      const answerRows = answers.map(a => ({ survey_id: surveyData.id, question_id: a.question_id, score: a.score }));
      // Delete old answers first
      await supabase.from('survey_answers').delete().eq('survey_id', surveyData.id);
      return mutate('survey_answers', 'insert', answerRows);
    }
    return res;
  },
};

// ===== Evaluation Operations =====
export const evaluationMutations = {
  async submitEvaluation(evalData: {
    id: string; user_id: string; evaluator_id: string;
    period: string; status: string; overall_comment: string;
  }, scores: { item_id: string; score: number; comment: string }[]) {
    const now = new Date().toISOString();
    const res = await mutate('evaluations', 'upsert', { ...evalData, updated_at: now });
    if (!res.success) return res;
    if (scores.length > 0) {
      await supabase.from('evaluation_scores').delete().eq('evaluation_id', evalData.id);
      const scoreRows = scores.map(s => ({ evaluation_id: evalData.id, item_id: s.item_id, score: s.score, comment: s.comment }));
      return mutate('evaluation_scores', 'insert', scoreRows);
    }
    return res;
  },
};

// ===== Interview Operations =====
export const interviewMutations = {
  async addInterview(data: {
    id: string; user_id: string; interviewer_id: string;
    date: string; type: string; summary: string; details: string;
    mood: number; action_items: string[];
  }) {
    return mutate('interview_logs', 'insert', { ...data, created_at: new Date().toISOString() });
  },
  async updateInterview(id: string, data: any) {
    return mutate('interview_logs', 'update', data, { id });
  },
  async deleteInterview(id: string) {
    return mutate('interview_logs', 'delete', null, { id });
  },
};

// ===== Thanks Points Operations =====
export const thanksMutations = {
  async sendThanks(from_user_id: string, to_user_id: string, message: string) {
    return mutate('thanks_points', 'insert', { from_user_id, to_user_id, message });
  },
};

// ===== User/Staff Operations =====
// Columns that exist in the Supabase users table (Including new ones we will add via SQL)
const USER_DB_COLUMNS = [
  'id', 'name', 'email', 'role', 'occupation_id', 'facility_id', 'status',
  'evaluator_id', 'gender', 'birth_date', 'hire_date', 'position', 'employment_type',
  'work_pattern', 'corporation', 'address', 'phone', 'notes', 'health_check_date',
  'resignation_date', 'resignation_reason', 'updated_at',
];

function filterUserColumns(data: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {};
  for (const key of USER_DB_COLUMNS) {
    if (key in data && data[key] !== undefined) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}

export const userMutations = {
  async updateUser(id: string, data: any) {
    const safeData = filterUserColumns({ ...data, updated_at: new Date().toISOString() });
    delete safeData.id; // UPDATEの場合はidを更新フィールドから除外
    console.log('[DB] updateUser:', id, safeData);
    return mutate('users', 'update', safeData, { id });
  },
  async addUser(data: any) {
    return mutate('users', 'insert', filterUserColumns(data));
  },
  async importUsers(users: any[]) {
    const safeUsers = users.map(u => filterUserColumns(u));
    return mutate('users', 'insert', safeUsers);
  },
  async deleteUsers(ids: string[]) {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }
    try {
      // Delete child records first to satisfy foreign key constraints
      await supabase.from('evaluations').delete().in('user_id', ids);
      await supabase.from('surveys').delete().in('user_id', ids);
      await supabase.from('interview_logs').delete().in('user_id', ids);
      await supabase.from('aptitude_tests').delete().in('user_id', ids);
      await supabase.from('thanks_points').delete().in('from_user_id', ids);
      await supabase.from('thanks_points').delete().in('to_user_id', ids);
      await supabase.from('transfer_history').delete().in('user_id', ids);
      await supabase.from('promotion_history').delete().in('user_id', ids);
      await supabase.from('salary_history').delete().in('user_id', ids);

      const { error } = await supabase.from('users').delete().in('id', ids);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
  async bulkUpdateUsers(ids: string[], updates: any) {
    if (!isSupabaseConfigured() || ids.length === 0) {
      return { success: true };
    }
    const safeData = filterUserColumns({ ...updates, updated_at: new Date().toISOString() });
    delete safeData.id;
    try {
      const { error } = await supabase.from('users').update(safeData).in('id', ids);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
};

// ===== Facility/Corp Operations =====
export const facilityMutations = {
  async addFacility(data: { id: string; name: string; type: string; corporation: string }) {
    return mutate('facilities', 'insert', data);
  },
  async updateStaffingTarget(facility_id: string, occupation_id: string, target_count: number) {
    const id = `fst-${facility_id}-${occupation_id}`;
    return mutate('facility_staffing_targets', 'upsert', { id, facility_id, occupation_id, target_count });
  },
};

// ===== Survey Question Management =====
export const surveyQuestionMutations = {
  async addQuestion(data: { id: string; category: string; question: string; sort_order: number; survey_type?: string }) {
    return mutate('survey_questions', 'insert', { ...data, survey_type: data.survey_type || 'regular' });
  },
  async updateQuestion(id: string, question: string) {
    return mutate('survey_questions', 'update', { question }, { id });
  },
  async deleteQuestion(id: string) {
    return mutate('survey_questions', 'delete', null, { id });
  },
};

// ===== Payroll Operations =====
export const payrollMutations = {
  async addRecords(records: any[]) {
    // Inject created_at and IDs if needed inside the mutation helper
    const payload = records.map(r => ({
      ...r,
      created_at: new Date().toISOString()
    }));
    return mutate('payroll_records', 'insert', payload);
  },
  async updatePayrollRecord(id: string, amount: number) {
    if (!isSupabaseConfigured()) return { success: true };
    try {
      const { error } = await supabase.from('payroll_records').update({ amount }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
  async deletePayrollRecords(yearMonth: string, facilityId?: string, userId?: string) {
    if (!isSupabaseConfigured()) return { success: true };
    try {
      let query = supabase.from('payroll_records').delete().eq('year_month', yearMonth);
      
      // If facilityId is provided, we need to find user_ids for that facility first
      if (facilityId || userId) {
        let userIdsQuery = supabase.from('users').select('id');
        if (userId) {
          userIdsQuery = userIdsQuery.eq('id', userId);
        } else if (facilityId) {
          userIdsQuery = userIdsQuery.eq('facility_id', facilityId);
        }
        const { data: users, error: userError } = await userIdsQuery;
        if (userError) throw userError;
        if (!users || users.length === 0) return { success: true, count: 0 }; // Nothing to delete
        
        const extractedUserIds = users.map(u => u.id);
        query = query.in('user_id', extractedUserIds);
      }
      
      // In JS we can append .select() to get the count of deleted rows, but it's simpler to just run it. 
      // Supabase v2 delete() allows returning deleted items.
      const { data, error } = await query.select('id');
      if (error) throw error;
      
      return { success: true, deletedCount: data?.length || 0 };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};
