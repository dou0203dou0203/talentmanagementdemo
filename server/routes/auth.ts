import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
            return;
        }

        const db = await getDb();
        const user = db.exec(
            `SELECT id, name, email, password_hash, role, facility_id, occupation_id
       FROM users WHERE email = ?`,
            [email]
        );

        if (user.length === 0 || user[0].values.length === 0) {
            res.status(401).json({ error: 'メールアドレスまたはパスワードが間違っています' });
            return;
        }

        const row = user[0].values[0];
        const [id, name, , passwordHash, role, facilityId, occupationId] = row as string[];

        // For demo: if password_hash is empty, accept any password
        if (passwordHash && passwordHash.length > 0) {
            const valid = await bcrypt.compare(password, passwordHash);
            if (!valid) {
                res.status(401).json({ error: 'メールアドレスまたはパスワードが間違っています' });
                return;
            }
        }

        const token = generateToken(id, role);

        res.json({
            token,
            user: { id, name, email, role, facility_id: facilityId, occupation_id: occupationId },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const db = await getDb();
        const result = db.exec(
            `SELECT u.id, u.name, u.email, u.role, u.facility_id, u.occupation_id, u.status,
              f.name as facility_name, o.name as occupation_name
       FROM users u
       LEFT JOIN facilities f ON u.facility_id = f.id
       LEFT JOIN occupations o ON u.occupation_id = o.id
       WHERE u.id = ?`,
            [req.userId!]
        );

        if (result.length === 0 || result[0].values.length === 0) {
            res.status(404).json({ error: 'ユーザーが見つかりません' });
            return;
        }

        const cols = result[0].columns;
        const row = result[0].values[0];
        const user: Record<string, unknown> = {};
        cols.forEach((col, i) => { user[col] = row[i]; });

        res.json(user);
    } catch (err) {
        console.error('Auth me error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
