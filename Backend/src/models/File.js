import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: "file",
      enum: ["file", "folder"],
    },

    language: {
      type: String,
      default: "plaintext",
    },

    extension: {
      type: String,
      default: "",
    },

    s3Key: {
      type: String,
      required: function() {
        return this.type === "file";
      },
      trim: true,
    },

    size: {
      type: Number,
      default: 0,
    },

    version: {
      type: Number,
      default: 1,
    },

    createdBy: {
      type: String,
      trim: true,
    },

    updatedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FileSchema.index({ roomId: 1, path: 1 }, { unique: true });
FileSchema.index({ roomId: 1 });
FileSchema.index({ s3Key: 1 });

export default mongoose.model("File", FileSchema);