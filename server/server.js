const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve project files (images, etc.) under /projects-static/
const projectsRoot = path.join(__dirname, '..', 'projects');
app.use('/projects-static', express.static(projectsRoot));

const db = require('./utils/db');

// Image proxy: resolves a relative image path based on the project file's directory
app.get('/api/project-image', (req, res) => {
    const projectPath = req.query.projectPath;
    const imagePath = req.query.imagePath;
    if (!projectPath || !imagePath) {
        return res.status(400).json({ error: 'Missing projectPath or imagePath' });
    }
    const projectDir = path.dirname(projectPath);
    const resolved = path.resolve(projectDir, imagePath);

    // Security: ensure the resolved path is within the projects root
    if (!resolved.startsWith(path.resolve(projectsRoot)) && !resolved.includes('projects')) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (fs.existsSync(resolved)) {
        res.sendFile(resolved);
    } else {
        res.status(404).json({ error: 'Image not found at ' + resolved });
    }
});

// Simple health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Dynamic Dashboard Stats
app.get('/api/stats', (req, res) => {
    const stats = {
        projects: 0,
        artifacts: 0,
        tasks: 0,
        pendingTasks: 0,
        ideas: 0,
        lastWeekActivity: 0
    };

    const qProjects = "SELECT COUNT(*) as count FROM projects";
    const qArtifacts = "SELECT COUNT(*) as count FROM artifacts WHERE mime = 'image'";
    const qTasks = "SELECT COUNT(*) as count FROM tasks";
    const qPending = "SELECT COUNT(*) as count FROM tasks WHERE status != 'done'";
    const qIdeas = "SELECT COUNT(*) as count FROM ideas";
    const qActivity = "SELECT COUNT(*) as count FROM projects WHERE updated_at >= datetime('now', '-7 days')";

    db.get(qProjects, (err, rP) => {
        if (rP) stats.projects = rP.count;
        db.get(qArtifacts, (err, rA) => {
            if (rA) stats.artifacts = rA.count;
            db.get(qTasks, (err, rT) => {
                if (rT) stats.tasks = rT.count;
                db.get(qPending, (err, rPen) => {
                    if (rPen) stats.pendingTasks = rPen.count;
                    db.get(qIdeas, (err, rI) => {
                        if (rI) stats.ideas = rI.count;
                        db.get(qActivity, (err, rAct) => {
                            if (rAct) stats.lastWeekActivity = rAct.count;
                            res.json(stats);
                        });
                    });
                });
            });
        });
    });
});

