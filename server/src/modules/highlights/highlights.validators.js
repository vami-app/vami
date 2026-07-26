"use strict";

const { body, param } = require("express-validator");

const createHighlightValidation = [
  body("quote")
    .notEmpty()
    .withMessage("Highlight quote is required")
    .isString()
    .withMessage("Highlight quote must be a string")
    .trim(),
  body("contextBefore").optional().isString().trim(),
  body("contextAfter").optional().isString().trim(),
  body("note").optional().isString().trim(),
];

const updateHighlightValidation = [
  param("id").isMongoId().withMessage("Invalid highlight ID"),
  body("note").optional().isString().trim(),
];

module.exports = {
  createHighlightValidation,
  updateHighlightValidation,
};
