import express from "express";
import fs from "fs";
import path from "path";
import os from "os";

const router = express.Router();

router.post("/folder", (req, res) => {
  const { folderName, roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ success: false, message: "roomId is required" });
  }

  const workspacePath = path.join(os.tmpdir(), "codefusion-workspaces", roomId);

  try {
    fs.mkdirSync(
      path.join(workspacePath, folderName),
      { recursive: true }
    );

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