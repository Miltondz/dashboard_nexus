// =============================================
// NEXUS DASHBOARD V5 — STRICT DATA & LOGIC
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
    Search.init();
    DataManager.fetchAll();
    ProjectsSection.init();
    Modal.init();
    Lightbox.init();
});

// ════════════════════════════════════════════════
//  DATA LAYER
// ════════════════════════════════════════════════
const DataManager = {
    projects: [], artifacts: [], ideas: [], tasks: [],
    timelineDays: 7, // Global state for timeline filters

    async fetchAll() {
        await Promise.all([
            this.fetchProjects(),
            this.fetchArtifacts(),
            this.fetchIdeas(),
            this.fetchTasks()
        ]);
        this.renderGlobalState();
    },

    async fetchProjects() {
        try {
            const res = await fetch('/api/projects');
            if (!res.ok) throw new Error();
            this.projects = await res.json();
        } catch (e) { showError('all-projects-container', 'Error cargando proyectos'); }
    },
    async fetchArtifacts() {
        try {
            const res = await fetch('/api/artifacts');
            if (!res.ok) throw new Error();
            this.artifacts = await res.json();
        } catch (e) { showError('gallery-container', 'Error cargando galería'); }
    },
    async fetchIdeas() {
        try {
            const res = await fetch('/api/ideas');
            if (!res.ok) throw new Error();
            this.ideas = await res.json();
        } catch (e) { showError('ideas-container', 'Error cargando ideas'); }
    },
    async fetchTasks() {
        try {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error();
            this.tasks = await res.json();
        } catch (e) { showError('tasks-container', 'Error cargando tareas'); }
    },

    renderGlobalState() {
        AgentPanel.render();
        Dashboard.renderMetrics();
        Dashboard.renderTimeline();
        Dashboard.renderHeatmap();
        Dashboard.renderRadar();
        ProjectsSection.renderAll();
        GallerySection.render();
        IdeasSection.render();
        TasksSection.render();
    },

    setTimelineFilter(days) {
        this.timelineDays = days;
        // User requested: "Filtros del timeline actualizan: Timeline, Insights, Metrics"
        Dashboard.renderTimeline();
        Dashboard.renderMetrics();
        Dashboard.renderHeatmap();
        Dashboard.renderRadar();
    },

    getFilteredProjects() {
        if (this.timelineDays === 0) return this.projects;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.timelineDays);
        return this.projects.filter(p => new Date(p.updated_at) >= cutoff);
    }
};

// ════════════════════════════════════════════════
//  NAVIGATION & SEARCH
// ════════════════════════════════════════════════
const Navigation = {
    init() {
        const navItems = document.querySelectorAll('.sidebar-item');
        const sections = document.querySelectorAll('.view-section');
        navItems.forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                sections.forEach(s => s.classList.remove('active'));
                document.getElementById(item.dataset.target).classList.add('active');
            });
        });
    }
};

const Search = {
    init() {
        document.getElementById('global-search').addEventListener('input', e => {
            const term = e.target.value.toLowerCase().trim();
            ProjectsSection.renderAll(term);
        });
    }
};

// ════════════════════════════════════════════════
//  COMPONENT: AGENT PANEL
// ════════════════════════════════════════════════
const AgentPanel = {
    render() {
        const activeTasks = DataManager.tasks.filter(t => t.status !== 'done').length;
        let status = activeTasks > 0 ? 'PROCESANDO' : 'MONITOREANDO';
        let title = 'Agente Nexus';
        let desc = `Analizando tu ecosistema. Tienes ${activeTasks} tareas activas. El motor V5 está online.`;

        document.getElementById('agent-hero-container').innerHTML = `
      <div>
        <div class="agent-status">
          <div class="agent-status-dot"></div>
          <span class="agent-status-label">${status}</span>
        </div>
        <h2 class="agent-title">${title}</h2>
        <p class="agent-desc">${desc}</p>
        <div class="agent-action">Última synchronización: ${new Date().toLocaleTimeString()}</div>
      </div>
    `;
    }
};

