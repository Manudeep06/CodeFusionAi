/**
 * Snapshot — one immutable, point-in-time copy of a room's workspace.
 *
 * Metadata lives here; the file contents live in a single JSON object in S3
 * (`snapshots/<roomId>/v<version>.json`). If S3 is unavailable the files are
 * stored inline so history still works in local development.
 */

import mongoose from "mongoose";

const SnapshotSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    reason: { type: String, enum: ["auto", "manual", "restore"], default: "auto" },
    createdBy: { type: String, default: "" },
    createdByName: { type: String, default: "" },
    /** SHA-256 of the workspace contents — consecutive identical snapshots are skipped. */
    contentHash: { type: String, required: true },
    fileCount: { type: Number, default: 0 },
    totalBytes: { type: Number, default: 0 },
    /** Paths with their size, so the History panel can show a summary without loading contents. */
    files: [{ path: String, size: Number, _id: false }],
    s3Key: { type: String, default: "" },
    inlineFiles: { type: String, default: "" },
    restoredFrom: { type: Number, default: null },
  },
  { timestamps: true }
);

SnapshotSchema.index({ roomId: 1, version: -1 }, { unique: true });

const Snapshot = mongoose.model("Snapshot", SnapshotSchema);

export default Snapshot;
