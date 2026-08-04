/**
 * Structured JSON Logger
 *
 * FAANG standard: logs are machine-parseable JSON, not free-form text.
 * Every entry includes level, timestamp, service name, and optional metadata.
 * This allows filtering by domain, alerting on error rate, and correlating
 * client error digests with server-side entries.
 *
 * No external dependency — uses native console to stay compatible with
 * Vercel's log drain and any OpenTelemetry-compatible backend.
 */

const SERVICE_NAME = 'vami';
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {Record<string, unknown>} [meta]
 */
function writeLog(level, message, meta = {}) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    env: process.env.NODE_ENV,
    message,
    ...meta,
  };

  const serialized = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(serialized);
      break;
    case 'warn':
      console.warn(serialized);
      break;
    case 'debug':
      if (!IS_PROD) console.debug(serialized);
      break;
    default:
      console.log(serialized);
  }
}

export const logger = {
  /** Informational events (server start, cache hit/miss, successful operations) */
  info: (message, meta) => writeLog('info', message, meta),

  /** Expected failures (validation errors, auth failures, not-found) */
  warn: (message, meta) => writeLog('warn', message, meta),

  /** Unexpected failures (DB errors, third-party API failures, unhandled exceptions) */
  error: (message, meta) => writeLog('error', message, meta),

  /** Development-only verbose tracing — suppressed in production */
  debug: (message, meta) => writeLog('debug', message, meta),
};
