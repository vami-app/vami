import { describe, it, expect } from "vitest";

/**
 * Pure arithmetic verification of engagement-weighted payout formula math
 * Writer Share = (Writer Eligible Seconds / Platform Eligible Seconds) * Subscriber Pool
 */
function calculatePayoutShare(writerSeconds, totalPlatformSeconds, poolCents) {
  if (totalPlatformSeconds <= 0) return 0;
  const ratio = writerSeconds / totalPlatformSeconds;
  return Math.round(ratio * poolCents);
}

describe("Writer Payout Formula Arithmetic (Unit)", () => {
  it("calculates correct proportional payout split for 70/30 read-time distribution", () => {
    const totalPoolCents = 100000; // $1,000.00
    const writerA_Seconds = 700;
    const writerB_Seconds = 300;
    const platformTotalSeconds = writerA_Seconds + writerB_Seconds;

    const payoutA = calculatePayoutShare(writerA_Seconds, platformTotalSeconds, totalPoolCents);
    const payoutB = calculatePayoutShare(writerB_Seconds, platformTotalSeconds, totalPoolCents);

    expect(payoutA).toBe(70000); // $700.00
    expect(payoutB).toBe(30000); // $300.00
    expect(payoutA + payoutB).toBe(totalPoolCents);
  });

  it("returns 0 payout when platform total seconds is zero or writer has zero reads", () => {
    expect(calculatePayoutShare(0, 1000, 50000)).toBe(0);
    expect(calculatePayoutShare(500, 0, 50000)).toBe(0);
  });
});
