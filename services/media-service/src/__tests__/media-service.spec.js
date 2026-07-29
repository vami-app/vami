import { describe, it, expect } from 'vitest';
const { S3MediaClient } = require('../infra/s3-client');
const { MediaAssetStore } = require('../store/media-store');

describe('media-service — Unit Tests', () => {
  it('s3 client generates presigned part and download URLs', () => {
    const client = new S3MediaClient('http://localhost:9000', 'vami-media');
    const partUrl = client.generatePresignedPartUrl('upl_123', 1, 'avatar.png');
    const downloadUrl = client.generatePresignedDownloadUrl('upl_123');

    expect(partUrl).toContain('http://localhost:9000/vami-media/upl_123_part_1_avatar.png');
    expect(partUrl).toContain('uploadId=upl_123');
    expect(downloadUrl).toContain('http://localhost:9000/vami-media/upl_123');
  });

  it('media store manages asset upload lifecycle', async () => {
    const store = new MediaAssetStore();
    const asset = await store.initiateUpload({
      ownerId: 'u1',
      filename: 'video.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 10485760,
      totalParts: 2,
    });

    expect(asset.uploadId).toBeDefined();
    expect(asset.status).toBe('UPLOADING');

    const completed = await store.completeUpload(asset.uploadId, 'http://localhost:9000/vami-media/video.mp4');
    expect(completed.status).toBe('READY');
    expect(completed.downloadUrl).toBe('http://localhost:9000/vami-media/video.mp4');
  });
});
