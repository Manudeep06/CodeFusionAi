/**
 * INTERVIEW PREP NOTES:
 * This file lists the URLs for user authentication (login/signup) and connects them to the user controller.
 */

import express from "express";
import validate from "../middleware/validate.js";
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
router.post(
  "/profile",
  validate({ body: { userId: "required|string" } }),
  upsertProfile
);

export default router;
