const crypto = require('crypto');
const db = require('../server/utils/db');

function generateApiKey() {
    return 'sk_nx_' + crypto.randomBytes(32).toString('hex');
}

const args = process.argv.slice(2);
const agentName = args[0];

if (!agentName) {
    console.error('Usage: node add-agent.js <AgentName>');
    process.exit(1);
}

const apiKey = generateApiKey();

db.run(`INSERT INTO agents (name, api_key) VALUES (?, ?)`, [agentName, apiKey], function (err) {
    if (err) {
        console.error('Failed to register agent:', err.message);
        process.exit(1);
    }

    console.log(`✅ Agent "${agentName}" created successfully!`);
    console.log(`🔑 API Key (save this now, it won't be shown again):`);
    console.log(`\n    ${apiKey}\n`);

    console.log(`To use it, send the header:`);
    console.log(`    X-Agent-API-Key: ${apiKey}`);

    // Close db to exit script gracefully
    db.close();
});
