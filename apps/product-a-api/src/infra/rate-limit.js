const { rateLimit } = require('express-rate-limit');
const { UnauthorizedError } = require('@vami/util');

/**
 * Creates a rate limiter for authentication login attempts.
 * 5 requests per 15 minutes per IP.
 * Returns a structured UnauthorizedError on breach — not a generic 429.
 * @returns {import('express').RequestHandler}
 */
function createLoginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (/** @type {any} */ _req, /** @type {any} */ _res, /** @type {any} */ next) =>
      next(new UnauthorizedError('Too many login attempts. Try again in 15 minutes.')),
  });
}

/**
 * Creates a general-purpose API rate limiter.
 * 200 requests per 15 minutes per IP — applied globally across all routes.
 * @returns {import('express').RequestHandler}
 */
function createGeneralLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (/** @type {any} */ _req, /** @type {any} */ _res, /** @type {any} */ next) =>
      next(new UnauthorizedError('Rate limit exceeded. Please slow down.')),
  });
}

module.exports = { createLoginLimiter, createGeneralLimiter };
