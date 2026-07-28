const crypto = require('crypto');

const MAX_PAGE_SIZE = 50;
const DEFAULT_SECRET = process.env.PAGINATION_SECRET || 'vami-default-pagination-secret-key-32b';

/**
 * @typedef {Object} CursorPayload
 * @property {string | number} sortValue
 * @property {string} id
 */

/**
 * Generates an HMAC-SHA256 signature for data string.
 * @param {string} data
 * @param {string} secret
 * @returns {string}
 */
function generateSignature(data, secret) {
  /** @type {any} */
  const encoding = 'base64url';
  return crypto.createHmac('sha256', secret).update(data).digest(encoding);
}

/**
 * Encodes a sort coordinate payload into an HMAC-signed Base64URL opaque cursor.
 * @param {CursorPayload} payload
 * @param {string} [secret=DEFAULT_SECRET]
 * @returns {string}
 */
function encodeCursor(payload, secret = DEFAULT_SECRET) {
  if (!payload || payload.sortValue === undefined || !payload.id) {
    throw new Error('Cursor payload requires sortValue and id properties.');
  }

  const rawJson = JSON.stringify({ sortValue: payload.sortValue, id: payload.id });
  /** @type {any} */
  const encoding = 'base64url';
  const base64Data = Buffer.from(rawJson).toString(encoding);
  const signature = generateSignature(base64Data, secret);

  return `${base64Data}.${signature}`;
}

/**
 * Decodes and verifies an HMAC-signed Base64URL opaque cursor.
 * @param {string} signedCursor
 * @param {string} [secret=DEFAULT_SECRET]
 * @returns {CursorPayload}
 */
function decodeCursor(signedCursor, secret = DEFAULT_SECRET) {
  if (typeof signedCursor !== 'string' || !signedCursor.includes('.')) {
    throw new Error('Invalid cursor format.');
  }

  const parts = signedCursor.split('.');
  if (parts.length !== 2) {
    throw new Error('Malformed cursor structure.');
  }

  const [base64Data, providedSignature] = parts;
  const expectedSignature = generateSignature(base64Data, secret);

  const sigBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid cursor signature or cursor tampering detected.');
  }

  try {
    /** @type {any} */
    const encoding = 'base64url';
    const rawJson = Buffer.from(base64Data, encoding).toString('utf8');
    const parsed = JSON.parse(rawJson);
    if (parsed.sortValue === undefined || !parsed.id) {
      throw new Error('Invalid payload fields in cursor.');
    }
    return parsed;
  } catch (err) {
    throw new Error('Failed to parse cursor payload.');
  }
}

/**
 * Builds a keyset pagination query object for MongoDB/Postgres indexed B-tree composite searches.
 * @param {Object} options
 * @param {string} [options.cursor]
 * @param {string} [options.sortField='_id']
 * @param {number} [options.limit=20]
 * @param {string} [options.secret=DEFAULT_SECRET]
 * @returns {{ filter: Record<string, any>, limit: number }}
 */
function buildKeysetQuery({ cursor, sortField = '_id', limit = 20, secret = DEFAULT_SECRET }) {
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
