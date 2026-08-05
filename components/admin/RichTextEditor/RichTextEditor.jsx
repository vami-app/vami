/**
 * components/admin/RichTextEditor/RichTextEditor.jsx
 *
 * SSR guard compositor — the only export from this organism.
 *
 * Architecture:
 * - Lexical reads browser APIs (window.getSelection, contentEditable, Selection)
 *   on mount. Rendering on the server causes hydration mismatches.
 * - next/dynamic with ssr:false defers the entire editor bundle to the client.
 * - The server renders a visual skeleton matching the editor dimensions,
 *   preventing CLS (Cumulative Layout Shift) during hydration.
 * - All props are forwarded transparently to LexicalEditor.
 *
 * Usage:
 *   import { RichTextEditor } from '@/components/admin/RichTextEditor';
 *
 *   <RichTextEditor
 *     initialState={post.content.lexicalState}  // JSON from MongoDB
 *     onChange={handleEditorChange}             // receives { json, html }
 *     placeholder="Write your post..."
 *   />
 */
import dynamic from 'next/dynamic';

const LexicalEditor = dynamic(
  () => import('./LexicalEditor').then((mod) => mod.LexicalEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="editor-skeleton"
        role="status"
        aria-label="Loading editor..."
        aria-busy="true"
        aria-live="polite"
      >
        <div className="editor-skeleton-toolbar" aria-hidden="true" />
        <div className="editor-skeleton-body" aria-hidden="true" />
      </div>
    ),
  }
);

export function RichTextEditor(props) {
  return <LexicalEditor {...props} />;
}