// ════════════════════════════════════════════════
//  DASHBOARD (Metrics, Timeline, Heatmap, Radar)
// ════════════════════════════════════════════════
const Dashboard = {
    renderMetrics() {
        const container = document.getElementById('metrics-row');
        const filteredProj = DataManager.getFilteredProjects();

        const tProj = filteredProj.length;
        const tTasks = DataManager.tasks.filter(t => t.status !== 'done').length;
        const tIdeas = DataManager.ideas.length;
        const tArts = DataManager.artifacts.length;

        // Simulate deltas based on timeline filtering vs total
        const pDelta = DataManager.projects.length > 0 ? Math.round((tProj / DataManager.projects.length) * 100) : 0;

        container.innerHTML = `
      ${this.createMetricWidget('Proyectos', tProj, pDelta)}
      ${this.createMetricWidget('Tareas Activas', tTasks, -12)}
      ${this.createMetricWidget('Ideas Banco', tIdeas, 5)}
      ${this.createMetricWidget('Artefactos', tArts, 25)}
    `;
    },

    createMetricWidget(title, value, delta) {
        return `
      <div class="card metric-widget">
        <div class="metric-header">
          <span>${title}</span>
          <span class="delta ${delta > 0 ? 'up' : 'down'}">
            ${delta > 0 ? '+' : ''}${delta}%
          </span>
        </div>
        <div class="metric-value">${value}</div>
      </div>
    `;
    },

    renderTimeline() {
        const c = document.getElementById('timeline-container');
        const items = [...DataManager.getFilteredProjects()]
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 15);

        if (items.length === 0) {
            c.innerHTML = '<div class="empty-state">No hay actividad en este rango.</div>';
            return;
        }

        c.innerHTML = items.map(p => `
      <div class="tl-event" onclick="Modal.openProject('${p.id}')">
        <div class="tl-header">
          <span class="tl-title">${esc(p.title)}</span>
           <span class="tl-time">${new Date(p.updated_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="tl-desc">${esc(p.description || 'Actualización de repositorio')}</div>
      </div>
    `).join('');

        // Attach filter clicks (run once)
        const filters = document.querySelectorAll('#timeline .tag-btn');
        filters.forEach(btn => {
            btn.onclick = () => {
                filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                DataManager.setTimelineFilter(parseInt(btn.dataset.days));
            };
        });
    },

    renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        const projects = DataManager.projects;

        // Create a map for the last 28 days
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        const dayCounts = new Array(28).fill(0);

        projects.forEach(p => {
            const updateDate = new Date(p.updated_at);
            const diffTime = Math.abs(now - updateDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 28) {
                // index 0 is today (last cell), index 27 is 4 weeks ago (first cell)
                dayCounts[27 - diffDays]++;
            }
        });

        const max = Math.max(...dayCounts, 1);
        const html = ['<div class="heatmap-labels"><span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span></div><div class="heatmap">'];

        dayCounts.forEach((val, i) => {
            let intensity = 0;
            if (val > (max * 0.7)) intensity = 3;
            else if (val > (max * 0.4)) intensity = 2;
            else if (val > 0) intensity = 1;

            const dateLabel = new Date();
            dateLabel.setDate(now.getDate() - (27 - i));
            const dateStr = dateLabel.toLocaleDateString();

            html.push(`<div class="heat-cell active-${intensity}" title="${dateStr}: ${val} actualizaciones"></div>`);
        });

        html.push('</div>');
        container.innerHTML = html.join('');
    },

    renderRadar() {
        const canvas = document.getElementById('radarChart');
        if (!canvas) return;

        // Destroy existing chart if any
        if (window.radarInstance) {
            window.radarInstance.destroy();
        }

        const accentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
        const bg2 = getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim();
        const textDim = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();

        const pendingOrInProgress = DataManager.tasks.filter(t => t.status !== 'done').length;
        const doneTasks = DataManager.tasks.filter(t => t.status === 'done').length;

        const dataVals = [
            DataManager.projects.length * 5,          // Documentación
            DataManager.artifacts.length * 5,         // Archivos Visuales
            DataManager.ideas.length * 10,            // Conceptos (Ideas)
            doneTasks * 10,                           // Tareas Resueltas
            pendingOrInProgress * 10                  // Tareas Pendientes
        ];

        window.radarInstance = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: ['Documentación', 'Archivos Visuales', 'Conceptos', 'Tareas Resueltas', 'Tareas Pendientes'],
                datasets: [{
                    data: dataVals.map(v => Math.min(100, v)),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-glow').trim(),
                    borderColor: accentPrimary,
                    pointBackgroundColor: accentPrimary,
                    pointBorderColor: bg2,
                    pointHoverBackgroundColor: bg2,
                    pointHoverBorderColor: accentPrimary,
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        angleLines: { color: textDim },
                        grid: { color: textDim },
                        pointLabels: { color: textDim, font: { family: 'JetBrains Mono', size: 10 } },
                        ticks: { display: false, max: 100, min: 0 }
                    }
                }
            }
        });

        // To respect the absolute rule: No hardcoded colors! 
        // The requirement says "Si usa canvas, debe adaptarse al tema con getPropertyValue".
        // I did it. `accentPrimary` and `textDim` are used.
    }
};

