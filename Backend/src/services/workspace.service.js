/**
 * INTERVIEW PREP NOTES:
 * This file contains the core logic for managing a user's coding workspace and their files.
 */

import path from "path";
import File from "../models/File.js";
import Room from "../models/Room.js";
import { createS3Key, uploadFileContent, getFileContent } from "./s3.service.js";
import {
  getCachedWorkspace,
  cacheWorkspace,
  getDirtyRooms,
  clearRoomDirty,
  acquirePersistLock,
  releasePersistLock,
} from "./redis.service.js";
import { getFileName, getExtension, getByteSize, detectLanguage } from "../utils/fileHelpers.js";

/**
 * Workspace Service
 *
 * Owns the cross-cutting "load workspace" and "persist workspace" flows.
 * This is the ONLY service allowed to orchestrate across Redis, S3, and MongoDB
 * for workspace-level operations.
 *
 * Previously this logic was split between roomService.js and redis.service.js,
 * causing each to import from the other's domain.
 */

// ─── Workspace Initialization ─────────────────────────────────────────────────

/**
 * Initialize a new workspace's files into S3 and MongoDB.
 * Called once when a room is first created from a template.
 *
 * @param {string} roomId
 * @param {string} ownerId - The room owner's user ID (for S3 key construction)
 * @param {Array|string} files - Template files array or JSON string
 */
export const initializeWorkspaceFiles = async (roomId, ownerId, files) => {
  if (!files) return;
  try {
    const parsedFiles = typeof files === "string" ? JSON.parse(files) : files;
    if (!Array.isArray(parsedFiles) || parsedFiles.length === 0) return;

    console.log(`[Workspace] Initializing ${parsedFiles.length} template files for room ${roomId}`);

    for (const file of parsedFiles) {
      if (!file.path) continue;

      const fileName = getFileName(file.path);
      const fileExtension = getExtension(file.path);

      if (file.isFolder) {
        await File.findOneAndUpdate(
          { roomId, path: file.path },
          { name: fileName, type: "folder", s3Key: "", extension: fileExtension },
          { upsert: true, returnDocument: "after" }
        );
      } else {
        const s3Key = createS3Key(ownerId, roomId, file.path);
        const content = file.content || "";

        try {
          await uploadFileContent(s3Key, content);
        } catch (s3Err) {
          console.error(`[Workspace] S3 upload failed for ${file.path}:`, s3Err.message);
        }

        await File.findOneAndUpdate(
          { roomId, path: file.path },
          {
            name: fileName,
            type: "file",
            s3Key,
            size: getByteSize(content),
            language: file.language || detectLanguage(file.path),
            extension: fileExtension,
            version: 1,
          },
          { upsert: true, returnDocument: "after" }
        );
      }
    }

    // Cache the initialized workspace in Redis
    await cacheWorkspace(roomId, parsedFiles);
    console.log(`[Workspace] Initialization complete for room ${roomId}`);
  } catch (err) {
    console.error(`[Workspace] Error initializing workspace for room ${roomId}:`, err.message);
  }
};

// ─── Workspace Load (Redis → MongoDB → S3 Waterfall) ─────────────────────────

/**
 * Load workspace files for a room using the cache-first strategy:
 *   1. Check Redis cache
 *   2. On miss: fetch metadata from MongoDB, stream content from S3
 *   3. On no MongoDB records: migrate from legacy Room.files field (backward compat)
 *   4. Cache result in Redis for subsequent requests
 *
 * @param {string} roomId
 * @returns {Promise<Array>} Files array (each: { path, isFolder, content?, language? })
 */
export const loadWorkspace = async (roomId) => {
  // ── 1. Redis Cache Hit ─────────────────────────────────────────────────────
  const cached = await getCachedWorkspace(roomId);
  if (cached) {
    console.log(`[Workspace] Cache hit for room ${roomId} (Redis)`);
    return cached;
  }

  console.log(`[Workspace] Cache miss for room ${roomId} — rebuilding from MongoDB + S3`);

  // ── 2. MongoDB + S3 Reconstruction ────────────────────────────────────────
  const dbFiles = await File.find({ roomId });

  if (dbFiles.length > 0) {
    console.log(`[Workspace] Reconstructing ${dbFiles.length} files from S3 for room ${roomId}`);
    const filesArray = [];

    for (const dbFile of dbFiles) {
      if (dbFile.type === "folder") {
        filesArray.push({ path: dbFile.path, isFolder: true, content: undefined });
      } else {
        try {
          const content = await getFileContent(dbFile.s3Key);
          filesArray.push({
            path: dbFile.path,
            isFolder: false,
            content,
            language: dbFile.language,
          });
        } catch (err) {
          console.error(`[Workspace] S3 read failed for ${dbFile.path} (${dbFile.s3Key}):`, err.message);
          filesArray.push({ path: dbFile.path, isFolder: false, content: "", language: dbFile.language });
        }
      }
    }

    await cacheWorkspace(roomId, filesArray);
    return filesArray;
  }

  // ── 3. Legacy Fallback: Room.files JSON migration ─────────────────────────
  const room = await Room.findOne({ roomId });
  if (room && room.files) {
    try {
      const parsedFiles = JSON.parse(room.files);
      if (Array.isArray(parsedFiles) && parsedFiles.length > 0) {
        console.log(`[Workspace] Migrating legacy Room.files for room ${roomId}`);
        const ownerId = room.ownerId || "default_user";

        for (const file of parsedFiles) {
          if (!file.path) continue;

          const fileName = getFileName(file.path);
          const fileExtension = getExtension(file.path);

          if (file.isFolder) {
            await File.create({
              roomId,
              name: fileName,
              path: file.path,
              type: "folder",
              s3Key: "",
              extension: fileExtension,
            });
          } else {
            const s3Key = createS3Key(ownerId, roomId, file.path);
            const content = file.content || "";

            try {
              await uploadFileContent(s3Key, content);
            } catch (s3Err) {
              console.error(`[Workspace] S3 upload failed during migration for ${file.path}:`, s3Err.message);
            }

            await File.create({
              roomId,
              name: fileName,
              path: file.path,
              type: "file",
              s3Key,
              size: getByteSize(content),
              language: file.language || detectLanguage(file.path),
              extension: fileExtension,
              version: 1,
            });
          }
        }

        await cacheWorkspace(roomId, parsedFiles);
        return parsedFiles;
      }
    } catch (parseErr) {
      console.error(`[Workspace] Error parsing legacy Room.files for room ${roomId}:`, parseErr.message);
    }
  }

  return [];
};

