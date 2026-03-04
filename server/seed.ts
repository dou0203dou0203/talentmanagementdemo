/**
 * Seed script: Inserts initial data from mockData into the SQLite database.
 * Run: npx tsx server/seed.ts
 */
import { getDb, saveDb } from './db.js';

async function seed() {
    console.log('🌱 Seeding database...');
    const db = await getDb();

    // Clear existing data
    const tables = ['surveys', 'evaluations', 'staffing_targets', 'survey_questions', 'survey_periods', 'users', 'occupations', 'facilities'];
    for (const t of tables) {
        db.run(`DELETE FROM ${t}`);
    }

    // ---- Facilities ----
    const facilities = [
        { id: 'f-1', name: '中央総合病院', type: '病院', area: '東京都' },
        { id: 'f-2', name: '北部クリニック', type: 'クリニック', area: '埼玉県' },
        { id: 'f-3', name: '南部リハビリテーション病院', type: '病院', area: '神奈川県' },
        { id: 'f-4', name: '東部介護施設', type: '介護施設', area: '千葉県' },
        { id: 'f-5', name: '西部在宅クリニック', type: 'クリニック', area: '東京都' },
        { id: 'f-6', name: '統括本部', type: '本部', area: '東京都' },
    ];
    for (const f of facilities) {
        db.run('INSERT INTO facilities (id, name, type, area) VALUES (?, ?, ?, ?)',
            [f.id, f.name, f.type, f.area]);
    }

    // ---- Occupations ----
    const occupations = [
        { id: 'occ-1', name: '医師', category: '医療' },
        { id: 'occ-2', name: '看護師', category: '医療' },
        { id: 'occ-3', name: '理学療法士', category: 'リハビリ' },
        { id: 'occ-4', name: '作業療法士', category: 'リハビリ' },
        { id: 'occ-5', name: '介護福祉士', category: '介護' },
        { id: 'occ-6', name: '社会福祉士', category: '介護' },
        { id: 'occ-7', name: '事務員', category: '事務' },
        { id: 'occ-8', name: 'ドライバー', category: 'その他' },
        { id: 'occ-9', name: '管理栄養士', category: '医療' },
    ];
    for (const o of occupations) {
        db.run('INSERT INTO occupations (id, name, category) VALUES (?, ?, ?)',
            [o.id, o.name, o.category]);
    }

    // ---- Users ----
    const users = [
        { id: 'u-1', name: '山田 一郎', email: 'yamada@example.com', occupation_id: 'occ-1', facility_id: 'f-1', hire_date: '2015-04-01', status: 'active', role: 'admin' },
        { id: 'u-2', name: '佐藤 花子', email: 'sato@example.com', occupation_id: 'occ-2', facility_id: 'f-1', hire_date: '2018-04-01', status: 'active', role: 'manager' },
        { id: 'u-3', name: '鈴木 次郎', email: 'suzuki@example.com', occupation_id: 'occ-3', facility_id: 'f-3', hire_date: '2020-04-01', status: 'active', role: 'staff' },
        { id: 'u-4', name: '高橋 美咲', email: 'takahashi@example.com', occupation_id: 'occ-2', facility_id: 'f-1', hire_date: '2021-04-01', status: 'active', role: 'staff' },
        { id: 'u-5', name: '伊藤 健太', email: 'ito@example.com', occupation_id: 'occ-2', facility_id: 'f-1', hire_date: '2019-04-01', status: 'active', role: 'staff' },
        { id: 'u-6', name: '渡辺 裕子', email: 'watanabe@example.com', occupation_id: 'occ-5', facility_id: 'f-4', hire_date: '2017-04-01', status: 'active', role: 'staff' },
        { id: 'u-7', name: '中村 大輔', email: 'nakamura@example.com', occupation_id: 'occ-7', facility_id: 'f-6', hire_date: '2022-04-01', status: 'active', role: 'staff' },
        { id: 'u-8', name: '小林 真理', email: 'kobayashi@example.com', occupation_id: 'occ-4', facility_id: 'f-3', hire_date: '2023-01-16', status: 'active', role: 'staff' },
        { id: 'u-9', name: '加藤 誠', email: 'kato@example.com', occupation_id: 'occ-8', facility_id: 'f-5', hire_date: '2020-07-01', status: 'active', role: 'staff' },
        { id: 'u-10', name: '吉田 さくら', email: 'yoshida@example.com', occupation_id: 'occ-6', facility_id: 'f-4', hire_date: '2021-10-01', status: 'leave', role: 'staff' },
    ];
    for (const u of users) {
        db.run(
            'INSERT INTO users (id, name, email, password_hash, occupation_id, facility_id, hire_date, status, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.name, u.email, '', u.occupation_id, u.facility_id, u.hire_date, u.status, u.role]
        );
    }

    // ---- Survey Questions ----
    const questions = [
        { id: 'sq-1', category: '仕事満足度', question: '現在の仕事にやりがいを感じていますか？', sort_order: 1 },
        { id: 'sq-2', category: '仕事満足度', question: '自分のスキルや能力を十分に活かせていますか？', sort_order: 2 },
        { id: 'sq-3', category: '人間関係', question: '上司や同僚との関係は良好ですか？', sort_order: 3 },
        { id: 'sq-4', category: '人間関係', question: '困った時に相談できる人が職場にいますか？', sort_order: 4 },
        { id: 'sq-5', category: '健康状態', question: '十分な睡眠や休息がとれていますか？', sort_order: 5 },
        { id: 'sq-6', category: '健康状態', question: '身体的・精神的に健康だと感じますか？', sort_order: 6 },
        { id: 'sq-7', category: 'キャリア展望', question: 'この職場で成長やキャリアアップの機会があると感じますか？', sort_order: 7 },
        { id: 'sq-8', category: 'キャリア展望', question: '今後もこの職場で働き続けたいと思いますか？', sort_order: 8 },
        { id: 'sq-9', category: 'ワークライフバランス', question: '業務量は適切だと感じますか？', sort_order: 9 },
        { id: 'sq-10', category: 'ワークライフバランス', question: 'プライベートの時間を十分に確保できていますか？', sort_order: 10 },
    ];
    for (const q of questions) {
        db.run('INSERT INTO survey_questions (id, category, question, sort_order) VALUES (?, ?, ?, ?)',
            [q.id, q.category, q.question, q.sort_order]);
    }

    // ---- Survey Periods ----
    const periods = [
        { id: 'sp-1', name: '2025年7月 定期サーベイ', start_date: '2025-07-01', end_date: '2025-07-31', status: 'closed' },
        { id: 'sp-2', name: '2025年8月 定期サーベイ', start_date: '2025-08-01', end_date: '2025-08-31', status: 'closed' },
        { id: 'sp-3', name: '2025年9月 定期サーベイ', start_date: '2025-09-01', end_date: '2025-09-30', status: 'closed' },
        { id: 'sp-4', name: '2025年10月 定期サーベイ', start_date: '2025-10-01', end_date: '2025-10-31', status: 'closed' },
        { id: 'sp-5', name: '2025年11月 定期サーベイ', start_date: '2025-11-01', end_date: '2025-11-30', status: 'closed' },
        { id: 'sp-6', name: '2025年12月 定期サーベイ', start_date: '2025-12-01', end_date: '2025-12-31', status: 'closed' },
        { id: 'sp-7', name: '2026年1月 定期サーベイ', start_date: '2026-01-01', end_date: '2026-01-31', status: 'closed' },
        { id: 'sp-8', name: '2026年2月 定期サーベイ', start_date: '2026-02-01', end_date: '2026-02-28', status: 'closed' },
        { id: 'sp-9', name: '2026年3月 定期サーベイ', start_date: '2026-03-01', end_date: '2026-03-31', status: 'active' },
    ];
    for (const p of periods) {
        db.run('INSERT INTO survey_periods (id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
            [p.id, p.name, p.start_date, p.end_date, p.status]);
    }

    // ---- Surveys (sample answers) ----
    const sampleSurveys = [
        // u-5 (伊藤) - 6 months of data, declining scores
        { id: 'sv-1', user_id: 'u-5', period_id: 'sp-1', date: '2025-07-15', m: 75, v: 72 },
        { id: 'sv-2', user_id: 'u-5', period_id: 'sp-2', date: '2025-08-14', m: 72, v: 70 },
        { id: 'sv-3', user_id: 'u-5', period_id: 'sp-3', date: '2025-09-12', m: 68, v: 65 },
        { id: 'sv-4', user_id: 'u-5', period_id: 'sp-4', date: '2025-10-16', m: 60, v: 55 },
        { id: 'sv-5', user_id: 'u-5', period_id: 'sp-5', date: '2025-11-13', m: 52, v: 48 },
        {
            id: 'sv-6', user_id: 'u-5', period_id: 'sp-6', date: '2025-12-01', m: 38, v: 35,
            answers: [
                { question_id: 'sq-1', score: 2 }, { question_id: 'sq-2', score: 2 },
                { question_id: 'sq-3', score: 1 }, { question_id: 'sq-4', score: 1 },
                { question_id: 'sq-5', score: 2 }, { question_id: 'sq-6', score: 1 },
                { question_id: 'sq-7', score: 1 }, { question_id: 'sq-8', score: 1 },
                { question_id: 'sq-9', score: 2 }, { question_id: 'sq-10', score: 1 },
            ],
            free_comment: '業務量が多くて辛い。相談できる人もいない。'
        },
        // u-4 (高橋) - stable scores
        { id: 'sv-7', user_id: 'u-4', period_id: 'sp-1', date: '2025-07-10', m: 80, v: 85 },
        { id: 'sv-8', user_id: 'u-4', period_id: 'sp-2', date: '2025-08-12', m: 82, v: 84 },
        { id: 'sv-9', user_id: 'u-4', period_id: 'sp-3', date: '2025-09-10', m: 78, v: 82 },
        { id: 'sv-10', user_id: 'u-4', period_id: 'sp-4', date: '2025-10-15', m: 85, v: 88 },
        { id: 'sv-11', user_id: 'u-4', period_id: 'sp-5', date: '2025-11-12', m: 80, v: 83 },
        {
            id: 'sv-12', user_id: 'u-4', period_id: 'sp-6', date: '2025-12-10', m: 82, v: 85,
            answers: [
                { question_id: 'sq-1', score: 4 }, { question_id: 'sq-2', score: 4 },
                { question_id: 'sq-3', score: 5 }, { question_id: 'sq-4', score: 4 },
                { question_id: 'sq-5', score: 4 }, { question_id: 'sq-6', score: 4 },
                { question_id: 'sq-7', score: 3 }, { question_id: 'sq-8', score: 4 },
                { question_id: 'sq-9', score: 4 }, { question_id: 'sq-10', score: 4 },
            ],
            free_comment: 'チームの雰囲気が良く、働きやすい環境です。'
        },
        // Other users
        { id: 'sv-13', user_id: 'u-2', period_id: 'sp-6', date: '2025-12-08', m: 70, v: 75 },
        { id: 'sv-14', user_id: 'u-3', period_id: 'sp-6', date: '2025-12-05', m: 65, v: 68 },
        { id: 'sv-15', user_id: 'u-6', period_id: 'sp-6', date: '2025-12-11', m: 72, v: 70 },
        { id: 'sv-16', user_id: 'u-7', period_id: 'sp-6', date: '2025-12-09', m: 88, v: 90 },
        { id: 'sv-17', user_id: 'u-8', period_id: 'sp-6', date: '2025-12-12', m: 55, v: 50 },
        { id: 'sv-18', user_id: 'u-9', period_id: 'sp-6', date: '2025-12-06', m: 78, v: 80 },
    ];

    for (const s of sampleSurveys) {
        db.run(
            `INSERT INTO surveys (id, user_id, period_id, survey_date, mental_score, motivation_score, answers, free_comment, submitted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [s.id, s.user_id, s.period_id, s.date, s.m, s.v,
            JSON.stringify((s as any).answers || []),
            (s as any).free_comment || '']
        );
    }

    // ---- Staffing Targets ----
    const staffingTargets = [
        { id: 'st-1', facility_id: 'f-1', occupation_id: 'occ-1', target: 8, current: 6 },
        { id: 'st-2', facility_id: 'f-1', occupation_id: 'occ-2', target: 20, current: 18 },
        { id: 'st-3', facility_id: 'f-2', occupation_id: 'occ-1', target: 3, current: 2 },
        { id: 'st-4', facility_id: 'f-2', occupation_id: 'occ-2', target: 5, current: 5 },
        { id: 'st-5', facility_id: 'f-3', occupation_id: 'occ-3', target: 10, current: 7 },
        { id: 'st-6', facility_id: 'f-3', occupation_id: 'occ-4', target: 6, current: 4 },
        { id: 'st-7', facility_id: 'f-4', occupation_id: 'occ-5', target: 15, current: 12 },
        { id: 'st-8', facility_id: 'f-4', occupation_id: 'occ-6', target: 3, current: 2 },
        { id: 'st-9', facility_id: 'f-5', occupation_id: 'occ-1', target: 2, current: 2 },
        { id: 'st-10', facility_id: 'f-5', occupation_id: 'occ-2', target: 4, current: 3 },
        { id: 'st-11', facility_id: 'f-1', occupation_id: 'occ-9', target: 2, current: 1 },
        { id: 'st-12', facility_id: 'f-4', occupation_id: 'occ-8', target: 3, current: 3 },
    ];
    for (const st of staffingTargets) {
        db.run(
            'INSERT INTO staffing_targets (id, facility_id, occupation_id, target_count, current_count) VALUES (?, ?, ?, ?, ?)',
            [st.id, st.facility_id, st.occupation_id, st.target, st.current]
        );
    }

    // ---- Evaluations ----
    const evaluations = [
        {
            id: 'ev-1', user_id: 'u-4', evaluator_id: 'u-2', period: '2025年度下期',
            status: 'submitted',
            items: [
                { category: '看護実践', question: '患者の状態を正確に把握し、適切な看護計画を立案できているか', score: 4, comment: '的確なアセスメントで信頼しています' },
                { category: '看護実践', question: '医療安全に配慮した看護行為を実施できているか', score: 5, comment: '' },
                { category: 'チームワーク', question: '多職種との連携を円滑に行えているか', score: 4, comment: 'リハビリチームとの連携が素晴らしい' },
                { category: '自己成長', question: '自己研鑽に取り組み、専門性を高めているか', score: 3, comment: '研修への参加を増やしましょう' },
            ]
        },
        {
            id: 'ev-2', user_id: 'u-5', evaluator_id: 'u-2', period: '2025年度下期',
            status: 'draft',
            items: [
                { category: '看護実践', question: '患者の状態を正確に把握し、適切な看護計画を立案できているか', score: 3, comment: '' },
                { category: 'チームワーク', question: '多職種との連携を円滑に行えているか', score: 2, comment: '最近コミュニケーションが減っている' },
            ]
        },
    ];
    for (const e of evaluations) {
        db.run(
            `INSERT INTO evaluations (id, user_id, evaluator_id, period, status, items, overall_comment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '', datetime('now'), datetime('now'))`,
            [e.id, e.user_id, e.evaluator_id, e.period, e.status, JSON.stringify(e.items)]
        );
    }

    saveDb();
    console.log('✅ Seed complete!');
    console.log(`   - ${facilities.length} facilities`);
    console.log(`   - ${occupations.length} occupations`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${questions.length} survey questions`);
    console.log(`   - ${periods.length} survey periods`);
    console.log(`   - ${sampleSurveys.length} survey responses`);
    console.log(`   - ${staffingTargets.length} staffing targets`);
    console.log(`   - ${evaluations.length} evaluations`);
}

seed().catch(console.error);
