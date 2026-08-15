/**
 * INTERVIEW PREP NOTES:
 * This file defines the structure for how collaborative room details are saved in our database.
 */

import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      default: "Untitled Project",
      trim: true,
    },

    ownerId: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      default: "Developer",
      trim: true,
    },

    template: {
      type: String,
      default: "react",
      enum: [
        "react",
        "node",
        "python",
        "cpp",
        "java",
        "html",
        "blank",
      ],
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    accessType: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    participants: [
      {
        type: String,
      },
    ],

    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoomSchema.index({ ownerId: 1, lastActive: -1 });
RoomSchema.index({ participants: 1, lastActive: -1 });
RoomSchema.index({ accessType: 1, lastActive: -1 });

export default mongoose.model("Room", RoomSchema);