/**
 * Authentication
 *
 * Verifies Firebase ID tokens (RS256 JWTs) against Google's public signing keys.
 * No service-account secret is required — only the Firebase project ID:
 *   iss = https://securetoken.google.com/<projectId>
 *   aud = <projectId>
 *
 * The JWKS is fetched once and cached/rotated by `jose`, so verification is a
 * local signature check on every request after the first.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";
import AppError from "../utils/AppError.js";

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const jwks = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * Verify a Firebase ID token and return the caller's identity.
 * @param {string} token
 * @returns {Promise<{ uid: string, email?: string, name?: string }>}
 */
export const verifyIdToken = async (token) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new AppError("Server auth is not configured (FIREBASE_PROJECT_ID missing).", 500);
  if (!token) throw new AppError("Authentication required.", 401);

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) throw new Error("Token has no subject");
    return { uid: payload.sub, email: payload.email, name: payload.name };
  } catch {
    throw new AppError("Invalid or expired session. Please sign in again.", 401);
  }
};

const bearer = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

/** Rejects the request unless it carries a valid Firebase ID token; sets req.user. */
export const requireAuth = async (req, res, next) => {
  try {
    req.user = await verifyIdToken(bearer(req));
    next();
  } catch (err) {
    next(err);
  }
};

/** Ensures the :userId route param belongs to the signed-in user. */
export const requireSelf = (param = "userId") => (req, res, next) => {
  if (req.params[param] !== req.user?.uid) {
    return next(new AppError("You can only access your own data.", 403));
  }
  next();
};

/** Socket.IO middleware: authenticates the connection from handshake.auth.token. */
export const socketAuth = async (socket, next) => {
  try {
    socket.user = await verifyIdToken(socket.handshake.auth?.token);
    next();
  } catch (err) {
    const error = new Error(err.message);
    error.data = { status: err.statusCode || 401 };
    next(error);
  }
};
