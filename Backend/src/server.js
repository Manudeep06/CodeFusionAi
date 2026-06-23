import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { createTerminal, terminals } from "./terminal/terminal.js";
import fs from "fs";
import path from "path";

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
});

const roomsCode = new Map();

const INITIAL_WORKSPACE = JSON.stringify([
  {
    path: "main.js",
    content: '// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World!");\n',
    isFolder: false,
    language: "javascript",
  },
]);

const syncFilesToDisk = (codeString) => {
  try {
    const files = JSON.parse(codeString);
    const workspaceRoot = path.join(path.resolve(process.cwd(), ".."), "workspace");
    
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
  }
};

syncFilesToDisk(INITIAL_WORKSPACE);

const broadcastRoomUsers = async (roomId) => {
  try {
    const sockets = await io.in(roomId).fetchSockets();
    const usersList = sockets.map((s) => ({
      userId: s.id,
      username: s.username || "Developer",
      photoURL: s.photoURL || "",
    }));
    io.to(roomId).emit("room-users", usersList);
  } catch (err) {
    console.error("Error broadcasting room users:", err);
  }
};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);
  createTerminal(socket);

  socket.emit("welcome", "Socket Connected Successfully");

  // Create Room
  socket.on("create-room", async (data) => {
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

    console.log(`${username} (${socket.id}) created room ${roomId}`);

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
    syncFilesToDisk(code);
    socket.to(roomId).emit("receive-code", code);
  });

  // Sync workspace to disk only (no broadcast) — used on reconnect after server restart
  socket.on("sync-workspace", ({ code }) => {
    syncFilesToDisk(code);
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
        }
      }
    }
  });

  // Real-Time Code Execution inside interactive terminal
  socket.on("run-code", ({ code, language }) => {
    try {
      const ext = language === "python" ? "py" : language === "java" ? "java" : language === "cpp" ? "cpp" : language === "html" ? "html" : "js";
      const fileName = `.temp_run.${ext}`;
      const projectRoot = path.resolve(process.cwd(), "..");
      const filePath = path.join(projectRoot, fileName);
      
      fs.writeFileSync(filePath, code);
      
      const term = terminals.get(socket.id);
      if (term) {
        socket.emit("terminal:data", `\r\n\x1b[33m▶ Running ${language} code in local terminal...\x1b[0m\r\n`);
        const isWin = process.platform === "win32";
        const javaCmd = isWin ? `javac ${fileName} ; if ($?) { java temp_run }` : `javac ${fileName} && java temp_run`;
        const cppCmd = isWin ? `g++ ${fileName} -o temp_run.exe ; if ($?) { ./temp_run.exe }` : `g++ ${fileName} -o temp_run && ./temp_run`;
        const cmd = language === "python" ? `python ${fileName}` : language === "java" ? javaCmd : language === "cpp" ? cppCmd : language === "html" ? `echo "HTML saved to ${fileName}. Open in browser."` : `node ${fileName}`;
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


app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});