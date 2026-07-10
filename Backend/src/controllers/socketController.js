import fs from "fs";
import path from "path";
import os from "os";
import { getOrCreateRoom, updateRoomFiles } from "../services/roomService.js";

const INITIAL_WORKSPACE = JSON.stringify([]);

/**
 * Fetch sockets in a room and broadcast user list to everyone in that room
 * @param {Object} io - Socket.io Server instance
 * @param {string} roomId 
 */
const broadcastRoomUsers = async (io, roomId) => {
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

/**
 * Register all Socket.io event listeners
 * @param {Object} io - Socket.io Server instance
 */
export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {

    socket.emit("welcome", "Socket Connected Successfully");

    // Create Room Event
    socket.on("create-room", async (data) => {
      let roomId = "";
      let username = "Developer";
      let photoURL = "";
      let roomName = "";
      let ownerId = "";
      let template = "react";
      let files = null;

      if (typeof data === "object" && data !== null) {
        roomId = data.roomId;
        username = data.username || "Developer";
        photoURL = data.photoURL || "";
        roomName = data.roomName || "";
        ownerId = data.ownerId || "";
        template = data.template || "react";
        files = data.files || null;
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
        await getOrCreateRoom({
          roomId,
          roomName,
          ownerId,
          template,
          files
        });
      } catch (err) {
        console.error("MongoDB create room error:", err);
      }

      await broadcastRoomUsers(io, roomId);
      socket.emit("room-created", roomId);
    });

    // Join Room Event
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
        const room = await getOrCreateRoom({ roomId });
        socket.emit("receive-code", room.files);
      } catch (err) {
        console.error("MongoDB join room error:", err);
        socket.emit("receive-code", INITIAL_WORKSPACE);
      }

      await broadcastRoomUsers(io, roomId);

      socket.to(roomId).emit("user-joined", {
        userId: socket.id,
        username,
        photoURL,
      });

      socket.emit("room-joined", roomId);
    });

    // Real-Time Code Synchronization Event
    socket.on("code-change", async ({ roomId, code }) => {
      try {
        await updateRoomFiles(roomId, code);
      } catch (err) {
        console.error("MongoDB code change error:", err);
      }
      socket.to(roomId).emit("receive-code", code);
    });

    // Sync Workspace to Disk (No broadcast) Event
    socket.on("sync-workspace", async ({ code }) => {
      if (socket.roomId) {
        try {
          await updateRoomFiles(socket.roomId, code);
        } catch (err) {
          console.error("MongoDB sync workspace error:", err);
        }
      }
    });

    // Real-Time Presence Event
    socket.on("update-presence", async ({ roomId, activeFile }) => {
      socket.activeFile = activeFile;
      await broadcastRoomUsers(io, roomId);
    });

    // Collaborative Cursors Event
    socket.on("cursor-change", ({ roomId, position }) => {
      socket.cursor = position;
      socket.to(roomId).emit("cursor-update", {
        userId: socket.id,
        position,
        activeFile: socket.activeFile
      });
    });

    // Handle disconnecting (before rooms are cleared)
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

    // Disconnect Event
    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });
};
