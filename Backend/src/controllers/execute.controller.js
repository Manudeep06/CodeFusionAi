/**
 * INTERVIEW PREP NOTES:
 * This file handles requests to run code. It takes the code from the user, passes it to the execution service, and returns the output.
 */

import asyncHandler from "../utils/asyncHandler.js";
import { executeCode as runCode } from "../services/execute.service.js";

/**
 * Execute Controller
 *
 * Thin HTTP layer over execute.service.js.
 * Extracted from the monolithic routes/executeCode.js which
 * previously handled FS operations, process execution, and routing inline.
 */

/**
 * POST /api/execute
 * Executes the provided code in the specified language.
 * Body: { language: string, code: string }
 */
export const executeCode = asyncHandler(async (req, res) => {
  const { language, code } = req.body;
  const result = await runCode(language, code);
  res.status(200).json(result);
});
