// ============================================
// HR関連モックデータ（Phase 1追加分）
// ============================================
import type { TransferHistory, PromotionHistory, SalaryHistory } from '../types';

export const transferHistories: TransferHistory[] = [
    { id: 'th-1', user_id: 'u-2', date: '2018-04-01', from_facility: 'さくらの樹クリニック', to_facility: '訪問看護平野', reason: '人員増強のため' },
    { id: 'th-2', user_id: 'u-3', date: '2022-10-01', from_facility: '本部', to_facility: '訪問看護平野', reason: '訪問看護部門強化' },
    { id: 'th-3', user_id: 'u-11', date: '2010-04-01', from_facility: '本部', to_facility: 'さくらの樹クリニック', reason: '事業所長就任のため' },
    { id: 'th-4', user_id: 'u-5', date: '2020-04-01', from_facility: 'さくらの家和泉', to_facility: '訪問看護東大阪', reason: '本人希望' },
    { id: 'th-5', user_id: 'u-1', date: '2015-04-01', from_facility: 'さくらの樹クリニック', to_facility: '本部', reason: '人事部長就任' },
];

export const promotionHistories: PromotionHistory[] = [
    { id: 'ph-1', user_id: 'u-1', date: '2015-04-01', from_position: '副院長', to_position: '人事部長', type: '役職変更' },
    { id: 'ph-2', user_id: 'u-2', date: '2020-04-01', from_position: '一般', to_position: '主任', type: '昇格' },
    { id: 'ph-3', user_id: 'u-11', date: '2010-04-01', from_position: '部長', to_position: '事業所長', type: '昇格' },
    { id: 'ph-4', user_id: 'u-5', date: '2023-04-01', from_position: '一般', to_position: '主任', type: '昇格' },
    { id: 'ph-5', user_id: 'u-6', date: '2022-10-01', from_position: '主任', to_position: '係長', type: '昇格' },
];

export const salaryHistories: SalaryHistory[] = [];
