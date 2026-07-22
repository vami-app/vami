"use strict";

const env = require("../config/env");

/**
 * @typedef {Object} EmailMessage
 * @property {string} to
 * @property {string} subject
 * @property {string} html
 * @property {string} text - plaintext fallback (deliverability + accessibility)
 */

/**
 * Send via Resend's HTTP API (production).
 * @param {EmailMessage} msg
 */
async function sendViaResend(msg) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend failed (${res.status}): ${body}`);
  }
}

/**
 * Send via Mailtrap's sandbox API (development — nothing reaches real inboxes).
 * @param {EmailMessage} msg
 */
async function sendViaMailtrap(msg) {
  const res = await fetch(
    `https://sandbox.api.mailtrap.io/api/send/${env.mailtrapInboxId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.mailtrapApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { email: env.emailFrom.replace(/^.*<|>$/g, ""), name: "Inkwell" },
        to: [{ email: msg.to }],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Mailtrap failed (${res.status}): ${body}`);
  }
}

/**
 * Console fallback so the flow is fully testable with zero email credentials.
 * @param {EmailMessage} msg
 */
async function sendViaConsole(msg) {
  console.log(
    `[email] to=${msg.to} subject="${msg.subject}"\n${msg.text}`
  );
}

/**
 * Send an email using the first configured provider:
 * Resend (RESEND_API_KEY) → Mailtrap sandbox (MAILTRAP_API_TOKEN + MAILTRAP_INBOX_ID) → console log.
 * Catches rate limits (e.g. Mailtrap 429) and falls back to console logging so user flows never fail.
 * @param {EmailMessage} msg
 * @returns {Promise<void>}
 */
async function sendEmail(msg) {
  if (env.resendApiKey) {
    try {
      return await sendViaResend(msg);
    } catch (err) {
      console.warn(`[email] Resend delivery notice: ${err.message}. Falling back to console delivery.`);
    }
  }
  if (env.mailtrapApiToken && env.mailtrapInboxId) {
    try {
      return await sendViaMailtrap(msg);
    } catch (err) {
      console.warn(`[email] Mailtrap delivery notice: ${err.message}. Falling back to console delivery.`);
    }
  }
  return sendViaConsole(msg);
}

module.exports = { sendEmail };
