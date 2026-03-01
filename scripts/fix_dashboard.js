const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.HOME, 'openclaw/workspace/projects/milton/dashboard_v5/.dashboard/dashboard.db');
const db = new sqlite3.Database(dbPath);

async function run() {
    console.log('--- Fixing Dashboard Data ---');

    // 1. Clean up ALL artifacts (we will re-run indexer once fixed)
    await new Promise((resolve, reject) => {
        db.run('DELETE FROM artifacts', (err) => err ? reject(err) : resolve());
    });
    console.log('Cleaned all artifacts.');

    // 2. Fix Tags and Metadata
    const projects = await new Promise((resolve, reject) => {
        db.all('SELECT id, path, title FROM projects', (err, rows) => err ? reject(err) : resolve(rows));
    });

    for (const project of projects) {
        if (!fs.existsSync(project.path)) continue;
        const content = fs.readFileSync(project.path, 'utf8');

        let tags = [];
        // Extract Bestiary specific metadata
        const binomial = content.match(/\*\*Nomenclatura binomial:\*\*\s*(.*)/);
        const clase = content.match(/\*\*Clase:\*\*\s*(.*)/);
        const order = content.match(/\*\*Ordo:\*\*\s*(.*)/);
        const habitat = content.match(/\*\*Habitat:\*\*\s*(.*)/);

        if (binomial) tags.push(binomial[1].replace(/[\*\_]/g, '').trim());
        if (clase) tags.push(clase[1].replace(/[\*\_]/g, '').trim());
        if (order) tags.push(order[1].replace(/[\*\_]/g, '').trim());
        if (habitat) {
            const h = habitat[1].split(',')[0].replace(/[\*\_]/g, '').trim();
            if (h) tags.push(h);
        }

        // Add standard tags if present (#tag style)
        const hashTags = content.match(/#(\w+)/g);
        if (hashTags) {
            hashTags.forEach(t => tags.push(t.substring(1)));
        }

        // Category tag based on path
        if (project.path.includes('bestiary')) tags.push('Bestiary');
        else if (project.path.includes('personal')) tags.push('Personal');
        else if (project.path.includes('automejora')) tags.push('AutoMejora');
        else if (project.path.includes('tareas-milton')) tags.push('Tareas');

        // Remove duplicates and filter empty
        const finalTagsList = [...new Set(tags.filter(t => t.length > 2))];
        const finalTags = finalTagsList.join(',');

        if (finalTags) {
            await new Promise((resolve) => {
                db.run('UPDATE projects SET tags = ? WHERE id = ?', [finalTags, project.id], resolve);
            });
            console.log(`Updated tags for: ${project.title} (${finalTags})`);
        }
    }

    db.close();
    console.log('--- Fix complete! ---');
}

run().catch(console.error);
