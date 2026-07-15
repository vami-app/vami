"use strict";

const { body } = require("express-validator");

const createPostRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 160 }),
  body("subtitle").optional().trim().isLength({ max: 200 }),
  body("contentHtml").optional().isString(),
  body("tags").optional().isArray({ max: 5 }).withMessage("Up to 5 tags allowed"),
  body("status").optional().isIn(["draft", "published"]),
];

const updatePostRules = [
  body("title").optional().trim().isLength({ min: 1, max: 160 }),
  body("subtitle").optional().trim().isLength({ max: 200 }),
  body("contentHtml").optional().isString(),
  body("tags").optional().isArray({ max: 5 }).withMessage("Up to 5 tags allowed"),
  body("status").optional().isIn(["draft", "published"]),
];

const commentRules = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 2000 })
    .withMessage("Comment is too long"),
];

module.exports = { createPostRules, updatePostRules, commentRules };
