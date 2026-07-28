/**
 * @typedef {Object} UserRecord
 * @property {string} id
 * @property {string} email
 * @property {string} username
 * @property {string} passwordHash
 * @property {string[]} roles
 * @property {string} [tenantId]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

class UserStore {
  /** @type {Map<string, UserRecord>} */
  #usersById = new Map();
  /** @type {Map<string, string>} */
  #emailIndex = new Map();
  /** @type {Map<string, string>} */
  #usernameIndex = new Map();

  /**
   * Creates and registers a new user in the store.
   * Enforces uniqueness on email and username.
   * @param {Object} input
   * @param {string} input.email
   * @param {string} input.username
   * @param {string} input.passwordHash
   * @param {string[]} [input.roles]
   * @param {string} [input.tenantId]
   * @returns {UserRecord}
   */
  createUser({ email, username, passwordHash, roles = ['MEMBER'], tenantId }) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    if (this.#emailIndex.has(normalizedEmail)) {
      throw new Error(`User with email "${normalizedEmail}" already exists.`);
    }
    if (this.#usernameIndex.has(normalizedUsername)) {
      throw new Error(`User with username "${normalizedUsername}" already exists.`);
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    /** @type {UserRecord} */
    const user = {
      id,
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      roles,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.#usersById.set(id, user);
    this.#emailIndex.set(normalizedEmail, id);
    this.#usernameIndex.set(normalizedUsername, id);

    return user;
  }

  /**
   * Finds a user by ID.
   * @param {string} id
   * @returns {UserRecord | null}
   */
  findById(id) {
    return this.#usersById.get(id) || null;
  }

  /**
   * Finds a user by email (case-insensitive).
   * @param {string} email
   * @returns {UserRecord | null}
   */
  findByEmail(email) {
    const id = this.#emailIndex.get(email.toLowerCase().trim());
    return id ? this.findById(id) : null;
  }

  /**
   * Finds a user by username.
   * @param {string} username
   * @returns {UserRecord | null}
   */
  findByUsername(username) {
    const id = this.#usernameIndex.get(username.trim());
    return id ? this.findById(id) : null;
  }

  /**
   * Resets all user state (useful for test resets).
   */
  reset() {
    this.#usersById.clear();
    this.#emailIndex.clear();
    this.#usernameIndex.clear();
  }
}

module.exports = {
  UserStore,
};
