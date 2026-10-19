/**
 * INTERVIEW PREP NOTES:
 * This file configures the connection to Redis, which is used for fast caching or real-time messaging.
 */

import Redis from "ioredis";

/**
 * MockRedis — In-memory fallback when Redis server is unavailable.
 * Implements the same interface as RedisWrapper so code is always identical.
 * Supports: string keys, Sets, Hashes, TTL, and NX locks.
 */
class MockRedis {
  constructor() {
    this.store = new Map();
    this.timers = new Map(); // track TTL timers for cleanup
    console.log("Redis Client: Using in-memory fallback cache");
  }

  // ── String Operations ──────────────────────────────────────────────────────

  async get(key) {
    const val = this.store.get(key);
    return val !== undefined && !(val instanceof Set) && !(val instanceof Map)
      ? String(val)
      : null;
  }

  /**
   * set(key, value)
   * set(key, value, "EX", seconds)    — expire after N seconds
   * set(key, value, "NX")             — only set if key does NOT exist
   * set(key, value, "NX", "EX", sec)  — NX + EX combined (used for locks)
   */
  async set(key, value, ...args) {
    const opts = {};
    for (let i = 0; i < args.length; i++) {
      const arg = String(args[i]).toUpperCase();
      if (arg === "EX") opts.ex = Number(args[i + 1]);
      if (arg === "NX") opts.nx = true;
    }

    if (opts.nx && this.store.has(key)) {
      return null; // NX: do nothing if key exists
    }

    this.store.set(key, value);

    if (opts.ex) {
      // Clear any existing timer for this key
      if (this.timers.has(key)) clearTimeout(this.timers.get(key));
      const timer = setTimeout(() => {
        this.store.delete(key);
        this.timers.delete(key);
      }, opts.ex * 1000);
      this.timers.set(key, timer);
    }

    return "OK";
  }

  async del(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key) {
    return this.store.has(key) ? 1 : 0;
  }

  async expire(key, seconds) {
    if (!this.store.has(key)) return 0;
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, seconds * 1000);
    timer.unref?.();
    this.timers.set(key, timer);
    return 1;
  }

  async incr(key) {
    const next = (parseInt(this.store.get(key), 10) || 0) + 1;
    this.store.set(key, String(next));
    return next;
  }

  async ttl(key) {
    return this.store.has(key) ? (this.timers.has(key) ? 1 : -1) : -2;
  }

  async hincrby(key, field, increment) {
    if (!this.store.has(key) || !(this.store.get(key) instanceof Map)) this.store.set(key, new Map());
    const hash = this.store.get(key);
    const next = (parseInt(hash.get(field), 10) || 0) + Number(increment);
    hash.set(field, String(next));
    return next;
  }

  async keys(pattern) {
    const keys = Array.from(this.store.keys());
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return keys.filter((k) => regex.test(k));
  }

  // ── Hash Operations (HSET / HGET / HGETALL / HDEL) ────────────────────────
  // Used for per-file workspace storage: each file path = one hash field.

  /** hset(key, field, value[, field2, value2, ...]) — same multi-pair form as Redis. */
  async hset(key, ...pairs) {
    if (!this.store.has(key)) {
      this.store.set(key, new Map());
    }
    const hash = this.store.get(key);
    if (!(hash instanceof Map)) return 0;
    let added = 0;
    for (let i = 0; i + 1 < pairs.length; i += 2) {
      if (!hash.has(String(pairs[i]))) added++;
      hash.set(String(pairs[i]), String(pairs[i + 1]));
    }
    return added;
  }

  async hget(key, field) {
    const hash = this.store.get(key);
    if (hash instanceof Map) return hash.get(String(field)) || null;
    return null;
  }

  async hgetall(key) {
    const hash = this.store.get(key);
    // Real Redis returns an empty object (not null) for a missing hash.
    if (!(hash instanceof Map) || hash.size === 0) return {};
    const result = {};
    for (const [k, v] of hash.entries()) result[k] = v;
    return result;
  }

  async hdel(key, ...fields) {
    const hash = this.store.get(key);
    if (!(hash instanceof Map)) return 0;
    let count = 0;
    for (const field of fields) {
      if (hash.delete(String(field))) count++;
    }
    return count;
  }

  async hkeys(key) {
    const hash = this.store.get(key);
    if (!(hash instanceof Map)) return [];
    return Array.from(hash.keys());
  }

  // ── Set Operations ─────────────────────────────────────────────────────────

  async sadd(key, member) {
    if (!this.store.has(key)) {
      this.store.set(key, new Set());
    }
    const set = this.store.get(key);
    if (set instanceof Set) {
      const before = set.size;
      set.add(String(member));
      return set.size - before;
    }
    return 0;
  }

  async smembers(key) {
    const set = this.store.get(key);
    if (set instanceof Set) return Array.from(set);
    return [];
  }

  async srem(key, member) {
    const set = this.store.get(key);
    if (set instanceof Set) {
      return set.delete(String(member)) ? 1 : 0;
    }
    return 0;
  }
}

/**
 * RedisWrapper — Thin proxy over ioredis with MockRedis fallback.
 * Falls back to MockRedis automatically on connection failure.
 */
class RedisWrapper {
  constructor() {
    this.client = null;
    this.isMock = false;
    this.init();
  }

  init() {
    const url = process.env.REDIS_URL || "redis://redis:6379";
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 1) {
            this.switchToMock();
            return null;
          }
          return 50;
        },
      });

      this.client.on("error", (err) => {
        console.warn("Redis client warning/error:", err.message);
        this.switchToMock();
      });
    } catch (e) {
      console.warn("Redis client initialization failed:", e.message);
      this.switchToMock();
    }
  }

  switchToMock() {
    if (!this.isMock) {
      this.client = new MockRedis();
      this.isMock = true;
    }
  }

  // ── String Operations ──────────────────────────────────────────────────────

  async get(key) {
    return this.client.get(key);
  }

  /**
   * set() with full options support.
   * Passes args through to ioredis or MockRedis.
   * Critical for NX-based distributed locking.
   */
  async set(key, value, ...args) {
    if (this.isMock) {
      return this.client.set(key, value, ...args);
    }
    return this.client.set(key, value, ...args);
  }

  async del(key) {
    return this.client.del(key);
  }

  async exists(key) {
    return this.client.exists(key);
  }

  async expire(key, seconds) {
    return this.client.expire(key, seconds);
  }

  async incr(key) {
    return this.client.incr(key);
  }

  async ttl(key) {
    return this.client.ttl(key);
  }

  async hincrby(key, field, increment) {
    return this.client.hincrby(key, field, increment);
  }

  async keys(pattern) {
    return this.client.keys(pattern);
  }

  // ── Hash Operations ────────────────────────────────────────────────────────

  async hset(key, ...pairs) {
    return this.client.hset(key, ...pairs);
  }

  async hget(key, field) {
    return this.client.hget(key, field);
  }

  async hgetall(key) {
    return this.client.hgetall(key);
  }

  async hdel(key, ...fields) {
    return this.client.hdel(key, ...fields);
  }

  async hkeys(key) {
    return this.client.hkeys(key);
  }

  // ── Set Operations ─────────────────────────────────────────────────────────

  async sadd(key, member) {
    return this.client.sadd(key, member);
  }

  async smembers(key) {
    return this.client.smembers(key);
  }

  async srem(key, member) {
    return this.client.srem(key, member);
  }
}

const redisWrapper = new RedisWrapper();
export default redisWrapper;
