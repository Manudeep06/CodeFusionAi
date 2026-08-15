/**
 * INTERVIEW PREP NOTES:
 * This file contains small, reusable helper functions for dealing with files (like checking file types or sizes).
 */

import path from "path";

/**
 * File Helper Utilities
 *
 * Shared, pure functions for file path manipulation, language detection,
 * and MIME type lookup. Extracted so services and controllers don't each
 * duplicate this logic.
 */

/** Map of file extension → programming language identifier (Monaco/CodeMirror compatible) */
const EXTENSION_TO_LANGUAGE = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".java": "java",
  ".cpp": "cpp",
  ".c": "c",
  ".cs": "csharp",
  ".go": "go",
  ".rs": "rust",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".kt": "kotlin",
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "scss",
  ".less": "less",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".xml": "xml",
  ".md": "markdown",
  ".sh": "shell",
  ".bash": "shell",
  ".sql": "sql",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".vue": "vue",
  ".svelte": "svelte",
};

/** Map of file extension → MIME content type */
const EXTENSION_TO_MIME = {
  ".js": "application/javascript",
  ".jsx": "application/javascript",
  ".ts": "application/typescript",
  ".tsx": "application/typescript",
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".py": "text/x-python",
  ".java": "text/x-java-source",
  ".cpp": "text/x-c++src",
  ".c": "text/x-csrc",
};

/**
 * Detect the programming language from a file path
 * @param {string} filePath - File path or name (e.g., "src/App.jsx")
 * @returns {string} Language identifier or "plaintext"
 */
export const detectLanguage = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || "plaintext";
};

/**
 * Get MIME content type from a file path
 * @param {string} filePath - File path or name
 * @returns {string} MIME type or "application/octet-stream"
 */
export const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_MIME[ext] || "application/octet-stream";
};

/**
 * Extract file name from a full path
 * @param {string} filePath - Full file path (e.g., "src/components/App.jsx")
 * @returns {string} Just the file name ("App.jsx")
 */
export const getFileName = (filePath) => {
  return path.basename(filePath);
};

/**
 * Extract file extension from a path
 * @param {string} filePath - File path
 * @returns {string} Extension with dot (e.g., ".jsx") or ""
 */
export const getExtension = (filePath) => {
  return path.extname(filePath).toLowerCase();
};

/**
 * Normalize a file path to use forward slashes (for S3 key consistency)
 * @param {string} filePath
 * @returns {string}
 */
export const normalizePath = (filePath) => {
  return filePath.replace(/\\/g, "/");
};

/**
 * Calculate byte size of a string (UTF-8)
 * @param {string} content
 * @returns {number}
 */
export const getByteSize = (content) => {
  return Buffer.byteLength(content || "", "utf8");
};
