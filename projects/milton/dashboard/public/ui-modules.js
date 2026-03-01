const UIModules = {
    renderHome(container, stats) {
        container.innerHTML = `
            <h1>Dashboard de Control</h1>
            <div class="stats-dashboard">
                <div class="stat-card"><h3 style="color:var(--accent)">${stats.total}</h3><span>Eventos</span></div>
                <div class="stat-card"><h3 style="color:var(--accent-writing)">${stats.writing}</h3><span>Relatos</span></div>
                <div class="stat-card"><h3 style="color:var(--accent-research)">${stats.research}</h3><span>Estudios</span></div>
                <div class="stat-card"><h3 style="color:var(--accent-coding)">${stats.coding}</h3><span>Proyectos</span></div>
                <div class="stat-card"><h3 style="color:var(--accent-art)">${stats.art}</h3><span>Arte</span></div>
            </div>`;
    },

    renderGrid(container, title, items, tagColor) {
        container.innerHTML = `<h1>${title}</h1><div class="grid-layout">${items.map(item => `
            <div class="content-card" onclick="app.openReader('${item.uuid}')">
                <div class="card-tag" style="color:${tagColor}">${item.type?.toUpperCase()}</div>
                <div style="padding:20px">
                    <h3>${item.title || 'Sin título'}</h3>
                    <p style="color:#8b949e; font-size:0.9rem">${item.content?.substring(0, 120)}...</p>
                </div>
            </div>`).join('')}</div>`;
    },

    renderArt(container, artItems) {
        container.innerHTML = `<h1>🎨 Galería de Arte</h1><div class="art-grid">${artItems.map(item => `
            <div class="art-card" style="background:var(--bg-panel); border:1px solid var(--border)">
                <img src="${item.media?.url || 'https://via.placeholder.com/400'}" alt="${item.title}">
                <div style="padding:15px"><h4>${item.title}</h4></div>
            </div>`).join('')}</div>`;
    },

    renderTasks(container, tasks) {
        container.innerHTML = `<h1>✅ Tareas</h1><div class="task-list">${tasks.map(t => `
            <div class="stat-card" style="text-align:left; margin-bottom:15px; border-left:4px solid var(--accent)">
                <strong>${t.title}</strong><div>${marked.parse(t.content || '')}</div>
            </div>`).join('')}</div>`;
    }
};
