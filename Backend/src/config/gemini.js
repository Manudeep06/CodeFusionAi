/**
 * INTERVIEW PREP NOTES:
 * This file sets up the connection to the Gemini AI API so we can use AI features in our app.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = (process.env.GEMINI_API_KEY || "").trim();

if (!apiKey) {
  console.warn("[Gemini] GEMINI_API_KEY is not set — AI features will be unavailable.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export default genAI;