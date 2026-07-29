/**
 * Pure domain template engine for notification body/subject rendering.
 * Performs safe variable interpolation without dangerous string evaluation.
 *
 * @param {string} templateStr
 * @param {Record<string, any>} variables
 * @returns {string}
 */
function renderTemplate(templateStr, variables = {}) {
  if (typeof templateStr !== 'string') return '';

  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const value = getNestedValue(variables, key);
    if (value === undefined || value === null) return '';
    return sanitizeHtml(String(value));
  });
}

/**
 * Safely resolves dot-notated nested property keys.
 * @param {Record<string, any>} obj
 * @param {string} path
 * @returns {any}
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

/**
 * Basic HTML entity sanitization.
 * @param {string} str
 * @returns {string}
 */
function sanitizeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  renderTemplate,
  sanitizeHtml,
};
