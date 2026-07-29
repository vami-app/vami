// describe, it, expect, beforeAll injected globally via vitest globals:true
const supertest = require('supertest');

// Stub env before app loads (validateEnv would throw otherwise)
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.IDENTITY_JWKS_URL = 'http://localhost:5000/.well-known/jwks.json';
process.env.PAGINATION_SECRET = 'test-pagination-secret-32-chars!!';
process.env.REDIS_PASSWORD = 'test-redis-password';

const { createApp } = require('../bootstrap/app');

describe('product-a-api — Health Module', () => {
  /** @type {any} */
  let request;

  beforeAll(() => {
    const { app } = createApp();
    request = supertest(app);
  });

  describe('GET /healthz — Liveness', () => {
    it('returns 200 with status ok', async () => {
      const res = await request.get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('product-a-api');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /readyz — Readiness', () => {
    it('returns 503 when Redis is unavailable (correct: Redis is a critical dependency)', async () => {
      // In test env, no Redis is running — readyz correctly reports 503.
      // This validates the real production behavior of the probe:
      // a pod with unreachable Redis should not receive traffic.
      const res = await request.get('/readyz');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('not_ready');
      expect(res.body.checks.env).toBe(true);   // env vars are set
      expect(res.body.checks.redis).toBe(false); // Redis not available in test
    });
  });

  describe('404 catch-all', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request.get('/completely-unknown-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });
});
