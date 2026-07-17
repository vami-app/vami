"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Follow = require("../models/Follow");

async function run() {
  console.log("Starting follow relationships backfill...");
  await connectDB();

  const users = await User.find({});
  let createdCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    if (!user.following || !user.following.length) continue;

    for (const followedId of user.following) {
      // Check if Follow doc already exists
      const exists = await Follow.findOne({
        follower: user._id,
        followee: followedId,
      });

      if (!exists) {
        await Follow.create({
          follower: user._id,
          followee: followedId,
          followedAt: user.createdAt || new Date(),
          sourcePost: null,
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }
  }

  console.log(`Backfill complete. Created ${createdCount} Follow documents, skipped ${skippedCount} existing relationships.`);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
