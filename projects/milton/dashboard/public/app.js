class LivingLabApp {
    constructor() {
        this.events = [];
        this.stats = { total: 0, writing: 0, research: 0, art: 0, coding: 0 };
        this.init();
    }

    async init() {
        await this.loadData();
        window.addEventListener('hashchange', () => this.route());
        this.route();
    }

    async loadData() {
        try {
            const res = await fetch('/api/events');
            const data = await res.json();
            this.events = Array.isArray(data) ? data : (data.events || []);
            this.updateStats();
        } catch (e) { console.error("Error:", e); }
    }

    updateStats() {
        this.stats.total = this.events.length;
        this.stats.writing = this.events.filter(e => e.tags?.includes('story') || e.type === 'writing').length;
        this.stats.research = this.events.filter(e => e.tags?.includes('research') || e.type === 'research').length;
        this.stats.coding = this.events.filter(e => e.tags?.includes('coding') || e.type === 'project').length;
        this.stats.art = this.events.filter(e => e.type === 'generation' || e.tags?.includes('art')).length;
    }

    route() {
        const view = window.location.hash.replace('#', '') || 'home';
        const container = document.getElementById('main-view-container');
        if (!container) return;

        if (view === 'escritura') {
            UIModules.renderGrid(container, "Relatos", this.events.filter(e => e.tags?.includes('story')), 'var(--accent-writing)');
        } else if (view === 'investigacion') {
            UIModules.renderGrid(container, "Investigación", this.events.filter(e => e.tags?.includes('research')), 'var(--accent-research)');
        } else if (view === 'proyectos') {
            UIModules.renderGrid(container, "Proyectos Coding", this.events.filter(e => e.tags?.includes('coding') || e.type === 'project'), 'var(--accent-coding)');
        } else if (view === 'arte') {
            UIModules.renderArt(container, this.events.filter(e => e.type === 'generation' || e.tags?.includes('art')));
        } else if (view === 'tareas') {
            UIModules.renderTasks(container, this.events.filter(e => e.tags?.includes('todo')));
        } else {
            UIModules.renderHome(container, this.stats);
        }
    }

    openReader(uuid) {
        const event = this.events.find(e => e.uuid === uuid);
        if (!event) return;
        document.getElementById('reader-content').innerHTML = `
            <article><h1>${event.title}</h1><hr>
            <div class="markdown-body">${marked.parse(event.content)}</div>
            <button onclick="app.downloadMD('${event.uuid}')" style="margin-top:20px; padding:10px; cursor:pointer">📥 Descargar .MD</button></article>`;
        document.getElementById('reader-overlay').classList.remove('hidden');
    }

    closeReader() { document.getElementById('reader-overlay').classList.add('hidden'); }

    downloadMD(uuid) {
        const event = this.events.find(e => e.uuid === uuid);
        const blob = new Blob([event.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${event.title}.md`; a.click();
    }
}
const app = new LivingLabApp();
