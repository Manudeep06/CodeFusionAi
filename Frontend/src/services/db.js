import { openDB } from 'idb';

const DB_NAME = 'CodeFusionWorkspaceDB';
const STORE_NAME = 'workspaces';

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'roomId' });
      }
    },
  });
};

/**
 * Save workspace files to IndexedDB
 * @param {string} roomId 
 * @param {Array<{path: string, content: string, isFolder: boolean}>} files 
 */
export const saveWorkspaceFiles = async (roomId, files) => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, { roomId, files, updatedAt: Date.now() });
  } catch (err) {
    console.error("Failed to save to IndexedDB:", err);
  }
};

/**
 * Load workspace files from IndexedDB
 * @param {string} roomId 
 * @returns {Promise<Array<{path: string, content: string, isFolder: boolean}> | null>}
 */
export const loadWorkspaceFiles = async (roomId) => {
  try {
    const db = await initDB();
    const data = await db.get(STORE_NAME, roomId);
    return data ? data.files : null;
  } catch (err) {
    console.error("Failed to load from IndexedDB:", err);
    return null;
  }
};
