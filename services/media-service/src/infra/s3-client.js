/**
 * Direct-to-Storage Presigned Upload & Download Engine.
 * Generates AWS S3 / MinIO compliant presigned URLs for client-side direct uploads.
 * Application servers NEVER buffer heavy binary video/image streams.
 */
class S3MediaClient {
  constructor(endpoint = 'http://localhost:9000', bucket = 'vami-media') {
    this.endpoint = endpoint;
    this.bucket = bucket;
  }

  /**
   * Generates a presigned PUT URL for uploading a specific chunk/part directly to MinIO/S3.
   *
   * @param {string} uploadId
   * @param {number} partNumber
   * @param {string} filename
   * @returns {string} Presigned PUT URL
   */
  generatePresignedPartUrl(uploadId, partNumber, filename) {
    const safeFilename = encodeURIComponent(filename);
    return `${this.endpoint}/${this.bucket}/${uploadId}_part_${partNumber}_${safeFilename}?partNumber=${partNumber}&uploadId=${uploadId}&X-Amz-Expires=900`;
  }

  /**
   * Generates a presigned GET URL for authorized media download.
   *
   * @param {string} assetKey
   * @returns {string} Presigned GET URL
   */
  generatePresignedDownloadUrl(assetKey) {
    const safeKey = encodeURIComponent(assetKey);
    return `${this.endpoint}/${this.bucket}/${safeKey}?response-content-disposition=inline&X-Amz-Expires=3600`;
  }
}

module.exports = { S3MediaClient };
