const { validateEnv, createLogger } = require('@vami/util');
const { createApp } = require('./app');

const logger = createLogger({ serviceName: 'product-a-api' });

/**
 * Required environment variables. validateEnv throws synchronously
 * if any are missing — preventing a silent misconfigured deployment.
 */
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

/**
 * Graceful shutdown: stop accepting new connections, wait for in-flight
 * requests to complete, then exit. Kubernetes sends SIGTERM before SIGKILL.
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close((err) => {
    if (err) {
      logger.error('Error during graceful shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('Server closed — process exiting');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  // Let Kubernetes restart the pod instead of silently continuing in a broken state
  process.exit(1);
});
