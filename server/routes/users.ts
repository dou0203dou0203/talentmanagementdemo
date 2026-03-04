import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Helper to convert sql.js result to array of objects
function rowsToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
    });
}

// GET /api/users
router.get('/', async (_req, res) => {
    try {
        const db = await getDb();
        const result = db.exec(`
      SELECT u.*, f.name as facility_name, o.name as occupation_name
      FROM users u
      LEFT JOIN facilities f ON u.facility_id = f.id
      LEFT JOIN occupations o ON u.occupation_id = o.id
      ORDER BY u.name
    `);

        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Users list error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const result = db.exec(`
      SELECT u.*, f.name as facility_name, o.name as occupation_name
      FROM users u
      LEFT JOIN facilities f ON u.facility_id = f.id
      LEFT JOIN occupations o ON u.occupation_id = o.id
      WHERE u.id = ?
    `, [req.params.id]);

        const users = rowsToObjects(result);
        if (users.length === 0) {
            res.status(404).json({ error: 'ユーザーが見つかりません' });
            return;
        }

        res.json(users[0]);
    } catch (err) {
        console.error('User get error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/facilities
router.get('/facilities/list', async (_req, res) => {
    try {
        const db = await getDb();
        const result = db.exec('SELECT * FROM facilities ORDER BY name');
        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Facilities error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/users/occupations/list
router.get('/occupations/list', async (_req, res) => {
    try {
        const db = await getDb();
        const result = db.exec('SELECT * FROM occupations ORDER BY name');
        res.json(rowsToObjects(result));
    } catch (err) {
        console.error('Occupations error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
