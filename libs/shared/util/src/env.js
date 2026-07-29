/**
 * @typedef {'string' | 'number' | 'boolean' | 'url'} EnvType
 */

/**
 * @typedef {Object} EnvSpec
 * @property {EnvType} [type='string']
 * @property {boolean} [required=true]
 * @property {string|number|boolean} [default]
 * @property {(value: any) => boolean} [validator]
 * @property {string} [description]
 */

/**
 * @typedef {Record<string, EnvSpec | EnvType>} EnvSchema
 */

/**
 * Validates process environment variables against a declarative schema contract.
 * Fails fast with aggregated, readable errors if any required key is missing or malformed.
 *
 * @param {EnvSchema} schema
 * @param {Record<string, string | undefined>} [env=process.env]
 * @returns {Record<string, any>}
 */
function validateEnv(schema, env = process.env) {
  const errors = [];
  /** @type {Record<string, any>} */
  const validated = {};

  for (const [key, specOrType] of Object.entries(schema)) {
    /** @type {EnvSpec} */
    const spec = typeof specOrType === 'string'
      ? { type: /** @type {EnvType} */ (specOrType), required: true }
      : { type: 'string', required: true, ...specOrType };

    const rawValue = env[key];
    const hasValue = rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '';

    if (!hasValue) {
      if (spec.required && spec.default === undefined) {
        errors.push(`Missing required environment variable: "${key}"${spec.description ? ` (${spec.description})` : ''}`);
        continue;
      }
      if (spec.default !== undefined) {
        validated[key] = spec.default;
        continue;
      }
      validated[key] = undefined;
      continue;
    }

    const valueStr = String(rawValue).trim();
    let parsedValue = /** @type {any} */ (valueStr);

    switch (spec.type) {
      case 'number': {
        const num = Number(valueStr);
        if (Number.isNaN(num)) {
          errors.push(`Environment variable "${key}" must be a valid number, got "${valueStr}"`);
        } else {
          parsedValue = num;
        }
        break;
      }
      case 'boolean': {
        const lower = valueStr.toLowerCase();
        if (lower === 'true' || lower === '1') {
          parsedValue = true;
        } else if (lower === 'false' || lower === '0') {
          parsedValue = false;
        } else {
          errors.push(`Environment variable "${key}" must be a boolean (true/false/1/0), got "${valueStr}"`);
        }
        break;
      }
      case 'url': {
        try {
          new URL(valueStr);
          parsedValue = valueStr;
        } catch {
          errors.push(`Environment variable "${key}" must be a valid URL, got "${valueStr}"`);
        }
        break;
      }
      case 'string':
      default:
        parsedValue = valueStr;
        break;
    }

    if (spec.validator && typeof spec.validator === 'function') {
      try {
        if (!spec.validator(parsedValue)) {
          errors.push(`Environment variable "${key}" failed custom validation check`);
        }
      } catch (err) {
        errors.push(`Environment variable "${key}" validation threw error: ${/** @type {Error} */ (err).message}`);
      }
    }

    validated[key] = parsedValue;
  }

  if (errors.length > 0) {
    const header = `\n=========================================================\n❌ [CRITICAL] ENVIRONMENT CONFIGURATION BOOT FAILURE\n=========================================================`;
    const details = errors.map((e) => `  • ${e}`).join('\n');
    const footer = `\n=========================================================\n`;
    throw new Error(`${header}\n${details}${footer}`);
  }

  return Object.freeze(validated);
}

module.exports = {
  validateEnv,
};

