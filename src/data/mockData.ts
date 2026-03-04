// ============================================
// タレントマネジメントシステム モックデータ
// 50ユーザー / 8施設 / 半年分サーベイ / 全員評価
// ============================================
import type {
  Occupation,
  EvaluationTemplateItem,
  User,
  Evaluation,
  Survey,
  SurveyQuestion,
  SurveyPeriod,
  Facility,
  FacilityStaffingTarget,
} from '../types';

export const occupations: Occupation[] = [
  {
    id: 'occ-1',
    name: '医師'
  },
  {
    id: 'occ-2',
    name: '看護師'
  },
  {
    id: 'occ-3',
    name: '理学療法士（PT）'
  },
  {
    id: 'occ-4',
    name: '介護福祉士'
  },
  {
    id: 'occ-5',
    name: '事務職'
  }
];

export const facilities: Facility[] = [
  {
    id: 'fac-1',
    name: '中央病院',
    type: '病院'
  },
  {
    id: 'fac-2',
    name: '駅前クリニック',
    type: 'クリニック'
  },
  {
    id: 'fac-3',
    name: 'さくら介護施設',
    type: '介護施設'
  },
  {
    id: 'fac-4',
    name: '東部クリニック',
    type: 'クリニック'
  },
  {
    id: 'fac-5',
    name: '南部病院',
    type: '病院'
  },
  {
    id: 'fac-6',
    name: 'ひまわり介護施設',
    type: '介護施設'
  },
  {
    id: 'fac-7',
    name: '西部クリニック',
    type: 'クリニック'
  },
  {
    id: 'fac-8',
    name: '本部',
    type: '本部'
  }
];

export const users: User[] = [
  {
    id: 'u-1',
    name: '高橋拓海',
    email: 'user1@example.com',
    role: 'admin',
    occupation_id: 'occ-1',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: null
  },
  {
    id: 'u-2',
    name: '石井誠',
    email: 'user2@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-3',
    name: '三浦瑠奈',
    email: 'user3@example.com',
    role: 'staff',
    occupation_id: 'occ-3',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-4',
    name: '金子芽依',
    email: 'user4@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-5',
    name: '山田悠真',
    email: 'user5@example.com',
    role: 'staff',
    occupation_id: 'occ-1',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-6',
    name: '前田裕子',
    email: 'user6@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-7',
    name: '石川正樹',
    email: 'user7@example.com',
    role: 'staff',
    occupation_id: 'occ-3',
    facility_id: 'fac-1',
    status: 'leave',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-8',
    name: '青木恵',
    email: 'user8@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-9',
    name: '中川結衣',
    email: 'user9@example.com',
    role: 'staff',
    occupation_id: 'occ-1',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-10',
    name: '木村裕子',
    email: 'user10@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-1',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-11',
    name: '太田健一',
    email: 'user11@example.com',
    role: 'manager',
    occupation_id: 'occ-1',
    facility_id: 'fac-2',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-12',
    name: '竹内優斗',
    email: 'user12@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-2',
    status: 'active',
    evaluator_id: 'u-11'
  },
  {
    id: 'u-13',
    name: '清水沙織',
    email: 'user13@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-2',
    status: 'active',
    evaluator_id: 'u-11'
  },
  {
    id: 'u-14',
    name: '藤田裕子',
    email: 'user14@example.com',
    role: 'staff',
    occupation_id: 'occ-1',
    facility_id: 'fac-2',
    status: 'active',
    evaluator_id: 'u-11'
  },
  {
    id: 'u-15',
    name: '松田海斗',
    email: 'user15@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-2',
    status: 'active',
    evaluator_id: 'u-11'
  },
  {
    id: 'u-16',
    name: '吉田大輔',
    email: 'user16@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-2',
    status: 'active',
    evaluator_id: 'u-11'
  },
  {
    id: 'u-17',
    name: '中村葵',
    email: 'user17@example.com',
    role: 'manager',
    occupation_id: 'occ-2',
    facility_id: 'fac-3',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-18',
    name: '後藤湊',
    email: 'user18@example.com',
    role: 'staff',
    occupation_id: 'occ-4',
    facility_id: 'fac-3',
    status: 'active',
    evaluator_id: 'u-17'
  },
  {
    id: 'u-19',
    name: '橋本瑠奈',
    email: 'user19@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-3',
    status: 'active',
    evaluator_id: 'u-17'
  },
  {
    id: 'u-20',
    name: '高橋樹',
    email: 'user20@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-3',
    status: 'active',
    evaluator_id: 'u-17'
  },
  {
    id: 'u-21',
    name: '伊藤大輔',
    email: 'user21@example.com',
    role: 'staff',
    occupation_id: 'occ-4',
    facility_id: 'fac-3',
    status: 'active',
    evaluator_id: 'u-17'
  },
  {
    id: 'u-22',
    name: '小野結衣',
    email: 'user22@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-3',
    status: 'active',
    evaluator_id: 'u-17'
  },
  {
    id: 'u-23',
    name: '山本彩花',
    email: 'user23@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-3',
    status: 'active',
    evaluator_id: 'u-17'
  },
  {
    id: 'u-24',
    name: '坂本駿',
    email: 'user24@example.com',
    role: 'manager',
    occupation_id: 'occ-1',
    facility_id: 'fac-4',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-25',
    name: '前田悠真',
    email: 'user25@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-4',
    status: 'active',
    evaluator_id: 'u-24'
  },
  {
    id: 'u-26',
    name: '吉田湊',
    email: 'user26@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-4',
    status: 'active',
    evaluator_id: 'u-24'
  },
  {
    id: 'u-27',
    name: '前田真央',
    email: 'user27@example.com',
    role: 'staff',
    occupation_id: 'occ-1',
    facility_id: 'fac-4',
    status: 'active',
    evaluator_id: 'u-24'
  },
  {
    id: 'u-28',
    name: '藤井大輔',
    email: 'user28@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-4',
    status: 'active',
    evaluator_id: 'u-24'
  },
  {
    id: 'u-29',
    name: '木村凛',
    email: 'user29@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-4',
    status: 'active',
    evaluator_id: 'u-24'
  },
  {
    id: 'u-30',
    name: '佐藤翔太',
    email: 'user30@example.com',
    role: 'manager',
    occupation_id: 'occ-1',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-31',
    name: '村上凛',
    email: 'user31@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-32',
    name: '遠藤悠真',
    email: 'user32@example.com',
    role: 'staff',
    occupation_id: 'occ-3',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-33',
    name: '渡辺正樹',
    email: 'user33@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-34',
    name: '後藤翔太',
    email: 'user34@example.com',
    role: 'staff',
    occupation_id: 'occ-1',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-35',
    name: '和田颯太',
    email: 'user35@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-5',
    status: 'leave',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-36',
    name: '岡本隼人',
    email: 'user36@example.com',
    role: 'staff',
    occupation_id: 'occ-3',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-37',
    name: '村上彩花',
    email: 'user37@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-38',
    name: '阿部優斗',
    email: 'user38@example.com',
    role: 'staff',
    occupation_id: 'occ-1',
    facility_id: 'fac-5',
    status: 'active',
    evaluator_id: 'u-30'
  },
  {
    id: 'u-39',
    name: '渡辺裕子',
    email: 'user39@example.com',
    role: 'manager',
    occupation_id: 'occ-2',
    facility_id: 'fac-6',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-40',
    name: '長谷川凛',
    email: 'user40@example.com',
    role: 'staff',
    occupation_id: 'occ-4',
    facility_id: 'fac-6',
    status: 'active',
    evaluator_id: 'u-39'
  },
  {
    id: 'u-41',
    name: '吉田慎',
    email: 'user41@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-6',
    status: 'active',
    evaluator_id: 'u-39'
  },
  {
    id: 'u-42',
    name: '佐藤花子',
    email: 'user42@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-6',
    status: 'active',
    evaluator_id: 'u-39'
  },
  {
    id: 'u-43',
    name: '福田京子',
    email: 'user43@example.com',
    role: 'staff',
    occupation_id: 'occ-4',
    facility_id: 'fac-6',
    status: 'active',
    evaluator_id: 'u-39'
  },
  {
    id: 'u-44',
    name: '山本正樹',
    email: 'user44@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-6',
    status: 'active',
    evaluator_id: 'u-39'
  },
  {
    id: 'u-45',
    name: '遠藤颯太',
    email: 'user45@example.com',
    role: 'manager',
    occupation_id: 'occ-1',
    facility_id: 'fac-7',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-46',
    name: '田中明美',
    email: 'user46@example.com',
    role: 'staff',
    occupation_id: 'occ-2',
    facility_id: 'fac-7',
    status: 'active',
    evaluator_id: 'u-45'
  },
  {
    id: 'u-47',
    name: '西村花子',
    email: 'user47@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-7',
    status: 'active',
    evaluator_id: 'u-45'
  },
  {
    id: 'u-48',
    name: '藤原慎',
    email: 'user48@example.com',
    role: 'staff',
    occupation_id: 'occ-1',
    facility_id: 'fac-7',
    status: 'active',
    evaluator_id: 'u-45'
  },
  {
    id: 'u-49',
    name: '原田美月',
    email: 'user49@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-8',
    status: 'active',
    evaluator_id: 'u-1'
  },
  {
    id: 'u-50',
    name: '岡田陽菜',
    email: 'user50@example.com',
    role: 'staff',
    occupation_id: 'occ-5',
    facility_id: 'fac-8',
    status: 'active',
    evaluator_id: 'u-1'
  }
];

export const evaluationTemplateItems: EvaluationTemplateItem[] = [
  {
    id: 'et-1',
    occupation_id: 'occ-1',
    category: '診療スキル',
    question: '的確な診断能力',
    sort_order: 1
  },
  {
    id: 'et-2',
    occupation_id: 'occ-1',
    category: '診療スキル',
    question: '治療計画の立案力',
    sort_order: 2
  },
  {
    id: 'et-3',
    occupation_id: 'occ-1',
    category: 'コミュニケーション',
    question: '患者説明のわかりやすさ',
    sort_order: 3
  },
  {
    id: 'et-4',
    occupation_id: 'occ-2',
    category: '看護スキル',
    question: '基本看護技術の遂行',
    sort_order: 1
  },
  {
    id: 'et-5',
    occupation_id: 'occ-2',
    category: '看護スキル',
    question: '患者観察力',
    sort_order: 2
  },
  {
    id: 'et-6',
    occupation_id: 'occ-2',
    category: 'チームワーク',
    question: '多職種連携',
    sort_order: 3
  },
  {
    id: 'et-7',
    occupation_id: 'occ-3',
    category: 'リハビリ技術',
    question: '運動療法の実施力',
    sort_order: 1
  },
  {
    id: 'et-8',
    occupation_id: 'occ-3',
    category: 'リハビリ技術',
    question: '治療プログラム作成',
    sort_order: 2
  },
  {
    id: 'et-9',
    occupation_id: 'occ-4',
    category: '介護スキル',
    question: '日常生活支援の質',
    sort_order: 1
  },
  {
    id: 'et-10',
    occupation_id: 'occ-4',
    category: '介護スキル',
    question: '認知症ケア',
    sort_order: 2
  },
  {
    id: 'et-11',
    occupation_id: 'occ-5',
    category: '事務処理',
    question: '正確な書類処理',
    sort_order: 1
  },
  {
    id: 'et-12',
    occupation_id: 'occ-5',
    category: '事務処理',
    question: 'スケジュール管理能力',
    sort_order: 2
  }
];

