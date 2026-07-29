const express = require('express');
const cookieParser = require('cookie-parser');
const { identityModule } = require('./index');
const { ServiceRegistry, ModuleRegistry } = require('@vami/registry');
const { validateEnv, createLogger } = require('@vami/util');

const logger = createLogger({ serviceName: 'identity-service' });

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5000';
process.env.PAGINATION_SECRET = process.env.PAGINATION_SECRET || 'dev-pagination-secret-32-chars-long!';
process.env.INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'dev-internal-secret';

validateEnv(['NODE_ENV', 'PORT']);

const PORT = Number(process.env.PORT) || 5000;

async function main() {
  const serviceRegistry = new ServiceRegistry();
  const moduleRegistry = new ModuleRegistry();

  moduleRegistry.register(identityModule);
  moduleRegistry.registerAllServices(serviceRegistry);

  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  moduleRegistry.mountAll(app);

  // G2-3 Fix: await KeyManager.initialize() BEFORE accepting connections.
  // Prevents race: first login request on fast startup finds uninitialized key → 500.
  await moduleRegistry.readyAll();

  const server = app.listen(PORT, () => {
    logger.info('identity-service listening', { port: PORT, env: process.env.NODE_ENV });
  });

  server.keepAliveTimeout = 61 * 1000;
  server.headersTimeout = 65 * 1000;

  /** @param {string} signal */
  function gracefulShutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully`);
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
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error('Failed to start identity-service', { error: err.message, stack: err.stack });
  process.exit(1);
});
