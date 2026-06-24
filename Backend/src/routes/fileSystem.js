import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const WORKSPACE = path.join(
  path.resolve(process.cwd(), ".."),
  "workspace"
);

router.post("/folder", (req, res) => {
  const { folderName } = req.body;

  try {
    fs.mkdirSync(
      path.join(WORKSPACE, folderName),
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