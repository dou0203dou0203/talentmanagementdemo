import { Router } from 'express';
import { getDb, saveDb } from '../db.js';

const router = Router();

function rowsToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            // Parse JSON fields
            if ((col === 'answers') && typeof row[i] === 'string') {
                try { obj[col] = JSON.parse(row[i] as string); } catch { obj[col] = row[i]; }
            } else {
                obj[col] = row[i];
            }
        });
        return obj;
    });
}

// GET /api/surveys - all surveys (optional filters: user_id, period_id)
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        let sql = `
      SELECT s.*, u.name as user_name, f.name as facility_name, o.name as occupation_name
      FROM surveys s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN facilities f ON u.facility_id = f.id
      LEFT JOIN occupations o ON u.occupation_id = o.id
    `;
        const conditions: string[] = [];
        const params: unknown[] = [];

        if (req.query.user_id) {
            conditions.push('s.user_id = ?');
            params.push(req.query.user_id);
        }
        if (req.query.period_id) {
            conditions.push('s.period_id = ?');
            params.push(req.query.period_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY s.survey_date DESC';

        const result = db.exec(sql, params);
        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Surveys list error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/surveys/periods - all survey periods
router.get('/periods', async (_req, res) => {
    try {
        const db = await getDb();
        const result = db.exec('SELECT * FROM survey_periods ORDER BY start_date DESC');
        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Periods error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/surveys/questions - all survey questions
router.get('/questions', async (_req, res) => {
    try {
        const db = await getDb();
        const result = db.exec('SELECT * FROM survey_questions ORDER BY sort_order');
        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Questions error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/surveys/token/:token - mobile survey access
router.get('/token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const match = token.match(/^(u[\w-]+)-(sp[\w-]+)$/);

        if (!match) {
            res.status(400).json({ error: '無効なトークンです' });
            return;
        }

        const [, userId, periodId] = match;
        const db = await getDb();

        // Get user
        const userResult = db.exec(`
      SELECT u.*, f.name as facility_name, o.name as occupation_name
      FROM users u
      LEFT JOIN facilities f ON u.facility_id = f.id
      LEFT JOIN occupations o ON u.occupation_id = o.id
      WHERE u.id = ?
    `, [userId]);

        if (userResult.length === 0 || userResult[0].values.length === 0) {
            res.status(404).json({ error: 'ユーザーが見つかりません' });
            return;
        }

        // Get period
        const periodResult = db.exec('SELECT * FROM survey_periods WHERE id = ?', [periodId]);
        if (periodResult.length === 0 || periodResult[0].values.length === 0) {
            res.status(404).json({ error: 'サーベイ期間が見つかりません' });
            return;
        }

        // Check if already submitted
        const existing = db.exec(
            'SELECT id FROM surveys WHERE user_id = ? AND period_id = ? AND submitted = 1',
            [userId, periodId]
        );

        const user = rowsToObjects(userResult)[0];
        const period = rowsToObjects(periodResult)[0];
        const alreadySubmitted = existing.length > 0 && existing[0].values.length > 0;

        // Get questions
        const questions = db.exec('SELECT * FROM survey_questions ORDER BY sort_order');

        res.json({
            user,
            period,
            already_submitted: alreadySubmitted,
            questions: rowsToObjects(questions),
        });
    } catch (err) {
        console.error('Token survey error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// POST /api/surveys - submit survey
router.post('/', async (req, res) => {
    try {
        const { user_id, period_id, answers, free_comment, mental_score, motivation_score } = req.body;

        if (!user_id || !period_id) {
            res.status(400).json({ error: 'ユーザーIDとサーベイ期間IDは必須です' });
            return;
        }

        const db = await getDb();

        // Check if already submitted
        const existing = db.exec(
            'SELECT id FROM surveys WHERE user_id = ? AND period_id = ? AND submitted = 1',
            [user_id, period_id]
        );

        if (existing.length > 0 && existing[0].values.length > 0) {
            res.status(409).json({ error: '既に回答済みです' });
            return;
        }

        const id = `sv-${Date.now()}`;
        const surveyDate = new Date().toISOString().split('T')[0];

        db.run(
            `INSERT INTO surveys (id, user_id, period_id, survey_date, mental_score, motivation_score, answers, free_comment, submitted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, user_id, period_id, surveyDate, mental_score || 0, motivation_score || 0, JSON.stringify(answers || []), free_comment || '']
        );

        saveDb();
        res.status(201).json({ id, message: '回答を保存しました' });
    } catch (err) {
        console.error('Survey submit error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
