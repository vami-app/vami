const crypto = require('crypto');
const jose = require('jose');

class KeyManager {
  /** @type {any} */
  #privateKey = null;
  /** @type {any} */
  #publicKey = null;
  /** @type {any} */
  #jwks = null;

  /**
   * Initializes the RSA keypair.
   * Reads PEM from process.env if provided; otherwise generates an in-memory
   * 2048-bit RSA pair for zero-config local development and testing.
   */
  async initialize() {
    if (process.env.RSA_PRIVATE_KEY_PEM && process.env.RSA_PUBLIC_KEY_PEM) {
      this.#privateKey = crypto.createPrivateKey(process.env.RSA_PRIVATE_KEY_PEM);
      this.#publicKey = crypto.createPublicKey(process.env.RSA_PUBLIC_KEY_PEM);
    } else {
      // Auto-generate 2048-bit RSA key pair for dev/test environments
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.#privateKey = crypto.createPrivateKey(privateKey);
      this.#publicKey = crypto.createPublicKey(publicKey);
    }

    // Pre-calculate JWKS representation
    const publicJwk = await jose.exportJWK(this.#publicKey);
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';
    publicJwk.kid = publicJwk.kid || 'vami-key-1';

    this.#jwks = {
      keys: [publicJwk],
    };
  }

  /**
   * Returns the private KeyObject for signing tokens.
   * @returns {any}
   */
  getPrivateKey() {
    if (!this.#privateKey) {
      throw new Error('KeyManager is not initialized. Call initialize() first.');
    }
    return this.#privateKey;
  }

  /**
   * Returns the public KeyObject for verifying tokens.
   * @returns {any}
   */
  getPublicKey() {
    if (!this.#publicKey) {
      throw new Error('KeyManager is not initialized. Call initialize() first.');
    }
    return this.#publicKey;
  }

  /**
   * Returns the JWKS payload for the /.well-known/jwks.json endpoint.
   * @returns {{ keys: any[] }}
   */
  getJWKS() {
    if (!this.#jwks) {
      throw new Error('KeyManager is not initialized. Call initialize() first.');
    }
    return this.#jwks;
  }
}

module.exports = {
  KeyManager,
};
