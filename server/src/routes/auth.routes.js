"use strict";

const express = require("express");
const {
  register,
  login,
  logout,
  refresh,
  me,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate");
const { registerRules, loginRules } = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/logout", requireAuth, logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);

module.exports = router;
