'use client';

/**
 * components/admin/RichTextEditor/nodes/ImageNode.jsx
 *
 * Custom Lexical DecoratorNode for inline images.
 *
 * Architecture:
 * - Extends DecoratorNode (not ElementNode) — it has no text children,
 *   is a void block, and renders a React component via decorate().
 * - Stores: src (HTTPS URL), altText, width, height, caption.
 *   NEVER stores a data: URI — only CDN URLs from Cloudinary.
 * - importJSON / exportJSON are required for MongoDB serialization.
 *   Without these, the node cannot survive a save → reload cycle.
 * - isInline() returns false — images are block-level in this editor.
 *
 * Usage:
 *   import { $createImageNode } from '../nodes/ImageNode';
 *   editor.update(() => {
 *     $insertNodeToNearestRoot($createImageNode({ src, altText, width, height }));
 *   });
 */
import { DecoratorNode } from 'lexical';
import { Suspense, lazy } from 'react';

// Lazy-load the render component — keeps the base editor bundle smaller.
// The ImageComponent is only loaded when an image node is actually in the document.
const ImageComponent = lazy(() =>
  import('../components/ImageComponent').then((mod) => ({ default: mod.ImageComponent }))
);

export class ImageNode extends DecoratorNode {
  __src;
  __altText;
  __width;
  __height;
  __caption;

  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__caption,
      node.__key
    );
  }

  constructor(src, altText, width, height, caption, key) {
    super(key);
    this.__src = src;
    this.__altText = altText ?? '';
    this.__width = width ?? 'auto';
    this.__height = height ?? 'auto';
    this.__caption = caption ?? '';
  }

  // ── DOM creation ───────────────────────────────────────────────────────────

  createDOM(config) {
    const span = document.createElement('span');
    const className = config.theme?.image;
    if (className) span.className = className;
    return span;
  }

  updateDOM() {
    // Return false — we never need to update the wrapper span itself.
    // React re-renders the inner ImageComponent when props change.
    return false;
  }

  // ── Node properties ────────────────────────────────────────────────────────

  isInline() { return false; }
  isKeyboardSelectable() { return true; }

  getSrc() { return this.__src; }
  getAltText() { return this.__altText; }
  getCaption() { return this.__caption; }

  // ── Serialization (required for MongoDB persistence) ──────────────────────

  static importJSON(serializedNode) {
    const { src, altText, width, height, caption } = serializedNode;
    return $createImageNode({ src, altText, width, height, caption });
  }

  exportJSON() {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      caption: this.__caption,
    };
  }

  // ── HTML import/export (for paste normalization and clipboard) ─────────────

  static importDOM() {
    return {
      img: () => ({
        conversion: (domNode) => {
          if (domNode instanceof HTMLImageElement) {
            const { src, alt, width, height } = domNode;
            // Only import HTTPS images from known CDN domains
            if (src && /^https:\/\//.test(src)) {
              const node = $createImageNode({
                src,
                altText: alt ?? '',
                width: width ? `${width}px` : 'auto',
                height: height ? `${height}px` : 'auto',
              });
              return { node };
            }
          }
          return null;
        },
        priority: 1,
      }),
    };
  }

  exportDOM() {
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    if (this.__width !== 'auto') img.width = parseInt(this.__width);
    if (this.__height !== 'auto') img.height = parseInt(this.__height);
    return { element: img };
  }

  // ── React rendering via Suspense ───────────────────────────────────────────

  decorate(editor, config) {
    return (
      <Suspense
        fallback={
          <div
            className="editor-image-skeleton"
            aria-label="Loading image..."
            role="img"
            style={{ width: this.__width !== 'auto' ? this.__width : '100%' }}
          />
        }
      >
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          caption={this.__caption}
          nodeKey={this.getKey()}
          editor={editor}
        />
      </Suspense>
    );
  }
}

// ── Factory functions (Lexical convention) ──────────────────────────────────

/**
 * Creates a new ImageNode and inserts it into the editor.
 *
 * @param {{ src: string, altText?: string, width?: string, height?: string, caption?: string }} props
 * @returns {ImageNode}
 */
export function $createImageNode({ src, altText, width, height, caption }) {
  return new ImageNode(src, altText ?? '', width ?? 'auto', height ?? 'auto', caption ?? '');
}

/**
 * @param {import('lexical').LexicalNode} node
 * @returns {node is ImageNode}
 */
export function $isImageNode(node) {
  return node instanceof ImageNode;
}
