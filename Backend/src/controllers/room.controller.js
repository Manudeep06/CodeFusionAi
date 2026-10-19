/**
 * INTERVIEW PREP NOTES:
 * This file handles requests for creating and managing collaborative rooms where users can work together.
 */

import asyncHandler from "../utils/asyncHandler.js";
import * as roomService from "../services/roomService.js";
import * as historyService from "../services/history.service.js";
import AppError from "../utils/AppError.js";

/**
 * Room Controller
 *
 * Thin HTTP layer over roomService. Each handler:
 * 1. Extracts validated data from req
 * 2. Delegates to roomService
 * 3. Sends the HTTP response
 *
 * IMPORTANT: Response shapes are preserved exactly as the original roomRoutes.js
 * to maintain frontend compatibility.
 *
 * Original response shapes:
 *   GET /public          → Array (direct)
 *   GET /user/:userId    → Array (direct)
 *   POST /:roomId/close  → { success, message, room }
 *   POST /:roomId/resume → { success, message, room }
 *   DELETE /:roomId      → { success, message }
 *   Error responses      → { error: string }   ← frontend reads data.error
 */

/**
 * GET /api/rooms/public
 * Returns all publicly accessible rooms as a direct array.
 */
export const getPublicRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.getPublicRooms();
  // Frontend expects direct array: dataPublic.slice(0, 3)
  res.status(200).json(rooms);
});

/**
 * GET /api/rooms/user/:userId
 * Returns all rooms owned or joined by the user as a direct array.
 */
export const getUserRooms = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const sessions = await roomService.getUserSessions(userId);
  // Frontend expects direct array: dataUser.slice(0, 3), dataUser.length
  res.status(200).json(sessions);
});

/**
 * POST /api/rooms/:roomId/close
 * Closes a room (owner only). Body: { userId }
 */
export const closeRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await roomService.closeRoom(roomId, req.user.uid);
  res.status(200).json({ success: true, message: "Room closed successfully", room });
});

/**
 * POST /api/rooms/:roomId/resume
 * Reopens a previously closed room (owner only). Body: { userId }
 */
export const resumeRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await roomService.resumeRoom(roomId, req.user.uid);
  res.status(200).json({ success: true, message: "Room resumed successfully", room });
});

/**
 * DELETE /api/rooms/:roomId
 * Permanently deletes a room (owner only). Body: { userId }
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  await roomService.deleteRoom(roomId, req.user.uid);
  res.status(200).json({ success: true, message: "Room deleted permanently" });
});

/**
 * GET /api/rooms/:roomId/history — newest-first list of saved versions.
 */
export const getRoomHistory = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  if (!(await roomService.getRoomById(roomId))) throw new AppError("Room not found", 404);
  const versions = await historyService.listSnapshots(roomId);
  res.status(200).json(versions);
});

/**
 * GET /api/rooms/:roomId/history/:version — files (with contents) of one version.
 */
export const getRoomVersion = asyncHandler(async (req, res) => {
  const { roomId, version } = req.params;
  const { snapshot, files } = await historyService.getSnapshotFiles(roomId, version);
  res.status(200).json({ version: snapshot.version, reason: snapshot.reason, createdAt: snapshot.createdAt, files });
});
