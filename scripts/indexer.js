require("dotenv").config();
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const yaml = require("yaml");
const { z } = require("zod");
const sqlite3 = require("sqlite3").verbose();
const sharp = require("sharp");

// -------------------------------------------------------------------
// 1️⃣  Configuración de la BD (usa la misma ruta que el servidor
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
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
});

// -------------------------------------------------------------------
// 3️⃣  Función que inserta o actualiza un proyecto en la tabla
// -------------------------------------------------------------------
function upsertProject(data, filePath) {
    const { title, description = "", tags = [] } = data;
    const tagsStr = tags.join(",");
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
            else console.log(`🔄 Proyecto actualizado → ${filePath}`);
        }
    );
}

// -------------------------------------------------------------------
// 4️⃣  Generar thumbnail (si el markdown contiene una imagen)
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
        console.warn("⚠️ No se pudo crear thumbnail:", e.message);
        return null;
    }
}

// -------------------------------------------------------------------
// 5️⃣  Observador de los directorios de proyectos
// -------------------------------------------------------------------
const watchDirs = [
    path.join(process.env.HOME, "openclaw/workspace/projects/personal"),
    path.join(process.env.HOME, "openclaw/workspace/projects/automejora"),
    path.join(process.env.HOME, "openclaw/workspace/projects/tareas-milton")
];


// Ensure directories exist before watching
watchDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const watcher = chokidar.watch(watchDirs, {
    ignored: /(^|[\/\\])\../, // ignora .git, .DS_Store, etc.
    persistent: true
});

watcher.on("add", async file => {
    if (!file.endsWith(".md")) return; // solo .md
    const raw = fs.readFileSync(file, "utf8");
    let projectData = {};
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
        try {
            const front = yaml.parse(fmMatch[1]);
            const validation = projectSchema.safeParse(front);
            if (validation.success) {
                projectData = validation.data;
            } else {
                console.warn(`⚠️ Front‑matter inválido en ${file}:`, validation.error.errors);
            }
        } catch (e) {
            console.error(`❌ Error parseando YAML en ${file}:`, e.message);
        }
    }

    if (!projectData.title) {
        // Fallback: extract from first heading (# Title) or use filename
        const h1Match = raw.match(/^#\s+(.*)/m);
        projectData.title = h1Match ? h1Match[1].trim() : path.basename(file, '.md');
        projectData.description = "Documento sin descripción.";
        projectData.tags = [];
    }

    // 1️⃣ Guardar proyecto en la BD
    upsertProject(projectData, file);

    // 2️⃣ Mapeo Inteligente de Imágenes Locales
    // Si el proyecto está en una carpeta propia, escaneamos la carpeta por imágenes
    const mdDir = path.dirname(file);
    const mdName = path.basename(file);

    fs.readdir(mdDir, async (err, files) => {
        if (err) return;

        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const mdFilesInDir = files.filter(f => f.endsWith('.md'));
        const isProjectFolder = mdFilesInDir.length === 1;
        const mdNameBase = path.basename(file, '.md');

        for (const f of files) {
            const ext = path.extname(f).toLowerCase();
            if (imageExtensions.includes(ext)) {
                // Inclusive matching: 
                // 1. If image is mentioned in markdown text
                // 2. OR if it starts with the markdown filename (e.g. story_illus_1.jpg)
                // 3. OR if it's a dedicated project folder (only one .md)
                const isMentioned = raw.includes(f);
                const isPrefixMatched = f.startsWith(mdNameBase);

                if (isMentioned || isPrefixMatched || isProjectFolder) {
                    const imgPath = path.join(mdDir, f);
                    const dest = path.join(__dirname, "..", "public", "thumbnails");
                    const thumb = await generateThumbnail(imgPath, dest);

                    if (thumb) {
                        db.run(
                            `INSERT INTO artifacts (project_id, filename, mime, thumbnail_path)
                     SELECT id, ?, 'image', ? FROM projects WHERE path = ?
                     AND NOT EXISTS (
                         SELECT 1 FROM artifacts a 
                         INNER JOIN projects p ON a.project_id = p.id
                         WHERE a.filename = ? AND p.path = ?
                     )`,
                            [f, thumb, file, f, file],
                            err => {
                                if (err) console.error("❌ Error guardando artefacto automático:", err.message);
                                else console.log(`📸 Artefacto indexado: ${f} para ${file}`);
                            }
                        );
                    }
                }
            }
        }
    });

});

console.log("👀 Indexer observando:", watchDirs.join(", "));
