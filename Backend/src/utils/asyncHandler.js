/**
 * asyncHandler — Async Route Wrapper
 *
 * Wraps an async Express handler and automatically forwards any thrown errors
 * to Express's next() error pipeline. This eliminates the need for try/catch
 * blocks in every controller function.
 *
 * Usage:
 *   router.get("/route", asyncHandler(async (req, res) => {
 *     const data = await someService.getData();
 *     res.json({ success: true, data });
 *   }));
 *
 * @param {Function} fn - Async Express handler (req, res, next)
 * @returns {Function} Express middleware that catches and forwards errors
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
