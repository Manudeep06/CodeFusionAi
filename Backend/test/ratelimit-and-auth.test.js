import { test, before } from "node:test";
import assert from "node:assert/strict";
import redisClient from "../src/config/redis.js";
import { rateLimit } from "../src/middleware/rateLimit.js";
import { verifyIdToken, requireSelf } from "../src/middleware/auth.js";
import { checkAndConsumeS3Token, incrementEditTokens } from "../src/services/redis.service.js";
import { TOKEN_BUCKET_CONFIG } from "../src/utils/redisKeys.js";

// Use the in-memory Redis so tests never need a server.
before(() => redisClient.switchToMock());

const fakeRes = () => {
  const headers = {};
  return { headers, setHeader: (k, v) => { headers[k] = v; } };
};
const run = (mw, req) => new Promise((resolve) => {
  const res = fakeRes();
  mw(req, res, (err) => resolve({ err, res }));
});

test("rate limiter allows `limit` requests per window, then returns 429", async () => {
  const mw = rateLimit({ name: `t-${Date.now()}`, limit: 3, windowSec: 60 });
  const req = { user: { uid: "u1" }, ip: "1.1.1.1" };
  for (let i = 0; i < 3; i++) {
    const { err, res } = await run(mw, req);
    assert.equal(err, undefined);
    assert.equal(res.headers["RateLimit-Remaining"], String(2 - i));
  }
  const { err, res } = await run(mw, req);
  assert.equal(err.statusCode, 429);
  assert.ok(Number(res.headers["Retry-After"]) > 0);
});

test("rate limits are tracked per user", async () => {
  const mw = rateLimit({ name: `t2-${Date.now()}`, limit: 1, windowSec: 60 });
  assert.equal((await run(mw, { user: { uid: "a" } })).err, undefined);
  assert.equal((await run(mw, { user: { uid: "b" } })).err, undefined);
  assert.equal((await run(mw, { user: { uid: "a" } })).err.statusCode, 429);
});

test("token bucket allows a burst of `bucketCapacity` S3 flushes, then throttles", async () => {
  const room = `bucket-${Date.now()}`;
  for (let i = 0; i < TOKEN_BUCKET_CONFIG.bucketCapacity; i++) {
    assert.equal(await checkAndConsumeS3Token(room), true, `flush ${i + 1} should pass`);
  }
  assert.equal(await checkAndConsumeS3Token(room), false);
});

test("token bucket refills over time (lastRefill must be persisted)", async () => {
  const room = `refill-${Date.now()}`;
  const realNow = Date.now;
  let now = realNow();
  Date.now = () => now;
  try {
    for (let i = 0; i < TOKEN_BUCKET_CONFIG.bucketCapacity; i++) await checkAndConsumeS3Token(room);
    assert.equal(await checkAndConsumeS3Token(room), false, "bucket should be empty");
    now += TOKEN_BUCKET_CONFIG.refillRateMs; // one token's worth of time passes
    assert.equal(await checkAndConsumeS3Token(room), true, "one token should have refilled");
    assert.equal(await checkAndConsumeS3Token(room), false);
  } finally {
    Date.now = realNow;
  }
});

test("edit tokens signal a flush at the configured threshold", async () => {
  const room = `edits-${Date.now()}`;
  let last;
  for (let i = 0; i < TOKEN_BUCKET_CONFIG.flushEditThreshold; i++) last = await incrementEditTokens(room);
  assert.equal(last.editCount, TOKEN_BUCKET_CONFIG.flushEditThreshold);
  assert.equal(last.shouldFlush, true);
});

test("verifyIdToken rejects missing and malformed tokens with 401", async () => {
  process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "demo-project";
  await assert.rejects(verifyIdToken(undefined), { statusCode: 401 });
  await assert.rejects(verifyIdToken("not-a-jwt"), { statusCode: 401 });
});

test("verifyIdToken reports a server misconfiguration as 500", async () => {
  const saved = process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_PROJECT_ID;
  await assert.rejects(verifyIdToken("x"), { statusCode: 500 });
  process.env.FIREBASE_PROJECT_ID = saved;
});

test("requireSelf blocks access to another user's data", () => {
  const mw = requireSelf("userId");
  let error = null;
  mw({ params: { userId: "victim" }, user: { uid: "attacker" } }, {}, (e) => { error = e; });
  assert.equal(error.statusCode, 403);
  mw({ params: { userId: "me" }, user: { uid: "me" } }, {}, (e) => { error = e; });
  assert.equal(error, undefined);
});
