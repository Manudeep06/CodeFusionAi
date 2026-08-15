/**
 * INTERVIEW PREP NOTES:
 * This file contains the core logic for organizing, reading, and writing files.
 */

/**
 * File Service
 *
 * Handles file and folder metadata operations in MongoDB.
 * S3 content operations belong in s3.service.js.
 * Redis cache operations belong in redis.service.js.
 * The orchestration of all three belongs in workspace.service.js.
 *
 * NOTE: The previous fileService.js contained syncFilesToDisk() which
 * wrote workspace files to os.tmpdir(). That function has been removed:
 * - Workspace persistence is now handled by workspace.service.js (→ S3)
 * - Temp files for code execution are handled by execute.service.js
 */

import File from "../models/File.js";
import AppError from "../utils/AppError.js";
import { getFileName, getExtension, detectLanguage } from "../utils/fileHelpers.js";

/**
 * Find a file by its MongoDB _id.
 *
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Object>} File document
 * @throws {AppError} 404 if not found
 */
export const findFileById = async (id) => {
  const file = await File.findById(id);
  if (!file) throw new AppError("File not found", 404);
  return file;
};

/**
 * Find a file by roomId + path (unique compound index).
 *
 * @param {string} roomId
 * @param {string} filePath
 * @returns {Promise<Object|null>}
 */
export const findFileByPath = async (roomId, filePath) => {
  return await File.findOne({ roomId, path: filePath });
};

/**
 * Get all files and folders for a room, sorted by path.
 *
 * @param {string} roomId
 * @returns {Promise<Array>}
 */
export const getRoomFiles = async (roomId) => {
  return await File.find({ roomId }).sort({ path: 1 });
};

/**
 * Create a folder metadata record in MongoDB.
 * Folders have no S3 key — they exist only as metadata.
 *
 * @param {Object} params
 * @param {string} params.roomId
 * @param {string} params.name
 * @param {string} params.folderPath
 * @param {string} [params.createdBy]
 * @returns {Promise<Object>} Created folder document
 * @throws {AppError} 409 if folder already exists
 */
export const createFolder = async ({ roomId, name, folderPath, createdBy }) => {
  const exists = await File.findOne({ roomId, path: folderPath });
  if (exists) throw new AppError("Folder already exists at this path", 409);

  return await File.create({
    roomId,
    name,
    path: folderPath,
    type: "folder",
    s3Key: "",
    extension: "",
    createdBy,
  });
};

/**
 * Register file metadata in MongoDB after a direct-to-S3 upload.
 * Returns existing record if the file is already registered (idempotent).
 *
 * @param {Object} params
 * @param {string} params.roomId
 * @param {string} params.name
 * @param {string} params.filePath
 * @param {string} params.type
 * @param {string} params.language
 * @param {string} params.extension
 * @param {string} params.s3Key
 * @param {number} [params.size]
 * @param {string} [params.createdBy]
 * @returns {Promise<{ file: Object, created: boolean }>}
 */
export const registerFile = async ({
  roomId,
  name,
  filePath,
  type,
  language,
  extension,
  s3Key,
  size,
  createdBy,
}) => {
  const existing = await File.findOne({ roomId, path: filePath });
  if (existing) return { file: existing, created: false };

  const file = await File.create({
    roomId,
    name,
    path: filePath,
    type,
    language: language || detectLanguage(filePath),
    extension: extension || getExtension(filePath),
    s3Key,
    size,
    createdBy,
  });

  return { file, created: true };
};

/**
 * Rename a file or folder (updates name and path).
 *
 * @param {string} id - MongoDB _id
 * @param {string} newName
 * @param {string} newPath
 * @returns {Promise<Object>} Updated file document
 * @throws {AppError} 404 if not found
 */
export const renameFile = async (id, newName, newPath) => {
  const file = await File.findById(id);
  if (!file) throw new AppError("File not found", 404);

  file.name = newName;
  file.path = newPath;
  return await file.save();
};

/**
 * Delete a file metadata record from MongoDB.
 * The caller is responsible for deleting the S3 object if applicable.
 *
 * @param {string} id - MongoDB _id
 * @returns {Promise<Object>} Deleted file document
 * @throws {AppError} 404 if not found
 */
export const deleteFileMetadata = async (id) => {
  const file = await File.findByIdAndDelete(id);
  if (!file) throw new AppError("File not found", 404);
  return file;
};
