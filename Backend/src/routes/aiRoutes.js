/**
 * INTERVIEW PREP NOTES:
 * This file lists all the URLs (endpoints) for AI features and connects them to the right controller functions.
 */

import express from "express";
import validate from "../middleware/validate.js";
import {
  chatWithAI,
  reviewCodeHandler,
  explainCodeHandler,
  optimizeCodeHandler,
} from "../controllers/aiController.js";

const router = express.Router();

/**
 * AI Routes
 * Base path: /api/ai
 */

// POST /api/ai/chat — General AI chat
router.post(
  "/chat",
  validate({ body: { message: "required|string" } }),
  chatWithAI
);

// POST /api/ai/review — Structured code review
router.post(
  "/review",
  validate({ body: { code: "required|string" } }),
  reviewCodeHandler
);

// POST /api/ai/explain — Code explanation
router.post(
  "/explain",
  validate({ body: { code: "required|string" } }),
  explainCodeHandler
);

// POST /api/ai/optimize — Code optimization
router.post(
  "/optimize",
  validate({ body: { code: "required|string" } }),
  optimizeCodeHandler
);

export default router;