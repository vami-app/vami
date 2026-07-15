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
    password: { type: String, required: true, select: false },
    bio: { type: String, maxlength: 200, default: "" },
    avatarUrl: { type: String, default: "" },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  },
  { timestamps: true }
);

// Hash password on create/change
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
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
    ...(includeEmail ? { email: this.email } : {}),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
