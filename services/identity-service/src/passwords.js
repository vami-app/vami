const argon2 = require('argon2');

/**
 * Default Argon2id hashing options adhering to OWASP 2026 guidelines.
 */
function getArgonOptions() {
  const isTest = process.env.NODE_ENV === 'test';
  return {
    type: argon2.argon2id,
    timeCost: isTest ? 1 : 3,
    memoryCost: isTest ? 4096 : 65536, // 64MB production vs 4MB test
    parallelism: 4,
    saltLength: 16,
  };
}

/**
 * Hashes a plain-text password using Argon2id.
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  const opts = /** @type {any} */ (getArgonOptions());
  const hashResult = await argon2.hash(password, opts);
  return typeof hashResult === 'string' ? hashResult : hashResult.toString();
}

/**
 * Verifies a plain-text password against an Argon2id hash.
 * @param {string} hash
 * @param {string} password
 * @returns {Promise<boolean>}
 */
async function verifyPassword(hash, password) {
  if (!hash || !password || typeof password !== 'string') {
    return false;
  }
  try {
    return await argon2.verify(hash, password);
  } catch (_err) {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};
