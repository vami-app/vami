import React, { useState } from 'react';
import { Card, Heading, Text, Badge, Button, Stack } from '@vami/ui';

/**
 * @typedef {Object} MediaAssetItem
 * @property {string} uploadId
 * @property {string} downloadUrl
 */

/**
 * Direct-to-Storage Presigned Media Upload & Download Widget.
 * Initiates multipart presigned upload session with media-service.
 */
export function MediaUploadWidget() {
  const [selectedFile, setSelectedFile] = useState(/** @type {File | null} */ (null));
  const [status, setStatus] = useState('idle'); // idle, initiating, uploaded, complete
  const [uploadResult, setUploadResult] = useState(/** @type {MediaAssetItem | null} */ (null));

  const handleFileSelect = (/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInitiateUpload = async () => {
    if (!selectedFile) return;

    try {
      setStatus('initiating');

      // Step 1: Initiate Multipart Presigned Upload with media-service
      const initRes = await fetch('/api/v1/media/uploads/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          mimeType: selectedFile.type || 'image/png',
          sizeBytes: selectedFile.size,
          totalParts: 1,
        }),
      });

      if (!initRes.ok) throw new Error('Initiation failed');
      const initData = await initRes.json();

      // Step 2: Complete upload session
      const completeRes = await fetch(`/api/v1/media/uploads/${initData.uploadId}/complete`, {
        method: 'POST',
      });

      if (!completeRes.ok) throw new Error('Completion failed');
      const completeData = await completeRes.json();

      setUploadResult(completeData.asset);
      setStatus('complete');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <Card elevation="sm" padding="20px">
      <Stack gap="16px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading level={3}>Direct-to-Storage Media Manager</Heading>
          <Badge variant="brand">S3 / MinIO Protocol</Badge>
        </div>

        <Text size="sm" color="var(--vami-color-text-secondary)">
          Direct chunked upload to object storage without buffering bytes on backend servers.
        </Text>

        <input type="file" onChange={handleFileSelect} id="media-file-input" style={{ fontSize: '14px' }} />

        {selectedFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text size="sm" weight="semibold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</Text>
            <Button onClick={handleInitiateUpload} disabled={status === 'initiating'}>
              {status === 'initiating' ? 'Uploading...' : 'Initiate S3 Direct Upload'}
            </Button>
          </div>
        )}

        {status === 'complete' && uploadResult && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--vami-color-background-subdued)',
              border: '1px solid var(--vami-color-border-subtle)',
            }}
          >
            <Badge variant="success">Upload Complete</Badge>
            <Text size="xs" style={{ marginTop: '8px' }}>Asset ID: {uploadResult.uploadId}</Text>
            <a
              href={uploadResult.downloadUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--vami-color-brand-accent)', fontSize: '13px', display: 'inline-block', marginTop: '4px' }}
            >
              Preview Presigned Download URL →
            </a>
          </div>
        )}
      </Stack>
    </Card>
  );
}
