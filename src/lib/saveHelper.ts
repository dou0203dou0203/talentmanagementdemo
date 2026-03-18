// Re-export everything for convenience
export { surveyMutations, evaluationMutations, interviewMutations, thanksMutations, userMutations, facilityMutations, surveyQuestionMutations } from './mutations';

// saveAndAlert: performs the Supabase mutation and shows appropriate alert
export async function saveAndAlert(mutationFn: ()=>Promise<{success:boolean;error?:string}>, successMsg: string, errorMsg?: string) {
  const result = await mutationFn();
  if (result.success) {
    alert('✅ ' + successMsg);
  } else {
    alert('❌ ' + (errorMsg || 'エラー') + ': ' + (result.error || ''));
  }
  return result;
}
