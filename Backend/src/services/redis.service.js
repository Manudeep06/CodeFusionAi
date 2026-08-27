/**
 * INTERVIEW PREP NOTES:
 * This file contains the core logic for saving and retrieving fast, temporary data using Redis.
 */

import redisClient from "../config/redis.js";
import { REDIS_KEYS, REDIS_TTL, TOKEN_BUCKET_CONFIG, encodeFilePath, decodeFilePath } from "../utils/redisKeys.js";

/**
 * Redis Service — Pure Cache Interface
 *
 * KEY ARCHITECTURAL IMPROVEMENT: Per-File Hash Storage
 * ─────────────────────────────────────────────────────
 * Previously, the entire workspace was stored as a single JSON string:
 *   SET room:{roomId}:workspace "[{...file1...}, {...file2...}]"
 *
 * Problem: If User A edits file1 and User B edits file2 simultaneously,
 * both send the FULL workspace. Whichever arrives last overwrites the
 * other user's changes for ALL files — a complete last-write-wins race.
 *
 * Fix: Store each file as an independent Redis Hash field:
 *   HSET room:{roomId}:files <base64(path)> <JSON(file)>
 *
 * Now concurrent writes to DIFFERENT files are fully independent.
 * User A updating file1 and User B updating file2 → no conflict.
 * Only same-file concurrent edits (the true ConcurrentEdit/CRDT problem)
 * still need OT/CRDT — but that requires a much bigger architecture change.
 */

// ─── Workspace Cache (Per-File Hash) ─────────────────────────────────────────

/**
 * Cache workspace files in Redis using a Hash.
 * Each file is stored as an independent hash field, keyed by its path.
 *
 * Concurrent updates to DIFFERENT files will NOT overwrite each other.
 * This eliminates the workspace-level last-write-wins race condition.
 *
 * @param {string} roomId
 * @param {Array|string} files - Files array or JSON string
 */
export const cacheWorkspace = async (roomId, files) => {
  try {
    const parsed = typeof files === "string" ? JSON.parse(files) : files;
    if (!Array.isArray(parsed)) return;

    const hashKey = REDIS_KEYS.workspaceHash(roomId);

    // Write each file as a separate hash field (atomic per-file)
    for (const file of parsed) {
      if (!file.path) continue;
      const field = encodeFilePath(file.path);
      await redisClient.hset(hashKey, field, JSON.stringify(file));
    }

    // Refresh TTL on every write (sliding expiry)
    await redisClient.expire(hashKey, REDIS_TTL.workspace);
  } catch (err) {
    console.error(`[Redis] cacheWorkspace error for room ${roomId}:`, err.message);
  }
};

/**
 * Update a SINGLE file in the workspace cache without touching other files.
 * Use this when only one file changed — avoids overwriting other concurrent edits.
 *
 * @param {string} roomId
 * @param {Object} file - { path, content, isFolder, language }
 */
export const cacheFile = async (roomId, file) => {
  if (!file?.path) return;
  try {
    const hashKey = REDIS_KEYS.workspaceHash(roomId);
    const field = encodeFilePath(file.path);
    await redisClient.hset(hashKey, field, JSON.stringify(file));
    await redisClient.expire(hashKey, REDIS_TTL.workspace);
  } catch (err) {
    console.error(`[Redis] cacheFile error for ${file.path} in room ${roomId}:`, err.message);
  }
};

/**
 * Remove a single file from the workspace hash.
 * Called when a file is deleted from the workspace.
 *
 * @param {string} roomId
 * @param {string} filePath
 */
export const evictFileFromWorkspace = async (roomId, filePath) => {
  try {
    const hashKey = REDIS_KEYS.workspaceHash(roomId);
    const field = encodeFilePath(filePath);
    await redisClient.hdel(hashKey, field);
  } catch (err) {
    console.error(`[Redis] evictFileFromWorkspace error for room ${roomId}:`, err.message);
  }
};

/**
 * Retrieve the cached workspace as a files array, reconstructed from the Hash.
 *
 * @param {string} roomId
 * @returns {Promise<Array|null>} Parsed files array, or null on miss
 */
