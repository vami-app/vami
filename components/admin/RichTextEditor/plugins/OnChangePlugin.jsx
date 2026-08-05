'use client';

/**
 * components/admin/RichTextEditor/plugins/OnChangePlugin.jsx
 *
 * Bridges the Lexical internal EditorState to the outside world.
 *
 * Architecture:
 * - Provides BOTH the Lexical JSON state (source of truth for MongoDB) and
 *   the serialized HTML projection (for read-only rendering) on every change.
 * - Skips the initial hydration event to prevent false "dirty" saves on mount.
 * - Skips updates where nothing actually changed (dirtyElements + dirtyLeaves = 0).
 *
 * The parent component is responsible for:
 * - Debouncing before API calls (never save on every keystroke)
 * - Deciding which projections to store (JSON always; HTML optionally)
 *
 * @param {{ json: object, html: string }} onChange - Fires on every substantive change
 * @param {boolean} [ignoreInitialChange=true] - Skip the mount hydration event
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';

export function OnChangePlugin({ onChange, ignoreInitialChange = true }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({
      editorState,
      dirtyElements,
      dirtyLeaves,
      prevEditorState,
    }) => {
      // Skip the initial editor mount to avoid false-positive onChange calls
      if (ignoreInitialChange && prevEditorState.isEmpty()) return;

      // Skip no-op updates — selection changes, focus/blur, etc.
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

      let json, html;
      editorState.read(() => {
        json = editorState.toJSON();
        html = $generateHtmlFromNodes(editor, null);
      });

      onChange({ json, html });
    });
  }, [editor, onChange, ignoreInitialChange]);

  // This plugin renders no UI
  return null;
}
