"use strict";

const path = require("path");
const dotenv = require("dotenv");

// Load .env from the server root (one level up from src/config)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Centralized, validated environment configuration.
 * @typedef {Object} EnvConfig
 * @property {number} port
 * @property {string} nodeEnv
 * @property {string} clientUrl
 * @property {string} mongoUri
 * @property {string} jwtAccessSecret
 * @property {string} jwtRefreshSecret
 * @property {string} jwtAccessExpires
 * @property {string} jwtRefreshExpires
 * @property {boolean} cookieSecure
 * @property {string} emailFrom
 * @property {string} resendApiKey
 * @property {string} mailtrapApiToken
 * @property {string} mailtrapInboxId
 * @property {boolean} isProd
 */

/** @type {EnvConfig} */
const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inkwell",
  mongoUriTest: process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/inkwell_test",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  emailFrom: process.env.EMAIL_FROM || "Inkwell <onboarding@resend.dev>",
  resendApiKey: process.env.RESEND_API_KEY || "",
  mailtrapApiToken: process.env.MAILTRAP_API_TOKEN || "",
  mailtrapInboxId: process.env.MAILTRAP_INBOX_ID || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "mock_google_client_id",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_google_client_secret",
  githubClientId: process.env.GITHUB_CLIENT_ID || "mock_github_client_id",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "mock_github_client_secret",
  get isProd() {
    return this.nodeEnv === "production";
  },
};

module.exports = env;
