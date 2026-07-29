const winston = require('winston');
require('winston-daily-rotate-file');
const { getContext } = require('./context');

/**
 * List of field names that must never appear in log output.
 * These are stripped from every log entry before it reaches any transport.
 * @type {string[]}
 */
const REDACTED_FIELDS = [
  'password', 'passwd', 'pass',
  'token', 'accessToken', 'refreshToken', 'idToken',
  'authorization', 'auth',
  'secret', 'clientSecret',
  'ssn', 'socialSecurityNumber',
  'creditCard', 'cardNumber', 'cvv', 'cvc',
  'apiKey', 'api_key',
];

/**
 * Winston format that strips known PII/secret fields from every log entry.
 * Applied before any transport receives the entry.
 * @param {any} obj
 * @param {number} [depth]
 * @param {number} [maxDepth]
 */
function redactDeep(obj, depth = 0, maxDepth = 3) {
  if (depth > maxDepth || obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_FIELDS.includes(key)) {
      obj[key] = '[REDACTED]';
    } else if (value !== null && typeof value === 'object') {
      redactDeep(value, depth + 1, maxDepth);
    }
  }
}

const redactFormat = winston.format((info) => {
  redactDeep(info);
  return info;
});

/**
 * Winston format that injects AsyncLocalStorage request context fields
 * (requestId, traceId, tenantId, userId) into every log entry.
 * Applied exactly once — not per-transport.
 */
const injectCorrelationContext = winston.format((info) => {
  const ctx = getContext();
  if (ctx) {
    if (ctx.requestId) info.requestId = ctx.requestId;
    if (ctx.traceId) info.traceId = ctx.traceId;
    if (ctx.tenantId) info.tenantId = ctx.tenantId;
    if (ctx.userId) info.userId = ctx.userId;
  }
  return info;
});

/**
 * Shared format stack applied to all transports:
 *   1. Redact PII/secrets
 *   2. Inject correlation context from AsyncLocalStorage
 *   3. Attach timestamp
 *   4. Serialize error stacks
 *   5. Output structured JSON
 */
const sharedFormat = winston.format.combine(
  redactFormat(),
  injectCorrelationContext(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Development-only console format — human-readable colorized output.
 * Does NOT re-run redact or context injection (already applied by sharedFormat
 * on the combined format chain, but since Console transport uses its own format
 * override, we apply the shared pipeline once at the logger level instead).
 */
const devConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, service, requestId, ...rest }) => {
    const rid = requestId ? ` [${requestId}]` : '';
    const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    return `${timestamp} ${level}${rid} [${service}]: ${message}${meta}`;
  })
);

/**
 * Creates an enterprise logger instance.
 *
 * Transports:
 *   - Console: always active. Dev = colorized, prod = JSON.
 *   - DailyRotateFile: structured JSON log rotation to logs/%DATE%-app.log,
 *     14-day retention, 20MB max per file.
 *
 * @param {{ serviceName?: string, logLevel?: string }} [options]
 * @returns {{ info: Function, warn: Function, error: Function, debug: Function, child: Function, raw: import('winston').Logger }}
 */
function createLogger(options = {}) {
  const serviceName = options.serviceName || 'vami-service';
  const logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
  const isDev = process.env.NODE_ENV === 'development';

  const loggerInstance = winston.createLogger({
    level: logLevel,
    defaultMeta: { service: serviceName },
    // sharedFormat runs once at the logger level and applies to all transports.
    format: sharedFormat,
    transports: [
      new winston.transports.Console({
        // In dev, override with human-readable format.
        // In prod, sharedFormat (JSON) is already applied at logger level.
        ...(isDev ? { format: devConsoleFormat } : {})
      }),
      new winston.transports.DailyRotateFile({
        dirname: process.env.LOG_DIR || 'logs',
        filename: '%DATE%-app.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        maxSize: '20m',
        // Compress rotated files to reduce disk usage.
        zippedArchive: true,
      }),
    ],
  });

  /**
   * Creates a child logger with pre-bound metadata.
   * Use this per-request to avoid passing requestId manually on every call.
   * @param {Record<string, any>} meta
   * @returns {{ info: Function, warn: Function, error: Function, debug: Function }}
   */
  function child(meta) {
    const childInstance = loggerInstance.child(meta);
    return {
      info: (/** @type {string} */ msg, m = {}) => childInstance.info(msg, m),
      warn: (/** @type {string} */ msg, m = {}) => childInstance.warn(msg, m),
      error: (/** @type {string} */ msg, m = {}) => childInstance.error(msg, m),
      debug: (/** @type {string} */ msg, m = {}) => childInstance.debug(msg, m),
    };
  }

  return {
    info: (/** @type {string} */ msg, meta = {}) => loggerInstance.info(msg, meta),
    warn: (/** @type {string} */ msg, meta = {}) => loggerInstance.warn(msg, meta),
    error: (/** @type {string} */ msg, meta = {}) => loggerInstance.error(msg, meta),
    debug: (/** @type {string} */ msg, meta = {}) => loggerInstance.debug(msg, meta),
    /** Creates a child logger with pre-bound context fields (e.g. { requestId }). */
    child,
    /** Escape hatch to the raw Winston instance. Use only for advanced transport config. */
    raw: loggerInstance,
  };
}

module.exports = {
  createLogger,
};
