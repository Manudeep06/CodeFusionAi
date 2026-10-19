/**
 * INTERVIEW PREP NOTES:
 * This file lists URLs for managing the file system structure (like folders) and connects them to the right functions.
 */

import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const SAFE_ID = /^[a-zA-Z0-9_-]+$/;

router.post("/folder", requireAuth, (req, res) => {
  const { folderName = "", roomId } = req.body;

  if (!roomId || !SAFE_ID.test(roomId)) {
    return res.status(400).json({ success: false, message: "A valid roomId is required" });
  }

  const workspacePath = path.resolve(os.tmpdir(), "codefusion-workspaces", roomId);
  const target = path.resolve(workspacePath, String(folderName));

  // Block "../" and absolute paths from escaping the room's workspace.
  if (target !== workspacePath && !target.startsWith(workspacePath + path.sep)) {
    return res.status(400).json({ success: false, message: "Invalid folder path" });
  }

  try {
    fs.mkdirSync(target, { recursive: true });

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
