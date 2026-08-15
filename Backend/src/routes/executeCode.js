/**
 * INTERVIEW PREP NOTES:
 * This file lists the URLs for code execution features and connects them to the execute controller.
 */

import express from "express";
import validate from "../middleware/validate.js";
import { executeCode } from "../controllers/execute.controller.js";

const router = express.Router();

/**
 * Code Execution Routes
 * Base path: /api/execute
 */

// POST /api/execute — Execute code in the specified language
router.post(
  "/",
  validate({ body: { language: "required|string", code: "required|string" } }),
  executeCode
);

export default router;