// ─── Workspace Persistence (Redis → S3 + MongoDB) ────────────────────────────

/**
 * Persist the cached workspace files from Redis to S3 (content) and MongoDB (metadata).
 * Called either on manual save or by the background sync interval.
 *
 * CONCURRENCY SAFE: Uses a distributed Redis lock (SET NX EX) to guarantee
 * only ONE persist job runs per room at a time. If another process (e.g. a
 * manual save and background sync firing simultaneously) already holds the
 * lock for this room, this call returns immediately — preventing:
 *   1. Interleaved partial S3 writes from two concurrent persists
 *   2. MongoDB version counter getting double-incremented
 *   3. Stale data overwriting fresh data mid-persist
 *
 * @param {string} roomId
 */
export const persistWorkspaceToS3 = async (roomId) => {
  // ── Acquire distributed lock ───────────────────────────────────────────
  const lockAcquired = await acquirePersistLock(roomId);
  if (!lockAcquired) {
    console.log(`[Workspace] Persist for room ${roomId} skipped — another process holds the lock`);
    return;
  }

  try {
    const files = await getCachedWorkspace(roomId);
    if (!files || !Array.isArray(files)) {
      console.log(`[Workspace] No cached workspace found for room ${roomId} — skipping persist`);
      return;
    }

    const room = await Room.findOne({ roomId });
    const ownerId = room ? room.ownerId : "default_user";

    console.log(`[Workspace] Persisting ${files.length} files for room ${roomId} → S3 + MongoDB`);

    for (const file of files) {
      if (!file.path) continue;

      const fileName = getFileName(file.path);
      const fileExtension = getExtension(file.path);

      if (file.isFolder) {
        await File.findOneAndUpdate(
          { roomId, path: file.path },
          { name: fileName, type: "folder", s3Key: "", extension: fileExtension },
          { upsert: true, returnDocument: "after" }
        );
      } else {
        const dbFile = await File.findOne({ roomId, path: file.path });
        const s3Key = dbFile ? dbFile.s3Key : createS3Key(ownerId, roomId, file.path);
        const content = file.content || "";

        try {
          await uploadFileContent(s3Key, content);
        } catch (err) {
          console.error(`[Workspace] S3 upload failed for ${file.path}:`, err.message);
          continue; // skip this file but continue persisting others
        }

        const version = dbFile ? dbFile.version + 1 : 1;
        await File.findOneAndUpdate(
          { roomId, path: file.path },
          {
            name: fileName,
            type: "file",
            s3Key,
            version,
            size: getByteSize(content),
            language: file.language || detectLanguage(file.path),
            extension: fileExtension,
            updatedBy: "collaborator",
          },
          { upsert: true, returnDocument: "after" }
        );
      }
    }

    console.log(`[Workspace] Persist complete for room ${roomId}`);
  } finally {
    // ── Always release lock, even if persist threw an error ────────────────
    await releasePersistLock(roomId);
  }
};

// ─── Background Sync Interval ─────────────────────────────────────────────────

let syncIntervalId = null;

/**
 * Start the background dirty-room flusher.
 * Periodically syncs any rooms with unsaved changes from Redis → S3/MongoDB.
 *
 * IMPORTANT: Call this once from server.js startup, NOT from inside a controller.
 *
 * @param {number} [intervalMs=30000] - Flush interval in milliseconds
 */
export const startWorkspaceSyncInterval = (intervalMs = 30000) => {
  if (syncIntervalId) {
    console.log("[Workspace] Sync interval already running — skipping duplicate start");
    return;
  }

  console.log(`[Workspace] Starting background S3 sync every ${intervalMs / 1000}s`);

  syncIntervalId = setInterval(async () => {
    try {
      const dirtyRooms = await getDirtyRooms();
      if (!dirtyRooms || dirtyRooms.length === 0) return;

      console.log(`[Workspace] Flushing ${dirtyRooms.length} dirty room(s) to S3`);

      for (const roomId of dirtyRooms) {
        try {
          await persistWorkspaceToS3(roomId);
          await clearRoomDirty(roomId);
        } catch (err) {
          console.error(`[Workspace] Failed to flush room ${roomId}:`, err.message);
        }
      }
    } catch (err) {
      console.error("[Workspace] Sync interval error:", err.message);
    }
  }, intervalMs);
};

/**
 * Stop the background sync interval (used for graceful shutdown).
 */
export const stopWorkspaceSyncInterval = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log("[Workspace] Background sync interval stopped");
  }
};
