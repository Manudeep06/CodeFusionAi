/**
 * INTERVIEW PREP NOTES:
 * This file contains the core logic for adding users to rooms, saving room states, and managing collaborations.
 */

import Room from "../models/Room.js";
import AppError from "../utils/AppError.js";
import File from "../models/File.js";
import { initializeWorkspaceFiles } from "./workspace.service.js";
import { deleteS3Prefix } from "./s3.service.js";
import { deleteRoomSnapshots } from "./history.service.js";
import { evictWorkspaceCache, clearRoomDirty } from "./redis.service.js";

const INITIAL_WORKSPACE = JSON.stringify([]);

/**
 * Room Service
 *
 * Handles all room lifecycle operations: creation, retrieval, closing, deletion.
 * Workspace-level operations (load/persist files) are delegated to workspace.service.js.
 *
 * All functions throw AppError for expected failures so controllers can
 * forward them to the centralized error handler without their own try/catch.
 */

/**
 * Find an existing room or create a new one.
 * On creation, seeds the workspace with template files.
 *
 * @param {Object} params
 * @param {string} params.roomId
 * @param {string} [params.roomName]
 * @param {string} [params.ownerId]
 * @param {string} [params.ownerName]
 * @param {string} [params.template]
 * @param {Array|string|null} [params.files] - Initial template files
 * @param {string} [params.accessType]
 * @param {string} [params.description]
 * @returns {Promise<Object>} The room Mongoose document
 */
export const getOrCreateRoom = async ({
  roomId,
  roomName = "",
  ownerId = "",
  ownerName = "Developer",
  template = "react",
  files = null,
  accessType = "private",
  description = "",
}) => {
  let room = await Room.findOne({ roomId });
  const isNew = !room;

  if (isNew) {
    room = await Room.create({
      roomId,
      name: roomName || "Untitled Project",
      ownerId: ownerId || "default_user",
      ownerName: ownerName || "Developer",
      template: template || "react",
      status: "active",
      accessType: accessType || "private",
      description: description || "",
    });

    // Populate S3 + MongoDB File metadata + Redis cache on first creation
    await initializeWorkspaceFiles(roomId, ownerId || "default_user", files || INITIAL_WORKSPACE);
  }

  return room;
};

/**
 * Fetch all rooms a user owns or has participated in.
 *
 * @param {string} userId
 * @returns {Promise<Array>} Array of room documents (files field excluded)
 */
export const getUserSessions = async (userId) => {
  return await Room.find({
    $or: [{ ownerId: userId }, { participants: userId }],
  })
    .select("-files")
    .sort({ lastActive: -1 });
};

/**
 * Fetch all publicly accessible rooms.
 *
 * @returns {Promise<Array>}
 */
export const getPublicRooms = async () => {
  // Public listing: expose only what the hub displays (no owner UID or participant list).
  return await Room.find({ accessType: "public", status: "active" })
    .select("roomId name description ownerName template status accessType createdAt updatedAt lastActive")
    .sort({ lastActive: -1 });
};

/**
 * Register a user as a participant in a room (idempotent — $addToSet).
 *
 * @param {string} roomId
 * @param {string} userId
 */
export const addParticipant = async (roomId, userId) => {
  if (!userId) return;
  await Room.updateOne({ roomId }, { $addToSet: { participants: userId } });
};

/**
 * Close a room (owner only). Closed rooms cannot be joined.
 *
 * @param {string} roomId
 * @param {string} userId
 * @returns {Promise<Object>} Updated room document
 * @throws {AppError} 404 if room not found, 403 if not the owner
 */
export const closeRoom = async (roomId, userId) => {
  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError("Room not found", 404);
  if (room.ownerId !== userId) {
    throw new AppError("Unauthorized: Only the room owner can close this session.", 403);
  }
  room.status = "closed";
  return await room.save();
};

/**
 * Reopen a previously closed room (owner only).
 *
 * @param {string} roomId
 * @param {string} userId
 * @returns {Promise<Object>} Updated room document
 * @throws {AppError} 404 if room not found, 403 if not the owner
 */
export const resumeRoom = async (roomId, userId) => {
  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError("Room not found", 404);
  if (room.ownerId !== userId) {
    throw new AppError("Unauthorized: Only the room owner can reopen this session.", 403);
  }
  room.status = "active";
  room.lastActive = Date.now();
  return await room.save();
};

/**
 * Permanently delete a room from MongoDB (owner only).
 * Removes the room, its file metadata, its S3 objects, its version history and its cache.
 *
 * @param {string} roomId
 * @param {string} userId
 * @throws {AppError} 404 if room not found, 403 if not the owner
 */
export const deleteRoom = async (roomId, userId) => {
  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError("Room not found", 404);
  if (room.ownerId !== userId) {
    throw new AppError("Unauthorized: Only the room owner can delete this session.", 403);
  }
  await Promise.allSettled([
    deleteS3Prefix(`users/${room.ownerId || "default_user"}/${roomId}/`),
    deleteRoomSnapshots(roomId),
    File.deleteMany({ roomId }),
    evictWorkspaceCache(roomId),
    clearRoomDirty(roomId),
  ]);
  return await Room.deleteOne({ roomId });
};

/**
 * Get a single room by its roomId.
 *
 * @param {string} roomId
 * @returns {Promise<Object|null>}
 */
export const getRoomById = async (roomId) => {
  return await Room.findOne({ roomId });
};
