"use strict";

const Follow = require("../models/Follow");
const { sendEmail } = require("./email");
const { newPostNotificationEmail } = require("./emailTemplates");
const { signUnsubscribeToken } = require("./unsubscribeToken");
const env = require("../config/env");

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackendUrl() {
  if (env.clientUrl.includes("localhost:3000")) {
    return `http://localhost:${env.port}`;
  }
  return env.clientUrl.replace(":3000", `:${env.port}`);
}

/**
 * Send notification emails to all followers of the post's author.
 * @param {Object} post - Mongoose Post document, populated with author
 * @returns {Promise<void>}
 */
async function notifyFollowersOfNewPost(post) {
  try {
    const author = post.author;
    if (!author) return;

    // Get all followers
    const follows = await Follow.find({ followee: author._id }).populate("follower");
    if (!follows || !follows.length) {
      console.log(`[notify] Author ${author.username} has 0 followers. Skipping notifications.`);
      return;
    }

    const postUrl = `${env.clientUrl}/p/${post.slug}`;
    const backendUrl = getBackendUrl();

    // Filter valid followers
    const recipients = follows
      .map((f) => f.follower)
      .filter((follower) => {
        if (!follower) return false;
        // Exclude self-follows (defensive)
        if (String(follower._id) === String(author._id)) return false;
        // Exclude unsubscribed users
        if (follower.emailPrefs && follower.emailPrefs.allEmails === false) return false;
        return true;
      });

    console.log(`[notify] Found ${recipients.length} active followers to notify for post "${post.title}" by @${author.username}`);

    // Chunk and send in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (follower) => {
          try {
            const unsubToken = signUnsubscribeToken(String(follower._id));
            const unsubscribeUrl = `${backendUrl}/api/auth/unsubscribe?token=${unsubToken}`;
            
            const emailMsg = newPostNotificationEmail({
              followerName: follower.name,
              authorName: author.name,
              postTitle: post.title,
              postUrl,
              unsubscribeUrl,
            });

            await sendEmail({
              to: follower.email,
              ...emailMsg,
            });
            console.log(`[notify] Notification email sent to ${follower.email}`);
          } catch (err) {
            console.error(`[notify] Failed to send email to ${follower.email}:`, err.message);
          }
        })
      );

      if (i + BATCH_SIZE < recipients.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }
  } catch (err) {
    console.error("[notify] Error in notifyFollowersOfNewPost:", err);
  }
}

module.exports = { notifyFollowersOfNewPost };
