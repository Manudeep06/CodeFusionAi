import fs from "fs";
import path from "path";
import { exec } from "child_process";
import AppError from "../utils/AppError.js";

/**
 * Code Execution Service
 *
 * Handles secure, isolated code execution for supported languages.
 * Extracted from routes/executeCode.js (which was a 120-line route file
 * doing FS ops, process spawning, and cleanup all inline).
 *
 * Each execution gets an isolated temp directory (runId) to prevent
 * concurrency conflicts between simultaneous requests.
 *
 * Supported languages: javascript, python, cpp, java
 * Static languages (html, css, json): acknowledged but not executed
 */

const TEMP_DIR = path.join(process.cwd(), "temp");

// Ensure the temp directory exists on service load
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/** Supported language configurations */
const LANGUAGE_CONFIG = {
  javascript: {
    fileName: "temp.js",
    buildCommand: null,
    runCommand: (runDir, fileName) => `node "${path.join(runDir, fileName)}"`,
  },
  python: {
    fileName: "temp.py",
    buildCommand: null,
    runCommand: (runDir, fileName) => `python "${path.join(runDir, fileName)}"`,
  },
  cpp: {
    fileName: "temp.cpp",
    buildCommand: null,
    // Compile + run in one command
    runCommand: (runDir, fileName) =>
      `g++ "${path.join(runDir, fileName)}" -o "${path.join(runDir, "temp")}" && "${path.join(runDir, "temp")}"`,
  },
  java: {
    fileName: "Main.java",
    buildCommand: null,
    runCommand: (runDir, fileName) =>
      `javac "${path.join(runDir, fileName)}" && java -cp "${runDir}" Main`,
  },
};

/** Static languages — no execution, just acknowledgment */
const STATIC_LANGUAGES = new Set(["html", "css", "json"]);

/**
 * Clean up a temporary run directory safely.
 * Errors during cleanup are logged but not thrown.
 *
 * @param {string} runDir
 */
const cleanupRunDir = (runDir) => {
  try {
    if (fs.existsSync(runDir)) {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("[Execute] Cleanup error for", runDir, ":", err.message);
  }
};

/**
 * Execute code for a given language.
 *
 * @param {string} language - Programming language identifier
 * @param {string} code     - Source code to execute
 * @returns {Promise<{ success: boolean, output: string }>}
 * @throws {AppError} 400 if language is unsupported
 */
export const executeCode = async (language, code) => {
  if (!language || !code) {
    throw new AppError("'language' and 'code' are required", 400);
  }

  // Static language handling
  if (STATIC_LANGUAGES.has(language)) {
    return {
      success: true,
      output: `${language.toUpperCase()} file saved successfully.`,
    };
  }

  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new AppError(`Unsupported language: '${language}'`, 400);
  }

  // Create isolated run directory
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const runDir = path.join(TEMP_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  try {
    // Write source code to temp file
    const filePath = path.join(runDir, config.fileName);
    fs.writeFileSync(filePath, code);

    const command = config.runCommand(runDir, config.fileName);

    // Execute and return result
    return await new Promise((resolve) => {
      exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
        cleanupRunDir(runDir);

        if (error) {
          resolve({ success: false, output: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout });
        }
      });
    });
  } catch (err) {
    cleanupRunDir(runDir);
    throw new AppError(`Execution failed: ${err.message}`, 500);
  }
};
