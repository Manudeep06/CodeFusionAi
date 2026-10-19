/**
 * CodeFusionAI documentation, written against the current source tree.
 * Each section: { id, group, label, content (GitHub-flavoured markdown) }.
 * Callouts use blockquotes starting with [!NOTE], [!TIP] or [!WARNING].
 */
export const docsSections = [
  // ─── Getting started ───────────────────────────────────────────────────────
  {
    id: "introduction",
    group: "Getting started",
    label: "Introduction",
    content: `
# Introduction

CodeFusionAI is a browser-based, real-time collaborative IDE. A team opens the same **room**, edits the same files together, runs the project inside the browser, and asks an AI assistant that can see the code they are working on.

## What you can do

| Capability | How it works |
| --- | --- |
| Live collaborative editing | Yjs CRDT updates over Socket.IO merge concurrent edits without conflicts, with presence and live cursors. |
| Run real projects | [WebContainers](https://webcontainers.io) boot a Node.js runtime in the tab: \`npm install\`, \`npm run dev\` and a live preview, with no server-side sandbox. |
| AI pair programming | A Gemini (\`gemini-2.5-flash\`) assistant that explains, reviews, optimises and writes code using your active file as context. |
| Durable workspaces | Files are cached in Redis, persisted to Amazon S3, and indexed in MongoDB, so a room survives server restarts. |
| Public & private rooms | Keep a room to people with the ID, or list it in the public hub. |

## Who it's for

- Teams pairing remotely or running workshops
- Technical interviews and hackathons
- Students learning from public rooms

> [!TIP] New here? Follow the **Quickstart**. You'll have a running React app shared with a teammate in about a minute.
`,
  },
  {
    id: "quickstart",
    group: "Getting started",
    label: "Quickstart",
    content: `
# Quickstart

## 1. Sign in
Open the app and choose **Get started**. You can sign in with Google or with an email and password (Firebase Authentication). New accounts are created on the **Create account** tab.

## 2. Create a room
On the Dashboard, under **Create a room**:

1. Enter a **project name**. It also becomes the root folder of the workspace.
2. Choose a **template**: React, Vue, Node or Vanilla.
3. Choose **Private** (anyone with the ID can join) or **Public** (also listed in the public hub, with an optional description).
4. Click **Create room**.

You are taken straight into the room. Its ID looks like \`cfai-ab12-cd34\`.

## 3. Invite collaborators
Copy the room ID from the status bar at the bottom of the IDE and share it. A collaborator pastes it into **Join a room** on their Dashboard, or into the command palette (**Ctrl K**).

## 4. Run it
Click **Run Code** in the editor toolbar. For template projects this runs \`npm install\` (the first time only) and \`npm run dev\` in the in-browser terminal. When the dev server starts, the **Preview** panel opens automatically.

> [!NOTE] The first install downloads packages into the browser and can take 10–30 seconds. Later runs reuse \`node_modules\` unless \`package.json\` changes.
`,
  },
  {
    id: "rooms",
    group: "Getting started",
    label: "Rooms & sessions",
    content: `
# Rooms & sessions

A **room** is a shared workspace: a file tree, its participants and its settings. Every room has an owner (the creator).

## Room lifecycle

| State | Meaning | Who can change it |
| --- | --- | --- |
| **Active** | Anyone with the ID can join and edit. | — |
| **Closed** | Participants are disconnected and new joins are refused. Files are kept. | Owner (Sessions → ⋯ → Close) |
| **Deleted** | The room, its file metadata and its S3 objects are removed permanently. | Owner (Sessions → ⋯ → Delete) |

A closed room can be reopened from the **Sessions** tab with **Resume**.

## The Sessions tab
- **My sessions** lists rooms you own or have joined. Filter by *Active*, *Closed*, *Owned* or *Joined*, or search by name or ID.
- **Public hub** lists every public room, so you can browse and join without an invitation.

## Command palette
Press **Ctrl K** (**⌘ K** on macOS) anywhere on the Dashboard to jump between tabs, open a recent room, create or join a room, or paste a room ID to join it directly.
`,
  },

  // ─── Using the IDE ─────────────────────────────────────────────────────────
  {
    id: "editor",
    group: "Using the IDE",
    label: "Editor",
    content: `
# Editor

The editor is [Monaco](https://microsoft.github.io/monaco-editor/), the engine behind VS Code, so syntax highlighting, multi-cursor editing, bracket-pair colouring, find & replace, and the minimap all work as you'd expect.

## Layout

| Area | Purpose |
| --- | --- |
| **Activity bar** (far left) | Switch the side panel between Explorer, Search, Collaborators and AI Assistant. |
| **Side panel** | The selected tool. Drag its edge to resize. |
| **Tabs** | Open files. Click × to close one. |
| **Editor** | The active file. **Run Code** and **Preview** sit in its toolbar. |
| **Terminal** | WebContainer shells. Drag the divider to resize. |
| **Status bar** | Online users, room ID (click to copy), language, and save status. |

## Save status
The badge in the title bar shows where your edits are:

- **Unsaved**: edits are in Redis and waiting to be flushed.
- **Saving…**: a flush to S3 is in progress.
- **Saved to S3**: everything is durable.

Press **Ctrl S** to force a save at any time. It also formats JSON files.
`,
  },
  {
    id: "files",
    group: "Using the IDE",
    label: "Files & folders",
    content: `
# Files & folders

The **Explorer** shows the room's file tree.

- **New file / New folder**: use the icons at the top of the Explorer, or right-click a folder.
- **Rename / Delete**: right-click a file or folder.
- **Upload**: upload individual files, or a whole folder from your machine.
- **Download**: export the entire workspace as \`workspace-<roomId>.zip\`.

## Where files live

1. **In your browser**: the workspace is mirrored into IndexedDB (\`CodeFusionWorkspaceDB\`) so it opens instantly.
2. **In Redis**: the server keeps the live workspace as a hash per room (\`room:<id>:files\`), one field per file path.
3. **In S3 + MongoDB**: file contents are stored as S3 objects and their metadata (path, size, language, S3 key) as \`File\` documents.

See **Persistence** for how and when data moves between these layers.
`,
  },
  {
    id: "terminal",
    group: "Using the IDE",
    label: "Terminal & running code",
    content: `
# Terminal & running code

## The terminal
Each terminal tab runs \`jsh\`, the WebContainer shell, entirely in your browser. It supports \`npm\`, \`npx\`, \`node\` and the usual shell basics (\`ls\`, \`cd\`, \`cat\`, \`mkdir\`, …). Open more shells with **+**.

> [!WARNING] WebContainers run Node.js only. Python, Java and C++ binaries are not available in the in-browser terminal.

## What Run Code does

| Situation | Command executed |
| --- | --- |
| The workspace has a \`package.json\`, first run or changed | \`npm install && npm run dev\` |
| The workspace has a \`package.json\`, already installed | \`npm run dev\` |
| No \`package.json\`, active file is JavaScript | \`node <active file>\` |

The command runs in the folder that contains \`package.json\`.

## Live preview
When a dev server starts listening, WebContainers report its URL and the **Preview** panel opens beside the editor. Drag its edge to resize it, or use the toolbar button to show or hide it.

## Server-side execution
The backend also exposes \`POST /api/execute\` for single-file JavaScript, Python, C++ and Java programs. It runs them with a 10-second timeout on the API host, so it needs those toolchains installed there.
`,
  },
  {
    id: "ai",
    group: "Using the IDE",
    label: "AI assistant",
    content: `
# AI assistant

CodeFusionAI uses **Google Gemini (\`gemini-2.5-flash\`)** through the backend, so the API key never reaches the browser.

## Inside a room
The AI panel sits on the right side of the workspace (toggle it from the toolbar). The assistant automatically gets:

- the **active file's** name, language and contents
- any **selected code** in the editor
- the recent conversation

**Suggested prompts** cover the common cases: *Explain this code*, *Find bugs*, *Optimize this function* and *Generate test cases*. Every code block has **Copy**, and **Apply to file** writes it into the editor as one undoable edit.

## AI Assistant page
Open **AI Assistant** from the sidebar for a full-page chat that isn't tied to a room. Chats are grouped by date, searchable, and saved in your browser.

## Endpoints

| Route | Purpose |
| --- | --- |
| \`POST /api/ai/chat\` | Free-form chat (\`{ message, history? }\`) |
| \`POST /api/ai/review\` | Code review (\`{ code, language }\`) |
| \`POST /api/ai/explain\` | Explanation (\`{ code, language }\`) |
| \`POST /api/ai/optimize\` | Optimisation suggestions (\`{ code, language }\`) |

> [!TIP] Select just the function you care about before asking. Shorter context gives sharper answers.
`,
  },
  {
    id: "collaboration",
    group: "Using the IDE",
    label: "Collaboration",
    content: `
# Collaboration

## Presence
The **Collaborators** panel and the status bar show who is online. Each user gets a colour, and the panel shows which file each person has open.

## Live cursors
Other people's cursors appear in the editor in their colour, labelled with their name, and update as they move.

## How edits propagate
1. You type. Monaco is bound to the file's **Yjs** text, so the change becomes a small binary CRDT update.
2. The client emits \`yjs-update\`; the server applies it to the room's authoritative document and relays it to everyone else.
3. Within ~400 ms the server folds the document into the room's Redis hash, marks the room *dirty*, and counts one edit token.

Because Yjs is a CRDT, two people typing in the **same** file at the same time converge to the same text, with no locks and no lost keystrokes. Creating, renaming and deleting files still uses \`code-change\`, which the server reconciles against the document.
`,
  },
  {
    id: "history",
    group: "Using the IDE",
    label: "Version history",
    content: `
# Version history

Every save to S3 records a **snapshot** of the whole workspace, so you can look back and undo mistakes.

## Browsing versions
Open the **History** panel from the activity bar. Each version shows who saved it, when, how many files it contains, and why it was taken:

| Badge | Meaning |
| --- | --- |
| **Auto** | Saved by the token-bucket flusher after edits |
| **Manual** | Someone pressed **Ctrl S** |
| **Restore** | The workspace was restored from an older version |

## Restoring
Pick a version and choose **Restore**. The live workspace is replaced for everyone in the room, and the restore is itself saved as a new version, so it can be undone too.

## How it works
- A snapshot is only written when the content hash (SHA-256) changes, so idle rooms don't create duplicates.
- The files are stored as one JSON object in S3 at \`snapshots/<roomId>/v<n>.json\`, with metadata in MongoDB.
- The newest **50** versions are kept per room.
`,
  },
  {
    id: "shortcuts",
    group: "Using the IDE",
    label: "Keyboard shortcuts",
    content: `
# Keyboard shortcuts

| Shortcut | Where | Action |
| --- | --- | --- |
| **Ctrl K** / **⌘ K** | Dashboard | Open the command palette |
| **Ctrl S** / **⌘ S** | Room | Save the workspace to S3 now |
| **Ctrl F** | Editor | Find |
| **Ctrl H** | Editor | Find & replace |
| **Ctrl /** | Editor | Toggle line comment |
| **Alt ↑ / ↓** | Editor | Move line up / down |
| **Alt Click** | Editor | Add a cursor |
| **Ctrl D** | Editor | Select next occurrence |
| **F1** | Editor | Monaco command palette |
| **↑ / ↓**, **Enter**, **Esc** | Command palette | Navigate, run, close |
`,
  },

  // ─── Architecture ──────────────────────────────────────────────────────────
  {
    id: "architecture",
    group: "Architecture",
    label: "System overview",
    content: `
# System overview

\`\`\`text
 Browser (React 19 + Vite)                     API server (Express 5 + Socket.IO)
 ┌──────────────────────────────┐   REST    ┌──────────────────────────────────┐
 │ Monaco · xterm · WebContainer│ ────────▶ │ routes → controllers → services  │
 │ Firebase Auth · IndexedDB    │ ◀──────── │                                  │
 │ socket.io-client             │ WebSocket │ socketController (rooms, cursors)│
 └──────────────────────────────┘ ◀──────▶ └───────┬──────────┬──────────┬─────┘
                                                   │          │          │
                                              Redis (live) MongoDB    Amazon S3
                                              workspace,   rooms,     file
                                              token bucket files,     contents
                                                           profiles
                                                    Gemini API (AI routes)
\`\`\`

## Frontend
| Concern | Implementation |
| --- | --- |
| Routing | \`react-router-dom\`: \`/\` landing, \`/login\`, \`/dashboard\`, \`/room/:roomId\` (the last two are protected) |
| Auth | Firebase Authentication (Google + email/password) through \`AuthContext\` |
| Editor | \`@monaco-editor/react\` with the custom \`cf-dark\` theme |
| Runtime | \`@webcontainer/api\` (\`services/webcontainer.js\`) |
| Terminal | \`xterm\` + \`xterm-addon-fit\` |
| Local cache | IndexedDB via \`idb\` (\`services/db.js\`) |

## Backend layers
- **routes/** map HTTP paths to controllers and validation middleware.
- **controllers/** stay thin; \`asyncHandler\` forwards errors to the central \`errorHandler\`.
- **services/** own business logic. \`workspace.service.js\` is the only service that coordinates Redis, S3 and MongoDB together.
- **config/** sets up MongoDB, Redis (with an in-memory fallback), AWS and Gemini clients.
`,
  },
  {
    id: "persistence",
    group: "Architecture",
    label: "Persistence & token bucket",
    content: `
# Persistence & token bucket

Writing to S3 on every keystroke would be slow and expensive. Instead, Redis absorbs edits and a **token bucket** decides when to flush.

## Loading a workspace
\`loadWorkspace(roomId)\` reads in this order:

1. **Redis**: the hash \`room:<id>:files\`. On a hit it returns immediately.
2. **MongoDB + S3**: on a miss it lists \`File\` documents for the room, downloads each object from S3, then repopulates Redis.
3. **Legacy migration**: rooms that stored files inline on the \`Room\` document are moved to S3 the first time they're opened.

## Flush triggers

| Trigger | Rule |
| --- | --- |
| Edit threshold | After **10** edit tokens (\`flushEditThreshold\`) |
| Idle timeout | Unsaved edits idle for **10 s** (\`idleFlushTimeoutMs\`) |
| Manual save | **Ctrl S** bypasses the rate limiter |
| Background sweep | A sweep runs every **30 s** over the \`dirty_rooms\` set |

## Rate limiting
Each room has a bucket of S3 upload tokens: capacity **5**, refilled at **1 token per 5 s**. An automatic flush spends one token. When the bucket is empty, the flush is skipped and retried later. Manual saves always go through.

## Safety
- A Redis lock (\`room:<id>:persist:lock\`, \`SET NX EX 60\`) stops two flushes for the same room from interleaving.
- Workspace hashes expire after **2 hours** idle, and every write refreshes the TTL.
- If Redis is unreachable, the server switches to an in-memory mock automatically, which is fine for local development.
`,
  },
  {
    id: "crdt",
    group: "Architecture",
    label: "CRDT live editing",
    content: `
# CRDT live editing

CodeFusionAI uses [Yjs](https://yjs.dev), a CRDT (conflict-free replicated data type), for text editing.

## Why a CRDT
Sending the whole file on every keystroke means the last writer wins: two people typing at once overwrite each other. A CRDT gives every character a unique, ordered identity, so concurrent inserts and deletes merge deterministically on every client.

## Topology
\`\`\`text
 Client A (Y.Doc) ──yjs-update──▶ Server (authoritative Y.Doc per room) ──▶ Client B
        ▲                                    │
        └──────────── yjs-update ────────────┘
                                             │ debounced 400 ms
                                             ▼
                                Redis workspace → token bucket → S3
\`\`\`

- The server keeps one \`Y.Doc\` per active room: a map from file path to \`Y.Text\`.
- On join it sends the full state (\`yjs-sync\`); afterwards only incremental updates travel.
- Structural changes (new, renamed or deleted files) are reconciled against the document, which stays the source of truth for content.
- Idle documents are dropped from memory five minutes after the last member leaves and rebuilt from storage on the next join.
`,
  },
  {
    id: "security",
    group: "Architecture",
    label: "Security",
    content: `
# Security

## Authentication
Every API route except health and the public room list requires a **Firebase ID token** (\`Authorization: Bearer <token>\`). The server verifies the RS256 signature against Google's public keys, plus the issuer and audience, with no service-account secret needed. Sockets present the same token in the handshake.

## Authorization
- The user ID always comes from the verified token, never from the request body, so nobody can act as someone else.
- Only a room's owner can close, reopen or delete it.
- Sockets can only write to rooms they have joined.

## Rate limiting
A Redis fixed-window limiter protects expensive routes:

| Route | Limit |
| --- | --- |
| AI (\`/api/ai/*\`) | 30 requests / minute / user |
| Code execution | 10 runs / minute / user |
| Files | 120 requests / minute / user |

Responses include \`RateLimit-*\` headers and \`429\` with \`Retry-After\` when exceeded.

## Input hardening
File-system paths are resolved and checked so \`../\` can't escape a room's directory, and the public room list exposes only display fields.
`,
  },
  {
    id: "data-model",
    group: "Architecture",
    label: "Data model",
    content: `
# Data model (MongoDB)

## Room
| Field | Type | Notes |
| --- | --- | --- |
| \`roomId\` | String | Unique, e.g. \`cfai-ab12-cd34\` |
| \`name\` | String | Project name |
| \`ownerId\` / \`ownerName\` | String | Firebase UID and display name |
| \`template\` | String | \`react\`, \`vue\`, \`node\`, \`vanilla\`, … |
| \`status\` | \`active\` \\| \`closed\` | |
| \`accessType\` | \`public\` \\| \`private\` | |
| \`description\` | String | Shown in the public hub |
| \`participants\` | Array | Users who have joined |
| \`createdAt\` / \`updatedAt\` | Date | Mongoose timestamps |

## File
One document per file or folder: \`roomId\`, \`name\`, \`path\`, \`type\` (\`file\` \\| \`folder\`), \`s3Key\`, \`extension\`, \`language\` and size. Contents live in S3 under \`<ownerId>/<roomId>/<path>\`.

## UserProfile
\`userId\`, \`displayName\` and \`photoURL\`. These sync with the Firebase profile on Dashboard load and when you save settings.
`,
  },

  // ─── Reference ─────────────────────────────────────────────────────────────
  {
    id: "rest-api",
    group: "Reference",
    label: "REST API",
    content: `
# REST API

Base URL: \`VITE_BACKEND_URL\` (default \`http://localhost:5000\`). All bodies are JSON. Unless marked public, routes need \`Authorization: Bearer <Firebase ID token>\`; see **Security**.

## Health
| Method | Path | Description |
| --- | --- | --- |
| GET | \`/\` | Service status and timestamp |

## Rooms: \`/api/rooms\`
| Method | Path | Description |
| --- | --- | --- |
| GET | \`/public\` | List public rooms (public) |
| GET | \`/user/:userId\` | Rooms a user owns or joined (newest first) |
| GET | \`/:roomId/history\` | List saved versions (newest first) |
| GET | \`/:roomId/history/:version\` | Files of one version |
| POST | \`/:roomId/close\` | Close a room (owner only) |
| POST | \`/:roomId/resume\` | Reopen a room (owner only) |
| DELETE | \`/:roomId\` | Delete a room, its files and its history (owner only) |

## Files: \`/api/files\`
| Method | Path | Description |
| --- | --- | --- |
| POST | \`/upload-url\` | Get a presigned S3 upload URL |
| POST | \`/register\` | Register uploaded file metadata |
| POST | \`/folder\` | Create a folder |
| GET | \`/room/:roomId\` | List a room's files |
| GET | \`/download/:id\` | Download a file |
| PUT | \`/:id\` | Rename or move a file |
| DELETE | \`/:id\` | Delete a file |

## Users: \`/api/users\`
| Method | Path | Description |
| --- | --- | --- |
| GET | \`/profile/:userId\` | Get a profile |
| POST | \`/profile\` | Create or update your own profile (\`{ displayName, photoURL }\`) |

## AI: \`/api/ai\`
\`POST /chat\`, \`/review\`, \`/explain\`, \`/optimize\`. See **AI assistant**.

## Execute: \`/api/execute\`
| Method | Path | Body |
| --- | --- | --- |
| POST | \`/\` | \`{ language: "javascript" \\| "python" \\| "cpp" \\| "java", code }\` |
`,
  },
  {
    id: "socket-events",
    group: "Reference",
    label: "Socket events",
    content: `
# Socket events

## Client → server
| Event | Payload | Effect |
| --- | --- | --- |
| \`create-room\` | \`{ roomId, roomName, ownerId, username, photoURL, template, files, accessType, description }\` | Creates the room and seeds template files to S3 |
| \`join-room\` | \`{ roomId, userId, username, photoURL }\` | Joins; the server replies with \`receive-code\` carrying the workspace |
| \`yjs-update\` | \`{ roomId, update }\` (binary) | CRDT text edit; applied and relayed |
| \`code-change\` | \`{ roomId, code }\` | Structural change (create, rename, delete); reconciled with the CRDT doc |
| \`sync-workspace\` | \`{ code }\` | Caches silently (no broadcast) |
| \`save-workspace\` | — | Forces a flush to S3 |
| \`restore-version\` | \`{ version }\` + ack | Restores a snapshot for the whole room |
| \`update-presence\` | \`{ roomId, activeFile }\` | Updates which file you have open |
| \`cursor-change\` | \`{ roomId, position }\` | Shares your cursor position |
| \`close-room\` | \`{ roomId, userId }\` | Owner closes the room |

## Server → client
| Event | Meaning |
| --- | --- |
| \`welcome\` | Sent on connect |
| \`room-created\` / \`room-joined\` | Your create or join succeeded (payload: the room ID) |
| \`user-joined\` | Someone else entered the room |
| \`yjs-sync\` | Full CRDT state, sent on join |
| \`yjs-update\` | Incremental CRDT edit from a collaborator |
| \`version-restored\` | \`{ version, by }\` after a restore |
| \`receive-code\` | The full workspace (JSON). Sent to you on join, then whenever another user edits |
| \`workspace-saved\` | \`{ success, timestamp, reason: "threshold" \\| "manual" }\` |
| \`room-users\` | Current participants and their active files |
| \`cursor-update\` | Another user's cursor moved |
| \`join-error\` / \`room-error\` | The room doesn't exist, is closed, or the request failed |
| \`room-closed\` | The owner closed the room |
`,
  },
  {
    id: "configuration",
    group: "Reference",
    label: "Configuration",
    content: `
# Configuration

## Backend: \`Backend/.env\`
| Variable | Required | Description |
| --- | --- | --- |
| \`PORT\` | No | API port (default \`5000\`) |
| \`FRONTEND_URL\` | No | Allowed frontend origin |
| \`MONGO_URI\` | Yes | MongoDB connection string |
| \`REDIS_URL\` | No | Defaults to \`redis://redis:6379\`; falls back to in-memory if unreachable |
| \`GEMINI_API_KEY\` | Yes | Google API key with the **Generative Language API** allowed (create one in [Google AI Studio](https://aistudio.google.com/apikey)) |
| \`FIREBASE_PROJECT_ID\` | Yes | Used to verify Firebase ID tokens (not a secret) |
| \`AWS_ACCESS_KEY_ID\` / \`AWS_SECRET_ACCESS_KEY\` | Yes | S3 credentials |
| \`AWS_REGION\` / \`AWS_BUCKET_NAME\` | Yes | S3 bucket location |

## Frontend: \`Frontend/.env\`
| Variable | Description |
| --- | --- |
| \`VITE_BACKEND_URL\` | API base URL (default \`http://localhost:5000\`) |
| \`VITE_API_URL\` | Override for the AI endpoint base |
| \`VITE_FIREBASE_*\` | Firebase web config: API key, auth domain, project ID, storage bucket, sender ID, app ID, measurement ID |

> [!WARNING] Never commit \`.env\` files. Rotate any key that has been shared.
`,
  },
  {
    id: "local-dev",
    group: "Reference",
    label: "Local development",
    content: `
# Local development

## Prerequisites
- Node.js 20+
- A MongoDB database (local or Atlas)
- Optional: Redis (\`docker run -p 6379:6379 redis\`) and an S3 bucket

## Install and run
\`\`\`bash
npm install            # root: installs concurrently
npm run install:all    # Backend + Frontend dependencies
npm run dev            # API on :5000 and Vite on :5173
\`\`\`

Or run them separately with \`npm run dev:backend\` and \`npm run dev:frontend\`.

## Project layout
\`\`\`text
Backend/src
  config/       mongo, redis (+ mock), aws, gemini clients
  controllers/  HTTP + socket handlers
  middleware/   validation, central error handler
  models/       Room, File, UserProfile
  routes/       /api/* routers
  services/     workspace, redis, s3, room, file, gemini, execute
  utils/        redis keys + token bucket config, helpers
Frontend/src
  pages/        Landing, Login, Dashboard, Room
  components/   ui/ (toast, dialogs, palette), Room/, AIAssist/, Docs/, Sessions/
  services/     socket, webcontainer, templates, IndexedDB, AI client
\`\`\`

> [!NOTE] WebContainers need cross-origin isolation. The Vite config sends the required \`COOP\`/\`COEP\` headers in dev and preview.
`,
  },

  // ─── Help ──────────────────────────────────────────────────────────────────
  {
    id: "troubleshooting",
    group: "Help",
    label: "Troubleshooting",
    content: `
# Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "Room not found" when joining | Wrong ID, or the room was deleted | Check the ID with the owner; it's case-sensitive |
| Terminal stuck on *Booting WebContainer…* | The page isn't cross-origin isolated, or the browser is unsupported | Use a recent Chromium-based browser or Firefox, and reload |
| Preview stays blank | The dev server hasn't started or is still installing | Watch the terminal for \`ready\` / \`Local:\` |
| Badge stays **Unsaved** | Flushes are rate-limited or S3 is unreachable | Press **Ctrl S**; check the server log for S3 errors |
| AI says the key was rejected or isn't allowed | \`GEMINI_API_KEY\` is missing or invalid, or the key's API restrictions block the Generative Language API | In Google Cloud Console → APIs & Services, enable **Generative Language API** and allow it on the key; or create a key in AI Studio |
| AI says it's over quota | Free-tier limit reached | Wait a minute, or enable billing on the key's project |
| Google sign-in popup closes | Popup blocked or domain not authorised | Allow popups; add the domain in Firebase → Authentication → Settings |
| Server log shows \`Redis client warning\` | No Redis at \`REDIS_URL\` | Expected locally; the in-memory fallback is active |
`,
  },
  {
    id: "faq",
    group: "Help",
    label: "FAQ",
    content: `
# FAQ

**Is my code private?**
Private rooms aren't listed anywhere, but anyone who has the room ID can join. Share IDs only with people you trust, and close the room when you're done.

**What happens if the server restarts?**
Anything already flushed to S3 is safe. On the next join the workspace is rebuilt from MongoDB + S3. Press **Ctrl S** before a planned restart to flush the latest edits.

**Can I use Python or Java?**
You can edit any language. The in-browser runtime is Node.js only; other languages run through the server-side \`/api/execute\` endpoint if the host has the toolchains.

**How many people can join a room?**
There's no hard limit. Rooms are Socket.IO rooms, so practical limits depend on the server.

**Can I export my project?**
Yes. Use **Download** in the Explorer to get a ZIP of the whole workspace.
`,
  },
];

export const docsGroups = [...new Set(docsSections.map((s) => s.group))];
