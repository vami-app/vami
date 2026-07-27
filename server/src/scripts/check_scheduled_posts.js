"use strict";

const connectDB = require("../config/db");
const { postRepository } = require("../modules/posts/posts.module");

async function checkScheduledPosts() {
  await connectDB();

  const now = new Date();
  console.log(`[check_scheduled_posts] Running post scheduler check at ${now.toISOString()}...`);

  const overduePosts = await postRepository.findDueScheduled(now);

  if (overduePosts.length === 0) {
    console.log("[check_scheduled_posts] No overdue scheduled posts found.");
    process.exit(0);
  }

  let publishedCount = 0;
  let skippedCount = 0;

  for (const post of overduePosts) {
    const author = post.author;
    if (!author || !author.emailVerified || author.status !== "active") {
      console.warn(
        `[check_scheduled_posts] Skipping post "${post.title}" (${post._id}): Author is inactive or unverified.`
      );
      skippedCount++;
      continue;
    }

    await postRepository.publishScheduled(post._id);
    console.log(
      `[check_scheduled_posts] Successfully published post "${post.title}" (${post._id}) scheduled for ${post.scheduledAt ? post.scheduledAt.toISOString() : now.toISOString()}`
    );
    publishedCount++;
  }

  console.log(
    `[check_scheduled_posts] Finished run: ${publishedCount} published, ${skippedCount} skipped.`
  );
  process.exit(0);
}

if (require.main === module) {
  checkScheduledPosts().catch((err) => {
    console.error("[check_scheduled_posts] Fatal error:", err);
    process.exit(1);
  });
}

module.exports = checkScheduledPosts;
