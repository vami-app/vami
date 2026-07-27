"use strict";

/**
 * Finalization sweep job for expiring HELD action dispute windows.
 */
class FinalizationJob {
  constructor(disputeService) {
    this.service = disputeService;
  }

  async runSweep(now = new Date()) {
    console.log(`[finalization.job] Running finalization sweep for expired dispute windows at ${now.toISOString()}...`);
    const result = await this.service.sweepFinalizationJob(now);
    console.log(`[finalization.job] Swept ${result.finalizedCount} expired dispute windows.`);
    return result;
  }
}

module.exports = FinalizationJob;
