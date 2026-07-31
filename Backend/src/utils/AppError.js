/**
 * AppError — Custom Operational Error
 *
 * Distinguishes between "operational" errors (expected, user-facing, like 404 or 400)
 * and programming errors (unexpected crashes). Only operational errors send structured
 * responses; programming errors are logged and return a generic 500.
 *
 * Usage:
 *   throw new AppError("Room not found", 404);
 *   throw new AppError("Unauthorized: Only the owner can close this room.", 403);
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx = client error, 5xx = server error)
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Capture stack trace, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
