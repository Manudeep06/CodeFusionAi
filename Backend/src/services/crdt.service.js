/**
 * CRDT document service (Yjs).
 *
 * Each live room has one authoritative Y.Doc held in memory:
 *   doc.getMap("files")  →  Map<path, Y.Text>
 *
 * Clients bind their Monaco editor to the Y.Text of the open file and exchange
 * binary Yjs updates through Socket.IO. Because Yjs is a CRDT, concurrent
 * edits to the same file from different users merge deterministically — no
 * locking, no last-writer-wins overwrites.
 *
 * The doc is seeded from the persisted workspace (Redis → S3) on first join,
 * and text changes are written back to the Redis workspace (debounced), so the
 * existing token-bucket flush and version history keep working unchanged.
 *
 * Docs are dropped from memory a while after the last member leaves; the next
 * join rebuilds them from storage.
 */

import * as Y from "yjs";

export const SERVER_ORIGIN = "server";
const IDLE_DROP_MS = 5 * 60 * 1000;

/** roomId → { doc, dropTimer } */
const rooms = new Map();

export const hasDoc = (roomId) => rooms.has(roomId);
export const getDoc = (roomId) => rooms.get(roomId)?.doc || null;

/**
 * Get the room's doc, creating and seeding it from `files` if needed.
 * @param {string} roomId
 * @param {Array<{path:string,isFolder?:boolean,content?:string}>} [files]
 */
export const ensureDoc = (roomId, files = []) => {
  let entry = rooms.get(roomId);
  if (!entry) {
    const doc = new Y.Doc();
    entry = { doc, dropTimer: null };
    rooms.set(roomId, entry);
    seedFiles(doc, files);
  }
  if (entry.dropTimer) {
    clearTimeout(entry.dropTimer);
    entry.dropTimer = null;
  }
  return entry.doc;
};

/** Add a Y.Text for every file path the doc doesn't know yet. */
export const seedFiles = (doc, files) => {
  const map = doc.getMap("files");
  doc.transact(() => {
    for (const f of files) {
      if (!f?.path || f.isFolder || map.has(f.path)) continue;
      const text = new Y.Text();
      text.insert(0, f.content || "");
      map.set(f.path, text);
    }
  }, SERVER_ORIGIN);
};

/**
 * Reconcile the doc with a structural change (create / delete / rename) coming
 * from a client's full file list. Existing texts are authoritative for content;
 * new paths are seeded; vanished paths are removed.
 *
 * @returns {{ files: Array, update: Uint8Array|null }} the list with doc contents
 *          applied, and the Yjs update to broadcast (null if nothing changed)
 */
export const reconcileFiles = (roomId, files) => {
  const doc = ensureDoc(roomId, []);
  const map = doc.getMap("files");
  const live = new Set(files.filter((f) => f?.path && !f.isFolder).map((f) => f.path));

  const update = captureUpdate(doc, () => {
    doc.transact(() => {
      for (const key of [...map.keys()]) if (!live.has(key)) map.delete(key);
    }, SERVER_ORIGIN);
    seedFiles(doc, files);
  });

  const merged = files.map((f) => (f?.path && !f.isFolder && map.has(f.path)
    ? { ...f, content: map.get(f.path).toString() }
    : f));
  return { files: merged, update };
};

/**
 * Overwrite every text with the given contents (used by version restore).
 * @returns {Uint8Array|null} update to broadcast
 */
export const replaceContents = (roomId, files) => {
  const doc = ensureDoc(roomId, []);
  const map = doc.getMap("files");
  const live = new Map(files.filter((f) => f?.path && !f.isFolder).map((f) => [f.path, f.content || ""]));

  return captureUpdate(doc, () => {
    doc.transact(() => {
      for (const key of [...map.keys()]) if (!live.has(key)) map.delete(key);
      for (const [path, content] of live) {
        let text = map.get(path);
        if (!text) {
          text = new Y.Text();
          map.set(path, text);
        }
        if (text.toString() !== content) {
          text.delete(0, text.length);
          text.insert(0, content);
        }
      }
    }, SERVER_ORIGIN);
  });
};

/** Apply a client's update. Returns false if the update was malformed. */
export const applyClientUpdate = (roomId, update, origin) => {
  const doc = getDoc(roomId);
  if (!doc) return false;
  try {
    Y.applyUpdate(doc, update instanceof Uint8Array ? update : new Uint8Array(update), origin);
    return true;
  } catch (err) {
    console.error(`[CRDT] Rejected malformed update for room ${roomId}:`, err.message);
    return false;
  }
};

/** Full state for a joining client. */
export const encodeState = (roomId) => {
  const doc = getDoc(roomId);
  return doc ? Y.encodeStateAsUpdate(doc) : null;
};

/** Current contents of every text: Map<path, string>. */
export const getContents = (roomId) => {
  const doc = getDoc(roomId);
  const out = new Map();
  if (!doc) return out;
  doc.getMap("files").forEach((text, path) => out.set(path, text.toString()));
  return out;
};

/** Schedule the doc to be dropped after the last member leaves. */
export const scheduleDrop = (roomId, delayMs = IDLE_DROP_MS) => {
  const entry = rooms.get(roomId);
  if (!entry) return;
  if (entry.dropTimer) clearTimeout(entry.dropTimer);
  entry.dropTimer = setTimeout(() => {
    entry.doc.destroy();
    rooms.delete(roomId);
  }, delayMs);
  entry.dropTimer.unref?.();
};

/** Collect every update produced while `fn` runs into one merged update. */
const captureUpdate = (doc, fn) => {
  const updates = [];
  const onUpdate = (u) => updates.push(u);
  doc.on("update", onUpdate);
  try {
    fn();
  } finally {
    doc.off("update", onUpdate);
  }
  return updates.length ? Y.mergeUpdates(updates) : null;
};

/** Test hook: forget every room. */
export const _resetForTests = () => {
  for (const { doc, dropTimer } of rooms.values()) {
    if (dropTimer) clearTimeout(dropTimer);
    doc.destroy();
  }
  rooms.clear();
};
