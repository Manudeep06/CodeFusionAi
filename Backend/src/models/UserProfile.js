/**
 * INTERVIEW PREP NOTES:
 * This file defines the structure for how user details (like name and email) are saved in our database.
 */

import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    photoURL: {
      type: String,
      default: "",
      trim: true,
    },
    displayName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

export default mongoose.model("UserProfile", UserProfileSchema);
