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
        styleSrc: ["'self'", "'unsafe-inline'"],
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
    return cors({ origin: true, credentials: true });
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
