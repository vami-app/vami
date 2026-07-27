"use strict";

const IUserRepository = require("./users.repository.interface");
const User = require("./users.model");

class MongoUserRepository extends IUserRepository {
  async create(data) {
    return User.create(data);
  }

  async findById(id, { selectPassword = false, selectTokens = false } = {}) {
    let query = User.findById(id);
    if (selectPassword) query = query.select("+password");
    if (selectTokens) query = query.select("+passwordResetTokenHash +passwordResetExpiresAt +emailVerifyTokenHash +emailVerifyExpiresAt");
    return query;
  }

  async findByEmail(email, { selectPassword = false, selectTokens = false } = {}) {
    if (!email) return null;
    let query = User.findOne({ email: email.toLowerCase().trim() });
    if (selectPassword) query = query.select("+password");
    if (selectTokens) query = query.select("+passwordResetTokenHash +passwordResetExpiresAt +emailVerifyTokenHash +emailVerifyExpiresAt");
    return query;
  }

  async findByUsername(username) {
    if (!username) return null;
    return User.findOne({ username: username.toLowerCase().trim() });
  }

  async findBySubdomain(subdomain) {
    if (!subdomain) return null;
    return User.findOne({ subdomain: subdomain.toLowerCase().trim() });
  }

  async findByOAuthId({ provider, providerId }) {
    if (provider === "google") {
      return User.findOne({ googleId: providerId });
    }
    if (provider === "github") {
      return User.findOne({ githubId: providerId });
    }
    return null;
  }

  async linkOAuthId({ id, provider, providerId }) {
    const update = {};
    if (provider === "google") update.googleId = providerId;
    if (provider === "github") update.githubId = providerId;
    return User.findByIdAndUpdate(id, update, { new: true });
  }

  async updatePasswordHash({ id, hash }) {
    const user = await User.findById(id).select("+password");
    if (!user) return null;
    user.password = hash;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return user;
  }

  async setResetToken({ id, tokenHash, expiresAt }) {
    return User.findByIdAndUpdate(
      id,
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
      { new: true }
    );
  }

  async findByValidResetToken(tokenHash) {
    return User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");
  }

  async setEmailVerified(id) {
    return User.findByIdAndUpdate(
      id,
      {
        emailVerified: true,
        emailVerifyTokenHash: undefined,
        emailVerifyExpiresAt: undefined,
      },
      { new: true }
    );
  }

  async setVerificationToken({ id, tokenHash, expiresAt }) {
    return User.findByIdAndUpdate(
      id,
      {
        emailVerifyTokenHash: tokenHash,
        emailVerifyExpiresAt: expiresAt,
      },
      { new: true }
    );
  }

  async setEmailPreferences({ id, prefs }) {
    const user = await User.findById(id);
    if (!user) return null;
    if (prefs.allEmails !== undefined) user.emailPrefs.allEmails = prefs.allEmails;
    if (prefs.digestFrequency !== undefined) user.emailPrefs.digestFrequency = prefs.digestFrequency;
    await user.save();
    return user;
  }

  async updateProfile({ id, fields }) {
    const user = await User.findById(id);
    if (!user) return null;

    if (fields.name !== undefined && fields.name.trim()) user.name = fields.name.trim();
    if (fields.bio !== undefined) user.bio = String(fields.bio).trim();
    if (fields.themePreference !== undefined) user.themePreference = fields.themePreference;
    if (fields.emailPrefs !== undefined) {
      if (fields.emailPrefs.allEmails !== undefined) user.emailPrefs.allEmails = fields.emailPrefs.allEmails;
      if (fields.emailPrefs.digestFrequency !== undefined) user.emailPrefs.digestFrequency = fields.emailPrefs.digestFrequency;
    }

    await user.save();
    return user;
  }

  async setAvatarUrl({ id, avatarUrl }) {
    return User.findByIdAndUpdate(id, { avatarUrl }, { new: true });
  }

  async setSubdomain({ id, subdomain }) {
    return User.findByIdAndUpdate(id, { subdomain: subdomain.toLowerCase().trim() }, { new: true });
  }

  async findBookmarks(id) {
    const USER_FIELDS = "name username avatarUrl bio";
    const user = await User.findById(id).populate({
      path: "bookmarks",
      populate: { path: "author", select: USER_FIELDS },
    });
    return user ? user.bookmarks : [];
  }

  async setExportStatus({ id, status, requestedAt }) {
    const update = { exportStatus: status };
    if (requestedAt) update.exportRequestedAt = requestedAt;
    return User.findByIdAndUpdate(id, update, { new: true });
  }

  async setPendingDeletion({ id, tokenHash, expiresAt }) {
    return User.findByIdAndUpdate(
      id,
      {
        deleteRequestedAt: new Date(),
        deleteToken: tokenHash,
      },
      { new: true }
    );
  }

  async findPaginated({ cursor, limit = 20, search = "" } = {}) {
    const query = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1);

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1]._id) : null;

    return { users: items, nextCursor, hasMore };
  }

  async setRole({ id, role }) {
    return User.findByIdAndUpdate(id, { role }, { new: true });
  }

  async setBanned({ id, banned }) {
    const status = banned ? "banned" : "active";
    return User.findByIdAndUpdate(id, { status }, { new: true });
  }

  async findEmailRecipients(filter = {}) {
    return User.find(filter);
  }

  async removeFromAllBookmarks(postIds) {
    if (!postIds || postIds.length === 0) return;
    return User.updateMany(
      { bookmarks: { $in: postIds } },
      { $pull: { bookmarks: { $in: postIds } } }
    );
  }

  async pullFollowReferences(userId) {
    return User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );
  }

  async updateMembershipStatus(id, status) {
    return User.findByIdAndUpdate(id, { membershipStatus: status }, { new: true });
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = MongoUserRepository;
