'use client';

/**
 * components/admin/RichTextEditor/plugins/PasteNormalizerPlugin.jsx
 *
 * Registers the paste normalization handler as a Lexical plugin.
 * Uses COMMAND_PRIORITY_HIGH to intercept paste before Lexical's own handlers.
 *
 * The actual normalization logic lives in utils/pasteNormalizer.js
 * to keep this registration wrapper thin and testable.
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { PASTE_COMMAND, COMMAND_PRIORITY_HIGH } from 'lexical';
import { normalizePaste } from '../utils/pasteNormalizer';

export function PasteNormalizerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => normalizePaste(event, editor),
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
