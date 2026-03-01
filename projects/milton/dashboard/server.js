const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3456;

const DATA_DIR = path.join(__dirname, 'data');
const EVENT_STORE_PATH = path.join(DATA_DIR, 'event-store.json');
const SEQUENCES_PATH = path.join(DATA_DIR, 'sequences.json');
const WORKSPACE_ROOT = path.join(__dirname, '../..');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function initializeStore() {
  if (!fs.existsSync(EVENT_STORE_PATH)) {
    fs.writeFileSync(EVENT_STORE_PATH, JSON.stringify({
      schema: 'openclaw.living-lab.v1',
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      sequences: { events: 0, thought: 0, code: 0, generation: 0, research: 0, system: 0 },
      events: []
    }, null, 2));
  }
  if (!fs.existsSync(SEQUENCES_PATH)) {
    fs.writeFileSync(SEQUENCES_PATH, JSON.stringify({
      events: 0, thought: 0, code: 0, generation: 0, research: 0, system: 0
    }, null, 2));
  }
}
initializeStore();

class EventStore {
  constructor() {
    this.clients = new Set();
    this.cache = null;
    this.lastMod = 0;
  }

  getEvents() {
    try {
      const st = fs.statSync(EVENT_STORE_PATH);
      if (st.mtimeMs > this.lastMod || !this.cache) {
        const data = JSON.parse(fs.readFileSync(EVENT_STORE_PATH, 'utf-8'));
        this.cache = data.events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.lastMod = st.mtimeMs;
      }
      return this.cache;
    } catch (e) { return []; }
  }

  nextSeq(type) {
    const seqs = JSON.parse(fs.readFileSync(SEQUENCES_PATH, 'utf-8'));
    seqs.events = (seqs.events || 0) + 1;
    seqs[type] = (seqs[type] || 0) + 1;
    fs.writeFileSync(SEQUENCES_PATH, JSON.stringify(seqs, null, 2));
    return { global: seqs.events, type: seqs[type] };
  }

  create({ type, project_ref, title, content, media, tags }) {
    const seq = this.nextSeq(type);
    const evt = {
      id: `evt_${type}_${seq.type}_${Date.now()}`,
      uuid: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type, project_ref: project_ref || null, title, content, media, tags,
      seq: seq.global
    };
    const store = JSON.parse(fs.readFileSync(EVENT_STORE_PATH, 'utf-8'));
    store.events.push(evt);
    fs.writeFileSync(EVENT_STORE_PATH, JSON.stringify(store, null, 2));
    this.cache = null;
    this.broadcast(evt);
    return evt;
  }

  broadcast(evt) {
    const msg = `data: ${JSON.stringify(evt)}\n\n`;
    this.clients.forEach(c => { try { c.write(msg); } catch(e) {} });
  }

  subscribe(res, req) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: {"type":"connected","time":"${new Date().toISOString()}"}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'history', events: this.getEvents().slice(0, 50) })}\n\n`);
    this.clients.add(res);
    req.on('close', () => this.clients.delete(res));
  }

  filter({ types, project, tags, limit = 50, offset = 0 }) {
    let evts = this.getEvents();
    if (types?.length) evts = evts.filter(e => types.includes(e.type));
    if (project) evts = evts.filter(e => e.project_ref === project);
    if (tags?.length) evts = evts.filter(e => tags.some(t => e.tags?.includes(t)));
    return { events: evts.slice(offset, offset + limit), total: evts.length, offset, limit };
  }

  stats() {
    const evts = this.getEvents();
    const st = { total: evts.length, byType: {}, projects: new Set(), tags: {} };
    evts.forEach(e => {
      st.byType[e.type] = (st.byType[e.type] || 0) + 1;
      if (e.project_ref) st.projects.add(e.project_ref);
      e.tags?.forEach(t => st.tags[t] = (st.tags[t] || 0) + 1);
    });
    st.projects = Array.from(st.projects);
    return st;
  }
}

const store = new EventStore();

const logger = {
  log: d => store.create(d),
  thought: (t, c, o = {}) => store.create({ type: 'thought', project_ref: o.project_ref, title: t, content: c, tags: o.tags }),
  code: (t, c, o = {}) => store.create({ type: 'code', project_ref: o.project_ref, title: t, content: `\`\`\`\n${c}\n\`\`\``, tags: [...(o.tags || []), 'code'] }),
  generation: (t, c, m, o = {}) => store.create({ type: 'generation', project_ref: o.project_ref, title: t, content: c, media: m, tags: [...(o.tags || []), 'generation'] }),
  research: (t, c, o = {}) => store.create({ type: 'research', project_ref: o.project_ref, title: t, content: c, tags: o.tags }),
  system: (t, c, o = {}) => store.create({ type: 'system', project_ref: o.project_ref, title: t, content: c, tags: o.tags })
};

module.exports.logger = logger;

// ─────────────────────────────────────────────────────────────────────────────
// CRÍTICO: STATIC FILES PRIMERO (antes de cualquier ruta /api)
// Esto permite que Express sirva archivos de public/ sin que las rutas
// de API o el SPA fallback capturen las peticiones a imágenes
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES (DESPUÉS de estáticos)
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json());

app.get('/api/stream', (req, res) => store.subscribe(res, req));

app.get('/api/events', (req, res) => {
  const r = store.filter({
    types: req.query.types?.split(','),
    project: req.query.project,
    tags: req.query.tags?.split(','),
    limit: parseInt(req.query.limit) || 50,
    offset: parseInt(req.query.offset) || 0
  });
  res.json(r);
});

app.post('/api/events', (req, res) => {
  const e = logger.log(req.body);
  e ? res.json(e) : res.status(400).json({ error: 'invalid' });
});

app.get('/api/stats', (req, res) => res.json(store.stats()));

app.get('/api/dashboard', (req, res) => res.json({
  stats: store.stats(), events: store.getEvents().slice(0, 20), version: '2.0.0'
}));

// Ruta de imagen para backward compatibility
app.get('/api/image/:dir/:file', (req, res) => {
  const p = path.join(WORKSPACE_ROOT, 'projects/personal', req.params.dir, 'images', req.params.file);
  fs.existsSync(p) ? res.sendFile(p) : res.status(404).json({ error: 'not found' });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPA FALLBACK (al final de TODO)
// ───                                                                  // ─────────────────────────────────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Watch para cambios en bestiario
chokidar.watch([
  path.join(WORKSPACE_ROOT, 'projects/personal/bestiary/creatures/*.md'),
], { ignored: /node_modules/ }).on('add', f => {
  if (f.endsWith('.md')) console.log('[watch]', path.basename(f));
});

app.listen(PORT, '0.0.0.0', () => console.log(`🧪 Living Lab Journal http://localhost:${PORT}`));
