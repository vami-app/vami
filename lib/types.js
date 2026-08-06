/**
 * Global Type Definitions
 * Used across the application for JSDoc type checking.
 */

/**
 * @typedef {Object} Category
 * @property {string} _id
 * @property {string} name
 * @property {string} slug
 * @property {string} [description]
 * @property {string} [image]
 */

/**
 * @typedef {Object} Product
 * @property {string} _id
 * @property {string} name
 * @property {string} slug
 * @property {Category|string} category
 * @property {string} [description]
 * @property {string[]} [images]
 * @property {boolean} [featured]
 * @property {string} [status]
 */

/**
 * @typedef {Object} BlogPost
 * @property {string} _id
 * @property {string} title
 * @property {string} slug
 * @property {string} [excerpt]
 * @property {string} content
 * @property {string} [coverImage]
 * @property {string} [status]
 */

/**
 * @typedef {Object} AdminPermission
 * @property {string} role
 * @property {string[]} permissions
 */

export {};
