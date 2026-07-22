"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const BCRYPT_COST = 12;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function isPasswordRequired() {
        return !this.googleId && !this.githubId;
      },
      select: false,
    },
    googleId: { type: String, default: undefined, sparse: true, unique: true },
    githubId: { type: String, default: undefined, sparse: true, unique: true },
    bio: { type: String, maxlength: 200, default: "" },
    avatarUrl: { type: String, default: "" },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    subdomain: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    customDomain: { type: String, default: null },
    exportRequestedAt: { type: Date },
    exportStatus: { type: String, enum: ["idle", "pending", "ready", "failed"], default: "idle" },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    emailPrefs: {
      allEmails: { type: Boolean, default: true },
      digestFrequency: { type: String, enum: ["weekly", "off"], default: "weekly" },
    },
    followedTags: { type: [String], default: [] },
    lastDigestSentAt: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpiresAt: { type: Date, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    membershipStatus: {
      type: String,
      enum: ["none", "active", "past_due", "canceled"],
      default: "none",
      index: true,
    },
    razorpayCustomerId: { type: String, default: null },
    razorpaySubscriptionId: { type: String, default: null },
  },
  { timestamps: true }
);

// Hash password on create/change
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_COST);
  next();
});

/**
 * Compare a plaintext candidate to the stored hash.
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Public-safe representation (never leaks password/email to other users).
 * @param {boolean} [includeEmail=false]
 * @returns {Object}
 */
userSchema.methods.toPublicJSON = function toPublicJSON(includeEmail = false) {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    followersCount: this.followers ? this.followers.length : 0,
    followingCount: this.following ? this.following.length : 0,
    subdomain: this.subdomain,
    customDomain: this.customDomain,
    emailVerified: this.emailVerified || false,
    role: this.role || "user",
    status: this.status || "active",
    membershipStatus: this.membershipStatus || "none",
    ...(includeEmail ? {
      email: this.email,
      emailPrefs: this.emailPrefs || { allEmails: true, digestFrequency: "weekly" },
    } : {}),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
