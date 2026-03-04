import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'talent-mgmt-secret-key-change-in-production';

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export function generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: '認証が必要です' });
        return;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch {
        res.status(401).json({ error: 'トークンが無効です' });
    }
}

// Optional auth - doesn't fail if no token
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            req.userId = decoded.userId;
            req.userRole = decoded.role;
        } catch {
            // Ignore invalid tokens for optional auth
        }
    }

    next();
}
