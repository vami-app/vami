'use client';

/**
 * components/admin/RichTextEditor/plugins/ImagePlugin.jsx
 *
 * Handles image insertion into the editor and manages the upload flow.
 *
 * Architecture:
 * - Uses the project's EXISTING signed direct-upload pattern (/api/upload/sign).
 *   Files go directly from browser → Cloudinary CDN. This server only signs.
 *   No file data passes through our Next.js server → no Vercel 4.5MB limit.
 *
 * - Two insertion paths:
 *   1. Toolbar button → file picker → upload → insert ImageNode
 *   2. INSERT_IMAGE_COMMAND → insert ImageNode directly (for programmatic use)
 *
 * - ImageNode MUST be registered in editorNodes.js before this plugin mounts.
 *   This plugin checks at mount time and throws a clear error if it's missing.
 *
 * - Upload state (progress, error) is local to this plugin — does not propagate
 *   to the form or cause form re-renders.
 *
 * Security:
 * - File type validated client-side before upload (defense-in-depth)
 * - File type enforced server-side by /api/upload/sign (allowed_formats param)
 * - Only HTTPS Cloudinary URLs inserted into editor state (validated in ImageNode.importDOM)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { $createImageNode, ImageNode } from '../nodes/ImageNode';

// ── Command ────────────────────────────────────────────────────────────────────

/**
 * Dispatched to insert a pre-uploaded image into the editor state.
 *
 * @example
 * editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
 *   src: 'https://res.cloudinary.com/...',
 *   altText: 'Description',
 *   width: 'auto',
 *   height: 'auto',
 * });
 */
export const INSERT_IMAGE_COMMAND = createCommand('INSERT_IMAGE_COMMAND');

// ── Constants ──────────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ── Plugin ─────────────────────────────────────────────────────────────────────

/**
 * @param {{ showButton?: boolean }} props
 * showButton: if true, renders a toolbar-compatible "Insert Image" button.
 *             Set false if you manage the button yourself in ToolbarPlugin.
 */
export function ImagePlugin({ showButton = false }) {
  const [editor] = useLexicalComposerContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Registration ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error(
        '[ImagePlugin] ImageNode is not registered in editorNodes.js. ' +
        'Add ImageNode to the editorNodes array before using ImagePlugin.'
      );
    }

    // Register the INSERT_IMAGE_COMMAND handler
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const { src, altText, width, height, caption } = payload;
        const imageNode = $createImageNode({ src, altText, width, height, caption });
        $insertNodeToNearestRoot(imageNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  // ── Upload pipeline (signed direct-to-Cloudinary) ────────────────────────

  const uploadFile = useCallback(async (file) => {
    // Client-side validation (defense-in-depth)
    if (!ALLOWED_MIME.has(file.type)) {
      setUploadError('Unsupported file type. Use JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Step 1: Get upload signature from our server (no file data sent here)
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'blog' }),
      });

      if (!signRes.ok) {
        const err = await signRes.json();
        throw new Error(err.error || 'Failed to get upload signature');
      }

      const { signature, timestamp, cloudName, apiKey, folder, allowed_formats, format, quality } =
        await signRes.json();

      // Step 2: Upload directly to Cloudinary CDN (file never touches our server)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      formData.append('allowed_formats', allowed_formats);
      formData.append('format', format);
      formData.append('quality', quality);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error?.message || 'Cloudinary upload failed');
      }

      const data = await uploadRes.json();

      // Step 3: Insert ImageNode into Lexical state with the CDN URL
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: data.secure_url,          // HTTPS Cloudinary URL
        altText: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        width: data.width ? `${Math.min(data.width, 800)}px` : 'auto',
        height: 'auto',
        caption: '',
      });
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
      console.error('[ImagePlugin] Upload error:', err);
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden file input — triggered by the toolbar button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="editor-image-file-input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Optional inline button (for use outside ToolbarPlugin) */}
      {showButton && (
        <button
          id="editor-btn-insert-image"
          type="button"
          onClick={openFilePicker}
          disabled={isUploading}
          aria-label="Insert image"
          title="Insert image"
          className="editor-toolbar-btn"
        >
          {isUploading ? '⏳' : '🖼️'}
        </button>
      )}

      {/* Upload error toast */}
      {uploadError && (
        <div
          role="alert"
          aria-live="assertive"
          className="editor-image-upload-error"
          onClick={() => setUploadError(null)}
        >
          {uploadError}
        </div>
      )}
    </>
  );
}

/**
 * Exported so ToolbarPlugin can trigger the file picker without
 * duplicating the upload logic.
 *
 * Usage in ToolbarPlugin:
 *   const imagePluginRef = useRef(null);
 *   <ImagePlugin ref={imagePluginRef} />
 *   <button onClick={() => imagePluginRef.current?.openFilePicker()} />
 *
 * Or simply use the INSERT_IMAGE_COMMAND with pre-uploaded URL.
 */
