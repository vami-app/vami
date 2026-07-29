const express = require('express');
const { S3MediaClient } = require('./infra/s3-client');
const { MediaAssetStore } = require('./store/media-store');
const { BadRequestError, NotFoundError } = require('@vami/util');

function createMediaRoutes() {
  const router = express.Router();
  const s3Client = new S3MediaClient();
  const mediaStore = new MediaAssetStore();

  /**
   * POST /api/v1/media/uploads/initiate
   * Direct-to-Storage Multipart Upload Initiation.
   * Creates asset record and generates presigned PUT URLs for chunk uploads directly to MinIO/S3.
   */
  router.post('/uploads/initiate', async (req, res, next) => {
    try {
      const { filename, mimeType, sizeBytes, totalParts = 1 } = req.body;
      const user = (/** @type {any} */ (req)).user;
      const ownerId = user && user.userId ? user.userId : (req.body.ownerId || 'user_demo');

      if (!filename || !mimeType || !sizeBytes) {
        throw new BadRequestError('Fields filename, mimeType, and sizeBytes are required.');
      }

      const asset = await mediaStore.initiateUpload({
        ownerId,
        filename,
        mimeType,
        sizeBytes,
        totalParts: Number(totalParts),
      });

      // Generate presigned PUT URLs for all parts
      const partUrls = [];
      for (let p = 1; p <= asset.totalParts; p++) {
        partUrls.push({
          partNumber: p,
          url: s3Client.generatePresignedPartUrl(asset.uploadId, p, filename),
        });
      }

      return res.status(201).json({
        uploadId: asset.uploadId,
        filename: asset.filename,
        totalParts: asset.totalParts,
        status: asset.status,
        partUrls,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/media/uploads/:uploadId/complete
   * Finalizes S3 multipart upload and sets status to READY.
   */
  router.post('/uploads/:uploadId/complete', async (req, res, next) => {
    try {
      const { uploadId } = req.params;
      const existing = await mediaStore.getById(uploadId);

      if (!existing) {
        throw new NotFoundError('Upload session not found.');
      }

      const downloadUrl = s3Client.generatePresignedDownloadUrl(uploadId);
      const completed = await mediaStore.completeUpload(uploadId, downloadUrl);

      return res.json({
        status: 'success',
        asset: completed,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/media/assets/:id
   * Retrieves asset metadata.
   */
  router.get('/assets/:id', async (req, res, next) => {
    try {
      const asset = await mediaStore.getById(req.params.id);
      if (!asset) {
        throw new NotFoundError('Media asset not found.');
      }
      return res.json(asset);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/media/assets/:id/download
   * Generates secure time-limited presigned GET URL for media download.
   */
  router.get('/assets/:id/download', async (req, res, next) => {
    try {
      const asset = await mediaStore.getById(req.params.id);
      if (!asset) {
        throw new NotFoundError('Media asset not found.');
      }

      const downloadUrl = s3Client.generatePresignedDownloadUrl(asset.uploadId);
      return res.json({
        uploadId: asset.uploadId,
        filename: asset.filename,
        downloadUrl,
        expiresInSeconds: 3600,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMediaRoutes };
