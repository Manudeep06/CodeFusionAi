export const docsSections = [
  {
    id: "welcome",
    label: "1. Welcome",
    content: `
# 1. Welcome

## What is CodeFusionAI?
CodeFusionAI is a state-of-the-art, AI-powered real-time collaborative workspace designed for developer teams. It allows you to write, run, and debug code directly in your browser without local dependencies.

## Key Features
- **Real-Time Collaboration:** Code with your team instantly.
- **AI Assistant:** Google Gemini integrated for code generation, bug fixing, and reviews.
- **In-Browser Execution:** Run Node.js, Python, C++, and Java directly.
- **Version Control:** Built-in Git integration for pushing and pulling.
- **Video & Chat:** Communicate without leaving the editor.

## Supported Programming Languages
CodeFusionAI supports a wide array of languages, including but not limited to:
- JavaScript / TypeScript (via WebContainers)
- Python
- C++
- Java
- HTML / CSS

## Why use CodeFusionAI?
No local setup required, instant synchronization, and built-in AI makes CodeFusionAI the ultimate platform for technical interviews, hackathons, and remote team collaborations.
    `
  },
  {
    id: "getting-started",
    label: "2. Getting Started",
    content: `
# 2. Getting Started

## Creating an account & Logging in
1. Navigate to the main application URL.
2. Click on **Login**.
3. Authenticate using your preferred method (e.g., Google or Email).

## Dashboard Overview
Once logged in, you will land on the Dashboard. Here you can see your active rooms, public rooms, and account settings.

## Creating a Workspace
1. In the Dashboard, enter a **Project Name** under "Create a room".
2. Select a starting template (e.g., React, Node, Python).
3. Choose **Private** or **Public** access.
4. Click **Create room**.

## Opening an Existing Workspace
- To join an existing room, paste the Room ID into the "Join a room" input and click **Join room**.
- Alternatively, select a recent room from the Dashboard list.

## Creating Files and Folders
- In the room, use the **File Explorer** on the left panel.
- Click the **New File** or **New Folder** icons at the top of the explorer to organize your workspace.

## Saving Files
Files in CodeFusionAI are saved to your browser's IndexedDB automatically and synchronized to the server in real-time. Use \`Ctrl + S\` to trigger an explicit save and format.
    `
  },
  {
    id: "collaboration",
    label: "3. Collaboration",
    content: `
# 3. Collaboration

## Creating a room
When you create a workspace, you are essentially creating a "room". You can share the Room ID with collaborators.

## Joining a room
Collaborators can enter the Room ID on their Dashboard to instantly join your session.

## Public vs Private rooms
- **Public Rooms:** Visible on the Dashboard for anyone to join and view.
- **Private Rooms:** Accessible only via the specific Room ID (and potentially restricted to invited users).

## Real-time code synchronization
Code changes are broadcasted via Socket.io with sub-15ms latency, allowing multiple users to edit the same file seamlessly.

## Cursor synchronization
You will see colored markers representing the cursors of other users currently in the room, complete with their name labels.

## Chat feature
Use the built-in chat panel to send messages to your team members without leaving the IDE.

## Video call feature
For deeper collaboration, click the **Call** button to initiate a WebRTC-based video and audio session with your peers.
    `
  },
  {
    id: "ai-assistant",
    label: "4. AI Assistant",
    content: `
# 4. AI Assistant

The AI Assistant is powered by advanced LLMs and can significantly boost your productivity.

## Capabilities
- **AI Code Generation:** Generate boilerplate or complex logic from natural language.
- **Bug Fixing:** Automatically detect and patch errors.
- **Code Explanation:** Highlight complex code and ask for a breakdown.
- **Code Optimization:** Refactor inefficient loops or algorithms.
- **Complexity Analysis:** Check Big-O time and space complexity.
- **Documentation Generation:** Auto-generate JSDoc or Python docstrings.
- **Best Practices Suggestions:** Ensure your code meets industry standards.

> [!TIP]
> **Prompt Examples:**
> - "Explain this code."
> - "Optimize this function."
> - "Find bugs."
> - "Generate unit tests."
> - "Review my code."
    `
  },
  {
    id: "code-editor",
    label: "5. Code Editor",
    content: `
# 5. Code Editor

The editor is powered by **Monaco Editor** (the same engine behind VS Code).

## Features
- **Syntax Highlighting:** Out-of-the-box support for dozens of languages.
- **Auto-completion:** IntelliSense suggestions based on context.
- **Themes:** Toggled automatically or via settings (Dark/Light).
- **Multi-cursor editing:** Hold \`Alt\` and click to place multiple cursors.

## Find & Replace
Use \`Ctrl + F\` to find text within the current file, and \`Ctrl + H\` to replace text.
    `
  },
  {
    id: "file-explorer",
    label: "6. File Explorer",
    content: `
# 6. File Explorer

## Managing your Workspace
- **Create file / folder:** Use the icons at the top of the explorer.
- **Rename:** Right-click a file and select "Rename" (or press \`F2\`).
- **Delete:** Right-click and select "Delete".
- **Download workspace:** Export your entire project as a ZIP file.
- **Upload files:** Drag and drop files from your OS into the explorer.
    `
  },
  {
    id: "terminal",
    label: "7. Terminal",
    content: `
# 7. Terminal

The built-in terminal (xterm.js) connects directly to the execution sandbox.

## Usage
- **Installing packages:** Use standard package managers like \`npm\` or \`pip\`.
- **Running applications:** Start dev servers or run scripts directly.

> [!INFO]
> **Example Commands:**
> \`\`\`bash
> npm install
> npm run dev
> python main.py
> g++ main.cpp && ./a.out
> java Main
> \`\`\`
    `
  },
  {
    id: "code-execution",
    label: "8. Code Execution",
    content: `
# 8. Code Execution

## Execution Environments
- **WebContainers (Client-side):** Runs Node.js, React, and Vite environments directly in the browser's WebAssembly sandbox.
- **Subprocess Compilers (Server-side):** Compiles and runs Python, C++, and Java on secure cloud host containers.

## Compile vs Run
You can run code via the terminal manually, or use the **Run** button (if configured) to automatically execute the current active file.

## Input/Output Console
Standard output (stdout) and standard error (stderr) are streamed in real-time to the terminal panel.
    `
  },
  {
    id: "version-control",
    label: "9. Version Control",
    content: `
# 9. Version Control

## Git Integration
CodeFusionAI includes built-in Git capabilities to manage your project history.

- **Commit:** Save your changes with a descriptive message.
- **Push / Pull:** Sync your local workspace with remote repositories like GitHub.
- **Branches:** Create isolated branches for feature development.
- **Merge & Conflict Resolution:** Visually resolve conflicts if multiple peers edit the same lines.
    `
  },
  {
    id: "keyboard-shortcuts",
    label: "10. Keyboard Shortcuts",
    content: `
# 10. Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| \`Ctrl + S\` | Save |
| \`Ctrl + F\` | Find |
| \`Ctrl + H\` | Replace |
| \`Ctrl + /\` | Toggle Comment |
| \`Ctrl + Space\` | IntelliSense |
| \`Alt + Shift + F\` | Format Document |
    `
  },
  {
    id: "project-templates",
    label: "11. Project Templates",
    content: `
# 11. Project Templates

Speed up your workflow using our built-in starter templates:

- **React:** Standard Vite + React template.
- **Node.js:** Express API boilerplate.
- **Python:** Basic Python script environment.
- **C++:** Minimal C++ compiler setup.
- **Java:** Standard Java class structure.
- **Vanilla:** Basic HTML/CSS/JS for simple web pages.
    `
  },
  {
    id: "settings",
    label: "12. Settings",
    content: `
# 12. Settings

Customize your workspace by clicking the Settings gear icon:

- **Theme:** Switch between Dark and Light mode.
- **Font Size & Tab Size:** Adjust editor typography.
- **Auto Save:** Toggle whether files save automatically on delay.
- **AI Preferences:** Set default models and strictness.
- **Notifications:** Manage alerts for messages and room joins.
    `
  },
  {
    id: "faq",
    label: "13. Frequently Asked Questions",
    content: `
# 13. Frequently Asked Questions

**1. How do I invite collaborators?**
Simply copy the Room ID from the Dashboard or Editor header and send it to them.

**2. How do I recover deleted files?**
Currently, deleted files cannot be recovered unless they were pushed to a remote Git repository.

**3. Can I work offline?**
No, real-time collaboration and cloud execution require an active internet connection.

**4. Is my code private?**
Yes, if you select "Private Room" during creation, only those with the Room ID can join.

**5. How does AI use my code?**
AI features send snippets of your code to the LLM solely for inference. Your code is not used to train public models.

*(More FAQs will be added as community feedback grows!)*
    `
  },
  {
    id: "troubleshooting",
    label: "14. Troubleshooting",
    content: `
# 14. Troubleshooting

> [!WARNING]
> **Common Issues & Solutions**

- **Cannot connect to room:** Check your internet connection or verify the Room ID.
- **AI not responding:** The AI service might be experiencing high traffic. Try again in a few moments.
- **Terminal not opening:** Ensure your browser supports WebContainers (requires secure context / HTTPS).
- **Build errors:** Check the terminal output for missing dependencies.
- **Dependency installation failed:** Try running \`npm cache clean --force\` and then \`npm install\`.
- **Git authentication failed:** Ensure your personal access token is valid and hasn't expired.
    `
  },
  {
    id: "security",
    label: "15. Security",
    content: `
# 15. Security

- **Authentication:** Powered by Firebase Auth for secure login.
- **Workspace privacy:** Only users with the explicit Room ID can access private rooms.
- **Encryption:** All WebSocket traffic and database connections are encrypted over HTTPS/WSS.
- **API key protection:** AI API keys are stored securely on the backend, never exposed to the client.
    `
  },
  {
    id: "best-practices",
    label: "16. Best Practices",
    content: `
# 16. Best Practices

- **Organize projects:** Keep your file structure clean and modular.
- **Commit frequently:** Save working states to Git regularly.
- **Use branches:** Don't work directly on \`main\` for experimental features.
- **Review AI suggestions:** Always audit AI-generated code before deploying.
- **Write meaningful commit messages:** Help your team understand your changes.
    `
  },
  {
    id: "changelog",
    label: "17. Changelog",
    content: `
# 17. Changelog

### v1.2 (Current)
- WebContainer client-side execution improvements.
- GeeksforGeeks-style Light Mode Documentation.

### v1.1
- Workspace explorer added.
- Integrated Terminal support.
- Git integration base functionality.

### v1.0
- Initial release.
- Real-time collaboration via Socket.io.
- Basic AI Assistant integrations.
    `
  },
  {
    id: "contact",
    label: "18. Contact & Support",
    content: `
# 18. Contact & Support

Need help? Reach out to us:

- **Email:** support@codefusionai.com
- **GitHub Repository:** [CodeFusionAI GitHub](https://github.com/Manudeep06/CodeFusionAi)
- **Issue Reporting:** Create an issue on our GitHub tracker.
- **Feature Requests:** Drop your ideas in our community discussion board.
    `
  }
];
