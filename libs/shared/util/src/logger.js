const winston = require('winston');
const { getContext } = require('./context');

/**
 * Custom Winston format injecting AsyncLocalStorage request context.
 */
const injectCorrelationContext = winston.format((info) => {
  const ctx = getContext();
  if (ctx) {
    if (ctx.requestId) info.requestId = ctx.requestId;
    if (ctx.traceId) info.traceId = ctx.traceId;
    if (ctx.tenantId) info.tenantId = ctx.tenantId;
    if (ctx.userId) info.userId = ctx.userId;
  }
  return info;
});

/**
 * Creates an enterprise logger instance.
 * @param {{ serviceName?: string, logLevel?: string }} [options]
 */
function createLogger(options = {}) {
  const serviceName = options.serviceName || 'vami-service';
  const logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';

  const loggerInstance = winston.createLogger({
    level: logLevel,
    defaultMeta: { service: serviceName },
    format: winston.format.combine(
      injectCorrelationContext(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'development'
          ? winston.format.combine(
              injectCorrelationContext(),
              winston.format.colorize(),
              winston.format.simple()
            )
          : winston.format.json()
      })
    ]
  });

  return {
    info: (msg, meta = {}) => loggerInstance.info(msg, meta),
    warn: (msg, meta = {}) => loggerInstance.warn(msg, meta),
    error: (msg, meta = {}) => loggerInstance.error(msg, meta),
    debug: (msg, meta = {}) => loggerInstance.debug(msg, meta),
    /** @type {import('winston').Logger} */
    raw: loggerInstance
  };
}

module.exports = {
  createLogger
};
