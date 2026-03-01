const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.env.HOME, 'openclaw/workspace/projects');
const targetDirs = ['personal', 'automejora', 'tareas-milton'];

function processDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.md')) {
            console.log(`Migrating: ${fullPath}`);
            let content = fs.readFileSync(fullPath, 'utf8');

            // 1. Add front-matter if missing
            if (!content.trim().startsWith('---')) {
                const titleMatch = content.match(/^#\s+(.*)/m);
                // Safely escape title for YAML
                const rawTitle = (titleMatch ? titleMatch[1].trim() : path.basename(file, '.md'));
                const title = JSON.stringify(rawTitle); // This will add quotes and escape internal quotes
                const frontMatter = `---\ntitle: ${title}\ntags: ["Migración V5"]\n---\n\n`;
                content = frontMatter + content;
            }

            // 2. Fix image paths: ![alt](../images/something.jpg) -> ![alt](something.jpg)
            // also copies the image next to the md
            const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
            let match;
            while ((match = imageRegex.exec(content)) !== null) {
                const alt = match[1];
                const imgRelPath = match[2];

                // If it looks like a local relative path
                if (!imgRelPath.startsWith('http') && !imgRelPath.startsWith('data:')) {
                    const imgFullPath = path.resolve(dir, imgRelPath);
                    if (fs.existsSync(imgFullPath)) {
                        const imgBasename = path.basename(imgFullPath);
                        const newImgPath = path.join(dir, imgBasename);

                        // Copy image if it's not already there
                        if (imgFullPath !== newImgPath) {
                            try {
                                fs.copyFileSync(imgFullPath, newImgPath);
                                console.log(`  Copied image: ${imgBasename} to ${dir}`);
                                content = content.replace(imgRelPath, imgBasename);
                            } catch (e) {
                                console.error(`  Error copying image ${imgFullPath}:`, e.message);
                            }
                        }
                    }
                }
            }

            fs.writeFileSync(fullPath, content);
        }
    });
}

targetDirs.forEach(sub => {
    const p = path.join(baseDir, sub);
    if (fs.existsSync(p)) {
        processDir(p);
    }
});
console.log('Migration complete!');
