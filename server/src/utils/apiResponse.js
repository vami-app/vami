"use strict";

/**
 * Send a standard success envelope.
 * @param {import('express').Response} res
 * @param {number} status - HTTP status code
 * @param {*} data - payload
 * @param {string} [message]
 */
function sendSuccess(res, status, data, message = "") {
  return res.status(status).json({ success: true, data, message });
}

/**
 * Application-level error carrying an HTTP status code. Thrown from
 * controllers and caught by the centralized error middleware.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {Array<{field?: string, message: string}>} [errors]
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { sendSuccess, ApiError };
