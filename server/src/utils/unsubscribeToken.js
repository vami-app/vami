"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Sign an unsubscribe token embedding userId and purpose.
 * @param {string} userId
 * @returns {string}
 */
function signUnsubscribeToken(userId) {
  return jwt.sign({ sub: userId, purpose: "unsubscribe" }, env.jwtAccessSecret, {
    expiresIn: "30d", // long-lived for email links
  });
}

/**
 * Verify an unsubscribe token.
 * @param {string} token
 * @returns {string} userId
 */
function verifyUnsubscribeToken(token) {
  const payload = jwt.verify(token, env.jwtAccessSecret);
  if (payload.purpose !== "unsubscribe") {
    throw new Error("Invalid token purpose");
  }
  return payload.sub;
}

/**
 * Sign a delete token.
 * @param {string} userId
 * @returns {string}
 */
function signDeleteToken(userId) {
  return jwt.sign({ sub: userId, purpose: "delete" }, env.jwtAccessSecret, {
    expiresIn: "30m", // 30 minutes TTL
  });
}

/**
 * Verify a delete token.
 * @param {string} token
 * @returns {string} userId
 */
function verifyDeleteToken(token) {
  const payload = jwt.verify(token, env.jwtAccessSecret);
  if (payload.purpose !== "delete") {
    throw new Error("Invalid token purpose");
  }
  return payload.sub;
}

module.exports = {
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  signDeleteToken,
  verifyDeleteToken,
};
