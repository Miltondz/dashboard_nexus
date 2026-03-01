-- 🌌 Dashboard Nexus Database Schema
-- Last Updated: 2026-03-01
-- This schema defines the structure for the Nexus V5 Dashboard (SQLite3 compatible).

-- ---------------------------------------------------------
-- 1. AGENTS: Authorized identities for API access
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- 2. PROJECTS: File-based content metadata
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    description TEXT,
    tags TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- 3. ARTIFACTS: Associated media (images, PDFs)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT,
    thumbnail_path TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 4. TASKS: Global Kanban and project-specific checklist
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending','in_progress','done')) DEFAULT 'pending',
    due_date TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')), 
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- 5. IDEAS: Captured seeds and future project sparks
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- 6. ACTIVITY LOG: Audit trail for actions
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE SET NULL
);