export const getCachedWorkspace = async (roomId) => {
  try {
    const hashKey = REDIS_KEYS.workspaceHash(roomId);
    const hashData = await redisClient.hgetall(hashKey);

    if (!hashData || Object.keys(hashData).length === 0) return null;

    // Reconstruct the array from hash fields, decoding paths
    const files = [];
    for (const [encodedPath, fileJson] of Object.entries(hashData)) {
      try {
        const file = JSON.parse(fileJson);
        files.push(file);
      } catch (parseErr) {
        console.error(`[Redis] Failed to parse file at path ${decodeFilePath(encodedPath)}:`, parseErr.message);
      }
    }

    // Sort by path for consistent ordering
    files.sort((a, b) => (a.path < b.path ? -1 : 1));
    return files.length > 0 ? files : null;
  } catch (err) {
    console.error(`[Redis] getCachedWorkspace error for room ${roomId}:`, err.message);
    return null;
  }
};

/**
 * Delete the entire workspace hash for a room.
 * Call this when a room is permanently deleted.
 *
 * @param {string} roomId
 */
export const evictWorkspaceCache = async (roomId) => {
  await redisClient.del(REDIS_KEYS.workspaceHash(roomId));
};

// ─── Dirty Room Tracking ─────────────────────────────────────────────────────

/**
 * Mark a room as having unsaved changes (needs sync to S3).
 * Uses a Redis Set so marking the same room twice is idempotent.
 *
 * @param {string} roomId
 */
export const markRoomDirty = async (roomId) => {
  await redisClient.sadd(REDIS_KEYS.dirtyRooms(), roomId);
};

/**
 * Get all room IDs that have unsaved changes.
 *
 * @returns {Promise<string[]>}
 */
export const getDirtyRooms = async () => {
  return await redisClient.smembers(REDIS_KEYS.dirtyRooms());
};

/**
 * Remove a room from the dirty set after its changes have been persisted.
 *
 * @param {string} roomId
 */
export const clearRoomDirty = async (roomId) => {
  await redisClient.srem(REDIS_KEYS.dirtyRooms(), roomId);
};

// ─── Token Bucket S3 Flushing & Rate Limiting ───────────────────────────────

/**
 * Increment the edit token counter for a room (1 edit = 1 token).
 * Also updates the last edit timestamp.
 *
 * @param {string} roomId
 * @returns {Promise<{ editCount: number, shouldFlush: boolean }>}
 */
export const incrementEditTokens = async (roomId) => {
  try {
    const key = REDIS_KEYS.tokenBucket(roomId);
    const now = Date.now();

    const editCount = await redisClient.hincrby(key, "editCount", 1);
    await redisClient.hset(key, "lastEditTime", now.toString());
    await redisClient.expire(key, REDIS_TTL.tokenBucket);

    const shouldFlush = editCount >= TOKEN_BUCKET_CONFIG.flushEditThreshold;
    return { editCount, shouldFlush };
  } catch (err) {
    console.error(`[Redis] incrementEditTokens error for room ${roomId}:`, err.message);
    return { editCount: 1, shouldFlush: false };
  }
};

/**
 * Check if an S3 upload token is available in the room's Token Bucket,
 * refilling tokens based on elapsed time if necessary. If available, consume 1 token.
 *
 * Rate-limiting token bucket algorithm:
 *   - Capacity: bucketCapacity (default 5)
 *   - Refill Rate: 1 token every refillRateMs (default 5000ms)
 *
 * @param {string} roomId
 * @returns {Promise<boolean>} true if token was consumed and S3 upload can proceed, false if rate limited
 */
export const checkAndConsumeS3Token = async (roomId) => {
  try {
    const key = REDIS_KEYS.tokenBucket(roomId);
    const now = Date.now();
    const data = await redisClient.hgetall(key);

    const capacity = TOKEN_BUCKET_CONFIG.bucketCapacity;
    const refillRateMs = TOKEN_BUCKET_CONFIG.refillRateMs;

    let s3Tokens = data.s3Tokens !== undefined ? parseFloat(data.s3Tokens) : capacity;
    let lastRefill = data.lastRefill !== undefined ? parseInt(data.lastRefill, 10) : now;

    // Refill tokens based on time elapsed since last refill
    const elapsed = now - lastRefill;
    if (elapsed > 0) {
      const addedTokens = elapsed / refillRateMs;
      s3Tokens = Math.min(capacity, s3Tokens + addedTokens);
      lastRefill = now;
    }

    if (s3Tokens >= 1) {
      s3Tokens -= 1;
      await redisClient.hset(key, "s3Tokens", s3Tokens.toString(), "lastRefill", lastRefill.toString());
      await redisClient.expire(key, REDIS_TTL.tokenBucket);
      return true;
    }

    // Rate limited — update refilled token state without consuming
    await redisClient.hset(key, "s3Tokens", s3Tokens.toString(), "lastRefill", lastRefill.toString());
    return false;
  } catch (err) {
    console.error(`[Redis] checkAndConsumeS3Token error for room ${roomId}:`, err.message);
    return true; // Fail open if Redis error occurs
  }
};

