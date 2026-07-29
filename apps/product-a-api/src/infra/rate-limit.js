const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = /** @type {any} */ (require('ioredis'));
const { TooManyRequestsError, createLogger } = require('@vami/util');

const logger = createLogger({ serviceName: 'product-a-api:rate-limit' });

/**
 * Lazily-initialised Redis client for the rate-limit store.
 * Separate from any future application-level Redis client —
 * rate limiting Redis errors must never cascade to the application.
 *
 * Fails OPEN: if Redis is unavailable, the in-memory fallback activates.
 * This is the correct trade-off: prefer availability over strict rate limiting
 * during Redis outages. A Redis failure should not lock users out.
 *
 * Recreates client if status is 'end' to recover from temporary Redis outages.
 * @type {any}
 */
let _redisClient = null;

function getRedisClient() {
  if (_redisClient && _redisClient.status !== 'end') return _redisClient;
  _redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    // lazyConnect prevents startup crash if Redis is momentarily unavailable
    lazyConnect: true,
    // Minimal retry — rate limiting degrades gracefully to memory on failure
    maxRetriesPerRequest: 1,
  });

  _redisClient.on('error', (/** @type {any} */ err) => {
    logger.warn('Rate-limit Redis error — degrading to in-memory fallback', { error: err.message || err.code || String(err) });
  });

  _redisClient.connect().catch(() => {});

  return _redisClient;
}

/**
 * Builds a Redis-backed rate limiter store.
 * Falls back to default (in-memory) if Redis client errors on send command.
 * @param {string} prefix - Unique key prefix per limiter (e.g. 'rl:login:')
 * @returns {import('express-rate-limit').Store | undefined}
 */
function buildRedisStore(prefix) {
  const client = getRedisClient();
  try {
    return new RedisStore({
      sendCommand: async (...args) => {
        if (client.status !== 'ready') {
          throw new Error(`Redis client status is '${client.status}' — rate-limit failing open`);
        }
        return client.call(...args);
      },
      prefix,
    });
  } catch {
    logger.warn(`Could not build Redis store for prefix ${prefix} — using in-memory fallback`);
    return undefined;
  }
}

/**
 * Creates a Redis-backed rate limiter for authentication login attempts.
 * 5 requests per 15 minutes per IP. Shared across all BFF pods.
 * Fails OPEN: if Redis store errors, passOnStoreError lets request proceed.
 * @returns {import('express').RequestHandler}
 */
function createLoginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    validate: false,
    store: buildRedisStore('rl:login:'),
    handler: (/** @type {any} */ _req, /** @type {any} */ _res, /** @type {any} */ next) =>
      next(new TooManyRequestsError('Too many login attempts. Try again in 15 minutes.')),
  });
}

/**
 * Creates a Redis-backed general-purpose API rate limiter.
 * 200 requests per 15 minutes per IP. Shared across all BFF pods.
 * Fails OPEN: if Redis store errors, passOnStoreError lets request proceed.
 * @returns {import('express').RequestHandler}
 */
function createGeneralLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    validate: false,
    store: buildRedisStore('rl:general:'),
    handler: (/** @type {any} */ _req, /** @type {any} */ _res, /** @type {any} */ next) =>
      next(new TooManyRequestsError('Rate limit exceeded. Please slow down.')),
  });
}

module.exports = { createLoginLimiter, createGeneralLimiter };
