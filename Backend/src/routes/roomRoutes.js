import express from "express";
import { getUserSessions, closeRoom, resumeRoom, deleteRoom, getPublicRooms } from "../services/roomService.js";

const router = express.Router();

// Get all public rooms
router.get("/public", async (req, res) => {
  try {
    const rooms = await getPublicRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all rooms a user created or participated in
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const sessions = await getUserSessions(userId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Close a room (Requires { userId } in request body for ownership checks)
router.post("/:roomId/close", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required in the body" });
    }
    const room = await closeRoom(roomId, userId);
    res.json({ success: true, message: "Room closed successfully", room });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// Resume a closed room (Requires { userId } in request body for ownership checks)
router.post("/:roomId/resume", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required in the body" });
    }
    const room = await resumeRoom(roomId, userId);
    res.json({ success: true, message: "Room resumed successfully", room });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// Delete a room permanently (Requires { userId } in request body for ownership checks)
router.delete("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required in the body" });
    }
    await deleteRoom(roomId, userId);
    res.json({ success: true, message: "Room deleted permanently" });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

export default router;