/**
 * Reset accumulated edit tokens to 0 after workspace has been persisted to S3.
 *
 * @param {string} roomId
 */
export const resetEditTokens = async (roomId) => {
  try {
    const key = REDIS_KEYS.tokenBucket(roomId);
    await redisClient.hset(key, "editCount", "0");
  } catch (err) {
    console.error(`[Redis] resetEditTokens error for room ${roomId}:`, err.message);
  }
};

/**
 * Get the current token bucket state for a room.
 *
 * @param {string} roomId
 * @returns {Promise<{ editCount: number, lastEditTime: number, s3Tokens: number }>}
 */
export const getTokenBucketState = async (roomId) => {
  try {
    const key = REDIS_KEYS.tokenBucket(roomId);
    const data = await redisClient.hgetall(key);
    return {
      editCount: data.editCount ? parseInt(data.editCount, 10) : 0,
      lastEditTime: data.lastEditTime ? parseInt(data.lastEditTime, 10) : 0,
      s3Tokens: data.s3Tokens ? parseFloat(data.s3Tokens) : TOKEN_BUCKET_CONFIG.bucketCapacity,
    };
  } catch (err) {
    console.error(`[Redis] getTokenBucketState error for room ${roomId}:`, err.message);
    return { editCount: 0, lastEditTime: 0, s3Tokens: TOKEN_BUCKET_CONFIG.bucketCapacity };
  }
};

// ─── Distributed Lock for S3 Persistence ─────────────────────────────────────

/**
 * Acquire an exclusive lock for persisting a room's workspace to S3.
 *
 * Uses Redis SET NX EX — atomic "set if not exists with expiry".
 * This guarantees only ONE server process can persist a given room at a time.
 * The lock auto-expires after persistLock TTL seconds to prevent deadlocks
 * if the server crashes mid-persist.
 *
 * @param {string} roomId
 * @returns {Promise<boolean>} true if lock acquired, false if another process holds it
 */
export const acquirePersistLock = async (roomId) => {
  try {
    const lockKey = REDIS_KEYS.persistLock(roomId);
    const result = await redisClient.set(
      lockKey,
      "1",
      "NX",
      "EX",
      REDIS_TTL.persistLock
    );
    return result === "OK";
  } catch (err) {
    console.error(`[Redis] acquirePersistLock error for room ${roomId}:`, err.message);
    return false; // Fail open: allow persist if lock can't be checked
  }
};

/**
 * Release the S3 persistence lock for a room.
 * Always call this after persistWorkspaceToS3 completes (success or failure).
 *
 * @param {string} roomId
 */
export const releasePersistLock = async (roomId) => {
  try {
    await redisClient.del(REDIS_KEYS.persistLock(roomId));
  } catch (err) {
    console.error(`[Redis] releasePersistLock error for room ${roomId}:`, err.message);
  }
};

// ─── File Content Cache ───────────────────────────────────────────────────────

/**
 * Cache individual file content by file ID (for fast single-file reads).
 *
 * @param {string} fileId - MongoDB File document _id
 * @param {string} content - File content string
 */
export const cacheFileContent = async (fileId, content) => {
  await redisClient.set(
    REDIS_KEYS.fileContent(fileId),
    content,
    "EX",
    REDIS_TTL.fileContent
  );
};

/**
 * Retrieve cached file content by file ID.
 *
 * @param {string} fileId
 * @returns {Promise<string|null>}
 */
export const getCachedFileContent = async (fileId) => {
  return await redisClient.get(REDIS_KEYS.fileContent(fileId));
};

/**
 * Evict a specific file's content cache entry.
 *
 * @param {string} fileId
 */
export const evictFileCache = async (fileId) => {
  await redisClient.del(REDIS_KEYS.fileContent(fileId));
};
