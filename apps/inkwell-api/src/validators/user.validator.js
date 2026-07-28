"use strict";

const { body } = require("express-validator");
const User = require("@vami/identity-service").User;

const RESERVED_SUBDOMAINS = [
  "www", "api", "admin", "mail", "app", "blog", "static",
  "cdn", "assets", "help", "support", "status", "dev", "staging"
];

const updateSubdomainRules = [
  body("subdomain")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Subdomain name is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Subdomain must be 3–30 characters")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Subdomain can only contain lowercase letters, numbers, and hyphens")
    .custom((value) => {
      if (RESERVED_SUBDOMAINS.includes(value)) {
        throw new Error("That subdomain is reserved");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const existingSub = await User.findOne({ subdomain: value, _id: { $ne: req.user._id } });
      if (existingSub) {
        throw new Error("That subdomain is already taken");
      }
      const existingUser = await User.findOne({ username: value, _id: { $ne: req.user._id } });
      if (existingUser) {
        throw new Error("That subdomain matches another user's username");
      }
      return true;
    }),
];

module.exports = { updateSubdomainRules };
