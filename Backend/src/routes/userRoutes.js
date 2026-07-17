import express from "express";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();

// Get user profile by userId
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const profile = await UserProfile.findOne({ userId });
    if (profile) {
      return res.json(profile);
    }
    return res.json({ userId, photoURL: "", displayName: "" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update or create user profile
router.post("/profile", async (req, res) => {
  try {
    const { userId, photoURL, displayName } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const updateFields = { updatedAt: Date.now() };
    if (photoURL !== undefined) updateFields.photoURL = photoURL;
    if (displayName !== undefined) updateFields.displayName = displayName;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
