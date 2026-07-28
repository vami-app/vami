const crypto = require('crypto');

const MAX_PAGE_SIZE = 50;

/**
 * Resolves the HMAC secret.
 * Throws at call-time if the env var is absent — never falls back to a
 * hardcoded value that would silently ship in git history.
 *
 * Tests that need a deterministic secret must pass it explicitly via the
 * `secret` parameter rather than relying on an env default.
 *
 * @returns {string}
 */
function requireSecret() {
  const secret = process.env.PAGINATION_SECRET;
  if (!secret) {
    throw new Error(
      'PAGINATION_SECRET environment variable is required. ' +
      'Set it in your .env file or pass an explicit secret to encodeCursor/decodeCursor.'
    );
  }
  return secret;
}

/**
 * @typedef {Object} CursorPayload
 * @property {string | number} sortValue
 * @property {string} id
 */

/**
 * Generates an HMAC-SHA256 signature for a data string.
 * @param {string} data
 * @param {string} secret
 * @returns {string} base64url-encoded signature
 */
function generateSignature(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

/**
 * Encodes a sort coordinate payload into an HMAC-signed Base64URL opaque cursor.
 * @param {CursorPayload} payload
 * @param {string} [secret] - defaults to PAGINATION_SECRET env var; must be provided in tests
 * @returns {string}
 */
function encodeCursor(payload, secret) {
  const resolvedSecret = secret ?? requireSecret();

  if (!payload || payload.sortValue === undefined || !payload.id) {
    throw new Error('Cursor payload requires sortValue and id properties.');
  }

  const rawJson = JSON.stringify({ sortValue: payload.sortValue, id: payload.id });
  const base64Data = Buffer.from(rawJson).toString('base64url');
  const signature = generateSignature(base64Data, resolvedSecret);

  return `${base64Data}.${signature}`;
}

/**
 * Decodes and verifies an HMAC-signed Base64URL opaque cursor.
 *
 * Security properties:
 * - Uses indexOf + substring instead of split('.') to prevent DoS via
 *   unbounded array allocation on attacker-controlled input.
 * - Uses Buffer with explicit 'base64url' encoding on both sides of
 *   timingSafeEqual so byte-level comparison matches what was signed.
 * - Uses crypto.timingSafeEqual to prevent timing-attack signature disclosure.
 *
 * @param {string} signedCursor
 * @param {string} [secret] - defaults to PAGINATION_SECRET env var; must be provided in tests
 * @returns {CursorPayload}
 */
function decodeCursor(signedCursor, secret) {
  const resolvedSecret = secret ?? requireSecret();

  if (typeof signedCursor !== 'string' || signedCursor.length === 0) {
    throw new Error('Invalid cursor: must be a non-empty string.');
  }

  // Bounded split: find the FIRST dot only.
  // Prevents DoS via a malicious cursor containing thousands of dots.
  const dotIndex = signedCursor.indexOf('.');
  if (dotIndex === -1) {
    throw new Error('Malformed cursor: missing signature separator.');
  }

  const base64Data = signedCursor.substring(0, dotIndex);
  const providedSignature = signedCursor.substring(dotIndex + 1);

  // Verify there is no additional dot in the signature segment.
  // A valid HMAC-SHA256 base64url value never contains a dot.
  if (providedSignature.includes('.')) {
    throw new Error('Malformed cursor: unexpected additional separator.');
  }

  const expectedSignature = generateSignature(base64Data, resolvedSecret);

  // Both buffers use 'base64url' encoding so we compare the actual signature
  // bytes — not the UTF-8 byte representation of the base64url string.
  const providedBuffer = Buffer.from(providedSignature, 'base64url');
  const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid cursor: signature verification failed.');
  }

  try {
    const rawJson = Buffer.from(base64Data, 'base64url').toString('utf8');
    const parsed = JSON.parse(rawJson);
    if (parsed.sortValue === undefined || !parsed.id) {
      throw new Error('Invalid payload fields in cursor.');
    }
    return parsed;
  } catch (_err) {
    throw new Error('Failed to parse cursor payload.');
  }
}

/**
 * Builds a keyset pagination query object for MongoDB/Postgres indexed B-tree composite searches.
 * @param {Object} options
 * @param {string} [options.cursor]
 * @param {string} [options.sortField='_id']
 * @param {number} [options.limit=20]
 * @param {string} [options.secret] - explicit secret; falls back to env var
 * @returns {{ filter: Record<string, any>, limit: number }}
 */
function buildKeysetQuery({ cursor, sortField = '_id', limit = 20, secret }) {
  const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

  if (!cursor) {
    return { filter: {}, limit: safeLimit };
  }

  const { sortValue, id } = decodeCursor(cursor, secret);

  if (sortField === '_id') {
    return {
      filter: { _id: { $lt: id } },
      limit: safeLimit,
    };
  }

  return {
    filter: {
      $or: [
        { [sortField]: { $lt: sortValue } },
        { [sortField]: sortValue, _id: { $lt: id } },
      ],
    },
    limit: safeLimit,
  };
}

module.exports = {
  encodeCursor,
  decodeCursor,
  buildKeysetQuery,
  MAX_PAGE_SIZE,
};
