"use strict";

const { body } = require("express-validator");

const subscribeValidator = [];
const verifyValidator = [
  body("razorpay_payment_id").notEmpty().withMessage("razorpay_payment_id is required"),
  body("razorpay_subscription_id").notEmpty().withMessage("razorpay_subscription_id is required"),
  body("razorpay_signature").notEmpty().withMessage("razorpay_signature is required"),
];

module.exports = {
  subscribeValidator,
  verifyValidator,
};
