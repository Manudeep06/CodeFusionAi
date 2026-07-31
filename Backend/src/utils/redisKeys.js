/**
 * Redis Key Constants
 *
 * Centralizes all Redis key patterns in one place. Prevents magic strings
 * from being scattered across multiple service files, making it easy to
 * audit, change, or namespace all cache keys at once.
 *
 * Naming Convention: <entity>:<identifier>:<field>
 */

export const REDIS_KEYS = {
  /**
   * Hash key that stores the full workspace for a room.
   * Each field in the hash is a base64-encoded file path.
   * Each value is a JSON-serialized file object { path, content, isFolder, language }.
   *
   * Using a Hash instead of a single string key means concurrent writes
   * to DIFFERENT files are completely independent — no overwrite race condition.
   *
   * Pattern: room:{roomId}:files  →  Hash<base64(path), JSON(file)>
   */
  workspaceHash: (roomId) => `room:${roomId}:files`,

  /**
   * Distributed lock key for S3 persistence of a room.
   * Acquired with SET NX EX before persisting, released with DEL after.
   * Prevents concurrent persist jobs from interleaving S3 writes.
   *
   * Pattern: room:{roomId}:persist:lock
   */
  persistLock: (roomId) => `room:${roomId}:persist:lock`,

  /** Set of roomIds that have unsaved changes and need S3 sync */
  dirtyRooms: () => `dirty_rooms`,

  /** Caches individual file content for fast single-file reads */
  fileContent: (fileId) => `file:${fileId}:content`,

  /** Stores user session data */
  userSession: (userId) => `session:${userId}`,

  /** Stores active room state (participants, cursors, etc.) */
  roomState: (roomId) => `room:${roomId}:state`,
};

/** Default TTL values (in seconds) */
export const REDIS_TTL = {
  /** Workspace hash: 2 hours. Refreshed on every write. */
  workspace: 60 * 60 * 2,

  /** S3 persist lock: 60 seconds max. Prevents deadlocks. */
  persistLock: 60,

  /** File content cache: 30 minutes */
  fileContent: 60 * 30,

  /** User session: 24 hours */
  userSession: 60 * 60 * 24,
};

/**
 * Encode a file path to a safe Redis hash field name (base64).
 * File paths can contain characters that Redis fields don't handle well.
 *
 * @param {string} filePath
 * @returns {string} base64-encoded path
 */
export const encodeFilePath = (filePath) =>
  Buffer.from(filePath).toString("base64");

/**
 * Decode a Redis hash field back to the original file path.
 *
 * @param {string} encoded - base64 string
 * @returns {string} original file path
 */
export const decodeFilePath = (encoded) =>
  Buffer.from(encoded, "base64").toString("utf8");
