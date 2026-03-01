const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', '.dashboard', 'dashboard.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open database inside utility:', err.message);
    } else {
        // Only logging once here can avoid duplicate logs
        // console.log('Connected to SQLite DB at', dbPath);
    }
});

module.exports = db;
