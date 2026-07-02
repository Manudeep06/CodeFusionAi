import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import os from "os";
import fileSystemRoute from "./routes/fileSystem.js";

import mongoose from "mongoose";
import Room from "./models/Room.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e9, // 1 GB limit for large workspace uploads
});

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

    try {
      const existing = await Room.findOne({ roomId });
      if (!existing) {
        await Room.create({
          roomId,
          name: roomName || 'Untitled Project',
          ownerId: data.ownerId || '',
          template: data.template || 'react',
          files: data.files || INITIAL_WORKSPACE
        });
      }
    } catch (err) {
      console.error("MongoDB create room error:", err);
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

    try {
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({
          roomId,
          files: INITIAL_WORKSPACE
        });
      }
      socket.emit("receive-code", room.files);
    } catch (err) {
      console.error("MongoDB join room error:", err);
      socket.emit("receive-code", INITIAL_WORKSPACE);
    }

    await broadcastRoomUsers(roomId);

    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
      username,
      photoURL,
    });

    socket.emit("room-joined", roomId);
  });

  // Real-Time Code Synchronization
  socket.on("code-change", async ({ roomId, code }) => {
    try {
      await Room.updateOne({ roomId }, { files: code, lastActive: Date.now() });
    } catch (err) {
      console.error("MongoDB code change error:", err);
    }
    syncFilesToDisk(roomId, code);
    socket.to(roomId).emit("receive-code", code);
  });

  // Sync workspace to disk only (no broadcast) — used on reconnect after server restart
  socket.on("sync-workspace", async ({ code }) => {
    if (socket.roomId) {
      try {
        await Room.updateOne({ roomId: socket.roomId }, { files: code, lastActive: Date.now() });
      } catch (err) {
        console.error("MongoDB sync workspace error:", err);
      }
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