class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=500]
   * @param {string} [errorCode='INTERNAL_ERROR']
   * @param {boolean} [isOperational=true]
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  /** @param {string} [message='Bad Request'] @param {string} [errorCode='BAD_REQUEST'] */
  constructor(message = 'Bad Request', errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode, true);
  }
}

class UnauthorizedError extends AppError {
  /** @param {string} [message='Unauthorized'] @param {string} [errorCode='UNAUTHORIZED'] */
  constructor(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    super(message, 401, errorCode, true);
  }
}

class ForbiddenError extends AppError {
  /** @param {string} [message='Forbidden'] @param {string} [errorCode='FORBIDDEN'] */
  constructor(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    super(message, 403, errorCode, true);
  }
}

class NotFoundError extends AppError {
  /** @param {string} [message='Resource Not Found'] @param {string} [errorCode='NOT_FOUND'] */
  constructor(message = 'Resource Not Found', errorCode = 'NOT_FOUND') {
    super(message, 404, errorCode, true);
  }
}

class ConflictError extends AppError {
  /** @param {string} [message='Conflict Detected'] @param {string} [errorCode='CONFLICT'] */
  constructor(message = 'Conflict Detected', errorCode = 'CONFLICT') {
    super(message, 409, errorCode, true);
  }
}

class InternalServerError extends AppError {
  /** @param {string} [message='Internal Server Error'] @param {string} [errorCode='INTERNAL_ERROR'] */
  constructor(message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR') {
    super(message, 500, errorCode, false);
  }
}

class ServiceUnavailableError extends AppError {
  /** @param {string} [message='Service Unavailable'] @param {string} [errorCode='SERVICE_UNAVAILABLE'] */
  constructor(message = 'Service Unavailable', errorCode = 'SERVICE_UNAVAILABLE') {
    super(message, 503, errorCode, true);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError,
};
