const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const authenticateAgent = require('../middleware/auth');

// Apply authentication middleware to all routes in this router
router.use(authenticateAgent);

// Simple agent heartbeat/status
router.get('/status', (req, res) => {
    res.json({
        message: 'Agent authenticated successfully',
        agent: {
            id: req.agent.id,
            name: req.agent.name
        }
    });
});

// Create a new idea
router.post('/ideas', express.json(), (req, res) => {
    const { title, content, tags } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required for an idea' });
    }

    const query = `INSERT INTO ideas (title, content, tags) VALUES (?, ?, ?, ?)`;
    db.run(query, [title, content || '', tags || ''], function (err) {
        if (err) {
            console.error('Failed to insert idea:', err);
            return res.status(500).json({ error: 'Database error while saving idea' });
        }
        res.status(201).json({
            message: 'Idea created successfully',
            idea_id: this.lastID
        });
    });
});

// Create a new task
router.post('/tasks', express.json(), (req, res) => {
    const { title, status, due_date, description } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required for a task' });
    }

    const taskStatus = status || 'pending'; // 'pending', 'in_progress', 'done'

    const query = `INSERT INTO tasks (title, status, due_date, description) VALUES (?, ?, ?, ?)`;
    db.run(query, [title, taskStatus, due_date || null, description || ''], function (err) {
        if (err) {
            console.error('Failed to insert task:', err);
            return res.status(500).json({ error: 'Database error while saving task' });
        }
        res.status(201).json({
            message: 'Task created successfully',
            task_id: this.lastID
        });
    });
});

// Fetch all projects for the agent
router.get('/projects', (req, res) => {
    db.all('SELECT * FROM projects ORDER BY updated_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Fetch all ideas for the agent
router.get('/ideas', (req, res) => {
    db.all('SELECT * FROM ideas ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Fetch all tasks for the agent
router.get('/tasks', (req, res) => {
    db.all('SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
