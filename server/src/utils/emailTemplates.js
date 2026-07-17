"use strict";

/**
 * HTML email templates. Kept deliberately simple: table layout + inline CSS,
 * since email clients do not reliably support modern CSS.
 */

/**
 * Escape user-supplied text for safe interpolation into email HTML.
 * @param {string} s
 * @returns {string}
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Password reset email.
 * @param {{ name: string, resetUrl: string, ttlMinutes: number }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
function passwordResetEmail({ name, resetUrl, ttlMinutes }) {
  const safeName = escapeHtml(name);
  const subject = "Reset your Inkwell password";
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your Inkwell password.",
    `Open this link to choose a new one (expires in ${ttlMinutes} minutes):`,
    "",
    resetUrl,
    "",
    "If you didn't request this, you can safely ignore this email — your password is unchanged.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f6f5f1;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f5f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;padding:40px;">
          <tr>
            <td style="font-size:22px;font-weight:bold;color:#1a1a1a;padding-bottom:16px;">Inkwell</td>
          </tr>
          <tr>
            <td style="font-size:15px;color:#333333;line-height:1.6;padding-bottom:24px;">
              Hi ${safeName},<br><br>
              We received a request to reset your password. Click the button below to choose a new one.
              This link expires in ${ttlMinutes} minutes.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${resetUrl}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-family:Arial,sans-serif;">Reset password</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888888;line-height:1.6;">
              If the button doesn't work, paste this link into your browser:<br>
              <a href="${resetUrl}" style="color:#555555;word-break:break-all;">${resetUrl}</a><br><br>
              If you didn't request this, you can safely ignore this email — your password is unchanged.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

module.exports = { passwordResetEmail };
