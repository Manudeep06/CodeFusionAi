/**
 * INTERVIEW PREP NOTES:
 * This file lists the URLs for code execution features and connects them to the execute controller.
 */

import express from "express";
import validate from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { executeCode } from "../controllers/execute.controller.js";

const router = express.Router();

/**
 * Code Execution Routes
 * Base path: /api/execute
 */

// POST /api/execute — Execute code in the specified language
router.post(
  "/",
  requireAuth,
  rateLimit({ name: "execute", limit: 10, windowSec: 60 }),
  validate({ body: { language: "required|string", code: "required|string" } }),
  executeCode
);

export default router;