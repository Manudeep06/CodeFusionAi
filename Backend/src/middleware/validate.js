/**
 * INTERVIEW PREP NOTES:
 * This file checks if the data sent by the user (like an email or password) is valid before we process it.
 */

import AppError from "../utils/AppError.js";

/**
 * Request Validation Middleware Factory
 *
 * Creates an Express middleware that validates req.body, req.params, or req.query
 * against a simple schema definition. Returns a 400 AppError if validation fails.
 *
 * This is a lightweight, zero-dependency validator (no Joi/Zod needed).
 * For complex schemas, this factory can be extended to support nested objects.
 *
 * Usage:
 *   router.post("/route", validate({
 *     body: { roomId: "required|string", name: "required|string" },
 *     params: { id: "required|string" }
 *   }), controller.handler);
 *
 * Supported rules (pipe-separated):
 *   - required      — field must be present and non-empty
 *   - string        — must be a string
 *   - number        — must be a number
 *   - boolean       — must be a boolean
 *   - array         — must be an array
 */

const RULE_VALIDATORS = {
  string: (val) => typeof val === "string",
  number: (val) => typeof val === "number" && !isNaN(val),
  boolean: (val) => typeof val === "boolean",
  array: (val) => Array.isArray(val),
};

/**
 * Validate a single source object (body/params/query) against a field schema
 * @param {Object} source - The data object to validate
 * @param {Object} schema - Map of field names to rule strings
 * @returns {string[]} Array of error messages (empty if valid)
 */
const validateSource = (source, schema) => {
  const errors = [];

  for (const [field, ruleString] of Object.entries(schema)) {
    const rules = ruleString.split("|").map((r) => r.trim());
    const value = source ? source[field] : undefined;
    const isPresent = value !== undefined && value !== null && value !== "";

    if (rules.includes("required") && !isPresent) {
      errors.push(`'${field}' is required`);
      continue; // skip further checks for this field
    }

    if (isPresent) {
      for (const rule of rules) {
        if (rule === "required") continue;
        const validator = RULE_VALIDATORS[rule];
        if (validator && !validator(value)) {
          errors.push(`'${field}' must be a ${rule}`);
        }
      }
    }
  }

  return errors;
};

/**
 * Validation middleware factory
 * @param {{ body?: Object, params?: Object, query?: Object }} schema
 * @returns {import('express').RequestHandler}
 */
const validate = (schema = {}) => {
  return (req, res, next) => {
    const allErrors = [];

    if (schema.body) {
      allErrors.push(...validateSource(req.body, schema.body));
    }
    if (schema.params) {
      allErrors.push(...validateSource(req.params, schema.params));
    }
    if (schema.query) {
      allErrors.push(...validateSource(req.query, schema.query));
    }

    if (allErrors.length > 0) {
      return next(new AppError(`Validation failed: ${allErrors.join("; ")}`, 400));
    }

    next();
  };
};

export default validate;
