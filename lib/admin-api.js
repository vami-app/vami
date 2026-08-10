/**
 * Shared helpers for admin client pages.
 */

export function formatApiError(data, fallback = 'Request failed') {
  if (!data) return fallback;
  if (Array.isArray(data.details) && data.details.length > 0) {
    return data.details
      .map((d) => (typeof d === 'string' ? d : d.message || d.field))
      .filter(Boolean)
      .join(' · ');
  }
  return data.error || fallback;
}

export function docId(doc) {
  if (!doc) return '';
  return String(doc._id ?? doc.id ?? '');
}

/**
 * Upload a file via the leads attachments endpoint (base64 JSON body).
 * @returns {Promise<string>} public URL
 */
export function uploadAdminFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = async () => {
      try {
        const res = await fetch('/api/leads/attachments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, filename: file.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(formatApiError(data, 'Upload failed'));
        if (!data.url) throw new Error('Upload returned no URL');
        resolve(data.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(file);
  });
}
