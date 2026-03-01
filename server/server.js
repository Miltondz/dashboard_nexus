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

// Download project endpoint (ZIP or raw markdown)
app.get('/api/download/:projectId', async (req, res) => {
    try {
        const id = req.params.projectId;
        db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
            if (err || !project) return res.status(404).send('Project not found');

            const projectsRoot = process.env.PROJECTS_ROOT || path.join(__dirname, '../../projects');
            // Guard against missing or undefined path
            if (!project.path) {
                return res.status(404).send('Project path not defined');
            }
            const projectPath = path.isAbsolute(project.path)
                ? project.path
                : path.join(projectsRoot, project.path);

            if (!fs.existsSync(projectPath)) return res.status(404).send('Project path not found');

            const stats = fs.statSync(projectPath);
            if (!stats.isDirectory()) {
                // If it's a file, just send it
                res.setHeader('Content-Disposition', `attachment; filename="${path.basename(projectPath)}"`);
                if (projectPath.endsWith('.md')) res.setHeader('Content-Type', 'text/markdown');
                return res.sendFile(projectPath);
            }

            // It's a directory
            const files = fs.readdirSync(projectPath);
            const mdFiles = files.filter(f => f.endsWith('.md'));
            const otherFiles = files.filter(f => !f.endsWith('.md'));

            // If only one markdown file and no other assets, send raw markdown
            if (mdFiles.length === 1 && otherFiles.length === 0) {
                const mdPath = path.join(projectPath, mdFiles[0]);
                res.setHeader('Content-Type', 'text/markdown');
                res.setHeader('Content-Disposition', `attachment; filename="${mdFiles[0]}"`);
                return res.sendFile(mdPath);
            }

            // Otherwise, stream a zip containing the whole folder
            const zipName = `${project.title || 'project'}.zip`;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', err => {
                console.error('Archive error:', err);
                if (!res.headersSent) res.status(500).send('Download failed');
            });

            archive.pipe(res);
            archive.directory(projectPath, false);
            archive.finalize();

        });

    } catch (e) {
        console.error(e);
        res.status(500).send('Download failed');
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
