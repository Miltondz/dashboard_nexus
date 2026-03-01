// scripts/init_db.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Resolve DB path (same as server uses)
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '.dashboard', 'dashboard.db');
const dashboardDir = path.dirname(dbPath);

// Ensure .dashboard directory exists
if (!fs.existsSync(dashboardDir)) {
    fs.mkdirSync(dashboardDir, { recursive: true });
    console.log('Created .dashboard directory at', dashboardDir);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open DB:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite DB at', dbPath);
});

// Helper to run a statement and log result
function run(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function init() {
    try {
        // Agents table (API keys)
        await run(`CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );`);

        // Projects table (metadata from markdown frontmatter)
        await run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      description TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );`);

        // Artifacts table (images, files)
        await run(`CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT,
      thumbnail_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`);

        // Tasks table
        await run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending','in_progress','done')) DEFAULT 'pending',
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
    );`);

        // Ideas table
        await run(`CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`);

        // Activity log table
        await run(`CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );`);

        console.log('Database schema created/verified successfully.');
    } catch (e) {
        console.error('Error initializing DB schema:', e.message);
    } finally {
        db.close();
    }
}

init();
