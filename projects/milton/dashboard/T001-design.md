# T001 — Dashboard Web Interno

*Diseño técnico y propuesta de implementación*

---

## Resumen Ejecutivo

**Objetivo:** Dashboard auto-actualizable para visualizar planificación, proyectos, ideas, investigaciones e imágenes generadas. Solo accesible en red interna (localhost/LAN).

**Alcance (MVP):**
- [ ] Vista de proyectos activos con estado y prioridad
- [ ] Timeline de actividades recientes
- [ ] Galería de imágenes generadas
- [ ] Sección de ideas/notas rápidas
- [ ] Actualización automática (polling o WebSocket)

---

## Opciones Técnicas Evaluadas

### Opción A: Static Site (Astro + iframe de Canvas)
| Aspecto | Valoración |
|---------|------------|
| **Pros** | Simple, rápido, puede servirse desde cualquier lugar |
| **Contras** | Sin estado real-time, Necesita rebuild para actualizar |
| **Stack** | Astro (SSG) + Tailwind + Canvas snapshot integrado |
| **Serving** | Nginx, Python http.server, o npx serve |
| **Complejidad** | Baja |

### Opción B: Node + Express + SSE (Server-Sent Events)
| Aspecto | Valoración |
|---------|------------|
| **Pros** | Real-time updates, API sencilla, familiar (JS) |
| **Contras** | Requiere Node corriendo, más complejidad |
| **Stack** | Node + Express + SSE + HTML vanilla/Tailwind |
| **Serving** | `node server.js` en puerto local |
| **Complejidad** | Media |

### Opción C: Single File con Live Reload
| Aspecto | Valoración |
|---------|------------|
| **Pros** | Un solo archivo HTML, zero dependencies |
| **Contras** | Funcionalidad limitada, polling HTTP básico |
| **Stack** | HTML5 + CSS + vanilla JS + fetch |
| **Serving** | Python `http.server` simple |
| **Complejidad** | Muy baja |

---

## Recomendación: Opción B (Node + Express + SSE)

**Justificación:**
1. **Real-time:** SSE permite push de actualizaciones desde el servidor al cliente
2. **FamiliSridad:** Milton usa Node/React regularmente
3. **Extensible:** Fácil agregar endpoints nuevos
4. **LAN-only:** Binding a `0.0.0.0` en puerto local (ej: 3000) con firewall

### Estructura Propuesta
```
dashboard/
├── server.js          # Express + SSE endpoint
├── public/
│   ├── index.html     # UI principal
│   ├── style.css      # TailwindCDN o custom
│   └── app.js         # Cliente SSE + render
├── data/
│   └── projects.json  # Feed de datos (actualizado por agente)
└── README.md
```

### Endpoints API
| Método | Ruta | Descripción |
|----------|------|-------------|
| GET | `/` | Dashboard UI |
| GET | `/api/projects` | Lista proyectos activos |
| GET | `/api/activity` | Actividad reciente (últimas 20) |
| GET | `/api/images` | Lista imágenes generadas |
| GET | `/api/stream` | SSE stream de actualizaciones |
| POST | `/api/refresh` | Trigger manual de actualización |

### Datos de Origen
El agente (yo) escribirá periódicamente a:
- `dashboard/data/projects.json` — Extraído de MEMORY.md y project indexes
- `dashboard/data/activity.json` — Log de acciones recientes
- `dashboard/data/images.json` — Inventario de generaciones

---
## Seguridad (LAN-only)

### Configuración Red
```bash
# Binding solo a interfaces locales o LAN
server.listen(3000, '0.0.0.0');  # LAN access
# o
server.listen(3000, '127.0.0.1'); # Solo localhost
```

### Recomendaciones
- Puerto alto no privilegiado (>1024)
- Firewall: solo IPs de LAN permitidas
- Opcional: Basic Auth con express-basic-auth
- NO exponer a internet público

---

## Plan de Implementación

### Fase 1: Setup (15 min)
- [ ] Crear estructura de carpetas
- [ ] package.json con express
- [ ] server.js básico con Express

### Fase 2: UI Estática (30 min)
- [ ] index.html con layout básico
- [ ] CSS grid para widgets
- [ ] Placeholders para proyectos/actividad/imágenes

### Fase 3: API + SSE (30 min)
- [ ] Endpoint /api/projects
- [ ] Endpoint /api/stream (SSE)
- [ ] Cliente SSE en app.js

### Fase 4: Integración de Datos (30 min)
- [ ] Script para exportar MEMORY.md → JSON
- [ ] Agregar endpoints de imágenes
- [ ] Test streaming

### Fase 5: Polish (15 min)
- [ ] Mejorar UI con Tailwind
- [ ] Auto-refresh visual
- [ ] Documentación

**Total estimado:** ~2 horas de trabajo de desarrollo

---

## Decisiones Pendientes

| Decisión | Opciones | Preferencia |
|----------|----------|-------------|
| Framework CSS | TailwindCDN vs Bootstrap vs vanilla | TailwindCDN |
| Refresh rate | SSE push vs polling 10s vs manual | SSE push |
| Datos en vivo | JSON files vs SQLite vs memory | JSON files |
| Hosting | Node directo vs Docker vs static | Node directo |

---

## Próximo Paso

**¿Milton aprueba Opción B (Node + Express + SSE)?**

Si sí:
1. Procedo a implementar Fase 1-2 en los próximos 30 minutos asignados
2. Luego vuelvo a Bestiario (Race Condition)

Si prefiere otra opción:
1. Ajustar diseño
2. Replanificar

---

*Diseño preparado para revisión — 2026-02-26 17:05 UTC*
