import asyncHandler from "../utils/asyncHandler.js";
import * as userService from "../services/user.service.js";

/**
 * User Controller
 *
 * Thin HTTP layer over userService. Extracted from the inline handlers
 * that previously lived directly inside routes/userRoutes.js.
 */

/**
 * GET /api/users/profile/:userId
 * Returns the user's profile. Returns a default empty profile if none exists.
 */
export const getProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const profile = await userService.getUserProfile(userId);
  res.status(200).json(profile);
});

/**
 * POST /api/users/profile
 * Creates or updates a user profile.
 * Body: { userId, photoURL?, displayName? }
 */
export const upsertProfile = asyncHandler(async (req, res) => {
  const { userId, photoURL, displayName } = req.body;
  const profile = await userService.upsertUserProfile(userId, { photoURL, displayName });
  res.status(200).json(profile);
});
