import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'talent.db');

let db: Database;

export async function getDb(): Promise<Database> {
    if (db) return db;

    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    // Load existing DB or create new
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    initTables();
    return db;
}

export function saveDb(): void {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

function initTables(): void {
    db.run(`
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      area TEXT NOT NULL
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS occupations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      occupation_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      hire_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      role TEXT NOT NULL DEFAULT 'staff',
      FOREIGN KEY (occupation_id) REFERENCES occupations(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      evaluator_id TEXT NOT NULL,
      period TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      items TEXT NOT NULL DEFAULT '[]',
      overall_comment TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (evaluator_id) REFERENCES users(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS survey_questions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS survey_periods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled'
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      period_id TEXT,
      survey_date TEXT NOT NULL,
      mental_score INTEGER NOT NULL DEFAULT 0,
      motivation_score INTEGER NOT NULL DEFAULT 0,
      answers TEXT DEFAULT '[]',
      free_comment TEXT DEFAULT '',
      submitted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (period_id) REFERENCES survey_periods(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS staffing_targets (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      occupation_id TEXT NOT NULL,
      target_count INTEGER NOT NULL DEFAULT 0,
      current_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (facility_id) REFERENCES facilities(id),
      FOREIGN KEY (occupation_id) REFERENCES occupations(id)
    )
  `);

    saveDb();
}
