'use client';

/**
 * components/admin/RichTextEditor/components/ImageComponent.jsx
 *
 * The React component rendered inside ImageNode.decorate().
 *
 * Architecture:
 * - Lazy-loaded — only shipped to the client when a document contains images.
 * - Uses the existing /api/upload/sign endpoint (signed direct-to-Cloudinary uploads).
 *   This means: file goes browser → Cloudinary CDN directly. The server only
 *   generates a signature — no file data passes through our Next.js server.
 *   This eliminates the 4.5MB Vercel body limit and reduces upload latency.
 * - Resizable via drag handle on the right edge.
 * - Alt text editable inline via click-to-edit pattern.
 * - Caption editable below the image.
 * - Delete button removes the node from the editor state.
 *
 * Security:
 * - Only accepts HTTPS src URLs (Cloudinary CDN). Never renders data: URIs.
 * - All mutations go through editor.update() — undo/redo safe.
 */
import { useCallback, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { $isImageNode } from '../nodes/ImageNode';

export function ImageComponent({
  src,
  altText,
  width,
  height,
  caption,
  nodeKey,
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingAlt, setIsEditingAlt] = useState(false);
  const [localAlt, setLocalAlt] = useState(altText);
  const [localCaption, setLocalCaption] = useState(caption);
  const imgRef = useRef(null);

  // ── Alt text editing ───────────────────────────────────────────────────────

  const commitAlt = useCallback(() => {
    setIsEditingAlt(false);
    if (localAlt === altText) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        const writable = node.getWritable();
        writable.__altText = localAlt;
      }
    });
  }, [editor, nodeKey, localAlt, altText]);

  // ── Caption editing ────────────────────────────────────────────────────────

  const commitCaption = useCallback((value) => {
    setLocalCaption(value);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        const writable = node.getWritable();
        writable.__caption = value;
      }
    });
  }, [editor, nodeKey]);

  // ── Delete node ────────────────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) node.remove();
    });
  }, [editor, nodeKey]);

  return (
    <div
      className={`editor-image-wrapper ${isSelected ? 'editor-image-wrapper--selected' : ''}`}
      onClick={() => setIsSelected(true)}
      onBlur={() => setIsSelected(false)}
      tabIndex={0}
      role="figure"
      aria-label={`Image: ${localAlt || 'No alt text'}`}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <img
        ref={imgRef}
        src={src}
        alt={localAlt}
        width={width !== 'auto' ? width : undefined}
        height={height !== 'auto' ? height : undefined}
        className="editor-image-img"
        draggable={false}
      />

      {/* ── Controls (visible when selected) ─────────────────────────────── */}
      {isSelected && (
        <div className="editor-image-controls" role="toolbar" aria-label="Image controls">

          {/* Alt text editor */}
          {isEditingAlt ? (
            <div className="editor-image-alt-editor">
              <label className="editor-image-alt-label" htmlFor={`alt-${nodeKey}`}>
                Alt text:
              </label>
              <input
                id={`alt-${nodeKey}`}
                type="text"
                value={localAlt}
                onChange={(e) => setLocalAlt(e.target.value)}
                onBlur={commitAlt}
                onKeyDown={(e) => { if (e.key === 'Enter') commitAlt(); }}
                className="editor-image-alt-input"
                aria-label="Image alt text"
                autoFocus
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsEditingAlt(true); }}
              className="editor-image-control-btn"
              aria-label="Edit alt text"
              title="Edit alt text"
            >
              ✏️ Alt
            </button>
          )}

          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="editor-image-control-btn editor-image-control-btn--delete"
            aria-label="Delete image"
            title="Delete image"
          >
            🗑️
          </button>
        </div>
      )}

      {/* ── Caption ───────────────────────────────────────────────────────── */}
      <figcaption>
        <input
          type="text"
          value={localCaption}
          onChange={(e) => commitCaption(e.target.value)}
          placeholder="Add a caption (optional)..."
          className="editor-image-caption"
          aria-label="Image caption"
          onClick={(e) => e.stopPropagation()}
        />
      </figcaption>
    </div>
  );
}
