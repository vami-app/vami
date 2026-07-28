const { encodeCursor, decodeCursor, buildKeysetQuery, MAX_PAGE_SIZE } = require('../index');

// All tests pass an explicit `secret` parameter.
// The new implementation throws if PAGINATION_SECRET env is not set and no
// explicit secret is provided — so tests must never rely on the env fallback.
const secret = 'test-secret-key-1234567890abcdef';

describe('HMAC Keyset Pagination', () => {

  // ── Encode / Decode — happy path ─────────────────────────────────────────

  it('encodes and decodes a valid cursor round-trip', () => {
    const payload = { sortValue: '2026-07-28T10:00:00Z', id: 'user_123' };
    const cursor = encodeCursor(payload, secret);

    expect(typeof cursor).toBe('string');
    expect(cursor).toContain('.');

    const decoded = decodeCursor(cursor, secret);
    expect(decoded.sortValue).toBe(payload.sortValue);
    expect(decoded.id).toBe(payload.id);
  });

  it('encodes numeric sortValue correctly', () => {
    const payload = { sortValue: 9999, id: 'item_42' };
    const decoded = decodeCursor(encodeCursor(payload, secret), secret);
    expect(decoded.sortValue).toBe(9999);
    expect(decoded.id).toBe('item_42');
  });

  // ── Signature tampering ────────────────────────────────────────────────────

  it('rejects a cursor with an invalid signature', () => {
    const cursor = encodeCursor({ sortValue: 100, id: 'item_1' }, secret);
    // Rebuild with a clearly wrong signature segment
    const base64Part = cursor.substring(0, cursor.indexOf('.'));
    expect(() => decodeCursor(`${base64Part}.badSignature`, secret)).toThrow(/signature/);
  });

  it('rejects a cursor signed with a different secret', () => {
    const cursor = encodeCursor({ sortValue: 1, id: 'a' }, secret);
    expect(() => decodeCursor(cursor, 'a-different-secret')).toThrow(/signature/);
  });

  // ── DoS protection — malicious dot injection ──────────────────────────────

  it('rejects a cursor with multiple dots (DoS protection)', () => {
    // An attacker sends a cursor with thousands of dots. The old split('.')
    // would allocate thousands of array elements. The new indexOf approach
    // detects a dot in the signature segment and throws immediately.
    const cursor = encodeCursor({ sortValue: 1, id: 'x' }, secret);
    const [data, sig] = [cursor.substring(0, cursor.indexOf('.')), cursor.substring(cursor.indexOf('.') + 1)];
    const malicious = `${data}.${sig}.extraDot`;
    expect(() => decodeCursor(malicious, secret)).toThrow(/Malformed cursor/);
  });

  it('rejects a cursor with zero dots', () => {
    expect(() => decodeCursor('nodotsinhere', secret)).toThrow(/missing signature separator/);
  });

  it('rejects an empty string cursor', () => {
    expect(() => decodeCursor('', secret)).toThrow();
  });

  it('rejects a non-string cursor', () => {
    // @ts-ignore — intentionally passing null to verify runtime type guard
    expect(() => decodeCursor(null, secret)).toThrow();
  });

  // ── Missing secret — must throw, never fall back ──────────────────────────

  it('throws if PAGINATION_SECRET is not set and no explicit secret is passed', () => {
    const original = process.env.PAGINATION_SECRET;
    delete process.env.PAGINATION_SECRET;

    try {
      expect(() => encodeCursor({ sortValue: 1, id: 'x' })).toThrow(/PAGINATION_SECRET/);
    } finally {
      // Restore env so other tests are not affected
      if (original !== undefined) process.env.PAGINATION_SECRET = original;
    }
  });

  // ── Payload validation ─────────────────────────────────────────────────────

  it('throws when encoding a payload missing sortValue', () => {
    // @ts-ignore — intentionally missing sortValue to test payload validation
    expect(() => encodeCursor({ id: 'x' }, secret)).toThrow();
  });

  it('throws when encoding a payload missing id', () => {
    // @ts-ignore — intentionally missing id to test payload validation
    expect(() => encodeCursor({ sortValue: 1 }, secret)).toThrow();
  });

  // ── buildKeysetQuery — limit clamping ─────────────────────────────────────

  it('clamps limit=0 to 1', () => {
    const result = buildKeysetQuery({ limit: 0, secret });
    expect(result.limit).toBe(1);
  });

  it(`clamps limit=${MAX_PAGE_SIZE + 1} to MAX_PAGE_SIZE=${MAX_PAGE_SIZE}`, () => {
    const result = buildKeysetQuery({ limit: MAX_PAGE_SIZE + 1, secret });
    expect(result.limit).toBe(MAX_PAGE_SIZE);
  });

  it('applies the ceiling from the original test (limit=100)', () => {
    const payload = { sortValue: 50, id: 'doc_99' };
    const cursor = encodeCursor(payload, secret);

    const query = buildKeysetQuery({ cursor, sortField: 'score', limit: 100, secret });

    expect(query.limit).toBe(MAX_PAGE_SIZE);
    expect(query.filter).toEqual({
      $or: [
        { score: { $lt: 50 } },
        { score: 50, _id: { $lt: 'doc_99' } },
      ],
    });
  });

  // ── buildKeysetQuery — sortField behaviour ────────────────────────────────

  it('uses simple $lt filter (not $or) when sortField is _id', () => {
    const cursor = encodeCursor({ sortValue: 'irrelevant', id: 'abc123' }, secret);
    const query = buildKeysetQuery({ cursor, sortField: '_id', limit: 10, secret });

    expect(query.filter).toEqual({ _id: { $lt: 'abc123' } });
    // Must NOT be an $or — that would add unnecessary overhead on the _id index
    expect(query.filter.$or).toBeUndefined();
  });

  it('returns empty filter when no cursor is provided (first page)', () => {
    const query = buildKeysetQuery({ limit: 20, secret });
    expect(query.filter).toEqual({});
    expect(query.limit).toBe(20);
  });
});
