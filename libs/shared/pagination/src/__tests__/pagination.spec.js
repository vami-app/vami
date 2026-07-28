const { encodeCursor, decodeCursor, buildKeysetQuery, MAX_PAGE_SIZE } = require('../index');

describe('HMAC Keyset Pagination', () => {
  const secret = 'test-secret-key-1234567890123456';

  it('should encode and decode valid cursors', () => {
    const payload = { sortValue: '2026-07-28T10:00:00Z', id: 'user_123' };
    const cursor = encodeCursor(payload, secret);

    expect(typeof cursor).toBe('string');
    expect(cursor).toContain('.');

    const decoded = decodeCursor(cursor, secret);
    expect(decoded.sortValue).toBe(payload.sortValue);
    expect(decoded.id).toBe(payload.id);
  });

  it('should reject tampered cursors with invalid signatures', () => {
    const payload = { sortValue: 100, id: 'item_1' };
    const cursor = encodeCursor(payload, secret);
    const parts = cursor.split('.');
    const tamperedCursor = `${parts[0]}.invalidSignature`;

    expect(() => decodeCursor(tamperedCursor, secret)).toThrow(/signature/);
  });

  it('should build keyset queries with hard page size ceiling', () => {
    const payload = { sortValue: 50, id: 'doc_99' };
    const cursor = encodeCursor(payload, secret);

    const query = buildKeysetQuery({
      cursor,
      sortField: 'score',
      limit: 100, // Request exceeds ceiling
      secret,
    });

    expect(query.limit).toBe(MAX_PAGE_SIZE);
    expect(query.filter).toEqual({
      $or: [
        { score: { $lt: 50 } },
        { score: 50, _id: { $lt: 'doc_99' } },
      ],
    });
  });
});
