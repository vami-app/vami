/**
 * @typedef {'PENDING' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED'} AssetStatus
 */

/**
 * @typedef {Object} MediaAsset
 * @property {string} uploadId
 * @property {string} ownerId
 * @property {string} filename
 * @property {string} mimeType
 * @property {number} sizeBytes
 * @property {number} totalParts
 * @property {number} uploadedParts
 * @property {AssetStatus} status
 * @property {number} createdAt
 * @property {string} [downloadUrl]
 */

class MediaAssetStore {
  /** @type {Map<string, MediaAsset>} */
  #assets = new Map();

  /**
   * Initializes a new multipart upload session.
   * @param {Omit<MediaAsset, 'uploadId' | 'uploadedParts' | 'status' | 'createdAt'>} payload
   * @returns {Promise<MediaAsset>}
   */
  async initiateUpload(payload) {
    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    /** @type {MediaAsset} */
    const record = {
      uploadId,
      ownerId: payload.ownerId,
      filename: payload.filename,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      totalParts: payload.totalParts || 1,
      uploadedParts: 0,
      status: 'UPLOADING',
      createdAt: Date.now(),
    };
    this.#assets.set(uploadId, record);
    return record;
  }

  /**
   * Completes a multipart upload and transitions asset status to PROCESSING/READY.
   * @param {string} uploadId
   * @param {string} downloadUrl
   * @returns {Promise<MediaAsset | null>}
   */
  async completeUpload(uploadId, downloadUrl) {
    const record = this.#assets.get(uploadId);
    if (!record) return null;

    record.status = 'READY';
    record.uploadedParts = record.totalParts;
    record.downloadUrl = downloadUrl;
    this.#assets.set(uploadId, record);
    return record;
  }

  /**
   * Retrieves media asset metadata by uploadId.
   * @param {string} uploadId
   * @returns {Promise<MediaAsset | null>}
   */
  async getById(uploadId) {
    return this.#assets.get(uploadId) || null;
  }
}

module.exports = { MediaAssetStore };
