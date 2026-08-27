/**
 * INTERVIEW PREP NOTES:
 * This file manages real-time connections (WebSockets). It handles events like users joining a room or sending messages instantly.
 */

import {
  getOrCreateRoom,
  addParticipant,
  closeRoom,
  getRoomById,
} from "../services/roomService.js";
import { loadWorkspace, persistWorkspaceToS3 } from "../services/workspace.service.js";
import {
  cacheWorkspace,
  markRoomDirty,
  clearRoomDirty,
  incrementEditTokens,
} from "../services/redis.service.js";

/**
 * Socket Controller
 *
 * Registers all Socket.IO event handlers.
 * This file ONLY handles socket event logic — no MongoDB queries, no S3 calls,
 * no filesystem operations, no business logic. All of that is delegated to services.
 *
 * Fixed issues from the original socketController.js:
 * - ❌ Removed direct Room.findOne() / room.save() calls (now use roomService)
 * - ❌ Removed Desktop folder creation (os.homedir() + "/Desktop/...") — server bug
 * - ❌ Removed fs.rmSync local workspace cleanup (not server's responsibility)
 * - ❌ Removed startWorkspaceSyncInterval() call (moved to server.js startup)
 * - ✅ All room operations go through roomService
 * - ✅ All workspace operations go through workspace.service
 * - ✅ All cache operations go through redis.service
 */

/**
 * Broadcast the current list of connected users in a room to all members.
 * @param {import('socket.io').Server} io
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
    console.error("[Socket] Error broadcasting room users:", err.message);
  }
};

/**
 * Register all Socket.IO event listeners on the server instance.
 * @param {import('socket.io').Server} io
 */
