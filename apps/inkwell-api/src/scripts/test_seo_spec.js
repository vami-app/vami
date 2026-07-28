"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("@vami/identity-service").User;
const Post = require("../models/Post");

async function run() {
  console.log("=== SEO Spec Verification Script ===");
  await connectDB();

  // 1. Check user model additions
  console.log("\n1. Testing User Model Additions...");
  let user = await User.findOne({ username: "ada" });
  if (!user) {
    console.error("Ada Lovelace user not found. Did you run pnpm seed?");
    process.exit(1);
  }

  // Update subdomain
  user.subdomain = "ada-love";
  user.exportStatus = "ready";
  user.exportRequestedAt = new Date();
  await user.save();
  console.log("User updated successfully with subdomain 'ada-love' and export ready.");

  // Fetch from DB again to verify
  let updatedUser = await User.findById(user._id);
  console.log("Verified User Subdomain in DB:", updatedUser.subdomain);
  console.log("Verified User Export Status:", updatedUser.exportStatus);

  // 2. Check post model additions
  console.log("\n2. Testing Post Model Additions...");
  let posts = await Post.find({ author: user._id });
  console.log(`Ada has ${posts.length} stories.`);
  
  if (posts.length > 0) {
    let post = posts[0];
    post.seo = {
      metaTitle: "SEO Title Test",
      metaDescription: "SEO Desc Test Description",
    };
    // Save to trigger pre-save hook
    await post.save();
    console.log("Post updated successfully with SEO overrides.");

    let updatedPost = await Post.findById(post._id);
    console.log("Verified Canonical URL:", updatedPost.seo.canonicalUrl);
    console.log("Verified indexable status:", updatedPost.indexable);
  }

  await mongoose.connection.close();
  console.log("\nVerification complete!");
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Verification failed:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
