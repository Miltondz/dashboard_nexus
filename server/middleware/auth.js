const db = require('../utils/db');

function authenticateAgent(req, res, next) {
    const apiKey = req.headers['x-agent-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing X-Agent-API-Key header' });
    }

    // Verify key against db
    db.get('SELECT id, name FROM agents WHERE api_key = ?', [apiKey], (err, row) => {
        if (err) {
            console.error('DB Auth Error:', err);
            return res.status(500).json({ error: 'Internal database error' });
        }

        if (!row) {
            return res.status(403).json({ error: 'Invalid API Key' });
        }

        // Attach agent info to request object
        req.agent = row;
        next();
    });
}

module.exports = authenticateAgent;
