const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", ".dashboard", "dashboard.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`INSERT INTO ideas (title, content) VALUES ('Integrar Open WebUI', 'Conectar el panel de Nexus con el motor de inferencia local.')`);
    db.run(`INSERT INTO ideas (title, content) VALUES ('Sistema de Alertas', 'Notificar al usuario si el servidor consume mucha memoria')`);

    db.run(`INSERT INTO tasks (title, status, due_date) VALUES ('Finalizar interfaz de V5', 'in_progress', '2026-02-28')`);
    db.run(`INSERT INTO tasks (title, status, due_date) VALUES ('Limpiar carpeta projects vieja', 'pending', '2026-03-05')`);
});

db.close(() => console.log("Seeding complete"));
