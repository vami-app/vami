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
    it('returns 200 when env is configured', async () => {
      const res = await request.get('/readyz');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.checks.env).toBe(true);
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
