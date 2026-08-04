/**
 * FAANG-Grade Cursor Pagination Utility
 * 
 * Implements Keyset/Cursor pagination for stable, O(1) depth traversal.
 * Handles encoding/decoding cursors and building MongoDB $or range queries.
 */

/**
 * Encodes a MongoDB sort field value and _id into a base64 opaque cursor.
 * 
 * @param {string|Date|number} sortValue - The value of the primary sort field (e.g., createdAt).
 * @param {string|mongoose.Types.ObjectId} id - The document's _id tie-breaker.
 * @returns {string} Base64 encoded cursor.
 */
export function encodeCursor(sortValue, id) {
  if (!sortValue || !id) return null;
  // Convert dates to ISO string for safe JSON serialization
  const valueToEncode = sortValue instanceof Date ? sortValue.toISOString() : sortValue;
  const payload = JSON.stringify([valueToEncode, id.toString()]);
  return Buffer.from(payload).toString('base64');
}

/**
 * Decodes a base64 cursor into its constituent parts.
 * 
 * @param {string} cursor - The base64 encoded cursor.
 * @returns {Array|null} Array containing [sortValue, id] or null if invalid.
 */
export function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const payload = Buffer.from(cursor, 'base64').toString('ascii');
    return JSON.parse(payload);
  } catch (error) {
    console.error('Invalid cursor provided:', cursor);
    return null;
  }
}

/**
 * Builds a MongoDB $or query for keyset pagination.
 * 
 * @param {string} cursor - Base64 encoded cursor.
 * @param {string} sortField - The primary field being sorted on (e.g., 'createdAt').
 * @param {boolean} [isDate=true] - Whether the sort field should be parsed as a Date.
 * @returns {Object} MongoDB query filter object to be appended to existing queries.
 */
export function buildCursorQuery(cursor, sortField, isDate = true) {
  if (!cursor) return {};
  const decoded = decodeCursor(cursor);
  if (!decoded || decoded.length !== 2) return {};

  const [sortValueRaw, idRaw] = decoded;
  
  // Safely cast the sort value back to its original type if necessary
  const sortValue = isDate ? new Date(sortValueRaw) : sortValueRaw;

  // $or query logic for { sortField: -1, _id: -1 }:
  // 1. Documents strictly older than the cursor's sort value.
  // 2. Documents with the exact same sort value, but a strictly smaller _id.
  return {
    $or: [
      { [sortField]: { $lt: sortValue } },
      { [sortField]: sortValue, _id: { $lt: idRaw } }
    ]
  };
}

/**
 * Transforms an array of documents into a Relay Connection standard response.
 * 
 * @param {Array} docs - The retrieved documents (should fetch limit + 1 to determine hasNextPage).
 * @param {number} limit - The requested page size.
 * @param {string} sortField - The primary sort field used to generate cursors.
 * @returns {Object} Relay Connection object { edges, pageInfo }.
 */
export function buildRelayConnection(docs, limit, sortField) {
  const hasNextPage = docs.length > limit;
  
  // Remove the extra document used to check for next page
  const items = hasNextPage ? docs.slice(0, limit) : docs;

  const edges = items.map(doc => ({
    cursor: encodeCursor(doc[sortField], doc._id),
    node: doc,
  }));

  const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

  return {
    edges,
    pageInfo: {
      hasNextPage,
      endCursor,
    },
  };
}
