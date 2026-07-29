const Redis = /** @type {any} */ (require('ioredis'));

/**
 * Health module controller.
 *
 * /healthz — liveness probe: always 200 if process is running.
 *            Kubernetes uses this to decide whether to restart the pod.
 *
 * /readyz   — readiness probe: checks that ALL critical dependencies are reachable.
 *             Returns 503 if any dependency (env config, Redis) is unavailable.
 *             Kubernetes uses this to decide whether to send traffic.
 *
 * Google SRE Book: readiness probes must reflect the pod's ability to serve
 * real traffic — not just "is the process alive?". A pod with a broken Redis
 * connection cannot serve rate-limited or session-dependent requests correctly.
 */

/**
 * Lazily-created Redis client used only for health checks.
 * Does NOT affect rate-limit or session Redis clients.
 * @type {any}
 */
let _healthRedis = null;

function getHealthRedis() {
  if (_healthRedis && _healthRedis.status !== 'end') return _healthRedis;
  _healthRedis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000, // 2s — readiness probe must respond quickly
  });
  _healthRedis.on('error', () => { /* handled per-ping in readiness */ });
  _healthRedis.connect().catch(() => {});
  return _healthRedis;
}

const healthController = {
  /**
   * GET /healthz
   * Liveness probe — always 200 if the server can handle requests.
   * @param {any} _req
   * @param {any} res
   */
  liveness(_req, res) {
    res.status(200).json({
      status: 'ok',
      service: 'product-a-api',
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * GET /readyz
   * Readiness probe — actively checks all critical dependencies.
   * Returns 200 only if environment is configured AND Redis is reachable.
   * @param {any} _req
   * @param {any} res
   */
  async readiness(_req, res) {
    const envOk = Boolean(process.env.IDENTITY_JWKS_URL && process.env.PAGINATION_SECRET);

    let redisOk = false;
    try {
      const client = getHealthRedis();
      const pong = await client.ping();
      redisOk = pong === 'PONG';
    } catch {
      redisOk = false;
    }

    const checks = {
      env: envOk,
      redis: redisOk,
    };

    const allReady = Object.values(checks).every(Boolean);

    res.status(allReady ? 200 : 503).json({
      status: allReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  },
};

module.exports = { healthController };

