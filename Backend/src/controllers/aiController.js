/**
 * INTERVIEW PREP NOTES:
 * This file acts as a middleman for AI features. It receives AI-related requests from the user, calls the AI service, and sends back the result.
 */

import asyncHandler from "../utils/asyncHandler.js";
import {
  generateResponse,
  reviewCode,
  explainCode,
  optimizeCode,
} from "../services/geminiService.js";

/**
 * AI Controller
 *
 * Thin HTTP layer over geminiService.
 * Each handler extracts request data, delegates to the service,
 * and returns a structured response.
 */

/**
 * POST /api/ai/chat
 * General-purpose AI chat.
 * Body: { message: string, history?: Array<{role: string, content: string}> }
 */
export const chatWithAI = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;
  const reply = await generateResponse(message, history);
  res.status(200).json({ success: true, reply });
});

/**
 * POST /api/ai/review
 * Perform a structured code review.
 * Body: { code: string, language?: string }
 */
export const reviewCodeHandler = asyncHandler(async (req, res) => {
  const { code, language = "" } = req.body;
  const review = await reviewCode(code, language);
  res.status(200).json({ success: true, review });
});

/**
 * POST /api/ai/explain
 * Explain what a piece of code does.
 * Body: { code: string, language?: string }
 */
export const explainCodeHandler = asyncHandler(async (req, res) => {
  const { code, language = "" } = req.body;
  const explanation = await explainCode(code, language);
  res.status(200).json({ success: true, explanation });
});

/**
 * POST /api/ai/optimize
 * Suggest and return an optimized version of the code.
 * Body: { code: string, language?: string }
 */
export const optimizeCodeHandler = asyncHandler(async (req, res) => {
  const { code, language = "" } = req.body;
  const optimization = await optimizeCode(code, language);
  res.status(200).json({ success: true, optimization });
});