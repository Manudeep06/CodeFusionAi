import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { createTerminal, terminals } from "./terminal/terminal.js";
import fs from "fs";
import path from "path";
import os from "os";
import fileSystemRoute from "./routes/fileSystem.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e9, // 1 GB limit for large workspace uploads
});

const roomsCode = new Map();

const INITIAL_WORKSPACE = JSON.stringify([]);

const syncFilesToDisk = (roomId, codeString) => {
  try {
    const files = JSON.parse(codeString);
    const workspaceRoot = path.join(os.tmpdir(), "codefusion-workspaces", roomId);
    
    if (!fs.existsSync(workspaceRoot)) {
      fs.mkdirSync(workspaceRoot, { recursive: true });
    }

    files.forEach(f => {
      if (!f.path) return;
      const fullPath = path.join(workspaceRoot, f.path);
      if (f.isFolder) {
        if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
      } else {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (f.content !== undefined) {
           fs.writeFileSync(fullPath, f.content);
        }
      }
    });
  } catch (err) {
    console.error("Sync error:", err);
    require("fs").appendFileSync(path.join(os.tmpdir(), "sync-error.log"), err.stack + "\n");
  }
};

const broadcastRoomUsers = async (roomId) => {
  try {
    const sockets = await io.in(roomId).fetchSockets();
    const usersList = sockets.map((s) => ({
      userId: s.id,
      username: s.username || "Developer",
      photoURL: s.photoURL || "",
      activeFile: s.activeFile || null,
    }));
    io.to(roomId).emit("room-users", usersList);
  } catch (err) {
    console.error("Error broadcasting room users:", err);
  }
};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.emit("welcome", "Socket Connected Successfully");

  // Create Room
  socket.on("create-room", async (data) => {
    let roomId = "";
    let username = "Developer";
    let photoURL = "";
    let roomName = "";

    if (typeof data === "object" && data !== null) {
      roomId = data.roomId;
      username = data.username || "Developer";
      photoURL = data.photoURL || "";
      roomName = data.roomName || "";
    } else {
      roomId = data;
    }

    if (roomName) {
      try {
        const desktopPath = path.join(os.homedir(), "Desktop");
        const workspaceDir = path.join(desktopPath, "CodeFusion Workspace");
        
        if (!fs.existsSync(workspaceDir)) {
          fs.mkdirSync(workspaceDir, { recursive: true });
        }
        const roomFolder = path.join(workspaceDir, roomName);
        if (!fs.existsSync(roomFolder)) {
          fs.mkdirSync(roomFolder, { recursive: true });
        }
      } catch (err) {
        console.error("Error creating room folder:", err);
      }
    }

    socket.join(roomId);
    socket.username = username;
    socket.photoURL = photoURL;
    socket.roomId = roomId;

    console.log(`${username} (${socket.id}) created room ${roomId}`);

    if (terminals.has(socket.id)) {
      terminals.get(socket.id).kill();
      terminals.delete(socket.id);
    }
    createTerminal(socket, roomId);

    if (!roomsCode.has(roomId)) {
      roomsCode.set(roomId, INITIAL_WORKSPACE);
    }

    await broadcastRoomUsers(roomId);

    socket.emit("room-created", roomId);
  });

  // Join Room
  socket.on("join-room", async (data) => {
    let roomId = "";
    let username = "Developer";
    let photoURL = "";

    if (typeof data === "object" && data !== null) {
      roomId = data.roomId;
      username = data.username || "Developer";
      photoURL = data.photoURL || "";
    } else {
      roomId = data;
    }

    socket.join(roomId);
    socket.username = username;
    socket.photoURL = photoURL;
    socket.roomId = roomId;

    console.log(`${username} (${socket.id}) joined room ${roomId}`);

    if (terminals.has(socket.id)) {
      terminals.get(socket.id).kill();
      terminals.delete(socket.id);
    }
    createTerminal(socket, roomId);

    if (!roomsCode.has(roomId)) {
      roomsCode.set(roomId, INITIAL_WORKSPACE);
    }

    await broadcastRoomUsers(roomId);

    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
      username,
      photoURL,
    });

    // Send current code to the joining user
    socket.emit("receive-code", roomsCode.get(roomId));

    socket.emit("room-joined", roomId);
  });

  // Real-Time Code Synchronization
  socket.on("code-change", ({ roomId, code }) => {
    roomsCode.set(roomId, code);
    syncFilesToDisk(roomId, code);
    socket.to(roomId).emit("receive-code", code);
  });

  // Sync workspace to disk only (no broadcast) — used on reconnect after server restart
  socket.on("sync-workspace", ({ code }) => {
    if (socket.roomId) {
      syncFilesToDisk(socket.roomId, code);
    }
  });

  // Real-Time Presence (Active File)
  socket.on("update-presence", async ({ roomId, activeFile }) => {
    socket.activeFile = activeFile;
    await broadcastRoomUsers(roomId);
  });

  // Collaborative Cursors
  socket.on("cursor-change", ({ roomId, position }) => {
    socket.cursor = position;
    socket.to(roomId).emit("cursor-update", {
      userId: socket.id,
      position,
      activeFile: socket.activeFile
    });
  });

  // Handle disconnecting before socket leaves rooms to update counts
  socket.on("disconnecting", async () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        const sockets = await io.in(roomId).fetchSockets();
        const usersList = sockets
          .filter((s) => s.id !== socket.id)
          .map((s) => ({
            userId: s.id,
            username: s.username || "Developer",
            photoURL: s.photoURL || "",
          }));

        io.to(roomId).emit("room-users", usersList);

        if (usersList.length === 0) {
          roomsCode.delete(roomId);
          try {
            const workspaceRoot = path.join(os.tmpdir(), "codefusion-workspaces", roomId);
            if (fs.existsSync(workspaceRoot)) {
              fs.rmSync(workspaceRoot, { recursive: true, force: true });
            }
          } catch (err) {
            console.error("Cleanup error:", err);
          }
        }
      }
    }
  });

  // Real-Time Code Execution inside interactive terminal
  socket.on("run-code", ({ code, language }) => {
    try {
      const EXT_MAP = {
        javascript: "js",
        python: "py",
        java: "java",
        cpp: "cpp",
        html: "html",
        css: "css",
        json: "json"
      };
      const ext = EXT_MAP[language] || "txt";
      const fileName = `.temp_run.${ext}`;
      
      if (!socket.roomId) throw new Error("No room joined");
      
      const workspacePath = path.join(os.tmpdir(), "codefusion-workspaces", socket.roomId);
      if (!fs.existsSync(workspacePath)) {
        fs.mkdirSync(workspacePath, { recursive: true });
      }
      const filePath = path.join(workspacePath, fileName);
      
      fs.writeFileSync(filePath, code);
      
      const term = terminals.get(socket.id);
      if (term) {
        socket.emit("terminal:data", `\r\n\x1b[33m▶ Running ${language} code in local terminal...\x1b[0m\r\n`);
        const isWin = process.platform === "win32";
        let cmd = "";
        
        switch (language) {
          case "javascript":
            cmd = `node "${filePath}"`;
            break;
          case "python":
            cmd = `python "${filePath}"`;
            break;
          case "java":
            cmd = isWin ? `javac "${filePath}" ; if ($?) { java -cp "${workspacePath}" temp_run }` : `javac "${filePath}" && java -cp "${workspacePath}" temp_run`;
            break;
          case "cpp":
            cmd = isWin ? `g++ "${filePath}" -o "${path.join(workspacePath, 'temp_run.exe')}" ; if ($?) { & "${path.join(workspacePath, 'temp_run.exe')}" }` : `g++ "${filePath}" -o "${path.join(workspacePath, 'temp_run')}" && "${path.join(workspacePath, 'temp_run')}"`;
            break;
          case "html":
          case "css":
          case "json":
            cmd = isWin ? `echo '${language.toUpperCase()} file saved to ${filePath}.'` : `echo "${language.toUpperCase()} file saved to ${filePath}."`;
            break;
          default:
            cmd = isWin ? `echo 'Execution not supported for language: ${language}'` : `echo "Execution not supported for language: ${language}"`;
        }
        
        term.write(`${cmd}\r`);
      }
    } catch (error) {
      console.error("Code execution error:", error);
      socket.emit("terminal:data", `\r\n\x1b[31m❌ Execution Error: ${error.message}\x1b[0m\r\n`);
    } finally {
      setTimeout(() => socket.emit("run-code-finished"), 500);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

app.use(
  "/api/filesystem",
  fileSystemRoute
);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});