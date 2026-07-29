const { validateEnv, createLogger } = require('@vami/util');
const { createApp } = require('./app');

const logger = createLogger({ serviceName: 'product-a-api' });

/**
 * Required environment variables. validateEnv throws synchronously
 * if any are missing — preventing a silent misconfigured deployment.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '4000';
process.env.IDENTITY_JWKS_URL = process.env.IDENTITY_JWKS_URL || 'http://localhost:5000/.well-known/jwks.json';
process.env.IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:5000';
process.env.PAGINATION_SECRET = process.env.PAGINATION_SECRET || 'dev-pagination-secret-32-chars-long!';
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'vamipassword';
process.env.INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'dev-internal-secret';

validateEnv([
  'NODE_ENV',
  'PORT',
  'IDENTITY_JWKS_URL',
  'PAGINATION_SECRET',
  'REDIS_PASSWORD',
]);

const PORT = Number(process.env.PORT) || 4000;

const { app } = createApp();

const server = app.listen(PORT, () => {
  logger.info(`product-a-api listening`, { port: PORT, env: process.env.NODE_ENV });
});

// Configure keep-alive and headers timeouts to prevent 502 race conditions with upstream load balancers
server.keepAliveTimeout = 61 * 1000; // 61s (> typical 60s LB idle timeout)
server.headersTimeout = 65 * 1000;   // 65s (> keepAliveTimeout)

/**
 * Graceful shutdown: stop accepting new connections, wait for in-flight
 * requests to complete, then exit. Kubernetes sends SIGTERM before SIGKILL.
 */
function gracefulShutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);

  // Force exit circuit breaker if connections hang past 25s
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown deadline exceeded (25s) — forcing exit');
    process.exit(1);
  }, 25000);

  server.close((err) => {
    clearTimeout(forceExitTimer);
    if (err) {
      logger.error('Error during graceful shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('Server closed — process exiting cleanly');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  // Let Kubernetes restart the pod instead of silently continuing in a broken state
  process.exit(1);
});
