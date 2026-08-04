/**
 * RSC Serialization Utilities
 *
 * Mongoose `.lean()` returns plain objects, but `_id` fields are
 * still `ObjectId` instances (Buffer-backed objects). When these are
 * passed as Server Component props, React's serialization layer may
 * throw or produce inconsistent output depending on version.
 *
 * These helpers coerce all non-primitive values to JSON-safe types
 * via `JSON.stringify → JSON.parse` round-trip, which:
 *   - Converts ObjectId → string
 *   - Converts Date → ISO string
 *   - Strips undefined fields
 *   - Is deterministic and dependency-free
 */

/**
 * Serialize a single Mongoose lean document for safe use as RSC props.
 * @template T
 * @param {T | null | undefined} doc
 * @returns {T | null}
 */
export function serializeDoc(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Serialize an array of Mongoose lean documents.
 * @template T
 * @param {T[] | null | undefined} docs
 * @returns {T[]}
 */
export function serializeDocs(docs) {
  if (!docs || !Array.isArray(docs)) return [];
  return JSON.parse(JSON.stringify(docs));
}
