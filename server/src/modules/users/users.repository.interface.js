"use strict";

/* eslint-disable no-unused-vars */

class IUserRepository {
  async create(data) {
    throw new Error("Method create must be implemented");
  }

  async findById(id, { selectPassword = false, selectTokens = false } = {}) {
    throw new Error("Method findById must be implemented");
  }

  async findByEmail(email, { selectPassword = false, selectTokens = false } = {}) {
    throw new Error("Method findByEmail must be implemented");
  }

  async findByUsername(username) {
    throw new Error("Method findByUsername must be implemented");
  }

  async findBySubdomain(subdomain) {
    throw new Error("Method findBySubdomain must be implemented");
  }

  async findByOAuthId({ provider, providerId }) {
    throw new Error("Method findByOAuthId must be implemented");
  }

  async linkOAuthId({ id, provider, providerId }) {
    throw new Error("Method linkOAuthId must be implemented");
  }

  async updatePasswordHash({ id, hash }) {
    throw new Error("Method updatePasswordHash must be implemented");
  }

  async setResetToken({ id, tokenHash, expiresAt }) {
    throw new Error("Method setResetToken must be implemented");
  }

  async findByValidResetToken(tokenHash) {
    throw new Error("Method findByValidResetToken must be implemented");
  }

  async setEmailVerified(id) {
    throw new Error("Method setEmailVerified must be implemented");
  }

  async setVerificationToken({ id, tokenHash, expiresAt }) {
    throw new Error("Method setVerificationToken must be implemented");
  }

  async setEmailPreferences({ id, prefs }) {
    throw new Error("Method setEmailPreferences must be implemented");
  }

  async updateProfile({ id, fields }) {
    throw new Error("Method updateProfile must be implemented");
  }

  async setAvatarUrl({ id, avatarUrl }) {
    throw new Error("Method setAvatarUrl must be implemented");
  }

  async setSubdomain({ id, subdomain }) {
    throw new Error("Method setSubdomain must be implemented");
  }

  async findBookmarks(id) {
    throw new Error("Method findBookmarks must be implemented");
  }

  async setExportStatus({ id, status, requestedAt }) {
    throw new Error("Method setExportStatus must be implemented");
  }

  async setPendingDeletion({ id, tokenHash, expiresAt }) {
    throw new Error("Method setPendingDeletion must be implemented");
  }

  async findPaginated({ cursor, limit = 20, search = "" } = {}) {
    throw new Error("Method findPaginated must be implemented");
  }

  async setRole({ id, role }) {
    throw new Error("Method setRole must be implemented");
  }

  async setBanned({ id, banned }) {
    throw new Error("Method setBanned must be implemented");
  }

  async findEmailRecipients(filter) {
    throw new Error("Method findEmailRecipients must be implemented");
  }

  async removeFromAllBookmarks(postIds) {
    throw new Error("Method removeFromAllBookmarks must be implemented");
  }

  async pullFollowReferences(userId) {
    throw new Error("Method pullFollowReferences must be implemented");
  }

  async updateMembershipStatus(id, status) {
    throw new Error("Method updateMembershipStatus must be implemented");
  }

  async deleteById(id) {
    throw new Error("Method deleteById must be implemented");
  }
}

module.exports = IUserRepository;
