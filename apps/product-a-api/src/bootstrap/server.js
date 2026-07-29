const { config } = require('../config/env');
const { createLogger } = require('@vami/util');
const { createApp } = require('./app');

const logger = createLogger({ serviceName: 'product-a-api' });

const PORT = config.PORT;

const { app } = createApp();

const server = app.listen(PORT, () => {
  logger.info('product-a-api listening', { port: PORT, env: config.NODE_ENV });
});

// Configure keep-alive and headers timeouts to prevent 502 race conditions with upstream load balancers
server.keepAliveTimeout = 61 * 1000; // 61s (> typical 60s LB idle timeout)
server.headersTimeout = 65 * 1000;   // 65s (> keepAliveTimeout)

/**
 * Graceful shutdown: stop accepting new connections, wait for in-flight
 * requests to complete, then exit. Kubernetes sends SIGTERM before SIGKILL.
 * @param {string} signal
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

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  // Let Kubernetes restart the pod instead of silently continuing in a broken state
  process.exit(1);
});
