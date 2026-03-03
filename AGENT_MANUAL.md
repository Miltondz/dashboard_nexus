# 🤖 AGENT OPERATIONS MANUAL — Dashboard Nexus V5

> **Versión:** 2.0 — Marzo 2026
> **Propósito:** Guía completa de operación para el agente IA que gestiona el Dashboard Nexus V5.

---

## 📡 CONEXIÓN Y ACCESO

| Dato           | Valor                                                    |
|----------------|----------------------------------------------------------|
| Dashboard URL  | `http://localhost:3099`                                  |
| API Base URL   | `http://localhost:3099/api/agent`                        |
| API Key Header | `X-Agent-API-Key: sk_nx_8021047a9fc44b6002dd54a5c4491f06cbb8cfeb1bf3eeb40c2fdbb7a389f986` |
| DB Path        | `~/openclaw/workspace/projects/milton/dashboard_v5/data/dashboard.db` |
| Workspace Root | `~/openclaw/workspace/projects/`                         |

### Verificar conexión
```bash
curl -s http://localhost:3099/api/agent/status \
  -H "X-Agent-API-Key: sk_nx_8021047a9fc44b6002dd54a5c4491f06cbb8cfeb1bf3eeb40c2fdbb7a389f986"
```
Respuesta esperada: `{"status":"ok","agent":"connected"}`

---

## 📂 ESTRUCTURA DE CARPETAS VIGILADAS

El Indexer monitorea estas carpetas en tiempo real (watcher activo con chokidar):

```
~/openclaw/workspace/projects/
├── personal/          → Proyectos personales, stories, investigación
├── automejora/        → Proyectos de desarrollo personal y profesional
├── tareas-milton/     → Tareas y checklist del usuario Milton
└── milton/            → Proyectos generales del usuario
```

### Reglas del Indexer
1. Todo archivo `.md` es indexado como **Proyecto**.
2. Imágenes (`.jpg`, `.png`, `.webp`, `.gif`) en la **misma carpeta** que un `.md` se indexan como **Artefacto** de ese proyecto.
3. Si hay múltiples `.md` en una carpeta, las imágenes se asignan según menciones explícitas en el Markdown o por prefijo de nombre de archivo.
4. Las miniaturas (thumbnails) se generan automáticamente al indexar (`thumb_*.webp`).
5. Los cambios (crear, modificar, eliminar) se procesan en tiempo real.

---

## 📝 CREAR O MODIFICAR PROYECTOS

### Formato obligatorio del Front-matter
Todo archivo `.md` **DEBE** comenzar con este bloque YAML:

```yaml
---
title: "Título del Proyecto"
description: "Descripción breve visible en la tarjeta del dashboard"
tags: ["IA", "Research", "Story"]
status: "active"          # Opcional: active | archived | draft
priority: "high"          # Opcional: high | medium | low
---

Contenido del proyecto en Markdown aquí...
```

### Categorías de tags recomendados
Usar siempre las mismas para mantener los filtros ordenados:

| Tag          | Uso                                         |
|--------------|---------------------------------------------|
| `IA`         | Proyectos relacionados con inteligencia artificial |
| `Research`   | Investigación y documentación               |
| `Story`      | Narrativa, worldbuilding, ficción           |
| `Creative`   | Arte, diseño, proyectos visuales            |
| `Task`       | Listas de tareas y gestión                  |
| `System`     | Configuración, herramientas, automatización |
| `Bestiary`   | Criaturas del Bestiarium Technologicum      |
| `Personal`   | Desarrollo personal                         |

### Crear proyecto simple (sin imágenes)
```bash
cat > ~/openclaw/workspace/projects/personal/mi-proyecto.md << 'EOF'
---
title: "Mi Nuevo Proyecto"
description: "Descripción breve"
tags: ["Research", "IA"]
---

## Contenido
Tu texto aquí...
EOF
```

### Crear proyecto con imágenes (carpeta)
```bash
# CORRECTO: Crear carpeta dedicada
mkdir -p ~/openclaw/workspace/projects/personal/criatura-x/
# Guardar el markdown y la imagen EN LA MISMA carpeta
cp imagen.jpg ~/openclaw/workspace/projects/personal/criatura-x/criatura-x.jpg
cat > ~/openclaw/workspace/projects/personal/criatura-x/criatura-x.md << 'EOF'
---
title: "Criatura X"
description: "Una entidad del Bestiarium"
tags: ["Bestiary", "Creative"]
---
![Criatura X](criatura-x.jpg)
Descripción detallada...
EOF
```

---

## 🔌 API ENDPOINTS COMPLETA

### `GET /api/agent/status`
Verifica la conexión y el estado del agente.
```bash
curl http://localhost:3099/api/agent/status \
  -H "X-Agent-API-Key: sk_nx_..."
```

### `POST /api/agent/ideas`
Registra una idea o concepto semilla en el Banco de Ideas.
```bash
curl -X POST http://localhost:3099/api/agent/ideas \
  -H "Content-Type: application/json" \
  -H "X-Agent-API-Key: sk_nx_..." \
  -d '{
    "title": "Título de la idea",
    "content": "Desarrollo detallado de la idea...",
    "tags": ["IA", "Research"]
  }'
```

### `POST /api/agent/tasks`
Registra una tarea en el checklist global.
```bash
curl -X POST http://localhost:3099/api/agent/tasks \
  -H "Content-Type: application/json" \
  -H "X-Agent-API-Key: sk_nx_..." \
  -d '{
    "title": "Descripción de la tarea",
    "status": "pending",
    "due_date": "2026-03-15"
  }'
```
**Valores de `status`:** `pending` | `in_progress` | `done`

