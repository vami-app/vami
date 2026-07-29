/**
 * Computes profile diff patch object — only sends changed non-empty fields to API.
 * FSD model layer abstraction for update-profile feature.
 *
 * @param {{ displayName: string, bio: string }} initial
 * @param {{ displayName: string, bio: string }} current
 * @returns {Record<string, string>}
 */
export function getProfileDiff(initial, current) {
  /** @type {Record<string, string>} */
  const patch = {};
  if (current.displayName !== initial.displayName) {
    patch.displayName = current.displayName;
  }
  if (current.bio !== initial.bio) {
    patch.bio = current.bio;
  }
  return patch;
}
