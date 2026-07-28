"use strict";

const { validationResult } = require("express-validator");
const { ApiError } = require("../utils/apiResponse");

/**
 * Run after an express-validator chain. Throws a 400 ApiError with the
 * collected field errors if validation failed.
 * @type {import('express').RequestHandler}
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  next(new ApiError(400, "Validation failed", errors));
}

module.exports = { validate };
