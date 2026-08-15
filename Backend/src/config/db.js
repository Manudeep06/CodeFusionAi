/**
 * INTERVIEW PREP NOTES:
 * This file contains the configuration to connect our backend to the database (usually MongoDB).
 */

import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("WARNING: MONGO_URI environment variable is not defined!");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