export const evaluations: Evaluation[] = [
  {
    id: 'ev-1',
    user_id: 'u-1',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-1',
        score: 2,
        comment: '意欲的'
      },
      {
        item_id: 'et-2',
        score: 4,
        comment: '改善が必要'
      },
      {
        item_id: 'et-3',
        score: 2,
        comment: '期待以上の成果'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-15'
  },
  {
    id: 'ev-2',
    user_id: 'u-2',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-4',
        score: 2,
        comment: '期待以上の成果'
      },
      {
        item_id: 'et-5',
        score: 5,
        comment: '標準的'
      },
      {
        item_id: 'et-6',
        score: 3,
        comment: '安定感がある'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-16'
  },
  {
    id: 'ev-3',
    user_id: 'u-3',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-7',
        score: 2,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-8',
        score: 4,
        comment: '安定感がある'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-17'
  },
  {
    id: 'ev-4',
    user_id: 'u-4',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-11',
        score: 3,
        comment: '安定感がある'
      },
      {
        item_id: 'et-12',
        score: 2,
        comment: '改善が必要'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-18'
  },
  {
    id: 'ev-5',
    user_id: 'u-5',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-1',
        score: 4,
        comment: '改善が必要'
      },
      {
        item_id: 'et-2',
        score: 2,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-3',
        score: 2,
        comment: '安定感がある'
      }
    ],
    overall_comment: '積極的な姿勢を評価',
    created_at: '2025-09-15',
    updated_at: '2025-09-19'
  },
  {
    id: 'ev-6',
    user_id: 'u-6',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-4',
        score: 2,
        comment: '改善が必要'
      },
      {
        item_id: 'et-5',
        score: 4,
        comment: '良好'
      },
      {
        item_id: 'et-6',
        score: 2,
        comment: '丁寧な対応'
      }
    ],
    overall_comment: '優れた成果を発揮',
    created_at: '2025-09-15',
    updated_at: '2025-09-20'
  },
  {
    id: 'ev-7',
    user_id: 'u-7',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-7',
        score: 4,
        comment: '安定感がある'
      },
      {
        item_id: 'et-8',
        score: 5,
        comment: '期待以上の成果'
      }
    ],
    overall_comment: '優れた成果を発揮',
    created_at: '2025-09-15',
    updated_at: '2025-09-21'
  },
  {
    id: 'ev-8',
    user_id: 'u-8',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-11',
        score: 2,
        comment: '高い専門性'
      },
      {
        item_id: 'et-12',
        score: 4,
        comment: '非常に優秀'
      }
    ],
    overall_comment: '安定したパフォーマンス',
    created_at: '2025-09-15',
    updated_at: '2025-09-22'
  },
  {
    id: 'ev-9',
    user_id: 'u-9',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-1',
        score: 2,
        comment: '標準的'
      },
      {
        item_id: 'et-2',
        score: 4,
        comment: '期待以上の成果'
      },
      {
        item_id: 'et-3',
        score: 4,
        comment: '高い専門性'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-23'
  },
  {
    id: 'ev-10',
    user_id: 'u-10',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-4',
        score: 4,
        comment: '安定感がある'
      },
      {
        item_id: 'et-5',
        score: 3,
        comment: '高い専門性'
      },
      {
        item_id: 'et-6',
        score: 4,
        comment: '成長が見られる'
      }
    ],
    overall_comment: 'さらなるスキル向上を期待',
    created_at: '2025-09-15',
    updated_at: '2025-09-24'
  },
  {
    id: 'ev-11',
    user_id: 'u-11',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-1',
        score: 2,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-2',
        score: 3,
        comment: '良好'
      },
      {
        item_id: 'et-3',
        score: 5,
        comment: '標準的'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-15'
  },
  {
    id: 'ev-12',
    user_id: 'u-12',
    evaluator_id: 'u-11',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-4',
        score: 3,
        comment: '良好'
      },
      {
        item_id: 'et-5',
        score: 3,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-6',
        score: 4,
        comment: '期待以上の成果'
      }
    ],
    overall_comment: '積極的な姿勢を評価',
    created_at: '2025-09-15',
    updated_at: '2025-09-16'
  },
  {
    id: 'ev-13',
    user_id: 'u-13',
    evaluator_id: 'u-11',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-11',
        score: 3,
        comment: '改善が必要'
      },
      {
        item_id: 'et-12',
        score: 2,
        comment: '丁寧な対応'
      }
    ],
    overall_comment: 'さらなるスキル向上を期待',
    created_at: '2025-09-15',
    updated_at: '2025-09-17'
  },
  {
    id: 'ev-14',
    user_id: 'u-14',
    evaluator_id: 'u-11',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-1',
        score: 4,
        comment: '改善が必要'
      },
      {
        item_id: 'et-2',
        score: 5,
        comment: '安定感がある'
      },
      {
        item_id: 'et-3',
        score: 5,
        comment: '意欲的'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-18'
  },
  {
    id: 'ev-15',
    user_id: 'u-15',
    evaluator_id: 'u-11',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-4',
        score: 5,
        comment: '期待以上の成果'
      },
      {
        item_id: 'et-5',
        score: 5,
        comment: '丁寧な対応'
      },
      {
        item_id: 'et-6',
        score: 3,
        comment: '安定感がある'
      }
    ],
    overall_comment: 'チームへの貢献が大きい',
    created_at: '2025-09-15',
    updated_at: '2025-09-19'
  },
  {
    id: 'ev-16',
    user_id: 'u-16',
    evaluator_id: 'u-11',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-11',
        score: 2,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-12',
        score: 2,
        comment: '非常に優秀'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-20'
  },
  {
    id: 'ev-17',
    user_id: 'u-17',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-4',
        score: 5,
        comment: '期待以上の成果'
      },
      {
        item_id: 'et-5',
        score: 5,
        comment: '標準的'
      },
      {
        item_id: 'et-6',
        score: 2,
        comment: '丁寧な対応'
      }
    ],
    overall_comment: '非常に良好な取り組み',
    created_at: '2025-09-15',
    updated_at: '2025-09-21'
  },
  {
    id: 'ev-18',
    user_id: 'u-18',
    evaluator_id: 'u-17',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-9',
        score: 3,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-10',
        score: 5,
        comment: '安定感がある'
      }
    ],
    overall_comment: 'さらなるスキル向上を期待',
    created_at: '2025-09-15',
    updated_at: '2025-09-22'
  },
  {
    id: 'ev-19',
    user_id: 'u-19',
    evaluator_id: 'u-17',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-11',
        score: 2,
        comment: '良好'
      },
      {
        item_id: 'et-12',
        score: 3,
        comment: '成長が見られる'
      }
    ],
    overall_comment: '非常に良好な取り組み',
    created_at: '2025-09-15',
    updated_at: '2025-09-23'
  },
  {
    id: 'ev-20',
    user_id: 'u-20',
    evaluator_id: 'u-17',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-4',
        score: 5,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-5',
        score: 5,
        comment: '改善が必要'
      },
      {
        item_id: 'et-6',
        score: 5,
        comment: '意欲的'
      }
    ],
    overall_comment: 'チームへの貢献が大きい',
    created_at: '2025-09-15',
    updated_at: '2025-09-24'
  },
  {
    id: 'ev-21',
    user_id: 'u-21',
    evaluator_id: 'u-17',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-9',
        score: 2,
        comment: '意欲的'
      },
      {
        item_id: 'et-10',
        score: 4,
        comment: '期待以上の成果'
      }
    ],
    overall_comment: '優れた成果を発揮',
    created_at: '2025-09-15',
    updated_at: '2025-09-15'
  },
  {
    id: 'ev-22',
    user_id: 'u-22',
    evaluator_id: 'u-17',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-11',
        score: 3,
        comment: '改善が必要'
      },
      {
        item_id: 'et-12',
        score: 4,
        comment: '丁寧な対応'
      }
    ],
    overall_comment: '積極的な姿勢を評価',
    created_at: '2025-09-15',
    updated_at: '2025-09-16'
  },
  {
    id: 'ev-23',
    user_id: 'u-23',
    evaluator_id: 'u-17',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-4',
        score: 5,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-5',
        score: 5,
        comment: '丁寧な対応'
      },
      {
        item_id: 'et-6',
        score: 2,
        comment: '安定感がある'
      }
    ],
    overall_comment: 'チームへの貢献が大きい',
    created_at: '2025-09-15',
    updated_at: '2025-09-17'
  },
  {
    id: 'ev-24',
    user_id: 'u-24',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-1',
        score: 5,
        comment: '改善が必要'
      },
      {
        item_id: 'et-2',
        score: 5,
        comment: '意欲的'
      },
      {
        item_id: 'et-3',
        score: 2,
        comment: '安定感がある'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-18'
  },
  {
    id: 'ev-25',
    user_id: 'u-25',
    evaluator_id: 'u-24',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-4',
        score: 4,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-5',
        score: 2,
        comment: '丁寧な対応'
      },
      {
        item_id: 'et-6',
        score: 4,
        comment: '成長が見られる'
      }
    ],
    overall_comment: '積極的な姿勢を評価',
    created_at: '2025-09-15',
    updated_at: '2025-09-19'
  },
  {
    id: 'ev-26',
    user_id: 'u-26',
    evaluator_id: 'u-24',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-11',
        score: 5,
        comment: '高い専門性'
      },
      {
        item_id: 'et-12',
        score: 2,
        comment: '標準的'
      }
    ],
    overall_comment: '改善の余地あり',
    created_at: '2025-09-15',
    updated_at: '2025-09-20'
  },
  {
    id: 'ev-27',
    user_id: 'u-27',
    evaluator_id: 'u-24',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-1',
        score: 3,
        comment: '標準的'
      },
      {
        item_id: 'et-2',
        score: 3,
        comment: '意欲的'
      },
      {
        item_id: 'et-3',
        score: 2,
        comment: '安定感がある'
      }
    ],
    overall_comment: '安定したパフォーマンス',
    created_at: '2025-09-15',
    updated_at: '2025-09-21'
  },
  {
    id: 'ev-28',
    user_id: 'u-28',
    evaluator_id: 'u-24',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-4',
        score: 3,
        comment: '丁寧な対応'
      },
      {
        item_id: 'et-5',
        score: 4,
        comment: '丁寧な対応'
      },
      {
        item_id: 'et-6',
        score: 2,
        comment: '改善が必要'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-22'
  },
  {
    id: 'ev-29',
    user_id: 'u-29',
    evaluator_id: 'u-24',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-11',
        score: 5,
        comment: '安定感がある'
      },
      {
        item_id: 'et-12',
        score: 3,
        comment: '安定感がある'
      }
    ],
    overall_comment: '安定したパフォーマンス',
    created_at: '2025-09-15',
    updated_at: '2025-09-23'
  },
  {
    id: 'ev-30',
    user_id: 'u-30',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-1',
        score: 2,
        comment: '改善が必要'
      },
      {
        item_id: 'et-2',
        score: 5,
        comment: '良好'
      },
      {
        item_id: 'et-3',
        score: 3,
        comment: '標準的'
      }
    ],
    overall_comment: '改善の余地あり',
    created_at: '2025-09-15',
    updated_at: '2025-09-24'
  },
  {
    id: 'ev-31',
    user_id: 'u-31',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-4',
        score: 5,
        comment: '意欲的'
      },
      {
        item_id: 'et-5',
        score: 5,
        comment: '意欲的'
      },
      {
        item_id: 'et-6',
        score: 5,
        comment: '期待以上の成果'
      }
    ],
    overall_comment: '非常に良好な取り組み',
    created_at: '2025-09-15',
    updated_at: '2025-09-15'
  },
  {
    id: 'ev-32',
    user_id: 'u-32',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-7',
        score: 5,
        comment: '期待以上の成果'
      },
      {
        item_id: 'et-8',
        score: 2,
        comment: '成長が見られる'
      }
    ],
    overall_comment: '今後の成長に期待',
    created_at: '2025-09-15',
    updated_at: '2025-09-16'
  },
  {
    id: 'ev-33',
    user_id: 'u-33',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-11',
        score: 2,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-12',
        score: 4,
        comment: '非常に優秀'
      }
    ],
    overall_comment: '改善の余地あり',
    created_at: '2025-09-15',
    updated_at: '2025-09-17'
  },
  {
    id: 'ev-34',
    user_id: 'u-34',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-1',
        score: 4,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-2',
        score: 3,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-3',
        score: 3,
        comment: '丁寧な対応'
      }
    ],
    overall_comment: '改善の余地あり',
    created_at: '2025-09-15',
    updated_at: '2025-09-18'
  },
  {
    id: 'ev-35',
    user_id: 'u-35',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-4',
        score: 5,
        comment: '意欲的'
      },
      {
        item_id: 'et-5',
        score: 2,
        comment: '安定感がある'
      },
      {
        item_id: 'et-6',
        score: 5,
        comment: '安定感がある'
      }
    ],
    overall_comment: '非常に良好な取り組み',
    created_at: '2025-09-15',
    updated_at: '2025-09-19'
  },
  {
    id: 'ev-36',
    user_id: 'u-36',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-7',
        score: 2,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-8',
        score: 5,
        comment: '期待以上の成果'
      }
    ],
    overall_comment: '安定したパフォーマンス',
    created_at: '2025-09-15',
    updated_at: '2025-09-20'
  },
  {
    id: 'ev-37',
    user_id: 'u-37',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-11',
        score: 4,
        comment: '高い専門性'
      },
      {
        item_id: 'et-12',
        score: 5,
        comment: '丁寧な対応'
      }
    ],
    overall_comment: '安定したパフォーマンス',
    created_at: '2025-09-15',
    updated_at: '2025-09-21'
  },
  {
    id: 'ev-38',
    user_id: 'u-38',
    evaluator_id: 'u-30',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-1',
        score: 4,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-2',
        score: 5,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-3',
        score: 3,
        comment: '期待以上の成果'
      }
    ],
    overall_comment: '非常に良好な取り組み',
    created_at: '2025-09-15',
    updated_at: '2025-09-22'
  },
  {
    id: 'ev-39',
    user_id: 'u-39',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-4',
        score: 2,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-5',
        score: 3,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-6',
        score: 3,
        comment: '高い専門性'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-23'
  },
  {
    id: 'ev-40',
    user_id: 'u-40',
    evaluator_id: 'u-39',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-9',
        score: 2,
        comment: '成長が見られる'
      },
      {
        item_id: 'et-10',
        score: 2,
        comment: '安定感がある'
      }
    ],
    overall_comment: '優れた成果を発揮',
    created_at: '2025-09-15',
    updated_at: '2025-09-24'
  },
  {
    id: 'ev-41',
    user_id: 'u-41',
    evaluator_id: 'u-39',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-11',
        score: 5,
        comment: '高い専門性'
      },
      {
        item_id: 'et-12',
        score: 4,
        comment: '改善が必要'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-15'
  },
  {
    id: 'ev-42',
    user_id: 'u-42',
    evaluator_id: 'u-39',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-4',
        score: 3,
        comment: '安定感がある'
      },
      {
        item_id: 'et-5',
        score: 4,
        comment: '標準的'
      },
      {
        item_id: 'et-6',
        score: 4,
        comment: '良好'
      }
    ],
    overall_comment: '積極的な姿勢を評価',
    created_at: '2025-09-15',
    updated_at: '2025-09-16'
  },
  {
    id: 'ev-43',
    user_id: 'u-43',
    evaluator_id: 'u-39',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-9',
        score: 2,
        comment: '丁寧な対応'
      },
      {
        item_id: 'et-10',
        score: 5,
        comment: '良好'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-17'
  },
  {
    id: 'ev-44',
    user_id: 'u-44',
    evaluator_id: 'u-39',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-11',
        score: 2,
        comment: '良好'
      },
      {
        item_id: 'et-12',
        score: 4,
        comment: '意欲的'
      }
    ],
    overall_comment: 'コミュニケーション力が高い',
    created_at: '2025-09-15',
    updated_at: '2025-09-18'
  },
  {
    id: 'ev-45',
    user_id: 'u-45',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-1',
        score: 3,
        comment: '意欲的'
      },
      {
        item_id: 'et-2',
        score: 4,
        comment: '標準的'
      },
      {
        item_id: 'et-3',
        score: 5,
        comment: '高い専門性'
      }
    ],
    overall_comment: '非常に良好な取り組み',
    created_at: '2025-09-15',
    updated_at: '2025-09-19'
  },
  {
    id: 'ev-46',
    user_id: 'u-46',
    evaluator_id: 'u-45',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-4',
        score: 4,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-5',
        score: 5,
        comment: '改善が必要'
      },
      {
        item_id: 'et-6',
        score: 2,
        comment: '非常に優秀'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-20'
  },
  {
    id: 'ev-47',
    user_id: 'u-47',
    evaluator_id: 'u-45',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-11',
        score: 5,
        comment: '改善が必要'
      },
      {
        item_id: 'et-12',
        score: 4,
        comment: '良好'
      }
    ],
    overall_comment: '今後の成長に期待',
    created_at: '2025-09-15',
    updated_at: '2025-09-21'
  },
  {
    id: 'ev-48',
    user_id: 'u-48',
    evaluator_id: 'u-45',
    period: '2025年度 上期',
    status: 'draft',
    scores: [
      {
        item_id: 'et-1',
        score: 2,
        comment: '非常に優秀'
      },
      {
        item_id: 'et-2',
        score: 4,
        comment: '丁寧な対応'
      },
      {
        item_id: 'et-3',
        score: 2,
        comment: '非常に優秀'
      }
    ],
    overall_comment: '積極的な姿勢を評価',
    created_at: '2025-09-15',
    updated_at: '2025-09-22'
  },
  {
    id: 'ev-49',
    user_id: 'u-49',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'approved',
    scores: [
      {
        item_id: 'et-11',
        score: 2,
        comment: '改善が必要'
      },
      {
        item_id: 'et-12',
        score: 2,
        comment: '標準的'
      }
    ],
    overall_comment: '確実な業務遂行力',
    created_at: '2025-09-15',
    updated_at: '2025-09-23'
  },
  {
    id: 'ev-50',
    user_id: 'u-50',
    evaluator_id: 'u-1',
    period: '2025年度 上期',
    status: 'submitted',
    scores: [
      {
        item_id: 'et-11',
        score: 3,
        comment: '改善が必要'
      },
      {
        item_id: 'et-12',
        score: 5,
        comment: '意欲的'
      }
    ],
    overall_comment: 'さらなるスキル向上を期待',
    created_at: '2025-09-15',
    updated_at: '2025-09-24'
  }
];

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'sq-1',
    category: '仕事満足度',
    question: '日々の業務にやりがいを感じていますか？',
    sort_order: 1
  },
  {
    id: 'sq-2',
    category: '仕事満足度',
    question: '自分のスキルが活かせる環境ですか？',
    sort_order: 2
  },
  {
    id: 'sq-3',
    category: '人間関係',
    question: '上司との関係は良好ですか？',
    sort_order: 3
  },
  {
    id: 'sq-4',
    category: '人間関係',
    question: '同僚との協力体制に満足していますか？',
    sort_order: 4
  },
  {
    id: 'sq-5',
    category: '健康状態',
    question: '十分な睡眠を取れていますか？',
    sort_order: 5
  },
  {
    id: 'sq-6',
    category: '健康状態',
    question: '身体的な疲労を感じていませんか？',
    sort_order: 6
  },
  {
    id: 'sq-7',
    category: 'キャリア展望',
    question: '将来のキャリアに希望を持てていますか？',
    sort_order: 7
  },
  {
    id: 'sq-8',
    category: 'キャリア展望',
    question: '成長の機会が十分にありますか？',
    sort_order: 8
  },
  {
    id: 'sq-9',
    category: 'ワークライフバランス',
    question: '仕事と私生活のバランスは取れていますか？',
    sort_order: 9
  },
  {
    id: 'sq-10',
    category: 'ワークライフバランス',
    question: '休暇を十分に取得できていますか？',
    sort_order: 10
  }
];

