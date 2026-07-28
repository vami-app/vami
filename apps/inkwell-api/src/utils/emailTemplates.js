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

/**
 * New story publication notification email.
 * @param {{ followerName: string, authorName: string, postTitle: string, postUrl: string, unsubscribeUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
function newPostNotificationEmail({ followerName, authorName, postTitle, postUrl, unsubscribeUrl }) {
  const safeFollowerName = escapeHtml(followerName);
  const safeAuthorName = escapeHtml(authorName);
  const safePostTitle = escapeHtml(postTitle);
  const subject = `${safeAuthorName} published a new story on Inkwell`;
  const text = [
    `Hi ${followerName},`,
    "",
    `${authorName} just published a new story: "${postTitle}".`,
    `Read it here:`,
    postUrl,
    "",
    "To unsubscribe from these notifications, open this link:",
    unsubscribeUrl,
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
              Hi ${safeFollowerName},<br><br>
              <strong>${safeAuthorName}</strong> just published a new story: <em>"${safePostTitle}"</em>. Click the button below to read it.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${postUrl}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-family:Arial,sans-serif;font-weight:bold;">Read Story</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#888888;line-height:1.6;border-top:1px solid #eeeeee;padding-top:16px;">
              You received this email because you follow ${safeAuthorName} on Inkwell.<br>
              <a href="${unsubscribeUrl}" style="color:#555555;text-decoration:underline;">Unsubscribe</a> from these emails.
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

/**
 * Weekly digest email.
 * @param {{ name: string, posts: Array<{ title: string, authorName: string, url: string }>, unsubscribeUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
function weeklyDigestEmail({ name, posts, unsubscribeUrl }) {
  const safeName = escapeHtml(name);
  const subject = "Your Inkwell Weekly Digest";
  
  const textPosts = posts.map((p, i) => `${i + 1}. "${p.title}" by ${p.authorName} - ${p.url}`).join("\n");
  const text = [
    `Hi ${name},`,
    "",
    "Here is your weekly digest of top stories from authors and tags you follow on Inkwell:",
    "",
    textPosts,
    "",
    "To unsubscribe from these notifications, open this link:",
    unsubscribeUrl,
  ].join("\n");

  const htmlPosts = posts.map((p) => `
    <tr style="border-bottom: 1px solid #eeeeee;">
      <td style="padding: 16px 0;">
        <a href="${p.url}" style="font-size: 16px; font-weight: bold; color: #4f46e5; text-decoration: none;">${escapeHtml(p.title)}</a>
        <div style="font-size: 13px; color: #666666; margin-top: 4px;">by ${escapeHtml(p.authorName)}</div>
      </td>
    </tr>
  `).join("");

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
            <td style="font-size:15px;color:#333333;line-height:1.6;padding-bottom:16px;">
              Hi ${safeName},<br><br>
              Here is your weekly digest of top stories from authors and tags you follow on Inkwell:
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${htmlPosts}
              </table>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#888888;line-height:1.6;border-top:1px solid #eeeeee;padding-top:24px;margin-top:24px;">
              You received this email because you are signed up for weekly digests on Inkwell.<br>
              <a href="${unsubscribeUrl}" style="color:#555555;text-decoration:underline;">Unsubscribe</a> from these emails.
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

/**
 * Account deletion confirmation email.
 * @param {{ name: string, deleteUrl: string, ttlMinutes: number }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
function deleteConfirmationEmail({ name, deleteUrl, ttlMinutes }) {
  const safeName = escapeHtml(name);
  const subject = "Confirm your Inkwell account deletion request";
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to permanently delete your Inkwell account.",
    `Click the link below to confirm this request (expires in ${ttlMinutes} minutes):`,
    "",
    deleteUrl,
    "",
    "If you didn't request this, you can safely ignore this email — your account will not be deleted.",
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
              We received a request to permanently delete your Inkwell account. If you wish to proceed, click the button below to confirm deletion.
              <strong>This action is completely irreversible.</strong> This confirmation link expires in ${ttlMinutes} minutes.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${deleteUrl}" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-family:Arial,sans-serif;font-weight:bold;">Permanently Delete Account</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888888;line-height:1.6;">
              If the button doesn't work, paste this link into your browser:<br>
              <a href="${deleteUrl}" style="color:#555555;word-break:break-all;">${deleteUrl}</a><br><br>
              If you didn't request this, you can safely ignore this email — your account will remain active.
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

/**
 * Email verification link.
 * @param {{ name: string, verifyUrl: string, ttlHours: number }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
function verifyEmailEmail({ name, verifyUrl, ttlHours }) {
  const safeName = escapeHtml(name);
  const subject = "Verify your Inkwell email address";
  const text = [
    `Hi ${name},`,
    "",
    "Thank you for registering on Inkwell!",
    `Please click the link below to verify your email address (expires in ${ttlHours} hours):`,
    "",
    verifyUrl,
    "",
    "If you didn't create an account, you can safely ignore this email.",
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
              Thank you for registering on Inkwell! Please click the button below to verify your email address.
              This verification link expires in ${ttlHours} hours.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${verifyUrl}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-family:Arial,sans-serif;font-weight:bold;">Verify Email Address</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888888;line-height:1.6;">
              If the button doesn't work, paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color:#555555;word-break:break-all;">${verifyUrl}</a><br><br>
              If you didn't create an account, you can safely ignore this email.
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

module.exports = { passwordResetEmail, newPostNotificationEmail, weeklyDigestEmail, deleteConfirmationEmail, verifyEmailEmail };
