import Room from "../models/Room.js";
import { syncFilesToDisk } from "./fileService.js";

const INITIAL_WORKSPACE = JSON.stringify([]);

/**
 * Find an existing room or create a new one with the given attributes
 * @param {Object} params
 * @param {string} params.roomId
 * @param {string} [params.roomName]
 * @param {string} [params.ownerId]
 * @param {string} [params.template]
 * @param {string} [params.files]
 * @returns {Promise<Object>} The room document
 */
export const getOrCreateRoom = async ({ roomId, roomName = "", ownerId = "", template = "react", files = null }) => {
  let room = await Room.findOne({ roomId });
  if (!room) {
    room = await Room.create({
      roomId,
      name: roomName || "Untitled Project",
      ownerId: ownerId || "",
      template: template || "react",
      files: files || INITIAL_WORKSPACE
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