export const surveyPeriods: SurveyPeriod[] = [
  {
    id: 'sp-1',
    name: '2025年7月サーベイ',
    start_date: '2025-07-01',
    end_date: '2025-07-15',
    status: 'closed'
  },
  {
    id: 'sp-2',
    name: '2025年8月サーベイ',
    start_date: '2025-08-01',
    end_date: '2025-08-15',
    status: 'closed'
  },
  {
    id: 'sp-3',
    name: '2025年9月サーベイ',
    start_date: '2025-09-01',
    end_date: '2025-09-15',
    status: 'closed'
  },
  {
    id: 'sp-4',
    name: '2025年10月サーベイ',
    start_date: '2025-10-01',
    end_date: '2025-10-15',
    status: 'closed'
  },
  {
    id: 'sp-5',
    name: '2025年11月サーベイ',
    start_date: '2025-11-01',
    end_date: '2025-11-15',
    status: 'closed'
  },
  {
    id: 'sp-6',
    name: '2025年12月サーベイ',
    start_date: '2025-12-01',
    end_date: '2025-12-15',
    status: 'active'
  }
];

export const surveys: Survey[] = [
  {
    id: 'sv-1',
    user_id: 'u-1',
    period_id: 'sp-1',
    mental_score: 62,
    motivation_score: 70,
    survey_date: '2025-07-04',
    submitted: true
  },
  {
    id: 'sv-2',
    user_id: 'u-1',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 63,
    survey_date: '2025-08-14',
    submitted: true
  },
  {
    id: 'sv-3',
    user_id: 'u-1',
    period_id: 'sp-3',
    mental_score: 57,
    motivation_score: 63,
    survey_date: '2025-09-12',
    submitted: true
  },
  {
    id: 'sv-4',
    user_id: 'u-1',
    period_id: 'sp-4',
    mental_score: 57,
    motivation_score: 69,
    survey_date: '2025-10-03',
    submitted: true
  },
  {
    id: 'sv-5',
    user_id: 'u-1',
    period_id: 'sp-5',
    mental_score: 57,
    motivation_score: 61,
    survey_date: '2025-11-14',
    submitted: true
  },
  {
    id: 'sv-6',
    user_id: 'u-1',
    period_id: 'sp-6',
    mental_score: 65,
    motivation_score: 69,
    survey_date: '2025-12-04',
    submitted: true
  },
  {
    id: 'sv-7',
    user_id: 'u-2',
    period_id: 'sp-1',
    mental_score: 60,
    motivation_score: 89,
    survey_date: '2025-07-13',
    submitted: true
  },
  {
    id: 'sv-8',
    user_id: 'u-2',
    period_id: 'sp-2',
    mental_score: 59,
    motivation_score: 89,
    survey_date: '2025-08-10',
    submitted: true
  },
  {
    id: 'sv-9',
    user_id: 'u-2',
    period_id: 'sp-3',
    mental_score: 59,
    motivation_score: 87,
    survey_date: '2025-09-10',
    submitted: true
  },
  {
    id: 'sv-10',
    user_id: 'u-2',
    period_id: 'sp-4',
    mental_score: 58,
    motivation_score: 92,
    survey_date: '2025-10-13',
    submitted: true
  },
  {
    id: 'sv-11',
    user_id: 'u-2',
    period_id: 'sp-5',
    mental_score: 65,
    motivation_score: 92,
    survey_date: '2025-11-12',
    submitted: true
  },
  {
    id: 'sv-12',
    user_id: 'u-2',
    period_id: 'sp-6',
    mental_score: 63,
    motivation_score: 89,
    survey_date: '2025-12-12',
    submitted: true
  },
  {
    id: 'sv-13',
    user_id: 'u-3',
    period_id: 'sp-1',
    mental_score: 92,
    motivation_score: 73,
    survey_date: '2025-07-09',
    submitted: true
  },
  {
    id: 'sv-14',
    user_id: 'u-3',
    period_id: 'sp-2',
    mental_score: 82,
    motivation_score: 63,
    survey_date: '2025-08-06',
    submitted: true
  },
  {
    id: 'sv-15',
    user_id: 'u-3',
    period_id: 'sp-3',
    mental_score: 78,
    motivation_score: 57,
    survey_date: '2025-09-13',
    submitted: true
  },
  {
    id: 'sv-16',
    user_id: 'u-3',
    period_id: 'sp-4',
    mental_score: 74,
    motivation_score: 52,
    survey_date: '2025-10-04',
    submitted: true
  },
  {
    id: 'sv-17',
    user_id: 'u-3',
    period_id: 'sp-5',
    mental_score: 56,
    motivation_score: 53,
    survey_date: '2025-11-07',
    submitted: true
  },
  {
    id: 'sv-18',
    user_id: 'u-3',
    period_id: 'sp-6',
    mental_score: 62,
    motivation_score: 28,
    survey_date: '2025-12-06',
    submitted: true
  },
  {
    id: 'sv-19',
    user_id: 'u-4',
    period_id: 'sp-1',
    mental_score: 71,
    motivation_score: 86,
    survey_date: '2025-07-07',
    submitted: true
  },
  {
    id: 'sv-20',
    user_id: 'u-4',
    period_id: 'sp-2',
    mental_score: 70,
    motivation_score: 92,
    survey_date: '2025-08-09',
    submitted: true
  },
  {
    id: 'sv-21',
    user_id: 'u-4',
    period_id: 'sp-3',
    mental_score: 77,
    motivation_score: 86,
    survey_date: '2025-09-03',
    submitted: true
  },
  {
    id: 'sv-22',
    user_id: 'u-4',
    period_id: 'sp-4',
    mental_score: 72,
    motivation_score: 89,
    survey_date: '2025-10-13',
    submitted: true
  },
  {
    id: 'sv-23',
    user_id: 'u-4',
    period_id: 'sp-5',
    mental_score: 68,
    motivation_score: 92,
    survey_date: '2025-11-05',
    submitted: true
  },
  {
    id: 'sv-24',
    user_id: 'u-4',
    period_id: 'sp-6',
    mental_score: 77,
    motivation_score: 87,
    survey_date: '2025-12-03',
    submitted: true
  },
  {
    id: 'sv-25',
    user_id: 'u-5',
    period_id: 'sp-1',
    mental_score: 63,
    motivation_score: 60,
    survey_date: '2025-07-13',
    submitted: true
  },
  {
    id: 'sv-26',
    user_id: 'u-5',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 63,
    survey_date: '2025-08-12',
    submitted: true
  },
  {
    id: 'sv-27',
    user_id: 'u-5',
    period_id: 'sp-3',
    mental_score: 69,
    motivation_score: 66,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-28',
    user_id: 'u-5',
    period_id: 'sp-4',
    mental_score: 78,
    motivation_score: 66,
    survey_date: '2025-10-04',
    submitted: true
  },
  {
    id: 'sv-29',
    user_id: 'u-5',
    period_id: 'sp-5',
    mental_score: 79,
    motivation_score: 76,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-30',
    user_id: 'u-5',
    period_id: 'sp-6',
    mental_score: 83,
    motivation_score: 70,
    survey_date: '2025-12-09',
    submitted: true
  },
  {
    id: 'sv-31',
    user_id: 'u-6',
    period_id: 'sp-1',
    mental_score: 70,
    motivation_score: 63,
    survey_date: '2025-07-06',
    submitted: true
  },
  {
    id: 'sv-32',
    user_id: 'u-6',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 53,
    survey_date: '2025-08-10',
    submitted: true
  },
  {
    id: 'sv-33',
    user_id: 'u-6',
    period_id: 'sp-3',
    mental_score: 58,
    motivation_score: 55,
    survey_date: '2025-09-04',
    submitted: true
  },
  {
    id: 'sv-34',
    user_id: 'u-6',
    period_id: 'sp-4',
    mental_score: 37,
    motivation_score: 30,
    survey_date: '2025-10-03',
    submitted: true
  },
  {
    id: 'sv-35',
    user_id: 'u-6',
    period_id: 'sp-5',
    mental_score: 38,
    motivation_score: 39,
    survey_date: '2025-11-12',
    submitted: true
  },
  {
    id: 'sv-36',
    user_id: 'u-6',
    period_id: 'sp-6',
    mental_score: 40,
    motivation_score: 18,
    survey_date: '2025-12-04',
    submitted: true
  },
  {
    id: 'sv-37',
    user_id: 'u-7',
    period_id: 'sp-1',
    mental_score: 74,
    motivation_score: 62,
    survey_date: '2025-07-10',
    submitted: true
  },
  {
    id: 'sv-38',
    user_id: 'u-7',
    period_id: 'sp-2',
    mental_score: 72,
    motivation_score: 58,
    survey_date: '2025-08-03',
    submitted: true
  },
  {
    id: 'sv-39',
    user_id: 'u-7',
    period_id: 'sp-3',
    mental_score: 64,
    motivation_score: 60,
    survey_date: '2025-09-09',
    submitted: true
  },
  {
    id: 'sv-40',
    user_id: 'u-7',
    period_id: 'sp-4',
    mental_score: 65,
    motivation_score: 61,
    survey_date: '2025-10-11',
    submitted: true
  },
  {
    id: 'sv-41',
    user_id: 'u-7',
    period_id: 'sp-5',
    mental_score: 67,
    motivation_score: 55,
    survey_date: '2025-11-11',
    submitted: true
  },
  {
    id: 'sv-42',
    user_id: 'u-7',
    period_id: 'sp-6',
    mental_score: 69,
    motivation_score: 61,
    survey_date: '2025-12-08',
    submitted: true
  },
  {
    id: 'sv-43',
    user_id: 'u-8',
    period_id: 'sp-1',
    mental_score: 71,
    motivation_score: 88,
    survey_date: '2025-07-12',
    submitted: true
  },
  {
    id: 'sv-44',
    user_id: 'u-8',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 88,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-45',
    user_id: 'u-8',
    period_id: 'sp-3',
    mental_score: 69,
    motivation_score: 84,
    survey_date: '2025-09-08',
    submitted: true
  },
  {
    id: 'sv-46',
    user_id: 'u-8',
    period_id: 'sp-4',
    mental_score: 62,
    motivation_score: 82,
    survey_date: '2025-10-14',
    submitted: true
  },
  {
    id: 'sv-47',
    user_id: 'u-8',
    period_id: 'sp-5',
    mental_score: 64,
    motivation_score: 86,
    survey_date: '2025-11-10',
    submitted: true
  },
  {
    id: 'sv-48',
    user_id: 'u-8',
    period_id: 'sp-6',
    mental_score: 70,
    motivation_score: 82,
    survey_date: '2025-12-12',
    submitted: true
  },
  {
    id: 'sv-49',
    user_id: 'u-9',
    period_id: 'sp-1',
    mental_score: 71,
    motivation_score: 71,
    survey_date: '2025-07-03',
    submitted: true
  },
  {
    id: 'sv-50',
    user_id: 'u-9',
    period_id: 'sp-2',
    mental_score: 74,
    motivation_score: 76,
    survey_date: '2025-08-14',
    submitted: true
  },
  {
    id: 'sv-51',
    user_id: 'u-9',
    period_id: 'sp-3',
    mental_score: 79,
    motivation_score: 79,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-52',
    user_id: 'u-9',
    period_id: 'sp-4',
    mental_score: 77,
    motivation_score: 83,
    survey_date: '2025-10-07',
    submitted: true
  },
  {
    id: 'sv-53',
    user_id: 'u-9',
    period_id: 'sp-5',
    mental_score: 83,
    motivation_score: 87,
    survey_date: '2025-11-04',
    submitted: true
  },
  {
    id: 'sv-54',
    user_id: 'u-9',
    period_id: 'sp-6',
    mental_score: 81,
    motivation_score: 86,
    survey_date: '2025-12-07',
    submitted: true
  },
  {
    id: 'sv-55',
    user_id: 'u-10',
    period_id: 'sp-1',
    mental_score: 74,
    motivation_score: 71,
    survey_date: '2025-07-05',
    submitted: true
  },
  {
    id: 'sv-56',
    user_id: 'u-10',
    period_id: 'sp-2',
    mental_score: 77,
    motivation_score: 79,
    survey_date: '2025-08-03',
    submitted: true
  },
  {
    id: 'sv-57',
    user_id: 'u-10',
    period_id: 'sp-3',
    mental_score: 75,
    motivation_score: 78,
    survey_date: '2025-09-06',
    submitted: true
  },
  {
    id: 'sv-58',
    user_id: 'u-10',
    period_id: 'sp-4',
    mental_score: 70,
    motivation_score: 79,
    survey_date: '2025-10-14',
    submitted: true
  },
  {
    id: 'sv-59',
    user_id: 'u-10',
    period_id: 'sp-5',
    mental_score: 74,
    motivation_score: 70,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-60',
    user_id: 'u-10',
    period_id: 'sp-6',
    mental_score: 69,
    motivation_score: 77,
    survey_date: '2025-12-04',
    submitted: true
  },
  {
    id: 'sv-61',
    user_id: 'u-11',
    period_id: 'sp-1',
    mental_score: 70,
    motivation_score: 69,
    survey_date: '2025-07-06',
    submitted: true
  },
  {
    id: 'sv-62',
    user_id: 'u-11',
    period_id: 'sp-2',
    mental_score: 67,
    motivation_score: 67,
    survey_date: '2025-08-03',
    submitted: true
  },
  {
    id: 'sv-63',
    user_id: 'u-11',
    period_id: 'sp-3',
    mental_score: 75,
    motivation_score: 69,
    survey_date: '2025-09-10',
    submitted: true
  },
  {
    id: 'sv-64',
    user_id: 'u-11',
    period_id: 'sp-4',
    mental_score: 67,
    motivation_score: 70,
    survey_date: '2025-10-14',
    submitted: true
  },
  {
    id: 'sv-65',
    user_id: 'u-11',
    period_id: 'sp-5',
    mental_score: 71,
    motivation_score: 68,
    survey_date: '2025-11-04',
    submitted: true
  },
  {
    id: 'sv-66',
    user_id: 'u-11',
    period_id: 'sp-6',
    mental_score: 66,
    motivation_score: 69,
    survey_date: '2025-12-09',
    submitted: true
  },
  {
    id: 'sv-67',
    user_id: 'u-12',
    period_id: 'sp-1',
    mental_score: 81,
    motivation_score: 82,
    survey_date: '2025-07-08',
    submitted: true
  },
  {
    id: 'sv-68',
    user_id: 'u-12',
    period_id: 'sp-2',
    mental_score: 85,
    motivation_score: 84,
    survey_date: '2025-08-07',
    submitted: true
  },
  {
    id: 'sv-69',
    user_id: 'u-12',
    period_id: 'sp-3',
    mental_score: 85,
    motivation_score: 92,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-70',
    user_id: 'u-12',
    period_id: 'sp-4',
    mental_score: 96,
    motivation_score: 88,
    survey_date: '2025-10-14',
    submitted: true
  },
  {
    id: 'sv-71',
    user_id: 'u-12',
    period_id: 'sp-5',
    mental_score: 93,
    motivation_score: 98,
    survey_date: '2025-11-13',
    submitted: true
  },
  {
    id: 'sv-72',
    user_id: 'u-12',
    period_id: 'sp-6',
    mental_score: 98,
    motivation_score: 98,
    survey_date: '2025-12-08',
    submitted: true
  },
  {
    id: 'sv-73',
    user_id: 'u-13',
    period_id: 'sp-1',
    mental_score: 74,
    motivation_score: 55,
    survey_date: '2025-07-07',
    submitted: true
  },
  {
    id: 'sv-74',
    user_id: 'u-13',
    period_id: 'sp-2',
    mental_score: 76,
    motivation_score: 58,
    survey_date: '2025-08-14',
    submitted: true
  },
  {
    id: 'sv-75',
    user_id: 'u-13',
    period_id: 'sp-3',
    mental_score: 68,
    motivation_score: 59,
    survey_date: '2025-09-13',
    submitted: true
  },
  {
    id: 'sv-76',
    user_id: 'u-13',
    period_id: 'sp-4',
    mental_score: 76,
    motivation_score: 60,
    survey_date: '2025-10-11',
    submitted: true
  },
  {
    id: 'sv-77',
    user_id: 'u-13',
    period_id: 'sp-5',
    mental_score: 71,
    motivation_score: 57,
    survey_date: '2025-11-13',
    submitted: true
  },
  {
    id: 'sv-78',
    user_id: 'u-13',
    period_id: 'sp-6',
    mental_score: 67,
    motivation_score: 54,
    survey_date: '2025-12-04',
    submitted: true
  },
  {
    id: 'sv-79',
    user_id: 'u-14',
    period_id: 'sp-1',
    mental_score: 60,
    motivation_score: 90,
    survey_date: '2025-07-07',
    submitted: true
  },
  {
    id: 'sv-80',
    user_id: 'u-14',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 91,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-81',
    user_id: 'u-14',
    period_id: 'sp-3',
    mental_score: 58,
    motivation_score: 85,
    survey_date: '2025-09-12',
    submitted: true
  },
  {
    id: 'sv-82',
    user_id: 'u-14',
    period_id: 'sp-4',
    mental_score: 59,
    motivation_score: 94,
    survey_date: '2025-10-13',
    submitted: true
  },
  {
    id: 'sv-83',
    user_id: 'u-14',
    period_id: 'sp-5',
    mental_score: 59,
    motivation_score: 92,
    survey_date: '2025-11-11',
    submitted: true
  },
  {
    id: 'sv-84',
    user_id: 'u-14',
    period_id: 'sp-6',
    mental_score: 61,
    motivation_score: 85,
    survey_date: '2025-12-07',
    submitted: true
  },
  {
    id: 'sv-85',
    user_id: 'u-15',
    period_id: 'sp-1',
    mental_score: 59,
    motivation_score: 88,
    survey_date: '2025-07-10',
    submitted: true
  },
  {
    id: 'sv-86',
    user_id: 'u-15',
    period_id: 'sp-2',
    mental_score: 59,
    motivation_score: 86,
    survey_date: '2025-08-05',
    submitted: true
  },
  {
    id: 'sv-87',
    user_id: 'u-15',
    period_id: 'sp-3',
    mental_score: 59,
    motivation_score: 83,
    survey_date: '2025-09-13',
    submitted: true
  },
  {
    id: 'sv-88',
    user_id: 'u-15',
    period_id: 'sp-4',
    mental_score: 57,
    motivation_score: 84,
    survey_date: '2025-10-03',
    submitted: true
  },
  {
    id: 'sv-89',
    user_id: 'u-15',
    period_id: 'sp-5',
    mental_score: 66,
    motivation_score: 88,
    survey_date: '2025-11-06',
    submitted: true
  },
  {
    id: 'sv-90',
    user_id: 'u-15',
    period_id: 'sp-6',
    mental_score: 62,
    motivation_score: 82,
    survey_date: '2025-12-13',
    submitted: true
  },
  {
    id: 'sv-91',
    user_id: 'u-16',
    period_id: 'sp-1',
    mental_score: 84,
    motivation_score: 67,
    survey_date: '2025-07-12',
    submitted: true
  },
  {
    id: 'sv-92',
    user_id: 'u-16',
    period_id: 'sp-2',
    mental_score: 79,
    motivation_score: 63,
    survey_date: '2025-08-13',
    submitted: true
  },
  {
    id: 'sv-93',
    user_id: 'u-16',
    period_id: 'sp-3',
    mental_score: 68,
    motivation_score: 49,
    survey_date: '2025-09-12',
    submitted: true
  },
  {
    id: 'sv-94',
    user_id: 'u-16',
    period_id: 'sp-4',
    mental_score: 69,
    motivation_score: 43,
    survey_date: '2025-10-05',
    submitted: true
  },
  {
    id: 'sv-95',
    user_id: 'u-16',
    period_id: 'sp-5',
    mental_score: 60,
    motivation_score: 43,
    survey_date: '2025-11-13',
    submitted: true
  },
  {
    id: 'sv-96',
    user_id: 'u-16',
    period_id: 'sp-6',
    mental_score: 39,
    motivation_score: 32,
    survey_date: '2025-12-05',
    submitted: true
  },
  {
    id: 'sv-97',
    user_id: 'u-17',
    period_id: 'sp-1',
    mental_score: 82,
    motivation_score: 65,
    survey_date: '2025-07-11',
    submitted: true
  },
  {
    id: 'sv-98',
    user_id: 'u-17',
    period_id: 'sp-2',
    mental_score: 86,
    motivation_score: 67,
    survey_date: '2025-08-07',
    submitted: true
  },
  {
    id: 'sv-99',
    user_id: 'u-17',
    period_id: 'sp-3',
    mental_score: 81,
    motivation_score: 59,
    survey_date: '2025-09-13',
    submitted: true
  },
  {
    id: 'sv-100',
    user_id: 'u-17',
    period_id: 'sp-4',
    mental_score: 83,
    motivation_score: 61,
    survey_date: '2025-10-05',
    submitted: true
  },
  {
    id: 'sv-101',
    user_id: 'u-17',
    period_id: 'sp-5',
    mental_score: 79,
    motivation_score: 65,
    survey_date: '2025-11-04',
    submitted: true
  },
  {
    id: 'sv-102',
    user_id: 'u-17',
    period_id: 'sp-6',
    mental_score: 85,
    motivation_score: 60,
    survey_date: '2025-12-11',
    submitted: true
  },
  {
    id: 'sv-103',
    user_id: 'u-18',
    period_id: 'sp-1',
    mental_score: 72,
    motivation_score: 62,
    survey_date: '2025-07-03',
    submitted: true
  },
  {
    id: 'sv-104',
    user_id: 'u-18',
    period_id: 'sp-2',
    mental_score: 72,
    motivation_score: 62,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-105',
    user_id: 'u-18',
    period_id: 'sp-3',
    mental_score: 82,
    motivation_score: 66,
    survey_date: '2025-09-13',
    submitted: true
  },
  {
    id: 'sv-106',
    user_id: 'u-18',
    period_id: 'sp-4',
    mental_score: 76,
    motivation_score: 63,
    survey_date: '2025-10-08',
    submitted: true
  },
  {
    id: 'sv-107',
    user_id: 'u-18',
    period_id: 'sp-5',
    mental_score: 73,
    motivation_score: 61,
    survey_date: '2025-11-12',
    submitted: true
  },
  {
    id: 'sv-108',
    user_id: 'u-18',
    period_id: 'sp-6',
    mental_score: 78,
    motivation_score: 65,
    survey_date: '2025-12-14',
    submitted: true
  },
  {
    id: 'sv-109',
    user_id: 'u-19',
    period_id: 'sp-1',
    mental_score: 72,
    motivation_score: 65,
    survey_date: '2025-07-14',
    submitted: true
  },
  {
    id: 'sv-110',
    user_id: 'u-19',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 67,
    survey_date: '2025-08-06',
    submitted: true
  },
  {
    id: 'sv-111',
    user_id: 'u-19',
    period_id: 'sp-3',
    mental_score: 65,
    motivation_score: 70,
    survey_date: '2025-09-11',
    submitted: true
  },
  {
    id: 'sv-112',
    user_id: 'u-19',
    period_id: 'sp-4',
    mental_score: 65,
    motivation_score: 61,
    survey_date: '2025-10-10',
    submitted: true
  },
  {
    id: 'sv-113',
    user_id: 'u-19',
    period_id: 'sp-5',
    mental_score: 68,
    motivation_score: 69,
    survey_date: '2025-11-06',
    submitted: true
  },
  {
    id: 'sv-114',
    user_id: 'u-19',
    period_id: 'sp-6',
    mental_score: 64,
    motivation_score: 61,
    survey_date: '2025-12-09',
    submitted: true
  },
  {
    id: 'sv-115',
    user_id: 'u-20',
    period_id: 'sp-1',
    mental_score: 85,
    motivation_score: 67,
    survey_date: '2025-07-11',
    submitted: true
  },
  {
    id: 'sv-116',
    user_id: 'u-20',
    period_id: 'sp-2',
    mental_score: 93,
    motivation_score: 65,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-117',
    user_id: 'u-20',
    period_id: 'sp-3',
    mental_score: 91,
    motivation_score: 67,
    survey_date: '2025-09-14',
    submitted: true
  },
  {
    id: 'sv-118',
    user_id: 'u-20',
    period_id: 'sp-4',
    mental_score: 87,
    motivation_score: 62,
    survey_date: '2025-10-13',
    submitted: true
  },
  {
    id: 'sv-119',
    user_id: 'u-20',
    period_id: 'sp-5',
    mental_score: 91,
    motivation_score: 65,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-120',
    user_id: 'u-20',
    period_id: 'sp-6',
    mental_score: 95,
    motivation_score: 63,
    survey_date: '2025-12-09',
    submitted: true
  },
  {
    id: 'sv-121',
    user_id: 'u-21',
    period_id: 'sp-1',
    mental_score: 86,
    motivation_score: 61,
    survey_date: '2025-07-08',
    submitted: true
  },
  {
    id: 'sv-122',
    user_id: 'u-21',
    period_id: 'sp-2',
    mental_score: 95,
    motivation_score: 61,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-123',
    user_id: 'u-21',
    period_id: 'sp-3',
    mental_score: 95,
    motivation_score: 61,
    survey_date: '2025-09-07',
    submitted: true
  },
  {
    id: 'sv-124',
    user_id: 'u-21',
    period_id: 'sp-4',
    mental_score: 90,
    motivation_score: 68,
    survey_date: '2025-10-12',
    submitted: true
  },
  {
    id: 'sv-125',
    user_id: 'u-21',
    period_id: 'sp-5',
    mental_score: 87,
    motivation_score: 61,
    survey_date: '2025-11-04',
    submitted: true
  },
  {
    id: 'sv-126',
    user_id: 'u-21',
    period_id: 'sp-6',
    mental_score: 89,
    motivation_score: 66,
    survey_date: '2025-12-06',
    submitted: true
  },
  {
    id: 'sv-127',
    user_id: 'u-22',
    period_id: 'sp-1',
    mental_score: 71,
    motivation_score: 71,
    survey_date: '2025-07-14',
    submitted: true
  },
  {
    id: 'sv-128',
    user_id: 'u-22',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 67,
    survey_date: '2025-08-13',
    submitted: true
  },
  {
    id: 'sv-129',
    user_id: 'u-22',
    period_id: 'sp-3',
    mental_score: 49,
    motivation_score: 49,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-130',
    user_id: 'u-22',
    period_id: 'sp-4',
    mental_score: 56,
    motivation_score: 47,
    survey_date: '2025-10-07',
    submitted: true
  },
  {
    id: 'sv-131',
    user_id: 'u-22',
    period_id: 'sp-5',
    mental_score: 51,
    motivation_score: 43,
    survey_date: '2025-11-06',
    submitted: true
  },
  {
    id: 'sv-132',
    user_id: 'u-22',
    period_id: 'sp-6',
    mental_score: 21,
    motivation_score: 18,
    survey_date: '2025-12-05',
    submitted: true
  },
  {
    id: 'sv-133',
    user_id: 'u-23',
    period_id: 'sp-1',
    mental_score: 88,
    motivation_score: 79,
    survey_date: '2025-07-04',
    submitted: true
  },
  {
    id: 'sv-134',
    user_id: 'u-23',
    period_id: 'sp-2',
    mental_score: 88,
    motivation_score: 77,
    survey_date: '2025-08-12',
    submitted: true
  },
  {
    id: 'sv-135',
    user_id: 'u-23',
    period_id: 'sp-3',
    mental_score: 84,
    motivation_score: 73,
    survey_date: '2025-09-07',
    submitted: true
  },
  {
    id: 'sv-136',
    user_id: 'u-23',
    period_id: 'sp-4',
    mental_score: 80,
    motivation_score: 79,
    survey_date: '2025-10-05',
    submitted: true
  },
  {
    id: 'sv-137',
    user_id: 'u-23',
    period_id: 'sp-5',
    mental_score: 89,
    motivation_score: 77,
    survey_date: '2025-11-07',
    submitted: true
  },
  {
    id: 'sv-138',
    user_id: 'u-23',
    period_id: 'sp-6',
    mental_score: 83,
    motivation_score: 74,
    survey_date: '2025-12-10',
    submitted: true
  },
  {
    id: 'sv-139',
    user_id: 'u-24',
    period_id: 'sp-1',
    mental_score: 90,
    motivation_score: 62,
    survey_date: '2025-07-13',
    submitted: true
  },
  {
    id: 'sv-140',
    user_id: 'u-24',
    period_id: 'sp-2',
    mental_score: 87,
    motivation_score: 58,
    survey_date: '2025-08-06',
    submitted: true
  },
  {
    id: 'sv-141',
    user_id: 'u-24',
    period_id: 'sp-3',
    mental_score: 88,
    motivation_score: 56,
    survey_date: '2025-09-12',
    submitted: true
  },
  {
    id: 'sv-142',
    user_id: 'u-24',
    period_id: 'sp-4',
    mental_score: 84,
    motivation_score: 60,
    survey_date: '2025-10-14',
    submitted: true
  },
  {
    id: 'sv-143',
    user_id: 'u-24',
    period_id: 'sp-5',
    mental_score: 93,
    motivation_score: 56,
    survey_date: '2025-11-07',
    submitted: true
  },
  {
    id: 'sv-144',
    user_id: 'u-24',
    period_id: 'sp-6',
    mental_score: 88,
    motivation_score: 57,
    survey_date: '2025-12-13',
    submitted: true
  },
  {
    id: 'sv-145',
    user_id: 'u-25',
    period_id: 'sp-1',
    mental_score: 89,
    motivation_score: 63,
    survey_date: '2025-07-08',
    submitted: true
  },
  {
    id: 'sv-146',
    user_id: 'u-25',
    period_id: 'sp-2',
    mental_score: 93,
    motivation_score: 67,
    survey_date: '2025-08-04',
    submitted: true
  },
  {
    id: 'sv-147',
    user_id: 'u-25',
    period_id: 'sp-3',
    mental_score: 95,
    motivation_score: 73,
    survey_date: '2025-09-04',
    submitted: true
  },
  {
    id: 'sv-148',
    user_id: 'u-25',
    period_id: 'sp-4',
    mental_score: 95,
    motivation_score: 69,
    survey_date: '2025-10-06',
    submitted: true
  },
  {
    id: 'sv-149',
    user_id: 'u-25',
    period_id: 'sp-5',
    mental_score: 98,
    motivation_score: 75,
    survey_date: '2025-11-04',
    submitted: true
  },
  {
    id: 'sv-150',
    user_id: 'u-25',
    period_id: 'sp-6',
    mental_score: 98,
    motivation_score: 88,
    survey_date: '2025-12-14',
    submitted: true
  },
  {
    id: 'sv-151',
    user_id: 'u-26',
    period_id: 'sp-1',
    mental_score: 72,
    motivation_score: 72,
    survey_date: '2025-07-04',
    submitted: true
  },
  {
    id: 'sv-152',
    user_id: 'u-26',
    period_id: 'sp-2',
    mental_score: 72,
    motivation_score: 64,
    survey_date: '2025-08-07',
    submitted: true
  },
  {
    id: 'sv-153',
    user_id: 'u-26',
    period_id: 'sp-3',
    mental_score: 75,
    motivation_score: 63,
    survey_date: '2025-09-11',
    submitted: true
  },
  {
    id: 'sv-154',
    user_id: 'u-26',
    period_id: 'sp-4',
    mental_score: 76,
    motivation_score: 63,
    survey_date: '2025-10-05',
    submitted: true
  },
  {
    id: 'sv-155',
    user_id: 'u-26',
    period_id: 'sp-5',
    mental_score: 77,
    motivation_score: 70,
    survey_date: '2025-11-06',
    submitted: true
  },
  {
    id: 'sv-156',
    user_id: 'u-26',
    period_id: 'sp-6',
    mental_score: 74,
    motivation_score: 69,
    survey_date: '2025-12-14',
    submitted: true
  },
  {
    id: 'sv-157',
    user_id: 'u-27',
    period_id: 'sp-1',
    mental_score: 76,
    motivation_score: 72,
    survey_date: '2025-07-07',
    submitted: true
  },
  {
    id: 'sv-158',
    user_id: 'u-27',
    period_id: 'sp-2',
    mental_score: 73,
    motivation_score: 71,
    survey_date: '2025-08-06',
    submitted: true
  },
  {
    id: 'sv-159',
    user_id: 'u-27',
    period_id: 'sp-3',
    mental_score: 77,
    motivation_score: 68,
    survey_date: '2025-09-08',
    submitted: true
  },
  {
    id: 'sv-160',
    user_id: 'u-27',
    period_id: 'sp-4',
    mental_score: 70,
    motivation_score: 65,
    survey_date: '2025-10-13',
    submitted: true
  },
  {
    id: 'sv-161',
    user_id: 'u-27',
    period_id: 'sp-5',
    mental_score: 73,
    motivation_score: 65,
    survey_date: '2025-11-12',
    submitted: true
  },
  {
    id: 'sv-162',
    user_id: 'u-27',
    period_id: 'sp-6',
    mental_score: 76,
    motivation_score: 73,
    survey_date: '2025-12-11',
    submitted: true
  },
  {
    id: 'sv-163',
    user_id: 'u-28',
    period_id: 'sp-1',
    mental_score: 68,
    motivation_score: 64,
    survey_date: '2025-07-07',
    submitted: true
  },
  {
    id: 'sv-164',
    user_id: 'u-28',
    period_id: 'sp-2',
    mental_score: 62,
    motivation_score: 67,
    survey_date: '2025-08-14',
    submitted: true
  },
  {
    id: 'sv-165',
    user_id: 'u-28',
    period_id: 'sp-3',
    mental_score: 67,
    motivation_score: 59,
    survey_date: '2025-09-14',
    submitted: true
  },
  {
    id: 'sv-166',
    user_id: 'u-28',
    period_id: 'sp-4',
    mental_score: 67,
    motivation_score: 63,
    survey_date: '2025-10-03',
    submitted: true
  },
  {
    id: 'sv-167',
    user_id: 'u-28',
    period_id: 'sp-5',
    mental_score: 67,
    motivation_score: 62,
    survey_date: '2025-11-07',
    submitted: true
  },
  {
    id: 'sv-168',
    user_id: 'u-28',
    period_id: 'sp-6',
    mental_score: 60,
    motivation_score: 63,
    survey_date: '2025-12-12',
    submitted: true
  },
  {
    id: 'sv-169',
    user_id: 'u-29',
    period_id: 'sp-1',
    mental_score: 93,
    motivation_score: 67,
    survey_date: '2025-07-13',
    submitted: true
  },
  {
    id: 'sv-170',
    user_id: 'u-29',
    period_id: 'sp-2',
    mental_score: 96,
    motivation_score: 63,
    survey_date: '2025-08-12',
    submitted: true
  },
  {
    id: 'sv-171',
    user_id: 'u-29',
    period_id: 'sp-3',
    mental_score: 92,
    motivation_score: 67,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-172',
    user_id: 'u-29',
    period_id: 'sp-4',
    mental_score: 95,
    motivation_score: 67,
    survey_date: '2025-10-04',
    submitted: true
  },
  {
    id: 'sv-173',
    user_id: 'u-29',
    period_id: 'sp-5',
    mental_score: 94,
    motivation_score: 65,
    survey_date: '2025-11-05',
    submitted: true
  },
  {
    id: 'sv-174',
    user_id: 'u-29',
    period_id: 'sp-6',
    mental_score: 96,
    motivation_score: 72,
    survey_date: '2025-12-13',
    submitted: true
  },
  {
    id: 'sv-175',
    user_id: 'u-30',
    period_id: 'sp-1',
    mental_score: 87,
    motivation_score: 83,
    survey_date: '2025-07-07',
    submitted: true
  },
  {
    id: 'sv-176',
    user_id: 'u-30',
    period_id: 'sp-2',
    mental_score: 81,
    motivation_score: 77,
    survey_date: '2025-08-08',
    submitted: true
  },
  {
    id: 'sv-177',
    user_id: 'u-30',
    period_id: 'sp-3',
    mental_score: 69,
    motivation_score: 69,
    survey_date: '2025-09-09',
    submitted: true
  },
  {
    id: 'sv-178',
    user_id: 'u-30',
    period_id: 'sp-4',
    mental_score: 63,
    motivation_score: 59,
    survey_date: '2025-10-12',
    submitted: true
  },
  {
    id: 'sv-179',
    user_id: 'u-30',
    period_id: 'sp-5',
    mental_score: 67,
    motivation_score: 47,
    survey_date: '2025-11-12',
    submitted: true
  },
  {
    id: 'sv-180',
    user_id: 'u-30',
    period_id: 'sp-6',
    mental_score: 57,
    motivation_score: 33,
    survey_date: '2025-12-09',
    submitted: true
  },
  {
    id: 'sv-181',
    user_id: 'u-31',
    period_id: 'sp-1',
    mental_score: 73,
    motivation_score: 65,
    survey_date: '2025-07-09',
    submitted: true
  },
  {
    id: 'sv-182',
    user_id: 'u-31',
    period_id: 'sp-2',
    mental_score: 69,
    motivation_score: 73,
    survey_date: '2025-08-13',
    submitted: true
  },
  {
    id: 'sv-183',
    user_id: 'u-31',
    period_id: 'sp-3',
    mental_score: 74,
    motivation_score: 73,
    survey_date: '2025-09-06',
    submitted: true
  },
  {
    id: 'sv-184',
    user_id: 'u-31',
    period_id: 'sp-4',
    mental_score: 71,
    motivation_score: 73,
    survey_date: '2025-10-03',
    submitted: true
  },
  {
    id: 'sv-185',
    user_id: 'u-31',
    period_id: 'sp-5',
    mental_score: 67,
    motivation_score: 71,
    survey_date: '2025-11-09',
    submitted: true
  },
  {
    id: 'sv-186',
    user_id: 'u-31',
    period_id: 'sp-6',
    mental_score: 72,
    motivation_score: 69,
    survey_date: '2025-12-14',
    submitted: true
  },
  {
    id: 'sv-187',
    user_id: 'u-32',
    period_id: 'sp-1',
    mental_score: 65,
    motivation_score: 81,
    survey_date: '2025-07-06',
    submitted: true
  },
  {
    id: 'sv-188',
    user_id: 'u-32',
    period_id: 'sp-2',
    mental_score: 62,
    motivation_score: 80,
    survey_date: '2025-08-14',
    submitted: true
  },
  {
    id: 'sv-189',
    user_id: 'u-32',
    period_id: 'sp-3',
    mental_score: 61,
    motivation_score: 79,
    survey_date: '2025-09-06',
    submitted: true
  },
  {
    id: 'sv-190',
    user_id: 'u-32',
    period_id: 'sp-4',
    mental_score: 63,
    motivation_score: 79,
    survey_date: '2025-10-06',
    submitted: true
  },
  {
    id: 'sv-191',
    user_id: 'u-32',
    period_id: 'sp-5',
    mental_score: 61,
    motivation_score: 77,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-192',
    user_id: 'u-32',
    period_id: 'sp-6',
    mental_score: 57,
    motivation_score: 79,
    survey_date: '2025-12-04',
    submitted: true
  },
  {
    id: 'sv-193',
    user_id: 'u-33',
    period_id: 'sp-1',
    mental_score: 70,
    motivation_score: 80,
    survey_date: '2025-07-04',
    submitted: true
  },
  {
    id: 'sv-194',
    user_id: 'u-33',
    period_id: 'sp-2',
    mental_score: 69,
    motivation_score: 83,
    survey_date: '2025-08-05',
    submitted: true
  },
  {
    id: 'sv-195',
    user_id: 'u-33',
    period_id: 'sp-3',
    mental_score: 67,
    motivation_score: 79,
    survey_date: '2025-09-04',
    submitted: true
  },
  {
    id: 'sv-196',
    user_id: 'u-33',
    period_id: 'sp-4',
    mental_score: 72,
    motivation_score: 81,
    survey_date: '2025-10-08',
    submitted: true
  },
  {
    id: 'sv-197',
    user_id: 'u-33',
    period_id: 'sp-5',
    mental_score: 62,
    motivation_score: 86,
    survey_date: '2025-11-14',
    submitted: true
  },
  {
    id: 'sv-198',
    user_id: 'u-33',
    period_id: 'sp-6',
    mental_score: 68,
    motivation_score: 79,
    survey_date: '2025-12-07',
    submitted: true
  },
  {
    id: 'sv-199',
    user_id: 'u-34',
    period_id: 'sp-1',
    mental_score: 87,
    motivation_score: 83,
    survey_date: '2025-07-04',
    submitted: true
  },
  {
    id: 'sv-200',
    user_id: 'u-34',
    period_id: 'sp-2',
    mental_score: 90,
    motivation_score: 80,
    survey_date: '2025-08-08',
    submitted: true
  },
  {
    id: 'sv-201',
    user_id: 'u-34',
    period_id: 'sp-3',
    mental_score: 92,
    motivation_score: 85,
    survey_date: '2025-09-07',
    submitted: true
  },
  {
    id: 'sv-202',
    user_id: 'u-34',
    period_id: 'sp-4',
    mental_score: 87,
    motivation_score: 89,
    survey_date: '2025-10-04',
    submitted: true
  },
  {
    id: 'sv-203',
    user_id: 'u-34',
    period_id: 'sp-5',
    mental_score: 88,
    motivation_score: 89,
    survey_date: '2025-11-09',
    submitted: true
  },
  {
    id: 'sv-204',
    user_id: 'u-34',
    period_id: 'sp-6',
    mental_score: 94,
    motivation_score: 89,
    survey_date: '2025-12-14',
    submitted: true
  },
  {
    id: 'sv-205',
    user_id: 'u-35',
    period_id: 'sp-1',
    mental_score: 69,
    motivation_score: 86,
    survey_date: '2025-07-07',
    submitted: true
  },
  {
    id: 'sv-206',
    user_id: 'u-35',
    period_id: 'sp-2',
    mental_score: 71,
    motivation_score: 90,
    survey_date: '2025-08-09',
    submitted: true
  },
  {
    id: 'sv-207',
    user_id: 'u-35',
    period_id: 'sp-3',
    mental_score: 72,
    motivation_score: 86,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-208',
    user_id: 'u-35',
    period_id: 'sp-4',
    mental_score: 68,
    motivation_score: 87,
    survey_date: '2025-10-13',
    submitted: true
  },
  {
    id: 'sv-209',
    user_id: 'u-35',
    period_id: 'sp-5',
    mental_score: 70,
    motivation_score: 95,
    survey_date: '2025-11-09',
    submitted: true
  },
  {
    id: 'sv-210',
    user_id: 'u-35',
    period_id: 'sp-6',
    mental_score: 76,
    motivation_score: 93,
    survey_date: '2025-12-07',
    submitted: true
  },
  {
    id: 'sv-211',
    user_id: 'u-36',
    period_id: 'sp-1',
    mental_score: 70,
    motivation_score: 63,
    survey_date: '2025-07-13',
    submitted: true
  },
  {
    id: 'sv-212',
    user_id: 'u-36',
    period_id: 'sp-2',
    mental_score: 70,
    motivation_score: 62,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-213',
    user_id: 'u-36',
    period_id: 'sp-3',
    mental_score: 67,
    motivation_score: 66,
    survey_date: '2025-09-13',
    submitted: true
  },
  {
    id: 'sv-214',
    user_id: 'u-36',
    period_id: 'sp-4',
    mental_score: 69,
    motivation_score: 66,
    survey_date: '2025-10-11',
    submitted: true
  },
  {
    id: 'sv-215',
    user_id: 'u-36',
    period_id: 'sp-5',
    mental_score: 65,
    motivation_score: 63,
    survey_date: '2025-11-12',
    submitted: true
  },
  {
    id: 'sv-216',
    user_id: 'u-36',
    period_id: 'sp-6',
    mental_score: 62,
    motivation_score: 67,
    survey_date: '2025-12-08',
    submitted: true
  },
  {
    id: 'sv-217',
    user_id: 'u-37',
    period_id: 'sp-1',
    mental_score: 58,
    motivation_score: 63,
    survey_date: '2025-07-12',
    submitted: true
  },
  {
    id: 'sv-218',
    user_id: 'u-37',
    period_id: 'sp-2',
    mental_score: 63,
    motivation_score: 62,
    survey_date: '2025-08-09',
    submitted: true
  },
  {
    id: 'sv-219',
    user_id: 'u-37',
    period_id: 'sp-3',
    mental_score: 59,
    motivation_score: 59,
    survey_date: '2025-09-07',
    submitted: true
  },
  {
    id: 'sv-220',
    user_id: 'u-37',
    period_id: 'sp-4',
    mental_score: 58,
    motivation_score: 59,
    survey_date: '2025-10-03',
    submitted: true
  },
  {
    id: 'sv-221',
    user_id: 'u-37',
    period_id: 'sp-5',
    mental_score: 65,
    motivation_score: 63,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-222',
    user_id: 'u-37',
    period_id: 'sp-6',
    mental_score: 66,
    motivation_score: 61,
    survey_date: '2025-12-05',
    submitted: true
  },
  {
    id: 'sv-223',
    user_id: 'u-38',
    period_id: 'sp-1',
    mental_score: 88,
    motivation_score: 88,
    survey_date: '2025-07-04',
    submitted: true
  },
  {
    id: 'sv-224',
    user_id: 'u-38',
    period_id: 'sp-2',
    mental_score: 83,
    motivation_score: 78,
    survey_date: '2025-08-09',
    submitted: true
  },
  {
    id: 'sv-225',
    user_id: 'u-38',
    period_id: 'sp-3',
    mental_score: 74,
    motivation_score: 70,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-226',
    user_id: 'u-38',
    period_id: 'sp-4',
    mental_score: 64,
    motivation_score: 76,
    survey_date: '2025-10-06',
    submitted: true
  },
  {
    id: 'sv-227',
    user_id: 'u-38',
    period_id: 'sp-5',
    mental_score: 44,
    motivation_score: 48,
    survey_date: '2025-11-12',
    submitted: true
  },
  {
    id: 'sv-228',
    user_id: 'u-38',
    period_id: 'sp-6',
    mental_score: 63,
    motivation_score: 58,
    survey_date: '2025-12-06',
    submitted: true
  },
  {
    id: 'sv-229',
    user_id: 'u-39',
    period_id: 'sp-1',
    mental_score: 87,
    motivation_score: 55,
    survey_date: '2025-07-08',
    submitted: true
  },
  {
    id: 'sv-230',
    user_id: 'u-39',
    period_id: 'sp-2',
    mental_score: 83,
    motivation_score: 61,
    survey_date: '2025-08-07',
    submitted: true
  },
  {
    id: 'sv-231',
    user_id: 'u-39',
    period_id: 'sp-3',
    mental_score: 78,
    motivation_score: 62,
    survey_date: '2025-09-13',
    submitted: true
  },
  {
    id: 'sv-232',
    user_id: 'u-39',
    period_id: 'sp-4',
    mental_score: 88,
    motivation_score: 60,
    survey_date: '2025-10-06',
    submitted: true
  },
  {
    id: 'sv-233',
    user_id: 'u-39',
    period_id: 'sp-5',
    mental_score: 81,
    motivation_score: 61,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-234',
    user_id: 'u-39',
    period_id: 'sp-6',
    mental_score: 78,
    motivation_score: 64,
    survey_date: '2025-12-03',
    submitted: true
  },
  {
    id: 'sv-235',
    user_id: 'u-40',
    period_id: 'sp-1',
    mental_score: 68,
    motivation_score: 70,
    survey_date: '2025-07-03',
    submitted: true
  },
  {
    id: 'sv-236',
    user_id: 'u-40',
    period_id: 'sp-2',
    mental_score: 71,
    motivation_score: 75,
    survey_date: '2025-08-12',
    submitted: true
  },
  {
    id: 'sv-237',
    user_id: 'u-40',
    period_id: 'sp-3',
    mental_score: 76,
    motivation_score: 76,
    survey_date: '2025-09-03',
    submitted: true
  },
  {
    id: 'sv-238',
    user_id: 'u-40',
    period_id: 'sp-4',
    mental_score: 74,
    motivation_score: 82,
    survey_date: '2025-10-10',
    submitted: true
  },
  {
    id: 'sv-239',
    user_id: 'u-40',
    period_id: 'sp-5',
    mental_score: 80,
    motivation_score: 86,
    survey_date: '2025-11-14',
    submitted: true
  },
  {
    id: 'sv-240',
    user_id: 'u-40',
    period_id: 'sp-6',
    mental_score: 88,
    motivation_score: 90,
    survey_date: '2025-12-03',
    submitted: true
  },
  {
    id: 'sv-241',
    user_id: 'u-41',
    period_id: 'sp-1',
    mental_score: 70,
    motivation_score: 61,
    survey_date: '2025-07-05',
    submitted: true
  },
  {
    id: 'sv-242',
    user_id: 'u-41',
    period_id: 'sp-2',
    mental_score: 69,
    motivation_score: 57,
    survey_date: '2025-08-07',
    submitted: true
  },
  {
    id: 'sv-243',
    user_id: 'u-41',
    period_id: 'sp-3',
    mental_score: 63,
    motivation_score: 57,
    survey_date: '2025-09-05',
    submitted: true
  },
  {
    id: 'sv-244',
    user_id: 'u-41',
    period_id: 'sp-4',
    mental_score: 62,
    motivation_score: 56,
    survey_date: '2025-10-05',
    submitted: true
  },
  {
    id: 'sv-245',
    user_id: 'u-41',
    period_id: 'sp-5',
    mental_score: 62,
    motivation_score: 57,
    survey_date: '2025-11-08',
    submitted: true
  },
  {
    id: 'sv-246',
    user_id: 'u-41',
    period_id: 'sp-6',
    mental_score: 65,
    motivation_score: 57,
    survey_date: '2025-12-03',
    submitted: true
  },
  {
    id: 'sv-247',
    user_id: 'u-42',
    period_id: 'sp-1',
    mental_score: 88,
    motivation_score: 74,
    survey_date: '2025-07-11',
    submitted: true
  },
  {
    id: 'sv-248',
    user_id: 'u-42',
    period_id: 'sp-2',
    mental_score: 83,
    motivation_score: 70,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-249',
    user_id: 'u-42',
    period_id: 'sp-3',
    mental_score: 78,
    motivation_score: 69,
    survey_date: '2025-09-09',
    submitted: true
  },
  {
    id: 'sv-250',
    user_id: 'u-42',
    period_id: 'sp-4',
    mental_score: 82,
    motivation_score: 74,
    survey_date: '2025-10-12',
    submitted: true
  },
  {
    id: 'sv-251',
    user_id: 'u-42',
    period_id: 'sp-5',
    mental_score: 82,
    motivation_score: 73,
    survey_date: '2025-11-10',
    submitted: true
  },
  {
    id: 'sv-252',
    user_id: 'u-42',
    period_id: 'sp-6',
    mental_score: 83,
    motivation_score: 73,
    survey_date: '2025-12-03',
    submitted: true
  },
  {
    id: 'sv-253',
    user_id: 'u-43',
    period_id: 'sp-1',
    mental_score: 80,
    motivation_score: 84,
    survey_date: '2025-07-08',
    submitted: true
  },
  {
    id: 'sv-254',
    user_id: 'u-43',
    period_id: 'sp-2',
    mental_score: 84,
    motivation_score: 89,
    survey_date: '2025-08-07',
    submitted: true
  },
  {
    id: 'sv-255',
    user_id: 'u-43',
    period_id: 'sp-3',
    mental_score: 85,
    motivation_score: 83,
    survey_date: '2025-09-03',
    submitted: true
  },
  {
    id: 'sv-256',
    user_id: 'u-43',
    period_id: 'sp-4',
    mental_score: 89,
    motivation_score: 81,
    survey_date: '2025-10-04',
    submitted: true
  },
  {
    id: 'sv-257',
    user_id: 'u-43',
    period_id: 'sp-5',
    mental_score: 82,
    motivation_score: 88,
    survey_date: '2025-11-13',
    submitted: true
  },
  {
    id: 'sv-258',
    user_id: 'u-43',
    period_id: 'sp-6',
    mental_score: 79,
    motivation_score: 88,
    survey_date: '2025-12-14',
    submitted: true
  },
  {
    id: 'sv-259',
    user_id: 'u-44',
    period_id: 'sp-1',
    mental_score: 61,
    motivation_score: 66,
    survey_date: '2025-07-05',
    submitted: true
  },
  {
    id: 'sv-260',
    user_id: 'u-44',
    period_id: 'sp-2',
    mental_score: 65,
    motivation_score: 66,
    survey_date: '2025-08-03',
    submitted: true
  },
  {
    id: 'sv-261',
    user_id: 'u-44',
    period_id: 'sp-3',
    mental_score: 62,
    motivation_score: 62,
    survey_date: '2025-09-08',
    submitted: true
  },
  {
    id: 'sv-262',
    user_id: 'u-44',
    period_id: 'sp-4',
    mental_score: 58,
    motivation_score: 66,
    survey_date: '2025-10-10',
    submitted: true
  },
  {
    id: 'sv-263',
    user_id: 'u-44',
    period_id: 'sp-5',
    mental_score: 60,
    motivation_score: 66,
    survey_date: '2025-11-04',
    submitted: true
  },
  {
    id: 'sv-264',
    user_id: 'u-44',
    period_id: 'sp-6',
    mental_score: 64,
    motivation_score: 64,
    survey_date: '2025-12-07',
    submitted: true
  },
  {
    id: 'sv-265',
    user_id: 'u-45',
    period_id: 'sp-1',
    mental_score: 80,
    motivation_score: 80,
    survey_date: '2025-07-05',
    submitted: true
  },
  {
    id: 'sv-266',
    user_id: 'u-45',
    period_id: 'sp-2',
    mental_score: 69,
    motivation_score: 75,
    survey_date: '2025-08-03',
    submitted: true
  },
  {
    id: 'sv-267',
    user_id: 'u-45',
    period_id: 'sp-3',
    mental_score: 58,
    motivation_score: 60,
    survey_date: '2025-09-07',
    submitted: true
  },
  {
    id: 'sv-268',
    user_id: 'u-45',
    period_id: 'sp-4',
    mental_score: 44,
    motivation_score: 68,
    survey_date: '2025-10-05',
    submitted: true
  },
  {
    id: 'sv-269',
    user_id: 'u-45',
    period_id: 'sp-5',
    mental_score: 36,
    motivation_score: 60,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-270',
    user_id: 'u-45',
    period_id: 'sp-6',
    mental_score: 35,
    motivation_score: 30,
    survey_date: '2025-12-07',
    submitted: true
  },
  {
    id: 'sv-271',
    user_id: 'u-46',
    period_id: 'sp-1',
    mental_score: 56,
    motivation_score: 85,
    survey_date: '2025-07-09',
    submitted: true
  },
  {
    id: 'sv-272',
    user_id: 'u-46',
    period_id: 'sp-2',
    mental_score: 56,
    motivation_score: 92,
    survey_date: '2025-08-09',
    submitted: true
  },
  {
    id: 'sv-273',
    user_id: 'u-46',
    period_id: 'sp-3',
    mental_score: 55,
    motivation_score: 94,
    survey_date: '2025-09-07',
    submitted: true
  },
  {
    id: 'sv-274',
    user_id: 'u-46',
    period_id: 'sp-4',
    mental_score: 60,
    motivation_score: 94,
    survey_date: '2025-10-05',
    submitted: true
  },
  {
    id: 'sv-275',
    user_id: 'u-46',
    period_id: 'sp-5',
    mental_score: 58,
    motivation_score: 90,
    survey_date: '2025-11-03',
    submitted: true
  },
  {
    id: 'sv-276',
    user_id: 'u-46',
    period_id: 'sp-6',
    mental_score: 65,
    motivation_score: 94,
    survey_date: '2025-12-14',
    submitted: true
  },
  {
    id: 'sv-277',
    user_id: 'u-47',
    period_id: 'sp-1',
    mental_score: 75,
    motivation_score: 70,
    survey_date: '2025-07-04',
    submitted: true
  },
  {
    id: 'sv-278',
    user_id: 'u-47',
    period_id: 'sp-2',
    mental_score: 71,
    motivation_score: 71,
    survey_date: '2025-08-07',
    submitted: true
  },
  {
    id: 'sv-279',
    user_id: 'u-47',
    period_id: 'sp-3',
    mental_score: 69,
    motivation_score: 75,
    survey_date: '2025-09-09',
    submitted: true
  },
  {
    id: 'sv-280',
    user_id: 'u-47',
    period_id: 'sp-4',
    mental_score: 76,
    motivation_score: 77,
    survey_date: '2025-10-07',
    submitted: true
  },
  {
    id: 'sv-281',
    user_id: 'u-47',
    period_id: 'sp-5',
    mental_score: 76,
    motivation_score: 76,
    survey_date: '2025-11-07',
    submitted: true
  },
  {
    id: 'sv-282',
    user_id: 'u-47',
    period_id: 'sp-6',
    mental_score: 73,
    motivation_score: 72,
    survey_date: '2025-12-04',
    submitted: true
  },
  {
    id: 'sv-283',
    user_id: 'u-48',
    period_id: 'sp-1',
    mental_score: 83,
    motivation_score: 68,
    survey_date: '2025-07-06',
    submitted: true
  },
  {
    id: 'sv-284',
    user_id: 'u-48',
    period_id: 'sp-2',
    mental_score: 83,
    motivation_score: 61,
    survey_date: '2025-08-12',
    submitted: true
  },
  {
    id: 'sv-285',
    user_id: 'u-48',
    period_id: 'sp-3',
    mental_score: 86,
    motivation_score: 60,
    survey_date: '2025-09-09',
    submitted: true
  },
  {
    id: 'sv-286',
    user_id: 'u-48',
    period_id: 'sp-4',
    mental_score: 82,
    motivation_score: 65,
    survey_date: '2025-10-08',
    submitted: true
  },
  {
    id: 'sv-287',
    user_id: 'u-48',
    period_id: 'sp-5',
    mental_score: 80,
    motivation_score: 61,
    survey_date: '2025-11-07',
    submitted: true
  },
  {
    id: 'sv-288',
    user_id: 'u-48',
    period_id: 'sp-6',
    mental_score: 84,
    motivation_score: 65,
    survey_date: '2025-12-05',
    submitted: true
  },
  {
    id: 'sv-289',
    user_id: 'u-49',
    period_id: 'sp-1',
    mental_score: 69,
    motivation_score: 71,
    survey_date: '2025-07-08',
    submitted: true
  },
  {
    id: 'sv-290',
    user_id: 'u-49',
    period_id: 'sp-2',
    mental_score: 70,
    motivation_score: 69,
    survey_date: '2025-08-09',
    submitted: true
  },
  {
    id: 'sv-291',
    user_id: 'u-49',
    period_id: 'sp-3',
    mental_score: 62,
    motivation_score: 76,
    survey_date: '2025-09-04',
    submitted: true
  },
  {
    id: 'sv-292',
    user_id: 'u-49',
    period_id: 'sp-4',
    mental_score: 64,
    motivation_score: 75,
    survey_date: '2025-10-06',
    submitted: true
  },
  {
    id: 'sv-293',
    user_id: 'u-49',
    period_id: 'sp-5',
    mental_score: 63,
    motivation_score: 71,
    survey_date: '2025-11-04',
    submitted: true
  },
  {
    id: 'sv-294',
    user_id: 'u-49',
    period_id: 'sp-6',
    mental_score: 70,
    motivation_score: 70,
    survey_date: '2025-12-05',
    submitted: true
  },
  {
    id: 'sv-295',
    user_id: 'u-50',
    period_id: 'sp-1',
    mental_score: 62,
    motivation_score: 64,
    survey_date: '2025-07-10',
    submitted: true
  },
  {
    id: 'sv-296',
    user_id: 'u-50',
    period_id: 'sp-2',
    mental_score: 57,
    motivation_score: 55,
    survey_date: '2025-08-11',
    submitted: true
  },
  {
    id: 'sv-297',
    user_id: 'u-50',
    period_id: 'sp-3',
    mental_score: 60,
    motivation_score: 56,
    survey_date: '2025-09-11',
    submitted: true
  },
  {
    id: 'sv-298',
    user_id: 'u-50',
    period_id: 'sp-4',
    mental_score: 61,
    motivation_score: 56,
    survey_date: '2025-10-09',
    submitted: true
  },
  {
    id: 'sv-299',
    user_id: 'u-50',
    period_id: 'sp-5',
    mental_score: 60,
    motivation_score: 55,
    survey_date: '2025-11-14',
    submitted: true
  },
  {
    id: 'sv-300',
    user_id: 'u-50',
    period_id: 'sp-6',
    mental_score: 61,
    motivation_score: 60,
    survey_date: '2025-12-06',
    submitted: true
  }
];

