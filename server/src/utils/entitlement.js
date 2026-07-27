/**
 * Canonical entitlement helper for Inkwell paywalled posts.
 * Determines if a viewer is allowed to read full post content.
 *
 * @param {Object} post - Post document or object with `locked` and `author`
 * @param {Object|null} viewer - Authenticated user object or null if unauthenticated
 * @param {Object|null} [freeReadContext] - Optional metered free read context { remainingFreeReads: number }
 * @returns {boolean}
 */
function canReadFull(post, viewer, freeReadContext = null) {
  if (!post || !post.locked) {
    return true;
  }

  // Check if metered free read context allows full access
  if (freeReadContext && typeof freeReadContext.remainingFreeReads === "number" && freeReadContext.remainingFreeReads > 0) {
    return true;
  }

  if (!viewer) {
    return false;
  }

  const authorId = post.author && post.author._id ? String(post.author._id) : String(post.author);
  const viewerId = String(viewer._id || viewer.id);

  // Post author always gets full access
  if (authorId === viewerId) {
    return true;
  }
  // Admin role gets full access for moderation
  if (viewer.role === "admin") {
    return true;
  }

  // Active membership status required for non-author / non-admin viewers
  return viewer.membershipStatus === "active";
}

module.exports = { canReadFull };
