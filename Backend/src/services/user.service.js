import UserProfile from "../models/UserProfile.js";
import AppError from "../utils/AppError.js";

/**
 * User Service
 *
 * Handles all UserProfile persistence operations.
 * Extracted from the inline handlers in routes/userRoutes.js.
 */

/**
 * Get a user profile by userId.
 * Returns a default empty profile object if none exists (non-error case).
 *
 * @param {string} userId
 * @returns {Promise<Object>} UserProfile document or default shape
 */
export const getUserProfile = async (userId) => {
  const profile = await UserProfile.findOne({ userId });
  if (profile) return profile;

  // Return a default shape so the frontend doesn't need to handle null
  return { userId, photoURL: "", displayName: "" };
};

/**
 * Create or update a user profile (upsert).
 * Only updates fields that are explicitly provided.
 *
 * @param {string} userId
 * @param {Object} fields
 * @param {string} [fields.photoURL]
 * @param {string} [fields.displayName]
 * @returns {Promise<Object>} Updated UserProfile document
 * @throws {AppError} 400 if userId is missing
 */
export const upsertUserProfile = async (userId, { photoURL, displayName } = {}) => {
  if (!userId) throw new AppError("userId is required", 400);

  const updateFields = { updatedAt: Date.now() };
  if (photoURL !== undefined) updateFields.photoURL = photoURL;
  if (displayName !== undefined) updateFields.displayName = displayName;

  return await UserProfile.findOneAndUpdate(
    { userId },
    { $set: updateFields },
    { returnDocument: "after", upsert: true }
  );
};