// Fetch projects with their thumbnail path if it exists
app.get('/api/projects', (req, res) => {
    const query = `
    SELECT p.*, a.thumbnail_path, a.filename as image_filename 
    FROM projects p
    LEFT JOIN artifacts a ON a.project_id = p.id AND a.mime = 'image'
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('DB error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        // Normalize thumbnail paths: convert absolute paths to relative URLs
        const publicRoot = path.join(__dirname, '..', 'public');
        const resolved = rows.map(row => {
            if (row.thumbnail_path) {
                const normalized = row.thumbnail_path.replace(/\\/g, '/');
                // If it's an absolute path, extract the part relative to public/
                const publicIdx = normalized.indexOf('/public/');
                if (publicIdx !== -1) {
                    row.thumbnail_path = normalized.substring(publicIdx + '/public'.length);
                } else if (!normalized.startsWith('/')) {
                    row.thumbnail_path = '/' + normalized;
                }
            }
            if (row.image_filename && row.path) {
                row.resolved_url = `/api/project-image?projectPath=${encodeURIComponent(row.path)}&imagePath=${encodeURIComponent(row.image_filename)}`;
            }
            return row;
        });
        res.json(resolved);
    });
});

// Get a single project with its full content and associated artifacts
app.get('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;

    db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
        if (err || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get associated artifacts
        db.all('SELECT * FROM artifacts WHERE project_id = ?', [projectId], (err, artifacts) => {
            if (err) artifacts = [];

            // Get associated tasks
            db.all('SELECT * FROM tasks WHERE project_id = ? ORDER BY status DESC', [projectId], (err, tasks) => {
                if (err) tasks = [];

                // Read the actual markdown file
                let content = '';
                try {
                    if (fs.existsSync(project.path)) {
                        const rawContent = fs.readFileSync(project.path, 'utf8');
                        // Rewrite relative image paths to absolute URLs via the image proxy
                        content = rewriteImagePaths(rawContent, project.path);
                    } else {
                        content = '_File content not found at path: ' + project.path + '_';
                    }
                } catch (readErr) {
                    content = '_Error reading file_';
                }

                // Also resolve artifact image paths for the modal
                const resolvedArtifacts = (artifacts || []).map(a => {
                    if (a.thumbnail_path) {
                        const normalized = a.thumbnail_path.replace(/\\/g, '/');
                        const publicIdx = normalized.indexOf('/public/');
                        if (publicIdx !== -1) {
                            a.thumbnail_path = normalized.substring(publicIdx + '/public'.length);
                        } else if (!normalized.startsWith('/')) {
                            a.thumbnail_path = '/' + normalized;
                        }
                    }
                    // Also provide a direct proxy URL for the original image
                    if (a.filename && project.path) {
                        a.resolved_url = `/api/project-image?projectPath=${encodeURIComponent(project.path)}&imagePath=${encodeURIComponent(a.filename)}`;
                    }
                    return a;
                });

                res.json({
                    ...project,
                    artifacts: resolvedArtifacts,
                    tasks,
                    content
                });
            });
        });
    });
});

/**
 * Rewrite relative image paths in markdown to absolute proxy URLs.
 * Handles both ![alt](path) and image: "path" in frontmatter.
 */
function rewriteImagePaths(markdownContent, projectFilePath) {
    // Rewrite markdown image syntax: ![alt](relative/path.jpg)
    return markdownContent.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (match, alt, imgPath) => {
            // Skip absolute URLs (http, https, data:)
            if (/^(https?:|data:|\/projects-static)/.test(imgPath)) return match;
            const proxyUrl = `/api/project-image?projectPath=${encodeURIComponent(projectFilePath)}&imagePath=${encodeURIComponent(imgPath)}`;
            return `![${alt}](${proxyUrl})`;
        }
    );
}

// Fetch all artifacts (Gallery)
app.get('/api/artifacts', (req, res) => {
    const query = `
    SELECT a.*, p.title as project_title, p.path as project_path
    FROM artifacts a
    LEFT JOIN projects p ON a.project_id = p.id
    WHERE a.mime = 'image'
    ORDER BY a.created_at DESC
  `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Normalize thumbnail paths for gallery
        const resolved = rows.map(row => {
            if (row.thumbnail_path) {
                const normalized = row.thumbnail_path.replace(/\\/g, '/');
                const publicIdx = normalized.indexOf('/public/');
                if (publicIdx !== -1) {
                    row.thumbnail_path = normalized.substring(publicIdx + '/public'.length);
                } else if (!normalized.startsWith('/')) {
                    row.thumbnail_path = '/' + normalized;
                }
            }
            // Also provide proxy URL as fallback
            if (row.filename && row.project_path) {
                row.resolved_url = `/api/project-image?projectPath=${encodeURIComponent(row.project_path)}&imagePath=${encodeURIComponent(row.filename)}`;
            }
            return row;
        });
        res.json(resolved);
    });
});

// Download ONE project file
app.get('/api/download/:projectId', async (req, res) => {
    try {
        const id = req.params.projectId;
        db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
            if (err || !project) return res.status(404).send('Project not found');
            if (!fs.existsSync(project.path)) return res.status(404).send('File not found');
            res.download(project.path);
        });
    } catch (e) {
        res.status(500).send('Download failed');
    }
});

// Download ENTIRE PROJECT (Logic to find the true root folder)
app.get('/api/download-folder/:projectId', async (req, res) => {
    try {
        const id = req.params.projectId;
        db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
            if (err || !project) return res.status(404).send('Project not found');

            const normPath = project.path.replace(/\\/g, '/');
            const roots = ['/personal/', '/automejora/', '/tareas-milton/'];
            let projectFolder = null;

            for (const root of roots) {
                const idx = normPath.indexOf(root);
                if (idx !== -1) {
                    const afterRoot = normPath.substring(idx + root.length);
                    const firstSubfolder = afterRoot.split('/')[0];
                    if (firstSubfolder && !firstSubfolder.endsWith('.md')) {
                        projectFolder = normPath.substring(0, idx + root.length + firstSubfolder.length);
                        break;
                    }
                }
            }

            const finalPath = projectFolder || path.dirname(project.path);
            if (!fs.existsSync(finalPath)) return res.status(404).send('Project root not found');

            const zipName = `${path.basename(finalPath)}.zip`;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(res);
            archive.directory(finalPath, false);
            archive.finalize();
        });
    } catch (e) {
        res.status(500).send('Project download failed');
    }
});

// Fetch Timeline (Activity log or projects sorted by creation)
app.get('/api/timeline', (req, res) => {
    // Mixing projects creation with activity log could be complex, 
    // for now, a timeline of newly created or updated projects.
    db.all('SELECT title, path, tags, updated_at FROM projects ORDER BY updated_at DESC LIMIT 50', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Ideas
app.get('/api/ideas', (req, res) => {
    db.all('SELECT * FROM ideas ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update project tags
app.post('/api/projects/:id/tags', (req, res) => {
    const projectId = req.params.id;
    const { tags } = req.body;
    console.log(`[TAG_UPDATE] Request for Project ID ${projectId} with tags: "${tags}"`);

    db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
        if (err) {
            console.error('[TAG_UPDATE] DB Get Error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (!project) {
            console.warn('[TAG_UPDATE] Project not found:', projectId);
            return res.status(404).json({ error: 'Project not found' });
        }

        console.log(`[TAG_UPDATE] Found project at path: ${project.path}`);

        // 1. Update DB
        db.run('UPDATE projects SET tags = ? WHERE id = ?', [tags, projectId], (err) => {
            if (err) {
                console.error('[TAG_UPDATE] DB Update Error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log('[TAG_UPDATE] DB successfully updated.');

            // 2. Update Markdown file front-matter
            if (fs.existsSync(project.path)) {
                try {
                    let fullContent = fs.readFileSync(project.path, 'utf8');
                    console.log(`[TAG_UPDATE] File read success (${fullContent.length} bytes)`);
                    const separator = fullContent.includes('\r\n') ? '\r\n' : '\n';

                    const frontMatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---/;
                    const match = fullContent.match(frontMatterRegex);

                    if (match) {
                        console.log('[TAG_UPDATE] Frontmatter detected, updating...');
                        let yamlStr = match[1];
                        if (yamlStr.includes('tags:')) {
                            yamlStr = yamlStr.replace(/tags:.*(\r?\n|$)/, `tags: ${tags}$1`);
                        } else {
                            yamlStr = yamlStr.trimEnd() + separator + `tags: ${tags}` + separator;
                        }
                        fullContent = fullContent.replace(frontMatterRegex, `---${separator}${yamlStr.trim()}${separator}---`);
                    } else {
                        console.log('[TAG_UPDATE] No frontmatter found, prepending...');
                        fullContent = `---${separator}tags: ${tags}${separator}---${separator}${separator}${fullContent.trim()}`;
                    }

                    fs.writeFileSync(project.path, fullContent, 'utf8');
                    console.log('[TAG_UPDATE] File successfully written.');
                    res.json({ success: true });
                } catch (e) {
                    console.error('[TAG_UPDATE] File System Error:', e);
                    res.status(500).json({ error: 'Failed to update Markdown file' });
                }
            } else {
                console.warn('[TAG_UPDATE] Warning: File not found on disk at', project.path);
                res.json({ success: true, warning: 'DB updated but file not found' });
            }
        });
    });
});

// Tasks
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Mount protected agent routes
const agentRouter = require('./routers/agentRouter');
app.use('/api/agent', agentRouter);

const PORT = process.env.PORT || 3099;
app.listen(PORT, () => {
    console.log(`Dashboard V5 server listening on port ${PORT}`);
    console.log(`Connected to SQLite DB via utils/db`);
});
