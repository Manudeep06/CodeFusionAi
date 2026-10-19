/**
 * Rate limiting (fixed window, backed by Redis).
 *
 * key = ratelimit:<name>:<identity>:<window>
 * INCR the key; on the first hit set EXPIRE = window length. If the count
 * exceeds `limit`, respond 429 with Retry-After. Works across multiple API
 * instances because the counter lives in Redis (or the in-memory fallback).
 */

import redisClient from "../config/redis.js";
import AppError from "../utils/AppError.js";

/**
 * @param {{ name: string, limit: number, windowSec: number }} options
 */
export const rateLimit = ({ name, limit, windowSec }) => async (req, res, next) => {
  try {
    const identity = req.user?.uid || req.ip;
    const window = Math.floor(Date.now() / 1000 / windowSec);
    const key = `ratelimit:${name}:${identity}:${window}`;

    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, windowSec);

    const resetIn = windowSec - (Math.floor(Date.now() / 1000) % windowSec);
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - count)));
    res.setHeader("RateLimit-Reset", String(resetIn));

    if (count > limit) {
      res.setHeader("Retry-After", String(resetIn));
      return next(new AppError(`Too many requests. Try again in ${resetIn}s.`, 429));
    }
    next();
  } catch (err) {
    // Fail open: a cache outage should not take the API down.
    console.error(`[RateLimit] ${name} check failed:`, err.message);
    next();
  }
};
