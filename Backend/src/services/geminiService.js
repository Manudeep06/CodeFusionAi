import genAI from "../config/gemini.js";
import AppError from "../utils/AppError.js";

/**
 * Gemini AI Service
 *
 * Provides structured AI prompts for all code intelligence features.
 * Each function builds a specific, context-rich prompt and returns
 * the model's response as a plain string.
 *
 * Model: gemini-2.5-flash
 */

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Get a configured Gemini model instance.
 * @returns {Object} Gemini GenerativeModel
 */
const getModel = () => genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Internal helper: send a prompt to Gemini and return the text response.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
const callGemini = async (prompt) => {
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("[Gemini] API error:", error.message);
    throw new AppError("Failed to generate AI response. Please try again.", 503);
  }
};

// ─── General Chat ─────────────────────────────────────────────────────────────

/**
 * General-purpose AI chat.
 * Supports optional conversation history for multi-turn context.
 *
 * @param {string} message - The user's message
 * @param {Array<{role: string, content: string}>} [history=[]] - Prior conversation turns
 * @returns {Promise<string>} AI response text
 */
export const generateResponse = async (message, history = []) => {
  if (!message) throw new AppError("Message is required", 400);

  let prompt = "";
  if (history.length > 0) {
    const historyText = history
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n");
    prompt = `Previous conversation:\n${historyText}\n\nUser: ${message}`;
  } else {
    prompt = message;
  }

  return await callGemini(prompt);
};

// ─── Code Review ──────────────────────────────────────────────────────────────

/**
 * Review code and provide structured feedback.
 *
 * @param {string} code - Source code to review
 * @param {string} [language=""] - Programming language for context
 * @returns {Promise<string>} Structured review as markdown
 */
export const reviewCode = async (code, language = "") => {
  if (!code) throw new AppError("Code is required for review", 400);

  const langContext = language ? ` (${language})` : "";
  const prompt = `You are a senior software engineer performing a code review.

Analyze the following${langContext} code and provide structured feedback covering:
1. **Code Quality** — readability, naming conventions, code style
2. **Potential Bugs** — edge cases, off-by-one errors, null handling
3. **Performance** — inefficiencies, unnecessary operations, memory usage
4. **Security** — injection risks, exposed secrets, unsafe operations
5. **Suggestions** — specific, actionable improvements with examples

Code to review:
\`\`\`${language}
${code}
\`\`\`

Provide your review in clear, structured markdown.`;

  return await callGemini(prompt);
};

// ─── Explain Code ─────────────────────────────────────────────────────────────

/**
 * Explain what a piece of code does in plain English.
 *
 * @param {string} code - Source code to explain
 * @param {string} [language=""] - Programming language for context
 * @returns {Promise<string>} Plain-English explanation as markdown
 */
export const explainCode = async (code, language = "") => {
  if (!code) throw new AppError("Code is required for explanation", 400);

  const langContext = language ? ` ${language}` : "";
  const prompt = `You are an expert programming tutor. Explain the following${langContext} code clearly and concisely.

Your explanation should:
- Start with a one-sentence summary of what this code does
- Walk through the logic step by step
- Highlight any important patterns, algorithms, or techniques used
- Use simple language accessible to a junior developer
- Include any important caveats or edge cases

Code to explain:
\`\`\`${language}
${code}
\`\`\`

Provide your explanation in clear, structured markdown.`;

  return await callGemini(prompt);
};

// ─── Optimize Code ────────────────────────────────────────────────────────────

/**
 * Suggest optimizations and return an improved version of the code.
 *
 * @param {string} code - Source code to optimize
 * @param {string} [language=""] - Programming language for context
 * @returns {Promise<string>} Optimized code with explanation as markdown
 */
export const optimizeCode = async (code, language = "") => {
  if (!code) throw new AppError("Code is required for optimization", 400);

  const langContext = language ? ` ${language}` : "";
  const prompt = `You are a performance optimization expert. Analyze and optimize the following${langContext} code.

Your response should include:
1. **Issues Found** — list what is inefficient or suboptimal in the original
2. **Optimized Code** — the improved version in a properly formatted code block
3. **Changes Explained** — a clear description of each optimization made and why it improves performance or quality

Code to optimize:
\`\`\`${language}
${code}
\`\`\`

Provide your response in clear, structured markdown.`;

  return await callGemini(prompt);
};