export const facilityStaffingTargets: FacilityStaffingTarget[] = [
  {
    id: 'fst-1',
    facility_id: 'fac-1',
    occupation_id: 'occ-1',
    target_count: 4
  },
  {
    id: 'fst-2',
    facility_id: 'fac-1',
    occupation_id: 'occ-2',
    target_count: 6
  },
  {
    id: 'fst-3',
    facility_id: 'fac-1',
    occupation_id: 'occ-3',
    target_count: 3
  },
  {
    id: 'fst-4',
    facility_id: 'fac-2',
    occupation_id: 'occ-1',
    target_count: 2
  },
  {
    id: 'fst-5',
    facility_id: 'fac-2',
    occupation_id: 'occ-2',
    target_count: 3
  },
  {
    id: 'fst-6',
    facility_id: 'fac-3',
    occupation_id: 'occ-2',
    target_count: 4
  },
  {
    id: 'fst-7',
    facility_id: 'fac-3',
    occupation_id: 'occ-4',
    target_count: 5
  },
  {
    id: 'fst-8',
    facility_id: 'fac-4',
    occupation_id: 'occ-1',
    target_count: 2
  },
  {
    id: 'fst-9',
    facility_id: 'fac-4',
    occupation_id: 'occ-2',
    target_count: 3
  },
  {
    id: 'fst-10',
    facility_id: 'fac-5',
    occupation_id: 'occ-1',
    target_count: 4
  },
  {
    id: 'fst-11',
    facility_id: 'fac-5',
    occupation_id: 'occ-2',
    target_count: 6
  },
  {
    id: 'fst-12',
    facility_id: 'fac-5',
    occupation_id: 'occ-3',
    target_count: 3
  },
  {
    id: 'fst-13',
    facility_id: 'fac-6',
    occupation_id: 'occ-2',
    target_count: 4
  },
  {
    id: 'fst-14',
    facility_id: 'fac-6',
    occupation_id: 'occ-4',
    target_count: 5
  },
  {
    id: 'fst-15',
    facility_id: 'fac-7',
    occupation_id: 'occ-1',
    target_count: 2
  },
  {
    id: 'fst-16',
    facility_id: 'fac-7',
    occupation_id: 'occ-2',
    target_count: 3
  }
];
