/**
 * INTERVIEW PREP NOTES:
 * This file sets up the connection to the Gemini AI API so we can use AI features in our app.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default genAI;