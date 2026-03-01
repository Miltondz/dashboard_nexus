const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.env.HOME, 'openclaw/workspace/projects');
const targetDirs = ['personal', 'automejora', 'tareas-milton'];

function fixYaml(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
        let lines = fmMatch[1].split('\n');
        let changed = false;
        lines = lines.map(line => {
            if (line.startsWith('title:')) {
                let title = line.substring(6).trim();
                // If title is double quoted and has unescaped internal quotes
                if (title.startsWith('"') && title.endsWith('"')) {
                    let inner = title.substring(1, title.length - 1);
                    // Check if there are unescaped quotes inside
                    if (inner.includes('"') && !inner.includes('\\"')) {
                        console.log(`Fixing title in ${filePath}: ${title}`);
                        // Change to single quotes for the inner ones or escape them
                        const fixedInner = inner.replace(/"/g, "'");
                        changed = true;
                        return `title: "${fixedInner}"`;
                    }
                }
            }
            return line;
        });
        if (changed) {
            const fixedFm = `---\n${lines.join('\n')}\n---`;
            const newContent = content.replace(fmMatch[0], fixedFm);
            fs.writeFileSync(filePath, newContent);
        }
    }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.md')) {
            fixYaml(fullPath);
        }
    });
}

targetDirs.forEach(sub => {
    const p = path.join(baseDir, sub);
    if (fs.existsSync(p)) {
        processDir(p);
    }
});
console.log('YAML Titles Fixed!');
