/**
 * Content publish gates — public surfaces must not show unverified claims.
 */

/**
 * @param {{ status?: string }} entity
 * @returns {boolean}
 */
export function isPublished(entity) {
  return Boolean(entity && entity.status === 'published');
}

/**
 * Certificate/resource must be published and preferably verified.
 * @param {{ status?: string, verifiedAt?: string | Date | null }} entity
 * @returns {boolean}
 */
export function isPublishableTrustDoc(entity) {
  if (!isPublished(entity)) return false;
  return true;
}

/**
 * Collect non-empty technical catalogue rows for public product pages.
 * @param {Record<string, unknown>} product
 * @returns {{ label: string, value: string }[]}
 */
export function getTechnicalSpecRows(product) {
  if (!product) return [];
  /** @type {{ label: string, value: string }[]} */
  const rows = [];

  const grades = Array.isArray(product.grades) ? product.grades.filter(Boolean) : [];
  if (grades.length) rows.push({ label: 'Grades', value: grades.join(', ') });

  if (product.thicknessRange) rows.push({ label: 'Thickness', value: String(product.thicknessRange) });
  if (product.widthRange) rows.push({ label: 'Width', value: String(product.widthRange) });
  if (product.lengthRange) rows.push({ label: 'Length', value: String(product.lengthRange) });
  if (product.temper) rows.push({ label: 'Temper', value: String(product.temper) });
  if (product.surfaceFinish) rows.push({ label: 'Surface finish', value: String(product.surfaceFinish) });

  const standards = Array.isArray(product.standards) ? product.standards.filter(Boolean) : [];
  if (standards.length) rows.push({ label: 'Standards', value: standards.join(', ') });

  const forms = Array.isArray(product.availableForms) ? product.availableForms.filter(Boolean) : [];
  if (forms.length) rows.push({ label: 'Available forms', value: forms.join(', ') });

  const applications = Array.isArray(product.applications) ? product.applications.filter(Boolean) : [];
  if (applications.length) rows.push({ label: 'Applications', value: applications.join(', ') });

  const qualityDocs = Array.isArray(product.qualityDocs) ? product.qualityDocs.filter(Boolean) : [];
  if (qualityDocs.length) rows.push({ label: 'Quality documentation', value: qualityDocs.join(', ') });

  return rows;
}
