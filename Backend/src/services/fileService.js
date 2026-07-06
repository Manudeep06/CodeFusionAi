import fs from "fs";
import path from "path";
import os from "os";

/**
 * Synchronize workspace files from memory/database string to disk
 * @param {string} roomId 
 * @param {string} codeString 
 */
export const syncFilesToDisk = (roomId, codeString) => {
  try {
    const files = JSON.parse(codeString);
    const workspaceRoot = path.join(os.tmpdir(), "codefusion-workspaces", roomId);
    
    if (!fs.existsSync(workspaceRoot)) {
      fs.mkdirSync(workspaceRoot, { recursive: true });
    }

    files.forEach(f => {
      if (!f.path) return;
      const fullPath = path.join(workspaceRoot, f.path);
      if (f.isFolder) {
        if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
      } else {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (f.content !== undefined) {
           fs.writeFileSync(fullPath, f.content);
        }
      }
    });
  } catch (err) {
    console.error("Sync error:", err);
    try {
      fs.appendFileSync(path.join(os.tmpdir(), "sync-error.log"), err.stack + "\n");
    } catch (logErr) {
      console.error("Could not write sync-error log to disk:", logErr);
    }
  }
};
