/**
 * INTERVIEW PREP NOTES:
 * This file lists the URLs for room management and connects them to the room controller.
 */

import express from "express";
import validate from "../middleware/validate.js";
import {
  getPublicRooms,
  getUserRooms,
  closeRoom,
  resumeRoom,
  deleteRoom,
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
  validate({ params: { userId: "required|string" } }),
  getUserRooms
);

// POST /api/rooms/:roomId/close — Close a room (owner only)
router.post(
  "/:roomId/close",
  validate({ body: { userId: "required|string" } }),
  closeRoom
);

// POST /api/rooms/:roomId/resume — Reopen a closed room (owner only)
router.post(
  "/:roomId/resume",
  validate({ body: { userId: "required|string" } }),
  resumeRoom
);

// DELETE /api/rooms/:roomId — Permanently delete a room (owner only)
router.delete(
  "/:roomId",
  validate({ body: { userId: "required|string" } }),
  deleteRoom
);

export default router;
