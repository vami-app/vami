/**
 * Pure domain preference engine.
 * Determines if a notification should be delivered over a given channel
 * based on user opt-in settings and transactional override rules.
 *
 * @param {{
 *   channel: 'email' | 'in-app' | 'sms' | 'push',
 *   category: 'transactional' | 'marketing' | 'system',
 *   userPreferences?: Record<string, boolean>
 * }} input
 * @returns {{ allowed: boolean, reason: string }}
 */
function shouldDeliver({ channel, category, userPreferences = {} }) {
  // Security and transactional notifications bypass user opt-outs (Uber/Slack standard)
  if (category === 'transactional') {
    return { allowed: true, reason: 'Transactional category bypasses preference filter' };
  }

  const preferenceKey = `${channel}_enabled`;
  const isEnabled = userPreferences[preferenceKey] !== false; // Default to enabled unless explicitly false

  if (!isEnabled) {
    return { allowed: false, reason: `User opted out of ${channel} notifications` };
  }

  return { allowed: true, reason: `Channel ${channel} permitted` };
}

module.exports = { shouldDeliver };
