const { AppError, createLogger } = require('@vami/util');

const logger = createLogger({ serviceName: 'product-a-api' });

/**
 * Centralized Express error handler.
 *
 * RULES (must not be broken):
 * 1. Must be the LAST middleware registered (after all routes).
 * 2. Must have exactly 4 arguments — Express detects error handlers by arity.
 * 3. Never expose stack traces in production — they reveal internal structure.
 * 4. Log error BEFORE sending the response so the log always gets written even
 *    if the response write fails.
 *
 * @param {any} err
 * @param {any} req
 * @param {any} res
 * @param {any} _next - required for 4-arg signature even if not used
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.errorCode : 'INTERNAL_ERROR';
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const message = isOperational ? err.message : 'An unexpected error occurred.';

  logger.error('Request error', {
    statusCode,
    errorCode,
    message: err.message,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    // Stack only logged server-side, never sent to client
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    requestId: req.requestId,
  });
}

module.exports = { errorHandler };