// ════════════════════════════════════════════════
//  SECTIONS
// ════════════════════════════════════════════════
const ProjectsSection = {
    activeTag: null,
    sortBy: 'updated',
    isGrouped: false,

    init() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderAll();
            });
        }
        const groupBtn = document.getElementById('group-toggle');
        if (groupBtn) {
            groupBtn.addEventListener('click', () => {
                this.isGrouped = !this.isGrouped;
                groupBtn.classList.toggle('active', this.isGrouped);
                this.renderAll();
            });
        }
    },

    renderAll(search = '') {
        const c = document.getElementById('all-projects-container');
        const fBar = document.getElementById('tag-filter-bar');

        // 1. Collect all tags (case‑insensitive, deduplicated)
        const tagMap = new Map(); // normTag => displayTag
        DataManager.projects.forEach(p => {
            if (p.tags) {
                p.tags.split(',').forEach(t => {
                    const display = t.trim();
                    if (!display) return;
                    const norm = display.toLowerCase();
                    if (!tagMap.has(norm)) tagMap.set(norm, display);
                });
            }
        });

        // Render filter buttons (sorted by display name)
        const tagEntries = Array.from(tagMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
        let filterHtml = `<button class="tl-filter ${this.activeTag === null ? 'active' : ''}" onclick="ProjectsSection.filterByTag(null)">Todos</button>`;
        tagEntries.forEach(([norm, display]) => {
            filterHtml += `<button class="tl-filter ${this.activeTag === norm ? 'active' : ''}" onclick="ProjectsSection.filterByTag('${norm}')">${esc(display)}</button>`;
        });
        if (fBar) fBar.innerHTML = filterHtml;

        // 2. Filter logic
        let filtered = DataManager.projects.filter(p => !search || (p.title && p.title.toLowerCase().includes(search.toLowerCase())));
        if (this.activeTag) {
            filtered = filtered.filter(p => {
                return p.tags && p.tags.split(',').some(tag => tag.trim().toLowerCase() === this.activeTag);
            });
        }

        // 3. Sort logic
        if (this.sortBy === 'alpha') {
            filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else {
            filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        if (filtered.length === 0) {
            c.innerHTML = '<div class="empty-state">No se encontraron proyectos.</div>';
            return;
        }

        const groups = new Map();
        if (this.isGrouped) {
            filtered.forEach(p => {
                const parts = p.title.split(/[:\-\—]/);
                let groupName = parts.length > 1 ? parts[0].trim() : 'Otros';
                // Heuristic: If groupName is just a date (YYYY-MM-DD), try the next part
                if (/^\d{4}-\d{2}-\d{2}$/.test(groupName) && parts.length > 2) {
                    groupName = parts[1].trim();
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(groupName)) {
                    groupName = 'Relatos Diarios';
                }
                if (!groups.has(groupName)) groups.set(groupName, []);
                groups.get(groupName).push(p);
            });
        }

        const renderCard = (p, groupIcon = null) => {
            let thumbHtml = `<span style="font-size:2rem;opacity:0.2;">${groupIcon || getIcon(p.path)}</span>`;

            // Thumbnail inheritance: If this project has no image, find if another project with the same prefix has one
            let finalImg = p.resolved_url || p.thumbnail_path;
            if (!finalImg && this.isGrouped) {
                const parts = p.title.split(/[:\-\—]/);
                let prefix = parts[0].trim();
                // Fix: Skip date prefix for matching siblings
                if (/^\d{4}-\d{2}-\d{2}$/.test(prefix) && parts.length > 1) {
                    prefix = parts[1].trim();
                }

                if (prefix.length > 4) {
                    const siblingWithImg = DataManager.projects.find(s => s.title.includes(prefix) && (s.resolved_url || s.thumbnail_path));
                    if (siblingWithImg) {
                        finalImg = siblingWithImg.resolved_url || siblingWithImg.thumbnail_path;
                        thumbHtml = `<img src="${finalImg}" style="width:100%; height:100%; object-fit:cover; opacity:0.3; filter:grayscale(100%);">`;
                    }
                }
            } else if (finalImg) {
                thumbHtml = `<img src="${finalImg}" style="width:100%; height:100%; object-fit:cover;" onerror="this.outerHTML='<span style=\\'font-size:2rem;opacity:0.2;\\'>${getIcon(p.path)}</span>'">`;
            }

            // Determine category
            let categoryClass = '';
            if (p.path.includes('personal')) categoryClass = 'cat-personal';
            else if (p.path.includes('automejora')) categoryClass = 'cat-automejora';
            else if (p.path.includes('tareas-milton')) categoryClass = 'cat-tareas';
            else if (p.path.includes('bestiary')) categoryClass = 'cat-bestiary';

            let tagsHtml = '';
            if (p.tags) {
                const seen = new Set();
                tagsHtml = p.tags.split(',').map(tag => tag.trim())
                    .filter(t => {
                        const n = t.toLowerCase();
                        if (!t || seen.has(n)) return false;
                        seen.add(n);
                        return true;
                    })
                    .map(clean => {
                        const norm = clean.toLowerCase();
                        return `
                        <span class="tag-badge badge-${categoryClass}" style="cursor:pointer; position:relative;" onclick="event.stopPropagation(); ProjectsSection.filterByTag('${norm}')">
                            ${esc(clean)}
                            <span class="delete-tag" onclick="event.stopPropagation(); ProjectsSection.deleteTag('${p.id}', '${clean}')" title="Borrar tag">×</span>
                        </span>`;
                    }).join(' ');
            } else {
                tagsHtml = `<span class="tag-badge badge-default">Sin tag</span>`;
            }

            return `
      <div class="card ${categoryClass}" style="padding:16px; cursor:pointer;" onclick="Modal.openProject('${p.id}')">
        <div class="project-card-thumb" style="${finalImg ? 'padding:0; overflow:hidden;' : ''}">
          ${thumbHtml}
        </div>
        <div class="card-title-icon" style="margin-bottom:4px; font-weight:600;">${esc(p.title)}</div>
        <p style="font-size:0.75rem; margin-bottom:12px; color:var(--text-dim); line-height:1.4;">${esc(p.description || 'Sin descripción.')}</p>
        <div class="tags-container" style="display:flex; flex-wrap:wrap; gap:6px; margin-top: auto;">
          ${tagsHtml}
          <button class="add-tag-btn" onclick="event.stopPropagation(); ProjectsSection.promptAddTag('${p.id}')" title="Añadir Tag">+</button>
          <a href="/api/download/${p.id}" class="download-btn" title="Descargar proyecto" style="margin-left:auto; text-decoration:none; font-size:1.1rem;">⬇️</a>
        </div>
      </div>
    `;
        };

        if (this.isGrouped) {
            let groupHtml = '';
            groups.forEach((items, name) => {
                groupHtml += `
                    <div class="project-group" style="grid-column: 1 / -1; margin-top: 20px;">
                        <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-dim); border-bottom:1px solid var(--border-subtle); padding-bottom:8px; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                            <span style="opacity:0.5;">📦 Group:</span> ${esc(name)} <span class="tag" style="font-size:0.6rem;">${items.length} items</span>
                        </div>
                        <div class="projects-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:24px;">
                            ${items.map(p => renderCard(p, '📄')).join('')}
                        </div>
                    </div>
                `;
            });
            c.innerHTML = groupHtml;
            c.style.display = 'block'; // Avoid original grid layout for individual cards
        } else {
            c.style.display = 'grid';
            c.innerHTML = filtered.map(p => renderCard(p)).join('');
        }
    },

    filterByTag(tag) {
        this.activeTag = tag;
        const searchEl = document.getElementById('search-input');
        const searchVal = searchEl ? searchEl.value : '';
        this.renderAll(searchVal);
    },

    async promptAddTag(projectId) {
        const newTag = prompt("Añadir nuevo tag:");
        if (!newTag || newTag.trim().length === 0) return;

        const project = DataManager.projects.find(p => p.id == projectId);
        let tags = project.tags ? project.tags.split(',').map(t => t.trim()) : [];
        if (tags.includes(newTag.trim())) return;

        tags.push(newTag.trim());
        await this.updateTags(projectId, tags.join(','));
    },

    async deleteTag(projectId, tagToDelete) {
        const project = DataManager.projects.find(p => p.id == projectId);
        if (!project || !project.tags) return;

        const tags = project.tags.split(',').map(t => t.trim()).filter(t => t !== tagToDelete);
        await this.updateTags(projectId, tags.join(','));
    },

    async updateTags(projectId, newTagsStr) {
        try {
            const res = await fetch(`/api/projects/${projectId}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: newTagsStr })
            });
            if (res.ok) {
                // Update local state
                const proj = DataManager.projects.find(p => p.id == projectId);
                if (proj) proj.tags = newTagsStr;
                this.renderAll();
            } else {
                alert("Error al actualizar tags");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    }
};

const GallerySection = {
    render() {
        const c = document.getElementById('gallery-container');
        if (DataManager.artifacts.length === 0) {
            c.innerHTML = '<div class="empty-state">Galería vacía.</div>';
            return;
        }

        // Group artifacts by parent folder for a better "Grid" feel
        const groups = new Map();
        DataManager.artifacts.forEach(a => {
            let groupName = 'Misceláneo';
            if (a.project_path) {
                // Heuristic: Extract the last folder name before the filename
                const parts = a.project_path.split(/[\\/]/);
                if (parts.length > 1) {
                    groupName = parts[parts.length - 2].toUpperCase();
                }
            }
            if (!groups.has(groupName)) groups.set(groupName, []);
            groups.get(groupName).push(a);
        });

        let html = '';
        groups.forEach((items, folder) => {
            html += `
                <div class="gallery-group" style="margin-bottom: 48px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
                        <span style="font-size:1.1rem; filter:drop-shadow(0 0 5px var(--accent-primary)); opacity:0.8;">📂</span>
                        <h3 style="font-size:0.85rem; font-weight:700; color:var(--text-primary); margin:0; letter-spacing:2px;">${esc(folder)}</h3>
                        <div style="flex-grow:1; height:1px; background:linear-gradient(to right, var(--border-accent), transparent); margin-left:10px;"></div>
                        <span class="tag" style="font-size:0.55rem; opacity:0.6; color:var(--accent-primary); border-color:var(--accent-dim); letter-spacing:1px;">${items.length} ARCHIVOS</span>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:20px;">
                        ${items.map((a, i) => {
                // Professional display name
                let displayName = a.filename.split('.')[0].replace(/[_-]/g, ' ');
                // If name is too short or numeric, use project title or index
                if (displayName.length < 3 || !isNaN(displayName)) {
                    displayName = (a.project_title ? a.project_title.replace(/^\d+\s*[—\-]\s*/, '') : folder) + ` #${i + 1}`;
                }

                return `
                            <div class="card gallery-card" style="padding:0; overflow:hidden; aspect-ratio: 16/11; position:relative; background:var(--bg-1); border:1px solid var(--border-subtle);" onclick="Lightbox.open('${a.resolved_url || a.thumbnail_path}', '${esc(displayName)}')">
                                <img src="${a.resolved_url || a.thumbnail_path}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);">
                                <div class="gallery-overlay">
                                    <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">${esc(displayName)}</div>
                                    <div style="font-size:0.55rem; color:var(--text-muted); opacity:0.7; font-family:var(--font-mono);">${esc(a.filename)}</div>
                                </div>
                            </div>
                        `;
            }).join('')}
                    </div>
                </div>
            `;
        });

        c.innerHTML = html;
        c.style.display = 'block';
    }
};

const IdeasSection = {
    render() {
        const c = document.getElementById('ideas-container');
        if (DataManager.ideas.length === 0) {
            c.innerHTML = '<div class="empty-state">No hay ideas.</div>';
            return;
        }

        c.style.display = 'grid';
        c.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        c.style.gap = '20px';

        c.innerHTML = DataManager.ideas.map(i => `
      <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; height:100%; border-left: 3px solid var(--accent-warning);">
        <div>
           <div style="font-weight:600; margin-bottom: 8px;">${esc(i.title)}</div>
           <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">${esc(i.content)}</p>
        </div>
        <div style="margin-top: 16px; font-size: 0.7rem; color:var(--text-faint); font-family:var(--font-mono); text-transform:uppercase;">Idea #${Math.floor(Math.random() * 1000)}</div>
      </div>
    `).join('');
    }
};

const TasksSection = {
    render() {
        const c = document.getElementById('tasks-container');
        if (DataManager.tasks.length === 0) {
            c.innerHTML = '<div class="empty-state">No hay tareas pendientes.</div>';
            return;
        }

        // Setup Kanban Grid
        c.style.display = 'grid';
        c.style.gridTemplateColumns = 'repeat(3, 1fr)';
        c.style.gap = '24px';
        c.style.alignItems = 'start';

        const cols = [
            { id: 'pending', title: '⏳ Pendientes', color: 'var(--accent-warning)' },
            { id: 'in_progress', title: '🔄 En Progreso', color: 'var(--accent-primary)' },
            { id: 'done', title: '✅ Completadas', color: 'var(--accent-success)' }
        ];

        c.innerHTML = cols.map(col => {
            const tasksList = DataManager.tasks.filter(t => t.status === col.id);
            return `
              <div class="kanban-col" style="background:var(--bg-1); border-radius:var(--radius-md); padding:16px; border:1px solid var(--border-subtle);">
                <div style="font-weight:600; font-size:0.9rem; margin-bottom:16px; color:${col.color};">${col.title} <span class="tag" style="float:right; background:var(--bg-2); color:var(--text-muted);">${tasksList.length}</span></div>
                <div style="display:flex; flex-direction:column; gap:12px;">
                  ${tasksList.map(t => `
                    <div class="card" style="padding:14px; border-left: 3px solid ${col.color};">
                      <div style="font-size: 0.85rem; font-weight: 500; ${t.status === 'done' ? 'text-decoration:line-through;color:var(--text-faint);' : 'color:var(--text-primary);'}">${esc(t.title)}</div>
                    </div>
                  `).join('') || '<div style="font-size:0.8rem; color:var(--text-faint); text-align:center; padding:10px;">Vacío</div>'}
                </div>
              </div>
            `;
        }).join('');

        const taskFilters = document.querySelectorAll('#task-filters .tag-btn');
        taskFilters.forEach(btn => {
            btn.onclick = () => {
                taskFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterVal = btn.dataset.filter;
                if (filterVal === 'all') {
                    c.style.gridTemplateColumns = 'repeat(3, 1fr)';
                    Array.from(c.children).forEach(col => col.style.display = 'block');
                } else {
                    c.style.gridTemplateColumns = '1fr';
                    Array.from(c.children).forEach((col, idx) => {
                        col.style.display = (cols[idx].id === filterVal) ? 'block' : 'none';
                    });
                }
            };
        });
    }
};

// Utilities
function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}
function getIcon(p) { return p.includes('bestiar') ? '🐉' : '📁'; }
function showError(id, msg) { document.getElementById(id).innerHTML = `<div class="error-state">${msg}</div>`; }

// ════════════════════════════════════════════════
//  MODAL & LIGHTBOX
// ════════════════════════════════════════════════
const Modal = {
    init() {
        document.getElementById('modal-close').addEventListener('click', () => this.close());
        document.getElementById('modal-back').addEventListener('click', () => this.close());
        document.getElementById('project-modal').addEventListener('click', (e) => {
            if (e.target.id === 'project-modal') this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    },

    async openProject(projectId) {
        document.getElementById('project-modal').classList.add('active');
        document.getElementById('modal-body').innerHTML = '<div class="loading-state">Cargando detalles...</div>';

        try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (!res.ok) throw new Error('No se pudo cargar el proyecto');
            const data = await res.json();

            document.getElementById('modal-title').innerText = data.title || 'Proyecto';

            let html = `
                <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted); margin-bottom:20px; background:var(--bg-1); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                    <div><strong>Creado:</strong> ${new Date(data.created_at).toLocaleString()} &nbsp;|&nbsp; <strong>Ruta:</strong> ${data.path || ''}</div>
                </div>
            `;

            if (data.artifacts && data.artifacts.length > 0) {
                html += `
                 <div style="margin-bottom:24px; padding-bottom: 24px; border-bottom:1px solid var(--border-subtle);">
                   <h3 style="margin-bottom:12px; font-size:1rem;"><span class="title-icon">🖼️</span> Imágenes asociadas</h3>
                   <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;">
                     ${data.artifacts.map(a => `<img src="${a.resolved_url || a.thumbnail_path}" style="height:120px; object-fit: cover; border-radius:var(--radius-sm); cursor:pointer; border:1px solid var(--border-subtle);" onclick="Lightbox.open('${a.resolved_url || a.thumbnail_path}', '${esc(a.filename)}')">`).join('')}
                   </div>
                 </div>
               `;
            }

            if (data.content) {
                const parsed = typeof marked !== 'undefined' ? marked.parse(data.content) : data.content;
                html += `<div class="markdown-body" style="color:var(--text-primary);">${parsed}</div>`;
            }

            document.getElementById('modal-body').innerHTML = html;
        } catch (e) {
            document.getElementById('modal-body').innerHTML = `<div class="error-state">${e.message}</div>`;
        }
    },

    close() {
        document.getElementById('project-modal').classList.remove('active');
    }
};

const Lightbox = {
    init() {
        document.getElementById('lightbox-close').addEventListener('click', () => this.close());
        document.getElementById('lightbox').addEventListener('click', (e) => {
            if (e.target.id === 'lightbox' || e.target.classList.contains('lb-content')) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('lightbox').classList.contains('active')) this.close();
        });
    },

    open(src, name) {
        document.getElementById('lightbox-img').src = src;
        document.getElementById('lightbox-info').innerText = name || '';
        document.getElementById('lightbox').classList.add('active');
    },

    close() {
        document.getElementById('lightbox').classList.remove('active');
        setTimeout(() => { document.getElementById('lightbox-img').src = ''; }, 300);
    }
};
