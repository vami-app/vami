/**
 * Validates process environment variables against a required keys schema.
 * @param {string[]} requiredKeys
 * @param {Record<string, string | undefined>} [env=process.env]
 * @returns {Record<string, string>}
 */
function validateEnv(requiredKeys, env = process.env) {
  const missing = [];
  /** @type {Record<string, string>} */
  const validated = {};

  for (const key of requiredKeys) {
    const value = env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    } else {
      validated[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(`[Env Config Error] Missing required environment variables: ${missing.join(', ')}`);
  }

  return validated;
}

module.exports = {
  validateEnv,
};
