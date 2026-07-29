/**
 * Health module controller.
 *
 * /healthz — liveness probe: always 200 if process is running.
 *            Kubernetes uses this to decide whether to restart the pod.
 *
 * /readyz   — readiness probe: checks that dependencies are reachable.
 *             Kubernetes uses this to decide whether to send traffic.
 *             Returns 503 if any critical dependency (Redis) is unavailable.
 */
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
   * Readiness probe — checks live dependency connections.
   * Currently verifies the environment is correctly configured.
   * When Redis is wired in Phase 4, this will ping the Redis connection.
   * @param {any} _req
   * @param {any} res
   */
  readiness(_req, res) {
    const checks = {
      env: Boolean(process.env.IDENTITY_JWKS_URL && process.env.PAGINATION_SECRET),
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