export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    socket.emit("welcome", "Socket Connected Successfully");

    // ── Create Room ────────────────────────────────────────────────────────
    socket.on("create-room", async (data) => {
      const {
        roomId,
        username = "Developer",
        photoURL = "",
        roomName = "",
        ownerId = "",
        template = "react",
        files = null,
        accessType = "private",
        description = "",
      } = typeof data === "object" && data !== null ? data : { roomId: data };

      socket.join(roomId);
      socket.username = username;
      socket.photoURL = photoURL;
      socket.roomId = roomId;

      console.log(`[Socket] ${username} (${socket.id}) created room ${roomId}`);

      try {
        await getOrCreateRoom({
          roomId,
          roomName,
          ownerId,
          ownerName: username,
          template,
          files,
          accessType,
          description,
        });
      } catch (err) {
        console.error("[Socket] Error creating room in DB:", err.message);
      }

      await broadcastRoomUsers(io, roomId);
      socket.emit("room-created", roomId);
    });

    // ── Join Room ──────────────────────────────────────────────────────────
    socket.on("join-room", async (data) => {
      const {
        roomId,
        username = "Developer",
        photoURL = "",
        userId = "",
      } = typeof data === "object" && data !== null ? data : { roomId: data };

      try {
        const room = await getRoomById(roomId);

        if (!room) {
          return socket.emit("join-error", "Room not found");
        }

        if (room.status === "closed") {
          return socket.emit(
            "join-error",
            "Access Denied: This session has been closed. Please reopen it from the dashboard before joining."
          );
        }

        await addParticipant(roomId, userId);

        socket.join(roomId);
        socket.username = username;
        socket.photoURL = photoURL;
        socket.roomId = roomId;

        console.log(`[Socket] ${username} (${socket.id}) joined room ${roomId}`);

        const roomFiles = await loadWorkspace(roomId);
        socket.emit("receive-code", JSON.stringify(roomFiles));

        await broadcastRoomUsers(io, roomId);

        socket.to(roomId).emit("user-joined", {
          userId: socket.id,
          username,
          photoURL,
        });

        socket.emit("room-joined", roomId);
      } catch (err) {
        console.error("[Socket] Error joining room:", err.message);
        socket.emit("join-error", "An error occurred while joining the room.");
      }
    });

    // ── Real-Time Code Change ──────────────────────────────────────────────
    // Caches workspace state, records 1 edit token, and triggers S3 flush if threshold reached.
    socket.on("code-change", async ({ roomId, code }) => {
      try {
        await cacheWorkspace(roomId, code);
        await markRoomDirty(roomId);

        // Record 1 edit token for this change
        const { shouldFlush } = await incrementEditTokens(roomId);
        if (shouldFlush) {
          console.log(`[Socket] Edit token threshold reached for room ${roomId} — initiating S3 flush`);
          const success = await persistWorkspaceToS3(roomId);
          if (success) {
            io.to(roomId).emit("workspace-saved", { success: true, timestamp: Date.now(), reason: "threshold" });
          }
        }
      } catch (err) {
        console.error("[Socket] Redis code-change processing error:", err.message);
      }
      socket.to(roomId).emit("receive-code", code);
    });

    // ── Sync Workspace (no broadcast) ──────────────────────────────────────
    // Used for silent sync events (e.g., on reconnect or focus change).
    socket.on("sync-workspace", async ({ code }) => {
      if (!socket.roomId) return;
      try {
        await cacheWorkspace(socket.roomId, code);
        await markRoomDirty(socket.roomId);
        const { shouldFlush } = await incrementEditTokens(socket.roomId);
        if (shouldFlush) {
          const success = await persistWorkspaceToS3(socket.roomId);
          if (success) {
            io.to(socket.roomId).emit("workspace-saved", { success: true, timestamp: Date.now(), reason: "threshold" });
          }
        }
      } catch (err) {
        console.error("[Socket] Redis sync-workspace processing error:", err.message);
      }
    });

    // ── Manual Save (force flush Redis → S3) ──────────────────────────────
    socket.on("save-workspace", async () => {
      if (!socket.roomId) return;
      try {
        console.log(`[Socket] Manual save triggered for room ${socket.roomId}`);
        const success = await persistWorkspaceToS3(socket.roomId, true);
        io.to(socket.roomId).emit("workspace-saved", { success, timestamp: Date.now(), reason: "manual" });
      } catch (err) {
        console.error("[Socket] Manual save error:", err.message);
        socket.emit("workspace-saved", { success: false, error: err.message });
      }
    });

    // ── User Presence Update ───────────────────────────────────────────────
    socket.on("update-presence", async ({ roomId, activeFile }) => {
      socket.activeFile = activeFile;
      await broadcastRoomUsers(io, roomId);
    });

    // ── Collaborative Cursor Positions ─────────────────────────────────────
    socket.on("cursor-change", ({ roomId, position }) => {
      socket.cursor = position;
      socket.to(roomId).emit("cursor-update", {
        userId: socket.id,
        position,
        activeFile: socket.activeFile,
      });
    });

    // ── Close Room ─────────────────────────────────────────────────────────
    socket.on("close-room", async ({ roomId, userId }) => {
      try {
        await closeRoom(roomId, userId); // throws AppError if not owner
        io.to(roomId).emit("room-closed", {
          roomId,
          message: "This room has been closed by the owner.",
        });
      } catch (err) {
        socket.emit("room-error", err.message);
      }
    });

    // ── Disconnecting (before rooms are cleared) ───────────────────────────
    socket.on("disconnecting", async () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;

        try {
          const sockets = await io.in(roomId).fetchSockets();
          const usersList = sockets
            .filter((s) => s.id !== socket.id)
            .map((s) => ({
              userId: s.id,
              username: s.username || "Developer",
              photoURL: s.photoURL || "",
            }));

          io.to(roomId).emit("room-users", usersList);
        } catch (err) {
          console.error("[Socket] Error broadcasting users on disconnect:", err.message);
        }
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User ${socket.id} disconnected (${reason})`);
    });
  });
};
