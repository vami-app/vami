import { createHash } from 'crypto';
import { unstable_after as after } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { serializeDoc, serializeDocs } from '@/lib/serialize';
import { sendEmail } from '@/services/email.service';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';

/** Simple in-memory rate limit (per process). */
const rateBuckets = new Map();

/**
 * @param {string} key
 * @param {number} limit
 * @param {number} windowMs
 */
export function checkRateLimit(key, limit = 8, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const entry = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  rateBuckets.set(key, entry);
  return entry.count <= limit;
}

/**
 * @param {string} ip
 */
export function hashIp(ip) {
  if (!ip) return '';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/**
 * Persist lead first; email asynchronously so inbox outages do not lose RFQs.
 * @param {Record<string, unknown>} payload
 * @param {{ ip?: string }} [meta]
 */
export async function createLead(payload, meta = {}) {
  await dbConnect();

  const lead = await Lead.create({
    ...payload,
    ipHash: hashIp(meta.ip || ''),
    status: 'new',
  });

  const plain = lead.toObject();
  revalidateTag('leads');
  revalidateTag('stats');

  after(async () => {
    try {
      const html = buildLeadEmailHtml(plain);
      const result = await sendEmail({
        subject: `New RFQ — ${plain.company || 'Unknown company'}`,
        html,
        replyTo: plain.email,
      });
      if (!result.ok && !result.skipped) {
        logger.error('Lead email failed after persist', { domain: 'leads', leadId: String(plain._id) });
      }
    } catch (err) {
      logger.error('Lead email after() threw', { domain: 'leads', message: err.message });
    }
  });

  return serializeDoc(plain);
}

export async function listLeadsAdmin({ status, limit = 50 } = {}) {
  await dbConnect();
  const query = {};
  if (status) query.status = status;
  const docs = await Lead.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return serializeDocs(docs);
}

export async function getLeadById(id) {
  await dbConnect();
  const doc = await Lead.findById(id).lean();
  return serializeDoc(doc);
}

export async function updateLead(id, data) {
  await dbConnect();
  const doc = await Lead.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  revalidateTag('leads');
  revalidateTag('stats');
  return serializeDoc(doc);
}

export async function countLeadsByStatus() {
  await dbConnect();
  const [newCount, reviewing, quoted, total] = await Promise.all([
    Lead.countDocuments({ status: 'new' }),
    Lead.countDocuments({ status: 'reviewing' }),
    Lead.countDocuments({ status: 'quoted' }),
    Lead.countDocuments(),
  ]);
  return { newCount, reviewing, quoted, total };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLeadEmailHtml(lead) {
  const rows = [
    ['Company', lead.company],
    ['Name', lead.name],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Country', lead.country],
    ['Product', lead.product],
    ['Category', lead.category],
    ['Material / grade', lead.materialGrade],
    ['Form', lead.formFactor],
    ['Quantity', lead.quantity],
    ['Dimensions', lead.dimensions],
    ['Standard', lead.requiredStandard],
    ['Delivery', lead.deliveryLocation],
    ['Notes', lead.additionalRequirements],
  ];

  const body = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
    .join('');

  const files = (lead.attachments || [])
    .map((a) => `<li><a href="${escapeHtml(a.url)}">${escapeHtml(a.filename || a.url)}</a></li>`)
    .join('');

  return `<h2>New RFQ</h2><table>${body}</table>${files ? `<h3>Attachments</h3><ul>${files}</ul>` : ''}`;
}
