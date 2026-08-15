/**
 * INTERVIEW PREP NOTES:
 * This file catches any errors that happen while processing a request and sends a friendly error message back to the user.
 */

import AppError from "../utils/AppError.js";

/**
 * Centralized Error Handler Middleware
 *
 * This must be registered as the LAST middleware in server.js (after all routes).
 * Express identifies it as an error handler because it has 4 parameters: (err, req, res, next).
 *
 * It handles three categories of errors:
 *   1. AppError (operational) — structured, user-facing messages with correct HTTP codes
 *   2. Mongoose ValidationError — 400 with field-level detail
 *   3. Mongoose CastError (invalid ObjectId) — treated as 404
 *   4. Unknown errors — generic 500 (message hidden in production)
 */

/**
 * Handle Mongoose CastError (e.g., invalid MongoDB ObjectId in URL param)
 * @param {Error} err
 * @returns {AppError}
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose ValidationError (schema-level validation failures)
 * @param {Error} err
 * @returns {AppError}
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB duplicate key errors (e.g., unique constraint violation)
 * @param {Error} err
 * @returns {AppError}
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || "field";
  const message = `Duplicate value for '${field}'. Please use a different value.`;
  return new AppError(message, 409);
};

/**
 * Send detailed error response in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err.message,    // alias: some frontend consumers read data.error
    stack: err.stack,
    error_detail: err,
  });
};

/**
 * Send safe error response in production
 * - Operational (AppError): reveal the message
 * - Programming errors: hide details, return generic message
 */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err.message,  // alias: some frontend consumers read data.error
    });
  } else {
    // Programming or unknown error: don't leak details
    console.error("💥 UNEXPECTED ERROR:", err);
    res.status(500).json({
      success: false,
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

/**
 * Global Express error handler
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    // Transform known Mongoose/Mongo error types into AppErrors
    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);

    sendErrorProd(error, res);
  }
};

export default errorHandler;
