'use client';

/**
 * components/admin/RichTextEditor/LexicalEditor.jsx
 *
 * The core Lexical editor component. This is the single 'use client' boundary
 * for the entire editor system. Everything below this line runs in the browser.
 *
 * Architecture constraints:
 * - This component MUST remain a 'use client' leaf. Do not render server
 *   components inside this component or import server-only modules here.
 * - initialState is a serialized Lexical JSON STRING from the parent server
 *   component (fetched from MongoDB). Never fetch data inside this component.
 * - onChange is called with { json, html } on every substantive change.
 *   The parent is responsible for debouncing before API calls.
 * - readOnly=true renders a non-editable display — but prefer RichTextRenderer
 *   (Server Component) for public-facing content, which ships zero editor JS.
 *
 * Plugins are registered here. Each plugin is a React component that accesses
 * the editor via useLexicalComposerContext(). Adding a feature = adding a plugin.
 *
 * @param {string|null} initialState - JSON string from MongoDB content.lexicalState
 * @param {function} [onChange] - receives { json: object, html: string }
 * @param {boolean} [readOnly=false]
 * @param {string} [placeholder='Start writing...']
 */
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';

import { editorTheme } from './config/editorTheme';
import { editorNodes } from './config/editorNodes';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { LinkPlugin } from './plugins/LinkPlugin';
import { OnChangePlugin } from './plugins/OnChangePlugin';
import { PasteNormalizerPlugin } from './plugins/PasteNormalizerPlugin';
import './RichTextEditor.css';

export function LexicalEditor({
  initialState = null,
  onChange,
  readOnly = false,
  placeholder = 'Start writing...',
}) {
  const initialConfig = {
    namespace: 'vami-editor',
    theme: editorTheme,
    nodes: editorNodes,
    editable: !readOnly,
    onError(error) {
      // Route to structured logger / Sentry in production
      console.error('[LexicalEditor] Unhandled editor error:', error);
    },
    // Hydrate from saved JSON state if provided, otherwise start with empty doc
    ...(initialState
      ? { editorState: initialState }
      : {}),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className="editor-container"
        data-editor-readonly={readOnly}
        data-testid="lexical-editor"
      >
        {/* Toolbar — only show in editable mode */}
        {!readOnly && <ToolbarPlugin />}

        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-content-editable"
                aria-label="Content editor"
                aria-multiline="true"
                role="textbox"
                spellCheck
                data-testid="editor-content"
              />
            }
            placeholder={
              <div className="editor-placeholder" aria-hidden="true">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          {/* ── Plugins ─────────────────────────────────────────────────── */}

          {/* Undo/redo stack — 300ms merge delay batches rapid keystrokes */}
          <HistoryPlugin delay={300} />

          {/* Ordered and unordered lists */}
          <ListPlugin />

          {/* Link creation with URL validation */}
          <LinkPlugin />

          {/* Paste normalization — DOMPurify + schema normalization */}
          <PasteNormalizerPlugin />

          {/* Serialization bridge — only mounted when a change handler is provided */}
          {onChange && (
            <OnChangePlugin onChange={onChange} ignoreInitialChange />
          )}
        </div>
      </div>
    </LexicalComposer>
  );
}
