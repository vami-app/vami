import { Resend } from 'resend';
import { env } from '@/env.mjs';
import { logger } from '@/lib/logger';

/**
 * @returns {Resend | null}
 */
function getClient() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

/**
 * @returns {{ ready: boolean, reason?: string }}
 */
export function getEmailStatus() {
  if (!env.RESEND_API_KEY) return { ready: false, reason: 'RESEND_API_KEY missing' };
  if (!env.LEADS_INBOX_EMAIL) return { ready: false, reason: 'LEADS_INBOX_EMAIL missing' };
  if (!env.LEADS_FROM_EMAIL) return { ready: false, reason: 'LEADS_FROM_EMAIL missing' };
  return { ready: true };
}

/**
 * Send transactional email via Resend. Fail closed when misconfigured.
 * @param {{ to?: string | string[], subject: string, html: string, replyTo?: string, text?: string }} opts
 */
export async function sendEmail({ to, subject, html, replyTo, text }) {
  const status = getEmailStatus();
  if (!status.ready) {
    logger.warn('Email send skipped — not configured', { domain: 'email', reason: status.reason });
    return { ok: false, skipped: true, reason: status.reason };
  }

  const client = getClient();
  if (!client) {
    return { ok: false, skipped: true, reason: 'RESEND_API_KEY missing' };
  }

  const { data, error } = await client.emails.send({
    from: env.LEADS_FROM_EMAIL,
    to: to || env.LEADS_INBOX_EMAIL,
    subject,
    html,
    text,
    replyTo,
  });

  if (error) {
    logger.error('Resend send failed', { domain: 'email', message: error.message });
    return { ok: false, skipped: false, error };
  }

  return { ok: true, id: data?.id };
}
