# 🌌 Dashboard Nexus (V5)

A high-performance, aesthetically pleasing project management dashboard designed for creators and AI-driven workflows. **Dashboard Nexus** focuses on content organization, visual progress tracking, and seamless AI agent integration.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=Dashboard+Nexus+V5+Interface)

## ✨ Features

-   **🎨 Premium Aesthetics:** Modern dark UI with glassmorphism, accent glows, and smooth transitions.
-   **📁 Intelligent Project Indexing:** Automatically scans your Markdown files and organizes them into categories (Bestiary, Research, Stories, Personal).
-   **🖼️ Visual Gallery:** Automatic extraction of images from project folders, grouped by project title with on-hover descriptive overlays.
-   **🏷️ Interactive Tag System:** Add, delete, and filter projects via tags. Changes are synced back to the physical Markdown front-matter.
-   **📊 Activity Heatmap:** Real-time visualization of your productivity over the last 28 days based on file updates.
-   **📋 Kanban Tasks & Ideas:** Manage your roadmap and quick thoughts with built-in Task and Idea trackers.
-   **🤖 AI Agent API:** Dedicated, authenticated endpoints (`/api/agent/`) for AI agents to create tasks, save ideas, and query project status.
-   **📦 Grouping & Inheritance:** Group related projects by title prefixes. Projects within a group can automatically "inherit" visuals from siblings.

## 🚀 Tech Stack

-   **Backend:** Node.js, Express.js
-   **Database:** SQLite3 (Fast, file-based persistence)
-   **Frontend:** Vanilla JS, Modern CSS (No bloated frameworks)
-   **Processing:** `sharp` (image thumbnails), `marked` (markdown rendering), `yaml` (metadata parsing).

## 🛠️ Installation & Setup

### 1. Requirements
- Node.js (v18+)
- NPM

### 2. Clone & Install
```bash
git clone https://github.com/Miltondz/dashboard_nexus.git
cd dashboard_nexus
npm install
```

### 3. Project Structure
The dashboard expects your projects to be in a `/projects` directory at the root.
```text
/projects
  /bestiary
    monster.md  <-- with optional YAML frontmatter
    monster.jpg <-- automatically associated
  /stories
    daily_log.md
```

### 4. Run the Server
```bash
# Default port is 3099 or define via env
PORT=3456 node server/server.js
```

## 🔌 Agent API (X-Agent-API-Key required)

Dashboard Nexus is built to be "Agent-First".

-   `GET /api/agent/projects`: List all indexed projects and their paths.
-   `POST /api/agent/tasks`: Create tasks directly in the Kanban board.
-   `POST /api/agent/ideas`: Capture thoughts to the Ideas section.
-   `GET /api/agent/status`: Verify agent connectivity.

## 📜 License
This project is part of a personal development workspace. Use it to supercharge your creativity.

---
*Built with ❤️ for the Next Generation of Creators.*
