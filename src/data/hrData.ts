// ============================================
// HR関連モックデータ（Phase 1追加分）
// ============================================
import type { TransferHistory, PromotionHistory, SalaryHistory } from '../types';

export const transferHistories: TransferHistory[] = [
    { id: 'th-1', user_id: 'u-2', date: '2018-04-01', from_facility: '駅前クリニック', to_facility: '中央病院', reason: '人員増強のため' },
    { id: 'th-2', user_id: 'u-3', date: '2022-10-01', from_facility: '中央病院', to_facility: '南リハビリ病院', reason: 'リハビリ部門強化' },
    { id: 'th-3', user_id: 'u-11', date: '2010-04-01', from_facility: '中央病院', to_facility: '駅前クリニック', reason: '事業所長就任のため' },
    { id: 'th-4', user_id: 'u-5', date: '2020-04-01', from_facility: '西部介護センター', to_facility: '中央病院', reason: '本人希望' },
    { id: 'th-5', user_id: 'u-1', date: '2015-04-01', from_facility: '中央病院', to_facility: '統括本部', reason: '人事部長就任' },
];

export const promotionHistories: PromotionHistory[] = [
    { id: 'ph-1', user_id: 'u-1', date: '2015-04-01', from_position: '副院長', to_position: '人事部長', type: '役職変更' },
    { id: 'ph-2', user_id: 'u-2', date: '2020-04-01', from_position: '一般', to_position: '主任', type: '昇格' },
    { id: 'ph-3', user_id: 'u-11', date: '2010-04-01', from_position: '部長', to_position: '事業所長', type: '昇格' },
    { id: 'ph-4', user_id: 'u-5', date: '2023-04-01', from_position: '一般', to_position: '主任', type: '昇格' },
    { id: 'ph-5', user_id: 'u-6', date: '2022-10-01', from_position: '主任', to_position: '係長', type: '昇格' },
];

export const salaryHistories: SalaryHistory[] = [
    { id: 'sh-1', user_id: 'u-1', date: '2005-04-01', change_type: '初任給', salary_range: 'S1', note: '入職時' },
    { id: 'sh-2', user_id: 'u-1', date: '2015-04-01', change_type: '昇給', salary_range: 'S5', note: '人事部長就任に伴い' },
    { id: 'sh-3', user_id: 'u-2', date: '2015-04-01', change_type: '初任給', salary_range: 'A1', note: '入職時' },
    { id: 'sh-4', user_id: 'u-2', date: '2020-04-01', change_type: '昇給', salary_range: 'A3', note: '主任昇格に伴い' },
    { id: 'sh-5', user_id: 'u-11', date: '2000-04-01', change_type: '初任給', salary_range: 'S1', note: '入職時' },
    { id: 'sh-6', user_id: 'u-11', date: '2010-04-01', change_type: '昇給', salary_range: 'S4', note: '事業所長就任' },
    { id: 'sh-7', user_id: 'u-5', date: '2018-04-01', change_type: '初任給', salary_range: 'A1', note: '入職時' },
    { id: 'sh-8', user_id: 'u-5', date: '2023-04-01', change_type: '昇給', salary_range: 'A2', note: '主任昇格に伴い' },
];
