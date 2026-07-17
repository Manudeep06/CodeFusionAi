import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  photoURL: { type: String, default: "" },
  displayName: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("UserProfile", UserProfileSchema);
