/**
 * Version history.
 *
 * Every successful flush to S3 records a snapshot of the whole workspace:
 *   1. Normalise files → stable JSON → SHA-256. If it equals the latest
 *      snapshot's hash, nothing changed, so no new version is written.
 *   2. Upload the JSON to S3 at snapshots/<roomId>/v<n>.json (falls back to
 *      storing it inline in MongoDB if S3 is unavailable).
 *   3. Insert Snapshot metadata and prune to the newest MAX_VERSIONS.
 *
 * Version numbers are assigned while the caller holds the room's persist lock,
 * so two flushes can never claim the same number.
 */

import crypto from "crypto";
import Snapshot from "../models/Snapshot.js";
import AppError from "../utils/AppError.js";
import { uploadFileContent, getFileContent, deleteS3Object } from "./s3.service.js";

export const MAX_VERSIONS = 50;

const snapshotKey = (roomId, version) => `snapshots/${roomId}/v${version}.json`;

/** Folders + files sorted by path, contents included; the canonical form we hash. */
export const normalizeFiles = (files = []) =>
  files
    .filter((f) => f && f.path)
    .map((f) => (f.isFolder
      ? { path: f.path, isFolder: true }
      : { path: f.path, isFolder: false, content: f.content || "", language: f.language || undefined }))
    .sort((a, b) => a.path.localeCompare(b.path));

export const hashFiles = (normalized) =>
  crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");

/**
 * Record a snapshot if the workspace changed since the last one.
 * @returns {Promise<object|null>} the new snapshot, or null when unchanged / empty
 */
export const createSnapshot = async (roomId, files, { reason = "auto", userId = "", userName = "", restoredFrom = null } = {}) => {
  const normalized = normalizeFiles(files);
  if (normalized.length === 0) return null;

  const contentHash = hashFiles(normalized);
  const latest = await Snapshot.findOne({ roomId }).sort({ version: -1 }).select("version contentHash").lean();
  if (latest && latest.contentHash === contentHash && reason !== "restore") return null;

  const version = (latest?.version || 0) + 1;
  const body = JSON.stringify(normalized);
  const fileEntries = normalized.filter((f) => !f.isFolder).map((f) => ({ path: f.path, size: Buffer.byteLength(f.content) }));

  let s3Key = snapshotKey(roomId, version);
  let inlineFiles = "";
  try {
    await uploadFileContent(s3Key, body, "application/json");
  } catch (err) {
    console.warn(`[History] S3 snapshot upload failed for ${roomId} v${version}; storing inline:`, err.message);
    s3Key = "";
    inlineFiles = body;
  }

  const snapshot = await Snapshot.create({
    roomId,
    version,
    reason,
    createdBy: userId,
    createdByName: userName,
    contentHash,
    fileCount: fileEntries.length,
    totalBytes: fileEntries.reduce((sum, f) => sum + f.size, 0),
    files: fileEntries,
    s3Key,
    inlineFiles,
    restoredFrom,
  });

  await pruneSnapshots(roomId);
  return snapshot;
};

/** Keep only the newest MAX_VERSIONS snapshots for a room. */
export const pruneSnapshots = async (roomId, keep = MAX_VERSIONS) => {
  const stale = await Snapshot.find({ roomId }).sort({ version: -1 }).skip(keep).select("_id s3Key").lean();
  if (stale.length === 0) return 0;
  await Promise.all(stale.filter((s) => s.s3Key).map((s) => deleteS3Object(s.s3Key).catch(() => {})));
  await Snapshot.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
  return stale.length;
};

/** Newest-first list of versions (metadata only). */
export const listSnapshots = async (roomId, limit = MAX_VERSIONS) =>
  Snapshot.find({ roomId })
    .sort({ version: -1 })
    .limit(limit)
    .select("version reason createdByName fileCount totalBytes files restoredFrom createdAt")
    .lean();

/** Full file list (with contents) for one version. */
export const getSnapshotFiles = async (roomId, version) => {
  const snapshot = await Snapshot.findOne({ roomId, version: Number(version) }).lean();
  if (!snapshot) throw new AppError(`Version ${version} not found for this room.`, 404);
  const raw = snapshot.s3Key ? await getFileContent(snapshot.s3Key) : snapshot.inlineFiles;
  return { snapshot, files: JSON.parse(raw || "[]") };
};

/** Remove every snapshot for a room (used when a room is deleted). */
export const deleteRoomSnapshots = async (roomId) => pruneSnapshots(roomId, 0);
