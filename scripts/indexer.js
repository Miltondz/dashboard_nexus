require("dotenv").config();
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const yaml = require("yaml");
const { z } = require("zod");
const sqlite3 = require("sqlite3").verbose();
const sharp = require("sharp");

// -------------------------------------------------------------------
// 1️⃣  Configuración de la BD
// -------------------------------------------------------------------
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", ".dashboard", "dashboard.db");
const db = new sqlite3.Database(dbPath, err => {
    if (err) {
        console.error("❌ No se pudo abrir la BD:", err.message);
        process.exit(1);
    }
    console.log("✅ Conectado a SQLite en", dbPath);
});

// -------------------------------------------------------------------
// 2️⃣  Esquema de validación del front‑matter (YAML)
// -------------------------------------------------------------------
const projectSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional().transform(val => {
        if (typeof val === 'string') return val.split(',').map(s => s.trim());
        return val;
    }),
    image: z.string().optional(),
});

// -------------------------------------------------------------------
// 3️⃣  Función que inserta o actualiza un proyecto en la tabla
// -------------------------------------------------------------------
function upsertProject(data, filePath) {
    const { title, description = "", tags = [] } = data;
    const tagsStr = Array.isArray(tags) ? tags.join(",") : tags;
    db.run(
        `INSERT INTO projects (title, path, description, tags)
     VALUES (?,?,?,?)
     ON CONFLICT(path) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       tags = excluded.tags,
       updated_at = datetime('now')`,
        [title, filePath, description, tagsStr],
        err => {
            if (err) console.error("❌ Error DB:", err.message);
            else console.log(`🔄 Proyecto sincronizado → ${path.basename(filePath)}`);
        }
    );
}

// -------------------------------------------------------------------
// 4️⃣  Generar thumbnail
// -------------------------------------------------------------------
async function generateThumbnail(imagePath, destFolder) {
    try {
        const fileName = path.basename(imagePath);
        const thumbPath = path.join(destFolder, `thumb_${fileName}`);
        if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
        await sharp(imagePath)
            .resize(200, 200, { fit: "inside" })
            .toFile(thumbPath);
        return thumbPath;
    } catch (e) {
        console.warn("⚠️ Thumbnail skip:", e.message);
        return null;
    }
}

// -------------------------------------------------------------------
// 5️⃣  Lógica de Asociación Inteligente
// -------------------------------------------------------------------

function findMatchingMd(imagePath) {
    const dir = path.dirname(imagePath);
    const siblings = fs.readdirSync(dir);
    const mdFiles = siblings.filter(s => s.endsWith('.md'));
    const imgName = path.basename(imagePath);

    if (mdFiles.length === 0) return null;
    if (mdFiles.length === 1) return path.join(dir, mdFiles[0]);

    // Buscar por prefijo o mención
    for (const md of mdFiles) {
        const mdPath = path.join(dir, md);
        const mdNameBase = path.basename(md, '.md');
        if (imgName.startsWith(mdNameBase)) return mdPath;

        const content = fs.readFileSync(mdPath, 'utf8');
        if (content.includes(imgName)) return mdPath;
    }
    return null;
}

async function processMarkdown(file) {
    console.log(`🔍 Escaneando MD: ${path.basename(file)}`);
    try {
        const raw = fs.readFileSync(file, "utf8");
        let projectData = {};
        const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        if (fmMatch) {
            try {
                const front = yaml.parse(fmMatch[1]);
                const validation = projectSchema.safeParse(front);
                if (validation.success) projectData = validation.data;
            } catch (e) {
                console.error(`❌ Error YAML en ${file}:`, e.message);
            }
        }

        if (!projectData.title) {
            const h1Match = raw.match(/^#\s+(.*)/m);
            projectData.title = h1Match ? h1Match[1].trim() : path.basename(file, '.md');
            projectData.description = "Documento sin descripción.";
            projectData.tags = [];
        }

        upsertProject(projectData, file);

        // Scan for images that belong to this MD
        const mdDir = path.dirname(file);
        const siblings = fs.readdirSync(mdDir);
        const mdNameBase = path.basename(file, '.md');
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

        for (const f of siblings) {
            if (imageExtensions.includes(path.extname(f).toLowerCase())) {
                const isMentioned = raw.includes(f);
                const isPrefixMatched = f.startsWith(mdNameBase);
                const isOnlyMd = mdFilesCount(mdDir) === 1;

                if (isMentioned || isPrefixMatched || isOnlyMd) {
                    await processImage(path.join(mdDir, f), file);
                }
            }
        }
    } catch (err) {
        console.error("❌ Error procesando MD:", err.message);
    }
}

function mdFilesCount(dir) {
    return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}

async function processImage(imagePath, parentMdPath) {
    if (!parentMdPath) {
        parentMdPath = findMatchingMd(imagePath);
    }
    if (!parentMdPath) return;

    const f = path.basename(imagePath);
    const dest = path.join(__dirname, "..", "public", "thumbnails");
    const thumb = await generateThumbnail(imagePath, dest);

    if (thumb) {
        db.run(
            `INSERT INTO artifacts (project_id, filename, mime, thumbnail_path)
             SELECT id, ?, 'image', ? FROM projects WHERE path = ?
             AND NOT EXISTS (
                 SELECT 1 FROM artifacts a 
                 INNER JOIN projects p ON a.project_id = p.id
                 WHERE a.filename = ? AND p.path = ?
             )`,
            [f, thumb, parentMdPath, f, parentMdPath],
            err => {
                if (err) console.error("❌ Error artefacto:", err.message);
                else console.log(`📸 Imagen vinculada: ${f} → ${path.basename(parentMdPath)}`);
            }
        );
    }
}

function removeFile(file) {
    console.log(`🗑️ Eliminando rastro: ${path.basename(file)}`);
    if (file.endsWith('.md')) {
        db.run('DELETE FROM projects WHERE path = ?', [file]);
    } else {
        const f = path.basename(file);
        db.run('DELETE FROM artifacts WHERE filename = ?', [f]);
    }
}

// -------------------------------------------------------------------
// 6️⃣  Watcher
// -------------------------------------------------------------------
const watchDirs = [
    path.join(process.env.HOME || "", "openclaw/workspace/projects/personal"),
    path.join(process.env.HOME || "", "openclaw/workspace/projects/automejora"),
    path.join(process.env.HOME || "", "openclaw/workspace/projects/tareas-milton")
];

watchDirs.forEach(dir => { if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

const watcher = chokidar.watch(watchDirs, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: false
});

watcher
    .on("add", file => {
        if (file.endsWith(".md")) processMarkdown(file);
        else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file).toLowerCase())) processImage(file);
    })
    .on("change", file => {
        if (file.endsWith(".md")) processMarkdown(file);
        else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file).toLowerCase())) processImage(file);
    })
    .on("unlink", file => {
        removeFile(file);
    });

console.log("👀 Indexer V5 escuchando cambios (Mapeo Inteligente Pro)...");
