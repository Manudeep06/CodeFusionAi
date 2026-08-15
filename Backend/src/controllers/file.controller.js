/**
 * INTERVIEW PREP NOTES:
 * This file handles requests related to files, such as uploading, downloading, or deleting files.
 */

import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import * as fileService from "../services/fileService.js";
import { generateUploadUrl, generateDownloadUrl, deleteS3Object } from "../services/s3.service.js";
import Room from "../models/Room.js";

/**
 * File Controller
 *
 * Thin HTTP layer over fileService and s3.service.
 * All DB and storage logic is in the respective service layers.
 * All handlers use asyncHandler — no try/catch blocks needed.
 */

/**
 * POST /api/files/upload-url
 * Generate a pre-signed S3 URL for direct browser-to-S3 upload.
 * Body: { roomId, fileName, path, language, contentType, createdBy }
 */
export const getUploadUrl = asyncHandler(async (req, res) => {
  const { roomId, fileName, path, language, contentType, createdBy } = req.body;

  // Resolve ownerId from room metadata (s3.service no longer queries DB itself)
  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError("Room not found", 404);

  const ownerId = room.ownerId || "default_user";

  const { uploadUrl, s3Key } = await generateUploadUrl(
    ownerId,
    roomId,
    path,
    contentType
  );

  // Register file metadata (upserts if already exists)
  const { file } = await fileService.registerFile({
    roomId,
    name: fileName,
    filePath: path,
    type: "file",
    language,
    s3Key,
    createdBy,
  });

  res.status(200).json({ success: true, uploadUrl, s3Key, file });
});

/**
 * POST /api/files/register
 * Register file metadata in MongoDB after a direct S3 upload completes.
 * Body: { roomId, name, path, type, language, extension, s3Key, size, createdBy }
 */
export const registerFile = asyncHandler(async (req, res) => {
  const { roomId, name, path, type, language, extension, s3Key, size, createdBy } = req.body;

  const { file, created } = await fileService.registerFile({
    roomId,
    name,
    filePath: path,
    type,
    language,
    extension,
    s3Key,
    size,
    createdBy,
  });

  res.status(created ? 201 : 200).json({ success: true, file });
});

/**
 * POST /api/files/folder
 * Create a folder metadata record in MongoDB (folders have no S3 key).
 * Body: { roomId, name, path, createdBy }
 */
export const createFolder = asyncHandler(async (req, res) => {
  const { roomId, name, path, createdBy } = req.body;

  // Verify room exists before creating folder
  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError("Room not found", 404);

  const folder = await fileService.createFolder({
    roomId,
    name,
    folderPath: path,
    createdBy,
  });

  res.status(201).json({ success: true, folder });
});

/**
 * GET /api/files/room/:roomId
 * Get all files and folders for a room (metadata only, not content).
 */
export const getRoomFiles = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const files = await fileService.getRoomFiles(roomId);
  res.status(200).json({ success: true, files });
});

/**
 * GET /api/files/download/:id
 * Get a pre-signed S3 download URL for a file by its MongoDB _id.
 */
export const downloadFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = await fileService.findFileById(id); // throws 404 if not found
  const downloadUrl = await generateDownloadUrl(file.s3Key);
  res.status(200).json({ success: true, downloadUrl });
});

/**
 * PUT /api/files/:id
 * Rename a file or folder.
 * Body: { name, path }
 */
export const renameFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, path } = req.body;
  const file = await fileService.renameFile(id, name, path);
  res.status(200).json({ success: true, file });
});

/**
 * DELETE /api/files/:id
 * Delete a file or folder.
 * For files: also deletes the S3 object.
 * For folders: only removes MongoDB metadata (S3 keys belong to individual files).
 */
export const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = await fileService.findFileById(id); // throws 404 if not found

  // Delete S3 object for actual files (folders have no S3 key)
  if (file.type === "file" && file.s3Key) {
    await deleteS3Object(file.s3Key);
  }

  await fileService.deleteFileMetadata(id);

  res.status(200).json({ success: true, message: "Deleted successfully" });
});