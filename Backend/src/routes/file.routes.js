/**
 * INTERVIEW PREP NOTES:
 * This file lists the URLs for file operations (upload/download) and connects them to the file controller.
 */

import express from "express";
import validate from "../middleware/validate.js";
import {
  getUploadUrl,
  downloadFile,
  getRoomFiles,
  deleteFile,
  renameFile,
  registerFile,
  createFolder,
} from "../controllers/file.controller.js";

const router = express.Router();

/**
 * File Routes
 * Base path: /api/files
 */

// POST /api/files/upload-url — Generate a pre-signed S3 upload URL
router.post(
  "/upload-url",
  validate({ body: { roomId: "required|string", path: "required|string" } }),
  getUploadUrl
);

// POST /api/files/register — Register file metadata after direct S3 upload
router.post(
  "/register",
  validate({ body: { roomId: "required|string", path: "required|string", s3Key: "required|string" } }),
  registerFile
);

// POST /api/files/folder — Create a folder metadata record
router.post(
  "/folder",
  validate({ body: { roomId: "required|string", name: "required|string", path: "required|string" } }),
  createFolder
);

// GET /api/files/room/:roomId — Get all files and folders for a room
router.get("/room/:roomId", getRoomFiles);

// GET /api/files/download/:id — Get a pre-signed S3 download URL
router.get("/download/:id", downloadFile);

// PUT /api/files/:id — Rename a file or folder
router.put(
  "/:id",
  validate({ body: { name: "required|string", path: "required|string" } }),
  renameFile
);

// DELETE /api/files/:id — Delete a file or folder
router.delete("/:id", deleteFile);

export default router;