import { Router } from 'express';
import { getDb, saveDb } from '../db.js';

const router = Router();

function rowsToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            if (col === 'items' && typeof row[i] === 'string') {
                try { obj[col] = JSON.parse(row[i] as string); } catch { obj[col] = row[i]; }
            } else {
                obj[col] = row[i];
            }
        });
        return obj;
    });
}

// GET /api/evaluations - list evaluations (optional filters: user_id, period, status)
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        let sql = `
      SELECT e.*, u.name as user_name, ev.name as evaluator_name,
             f.name as facility_name, o.name as occupation_name
      FROM evaluations e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN users ev ON e.evaluator_id = ev.id
      LEFT JOIN facilities f ON u.facility_id = f.id
      LEFT JOIN occupations o ON u.occupation_id = o.id
    `;
        const conditions: string[] = [];
        const params: unknown[] = [];

        if (req.query.user_id) {
            conditions.push('e.user_id = ?');
            params.push(req.query.user_id);
        }
        if (req.query.period) {
            conditions.push('e.period = ?');
            params.push(req.query.period);
        }
        if (req.query.status) {
            conditions.push('e.status = ?');
            params.push(req.query.status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY e.updated_at DESC';

        const result = db.exec(sql, params);
        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Evaluations list error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/evaluations/:id
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const result = db.exec(`
      SELECT e.*, u.name as user_name, ev.name as evaluator_name
      FROM evaluations e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN users ev ON e.evaluator_id = ev.id
      WHERE e.id = ?
    `, [req.params.id]);

        const rows = rowsToObjects(result);
        if (rows.length === 0) {
            res.status(404).json({ error: '評価が見つかりません' });
            return;
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Evaluation get error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// POST /api/evaluations - create or update
router.post('/', async (req, res) => {
    try {
        const { id, user_id, evaluator_id, period, status, items, overall_comment } = req.body;

        if (!user_id || !evaluator_id || !period) {
            res.status(400).json({ error: '必須項目が不足しています' });
            return;
        }

        const db = await getDb();
        const now = new Date().toISOString();

        if (id) {
            // Update existing
            db.run(
                `UPDATE evaluations SET status = ?, items = ?, overall_comment = ?, updated_at = ?
         WHERE id = ?`,
                [status || 'draft', JSON.stringify(items || []), overall_comment || '', now, id]
            );
            saveDb();
            res.json({ id, message: '評価を更新しました' });
        } else {
            // Create new
            const newId = `ev-${Date.now()}`;
            db.run(
                `INSERT INTO evaluations (id, user_id, evaluator_id, period, status, items, overall_comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [newId, user_id, evaluator_id, period, status || 'draft', JSON.stringify(items || []), overall_comment || '', now, now]
            );
            saveDb();
            res.status(201).json({ id: newId, message: '評価を作成しました' });
        }
    } catch (err) {
        console.error('Evaluation save error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/evaluations/staffing/targets - staffing targets
router.get('/staffing/targets', async (_req, res) => {
    try {
        const db = await getDb();
        const result = db.exec(`
      SELECT st.*, f.name as facility_name, o.name as occupation_name
      FROM staffing_targets st
      LEFT JOIN facilities f ON st.facility_id = f.id
      LEFT JOIN occupations o ON st.occupation_id = o.id
      ORDER BY f.name, o.name
    `);
        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Staffing targets error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
