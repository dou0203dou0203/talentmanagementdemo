import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import surveyRoutes from './routes/surveys.js';
import evaluationRoutes from './routes/evaluations.js';
import { authMiddleware, optionalAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', optionalAuth, userRoutes);
app.use('/api/surveys', optionalAuth, surveyRoutes);
app.use('/api/evaluations', authMiddleware, evaluationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
async function start() {
    // Initialize DB
    await getDb();
    console.log('📦 Database initialized');

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`   API: http://localhost:${PORT}/api`);
        console.log(`   Frontend: http://localhost:${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

start().catch(console.error);