### `PATCH /api/agent/tasks/:id`
Actualiza el estado de una tarea existente.
```bash
curl -X PATCH http://localhost:3099/api/agent/tasks/5 \
  -H "Content-Type: application/json" \
  -H "X-Agent-API-Key: sk_nx_..." \
  -d '{"status": "done"}'
```

### `GET /api/projects`
Lista todos los proyectos indexados.
```bash
curl http://localhost:3099/api/projects \
  -H "X-Agent-API-Key: sk_nx_..."
```

### `GET /api/stats`
Obtiene métricas generales en tiempo real.
```bash
curl http://localhost:3099/api/stats
```
Respuesta:
```json
{
  "projects": 12,
  "artifacts": 45,
  "tasks": 8,
  "pendingTasks": 3,
  "ideas": 22,
  "lastWeekActivity": 5
}
```

---

## 📊 CONSULTAS DIRECTAS A LA BASE DE DATOS

Cuando la API no es suficiente, puedes consultar directamente SQLite:

```bash
DB="~/openclaw/workspace/projects/milton/dashboard_v5/data/dashboard.db"

# Ver todos los proyectos
sqlite3 $DB "SELECT id, title, tags FROM projects ORDER BY updated_at DESC LIMIT 10;"

# Ver tareas pendientes
sqlite3 $DB "SELECT id, title, due_date FROM tasks WHERE status='pending';"

# Ver ideas recientes
sqlite3 $DB "SELECT id, title, created_at FROM ideas ORDER BY created_at DESC LIMIT 5;"

# Contar artefactos por proyecto
sqlite3 $DB "SELECT project_id, COUNT(*) as total FROM artifacts GROUP BY project_id;"
```

---

## 🖼️ GALERÍA Y ARTEFACTOS

### Reglas de asociación imagen → proyecto
1. **Prioridad 1 — Mención directa:** La imagen está referenciada con `![alt](imagen.jpg)` en el `.md`.
2. **Prioridad 2 — Prefijo de nombre:** `criatura-x.jpg` se asocia a `criatura-x.md`.
3. **Prioridad 3 — Único .md en carpeta:** Si solo hay un `.md` en la carpeta, todas las imágenes le pertenecen.

### Actualizar una imagen existente
Simplemente **reemplaza el archivo** con el mismo nombre. El watcher detectará el cambio, re-indexará y regenerará el thumbnail automáticamente. No es necesario borrar el registro anterior.

### Formatos soportados
- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

---

## ✅ GESTIÓN DE TAREAS

### Estados del ciclo de vida
```
pending → in_progress → done
```

### Buenas prácticas
- Siempre incluir `due_date` para que aparezcan en el calendario del dashboard.
- Usar títulos descriptivos y accionables: "Escribir capítulo 3 de Bestiarium" en vez de "Capítulo 3".
- Al completar una tarea del archivo `.md` en `tareas-milton/`, actualizar también el estado vía API para mantener la BD sincronizada.

---

## 💡 BANCO DE IDEAS

El Banco de Ideas es independiente del sistema de archivos. Se gestiona **exclusivamente** vía API.

### Cuándo usar ideas vs proyectos
| Banco de Ideas | Proyecto |
|----------------|----------|
| Concepto embrionario sin estructura | Trabajo con contenido desarrollado |
| Inspiración rápida que no merece carpeta aún | Tiene archivos, imágenes o múltiples documentos |
| Referencia futura ("investigar X en el futuro") | Trabajo activo o terminado |

---

## 🚨 REGLAS CRÍTICAS DEL AGENTE

1. **No resumir:** Guardar siempre el Markdown completo y detallado. No comprimir ideas.
2. **Case-sensitive:** Los nombres de archivo en Linux distinguen mayúsculas. `Imagen.JPG` ≠ `imagen.jpg`.
3. **No duplicar tags:** Usar `IA` consistentemente, nunca `ia`, `Ia` o `AI` mezclados.
4. **No modificar directamente la BD:** Usar siempre la API o el sistema de archivos. Editar SQLite manualmente puede romper el estado del dashboard.
5. **Confirmar antes de borrar:** Si el usuario pide eliminar un proyecto o tarea, confirmar antes de actuar.
6. **Esperar permiso para modificaciones estructurales:** No cambiar configuración del servidor, indexer o base de datos sin explicar el motivo y recibir aprobación explícita.

---

## 🔧 COMANDOS DE DIAGNÓSTICO

```bash
# Estado del servidor del dashboard
curl -s http://localhost:3099/health

# Ver log del indexer en tiempo real
screen -r indexer

# Ver log del dashboard en tiempo real
screen -r dashboard_v5

# Reiniciar el indexer
screen -S indexer -X stuff $'\003'
cd ~/openclaw/workspace/projects/milton/dashboard_v5
node scripts/indexer.js &

# Verificar que el puerto 3099 esté activo
ss -tlnp | grep 3099
```

---

## 🔁 FLUJO DE TRABAJO RECOMENDADO

```
1. Usuario pide crear un proyecto
        ↓
2. Determinar tipo:
   - ¿Solo texto? → Crear .md en carpeta adecuada
   - ¿Con imágenes? → Crear subcarpeta, guardar .md e imágenes juntos
        ↓
3. Escribir Front-matter completo (title, description, tags)
        ↓
4. El Indexer detecta el cambio automáticamente (≈ 2-3 segundos)
        ↓
5. Verificar con GET /api/projects o preguntando al usuario si se ve en dashboard
        ↓
6. Si hay tareas asociadas → POST /api/agent/tasks
7. Si hay ideas relacionadas → POST /api/agent/ideas
```

---

*Última actualización: Marzo 2026 — Dashboard Nexus V5*
