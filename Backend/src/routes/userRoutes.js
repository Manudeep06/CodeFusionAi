/**
 * INTERVIEW PREP NOTES:
 * This file lists the URLs for user authentication (login/signup) and connects them to the user controller.
 */

import express from "express";
import validate from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { getProfile, upsertProfile } from "../controllers/user.controller.js";

const router = express.Router();

/**
 * User Routes
 * Base path: /api/users
 */

// GET /api/users/profile/:userId — Get user profile
router.get(
  "/profile/:userId",
  validate({ params: { userId: "required|string" } }),
  getProfile
);

// POST /api/users/profile — Create or update user profile
router.post("/profile", requireAuth, rateLimit({ name: "profile", limit: 20, windowSec: 60 }), upsertProfile);

export default router;
