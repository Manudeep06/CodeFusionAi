import Room from "../models/Room.js";
import { syncFilesToDisk } from "./fileService.js";

const INITIAL_WORKSPACE = JSON.stringify([]);

/**
 * Find an existing room or create a new one with the given attributes
 * @param {Object} params
 * @param {string} params.roomId
 * @param {string} [params.roomName]
 * @param {string} [params.ownerId]
 * @param {string} [params.ownerName]
 * @param {string} [params.template]
 * @param {string} [params.files]
 * @returns {Promise<Object>} The room document
 */
export const getOrCreateRoom = async ({ roomId, roomName = "", ownerId = "", ownerName = "Developer", template = "react", files = null, accessType = "private", description = "" }) => {
  let room = await Room.findOne({ roomId });
  if (!room) {
    room = await Room.create({
      roomId,
      name: roomName || "Untitled Project",
      ownerId: ownerId || "",
      ownerName: ownerName || "Developer",
      template: template || "react",
      files: files || INITIAL_WORKSPACE,
      status: "active",
      accessType: accessType || "private",
      description: description || ""
    });
  }
  syncFilesToDisk(roomId, room.files);
  return room;
};

/**
 * Update the room files and synchronize them to disk
 * @param {string} roomId 
 * @param {string} files 
 */
export const updateRoomFiles = async (roomId, files) => {
  await Room.updateOne({ roomId }, { files, lastActive: Date.now() });
  syncFilesToDisk(roomId, files);
};

/**
 * Fetch all rooms that a user owns OR joined as a participant
 * @param {string} userId
 * @returns {Promise<Array>} List of rooms
 */
export const getUserSessions = async (userId) => {
  return await Room.find({
    $or: [
      { ownerId: userId },
      { participants: userId }
    ]
  }).sort({ lastActive: -1 });
};

/**
 * Close a room (Only the Owner can do this)
 * @param {string} roomId
 * @param {string} userId
 * @returns {Promise<Object>} The updated room document
 */
export const closeRoom = async (roomId, userId) => {
  const room = await Room.findOne({ roomId });
  if (!room) throw new Error("Room not found");
  
  if (room.ownerId !== userId) {
    throw new Error("Unauthorized: Only the room owner can close this session.");
  }
  
  room.status = "closed";
  return await room.save();
};

/**
 * Resume/Reopen a room (Only the Owner can do this)
 * @param {string} roomId
 * @param {string} userId
 * @returns {Promise<Object>} The updated room document
 */
export const resumeRoom = async (roomId, userId) => {
  const room = await Room.findOne({ roomId });
  if (!room) throw new Error("Room not found");
  
  if (room.ownerId !== userId) {
    throw new Error("Unauthorized: Only the room owner can reopen this session.");
  }
  
  room.status = "active";
  room.lastActive = Date.now();
  return await room.save();
};

/**
 * Register a user as a participant in a room if they are not already registered
 * @param {string} roomId
 * @param {string} userId
 */
export const addParticipant = async (roomId, userId) => {
  if (!userId) return;
  await Room.updateOne(
    { roomId },
    { $addToSet: { participants: userId } }
  );
};

/**
 * Permanently delete a room (Only the Owner can do this)
 * @param {string} roomId
 * @param {string} userId
 */
export const deleteRoom = async (roomId, userId) => {
  const room = await Room.findOne({ roomId });
  if (!room) throw new Error("Room not found");
  
  if (room.ownerId !== userId) {
    throw new Error("Unauthorized: Only the room owner can permanently delete this session.");
  }
  
  return await Room.deleteOne({ roomId });
};

/**
 * Fetch all public rooms
 * @returns {Promise<Array>} List of public rooms
 */
export const getPublicRooms = async () => {
  return await Room.find({ accessType: "public" }).sort({ lastActive: -1 });
};

