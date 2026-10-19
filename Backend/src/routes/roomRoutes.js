/**
 * INTERVIEW PREP NOTES:
 * This file lists the URLs for room management and connects them to the room controller.
 */

import express from "express";
import validate from "../middleware/validate.js";
import { requireAuth, requireSelf } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  getPublicRooms,
  getUserRooms,
  closeRoom,
  resumeRoom,
  deleteRoom,
  getRoomHistory,
  getRoomVersion,
} from "../controllers/room.controller.js";

const router = express.Router();

/**
 * Room Routes
 * Base path: /api/rooms
 */

// GET /api/rooms/public — List all public rooms
router.get("/public", getPublicRooms);

// GET /api/rooms/user/:userId — List rooms owned or joined by a user
router.get(
  "/user/:userId",
  requireAuth,
  requireSelf("userId"),
  validate({ params: { userId: "required|string" } }),
  getUserRooms
);

// POST /api/rooms/:roomId/close — Close a room (owner only)
router.post("/:roomId/close", requireAuth, closeRoom);

// POST /api/rooms/:roomId/resume — Reopen a closed room (owner only)
router.post("/:roomId/resume", requireAuth, resumeRoom);

// DELETE /api/rooms/:roomId — Permanently delete a room (owner only)
router.get("/:roomId/history", requireAuth, getRoomHistory);
router.get("/:roomId/history/:version", requireAuth, rateLimit({ name: "history", limit: 60, windowSec: 60 }), getRoomVersion);

router.delete("/:roomId", requireAuth, rateLimit({ name: "room-delete", limit: 20, windowSec: 3600 }), deleteRoom);

export default router;
