"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("@vami/identity-service").User;
const Post = require("../models/Post");
const { sendEmail } = require("../utils/email");
const { weeklyDigestEmail } = require("../utils/emailTemplates");
const { signUnsubscribeToken } = require("../utils/unsubscribeToken");
const env = require("../config/env");

function getBackendUrl() {
  if (env.clientUrl.includes("localhost:3000")) {
    return `http://localhost:${env.port}`;
  }
  return env.clientUrl.replace(":3000", `:${env.port}`);
}

async function run() {
  console.log("Starting weekly digest email delivery run...");
  await connectDB();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const backendUrl = getBackendUrl();

  // Find all users who want weekly digest
  const users = await User.find({
    "emailPrefs.digestFrequency": "weekly",
  });

  console.log(`Found ${users.length} users to process for weekly digest.`);

  for (const user of users) {
    // Idempotency guard: Skip if user has already received a digest in the last 6 days
    if (user.lastDigestSentAt) {
      const daysSinceLast = (now - user.lastDigestSentAt) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < 6) {
        console.log(`[digest] Skipping user @${user.username} (already sent ${daysSinceLast.toFixed(1)} days ago)`);
        continue;
      }
    }

    // Skip if all emails are disabled
    if (user.emailPrefs && user.emailPrefs.allEmails === false) {
      console.log(`[digest] Skipping user @${user.username} (allEmails disabled)`);
      continue;
    }

    // Gather candidate posts: status published, publishedAt >= sevenDaysAgo
    // where author is in user.following OR any tag in tags matches user.followedTags
    const query = {
      status: "published",
      moderationStatus: "visible",
      publishedAt: { $gte: sevenDaysAgo },
      $or: [],
    };

    if (user.following && user.following.length > 0) {
      query.$or.push({ author: { $in: user.following } });
    }
    if (user.followedTags && user.followedTags.length > 0) {
      query.$or.push({ tags: { $in: user.followedTags } });
    }

    // If user has no follows or tags followed, query.$or is empty. Mongoose will fail empty $or.
    let posts = [];
    if (query.$or.length > 0) {
      posts = await Post.find(query)
        .populate("author", "name username")
        .sort({ totalClaps: -1 })
        .limit(5);
    }

    if (!posts.length) {
      console.log(`[digest] No matching posts in the last 7 days for user @${user.username}. Skipping email.`);
      continue;
    }

    // Format posts for template
    const formattedPosts = posts.map((p) => ({
      title: p.title,
      authorName: p.author ? p.author.name : "Unknown",
      url: `${env.clientUrl}/p/${p.slug}`,
    }));

    const unsubToken = signUnsubscribeToken(String(user._id));
    const unsubscribeUrl = `${backendUrl}/api/auth/unsubscribe?token=${unsubToken}`;

    const emailMsg = weeklyDigestEmail({
      name: user.name,
      posts: formattedPosts,
      unsubscribeUrl,
    });

    try {
      await sendEmail({
        to: user.email,
        ...emailMsg,
      });
      user.lastDigestSentAt = now;
      await user.save();
      console.log(`[digest] Sent digest email to @${user.username} (${user.email})`);
    } catch (err) {
      console.error(`[digest] Failed to send digest to @${user.username} (${user.email}):`, err.message);
    }
  }

  console.log("Weekly digest email delivery run finished.");
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("Digest delivery run failed:", err);
  process.exit(1);
});
