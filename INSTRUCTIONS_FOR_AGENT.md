# 🤖 Dashboard V5 Agent Protocol

**Target Dashboard:** Dashboard V5 (Zen Minimalist)
**Host:** http://localhost:3099 (internal connection on server)

## 1. Project Creation Protocol (File-Based)
To add content to the dashboard, use the file system. The Indexer watches these root folders:
- `~/openclaw/workspace/projects/personal/`
- `~/openclaw/workspace/projects/automejora/`
- `~/openclaw/workspace/projects/tareas-milton/`

### File Format (Markdown)
Every project **MUST** start with a Front-matter block:
```yaml
---
title: "Project Title"
description: "Short summary for the card"
tags: ["AI", "Creative", "System"]
---
```

### Directory Structure & Images
- **Projects with images:** Create a folder (e.g., `personal/my-story/`), save `story.md` and all images (`.jpg`, `.png`, `.webp`) in that same folder.
- **Images Mapping:** Images saved next to a `.md` file are automatically indexed as Gallery Artifacts for that project. Use relative links like `![alt](image.jpg)`.

## 2. API Endpoints (Database-Driven Interaction)
Use these endpoints to interact with the dashboard beyond simple files.
**Base URL:** `http://localhost:3099/api/agent` (Internally)
**Auth Header:** `X-Agent-API-Key: sk_nx_8021047a9fc44b6002dd54a5c4491f06cbb8cfeb1bf3eeb40c2fdbb7a389f986`

### POST /ideas
Registers a new seed or spark for future work (not tied to a specific project folder).
- Body: `{ "title": "...", "content": "...", "tags": ["..."] }`
- Example: `curl -X POST -H "X-Agent-API-Key: ..." -d '{...}' http://localhost:3099/api/agent/ideas`

### POST /tasks
Registers a general task in the global checklist.
- Body: `{ "title": "...", "status": "pending", "due_date": "YYYY-MM-DD" }`
- Status: `pending`, `in_progress`, `done`.

### GET /status
Verifies if your current API key is valid and connected to the dashboard.

## 3. Critical Agent Guidelines
- **No Summary Rule:** Do not summarize content unless explicitly asked. Save full Markdown data.
## 4. Nuances & Best Practices (Minor but Critical)
- **Case Sensitivity (Linux):** Filenames are case-sensitive. Ensure `image.jpg` in your Markdown matches exactly the file on disk. Avoid `Image.JPG`.
- **Tag Consistency:** Use a consistent set of tags (e.g., `[IA, Research, Story, Task]`) to keep the dashboard filters organized. Avoid redundant tags like `ia` and `IA`.
- **Visual Excellence:** For "Creative" or "Bestiary" projects, always aim for at least one image. The first image found in the folder will be the "Cover Image" on the dashboard card.
- **Relative Linking:** You can link between projects using standard Markdown: `[Link](../other-project/file.md)`.
- **Environment:** You are running on a Linux Server. Use `~/openclaw/workspace/...` for all your operations.
- **Deployment:** The dashboard is served on port `3099`. You can verify your work by checking the UI (if you have browser access or by asking the User).
