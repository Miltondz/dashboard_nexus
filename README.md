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

### 📋 Organizational Power
- **Zen Kanban:** Minimalist task tracking with `Pending`, `In Progress`, and `Done` states.
- **Ideas Spark:** A dedicated "Inbox" for seeds and thoughts that aren't yet ready to become full project folders.
- **Heuristic Grouping:** Automatic clustering of cards based on title separators (`:`, `-`, `—`), keeping series and related logs visually connected.

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
node server/server.js # Or use PM2/Screen on Port 3456
```

### 3. Folder Structure (Nexus Protocol)
The dashboard watches specific internal paths. Content should be stored in:
- `/projects/personal/`
- `/projects/automejora/`
- `/projects/tareas-milton/`

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

Dashboard Nexus provides an authenticated API for AI Agents. All agent requests require a valid `X-Agent-API-Key`.

### 📡 Consultation Methods (GET)
- `GET /api/agent/status`: Heartbeat check to verify key validity.
- `GET /api/agent/projects`: Returns full metadata and physical paths for all indexed work.
- `GET /api/agent/tasks`: Retrieves the current state of the global Kanban board.
- `GET /api/agent/ideas`: Lists all captured thoughts and seeds.

### ✍️ Action Methods (POST)
- `POST /api/agent/tasks`: Create tasks (Body: `title`, `status`, `due_date`).
- `POST /api/agent/ideas`: Save new ideas (Body: `title`, `content`, `tags`).
- `POST /api/projects/:id/tags`: Atomic update to tags (Syncs DB and .md file).

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
