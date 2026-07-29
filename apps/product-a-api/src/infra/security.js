const helmet = require('helmet');
const cors = require('cors');

/**
 * Builds a hardened Helmet middleware configuration.
 *
 * Defaults (CSP, HSTS, X-Frame-Options, etc.) are enabled by Helmet automatically.
 * CSP is customized to allow same-origin scripts and cookies for the BFF.
 *
 * @returns {import('express').RequestHandler}
 */
function buildHelmet() {
  const helmetFn = helmet.default || helmet;
  return helmetFn({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // P3-A: No 'unsafe-inline' — Vite bundles CSS into external files.
        // If a future inline style is required, use a nonce instead.
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    // HSTS: only enforce in production (dev runs over HTTP)
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    // Prevent MIME sniffing
    noSniff: true,
    // XSS filter for older browsers
    xssFilter: true,
    // Prevent iframe embedding
    frameguard: { action: 'deny' },
  });
}

/**
 * Builds a CORS middleware configuration.
 *
 * In development, allows any origin.
 * In production, restricts to the allowed origins list from ALLOWED_ORIGINS env var.
 *
 * @returns {import('express').RequestHandler}
 */
function buildCors() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // P3-C: Explicit dev whitelist — not wildcard.
    // origin: true accepts ANY origin including malicious local pages.
    // In dev, credentials (httpOnly cookies) are real session cookies.
    const devOrigins = [
      'http://localhost:3000',  // product-a-web Vite dev server
      'http://localhost:5173',  // Vite default port
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];
    return cors({
      origin: (origin, callback) => {
        if (!origin || devOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: dev origin '${origin}' not in whitelist`));
      },
      credentials: true,
    });
  }

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600, // Cache preflight response for 10 minutes
  });
}

module.exports = { buildHelmet, buildCors };
