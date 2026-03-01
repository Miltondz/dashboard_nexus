# 🌌 Dashboard Nexus (V5)

**Dashboard Nexus** is a professional, high-performance project management system meticulously designed for creators and AI-driven workflows. It serves as a central "Zen Minimalist" hub to organize cross-category content, track visual progress, and provide a secure, authenticated bridge for AI agents.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=Dashboard+Nexus+V5+Interface)

## ✨ Core Philosophy
- **Aesthetic Excellence:** A custom dark theme with glassmorphism, accent glows, and fluid transitions for a premium "OS-like" feel.
- **Agent-First Architecture:** Built from the ground up for AI integration. It treats AI as a first-class citizen with dedicated endpoints for data ingestion and status retrieval.
- **Data Sovereignty:** Content is strictly file-based (Markdown) with a localized SQLite3 bridge for speed, ensuring your data is always portable.

---

## 🚀 Key Features

### 🖼️ Intelligent Visuals
- **Dynamic Project Indexing:** Automatically categorizes work into `Bestiary`, `Research`, `Stories`, and `Personal` based on folder heuristics.
- **The "Smart Gallery":** Groups images by project folder. Includes on-hover metadata overlays and a fixed 16:11 aspect ratio for a pristine grid layout.
- **Thumbnail Inheritance:** Intelligent thumbnail logic where projects sharing a title prefix (e.g., "001 — ") can inherit cover art from siblings, ensuring no project card looks empty.

### 🏷️ Content & Metadata
- **Live Tag Management:** Add or delete tags directly from the UI. The Nexus engine automatically synchronizes these changes back to the physical **Markdown front-matter** on disk.
- **Activity Heatmap:** A GitHub-style productivity visualization tracking project updates and intensity over the last 28 days.
- **Markdown Core:** Renders full Markdown content with secure image proxies for high-resolution local assets.

---

## 🛠️ Installation & Setup

### 1. Requirements
- Node.js (v18+)
- NPM
- SQLite3

### 2. Deployment
```bash
git clone https://github.com/Miltondz/dashboard_nexus.git
cd dashboard_nexus
npm install
node server/server.js # Default Port: 3099 (or 3456 as configured)
```

### 3. Folder Structure & Image Protocol
The dashboard watches specific paths (`/projects/personal/`, `/projects/automejora/`, `/projects/tareas-milton/`).

- **Projects with images:** Create a dedicated folder (e.g., `personal/my-story/`), save `story.md` and all images (`.jpg`, `.png`, `.webp`) in that same folder.
- **Images Mapping:** Images saved next to a `.md` file are automatically indexed as Gallery Artifacts for that project. Use relative links like `![alt](image.jpg)`.

**Standard Project Format:**
Projects must be Markdown files with YAML front-matter:
```yaml
---
title: "The Project Title"
description: "A short, engaging summary"
tags: IA, Research, Story
---
# Content starts here...
```

---

## 🔌 Agent Protocol (API)

Dashboard Nexus provides an authenticated API for AI Agents.

**Auth Header:** `X-Agent-API-Key: xxxxxxxxxx`

### 📡 Consultation Methods (GET)
- `GET /api/agent/status`: Heartbeat check to verify key validity.
- `GET /api/agent/projects`: Returns full metadata and physical paths for all indexed work.
- `GET /api/agent/tasks`: Retrieves the current state of the global Kanban board.
- `GET /api/agent/ideas`: Lists all captured thoughts and seeds.

### ✍️ Action Methods (POST)

#### POST /ideas
Registers a new seed or spark for future work (not tied to a specific project folder).
- **Body:** `{ "title": "...", "content": "...", "tags": "tag1, tag2" }`
- **Example:**
```bash
curl -X POST -H "X-Agent-API-Key: xxxxxxx" \
     -d '{"title": "Idea Name", "content": "The description"}' \
     http://localhost:3099/api/agent/ideas
```

#### POST /tasks
Registers a general task in the global checklist.
- **Body:** `{ "title": "...", "status": "pending", "due_date": "YYYY-MM-DD" }`
- **Status Options:** `pending`, `in_progress`, `done`.

#### POST /projects/:id/tags
Atomic update to tags. This synchronizes the database and the physical `.md` file on disk.
- **Body:** `{ "tags": "new, tags, list" }`

---

## 💡 Best Practices & Guidelines
- **Case Sensitivity:** Ensure filenames in Markdown match the disk exactly (Linux standard).
- **Visual Priority:** For "Bestiary" or "Creative" types, always include an image in the project folder; the first image found will become the card cover.
- **Tag Consistency:** Maintain an organized taxonomy (e.g., `[IA, Research, Story]`) to keep filters effective.
- **No-Summary Rule:** Agents should store raw Markdown data from original sources to avoid loss of detail.

## 📜 License
This project is part of a private professional workspace. Developed to push the limits of creativity and organization.

---
*Built with ❤️ by Milton for the Next Generation of Creators.*
