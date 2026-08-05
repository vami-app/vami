'use client';

/**
 * components/admin/RichTextEditor/plugins/CodeBlockPlugin.jsx
 *
 * Syntax-highlighted code blocks using Lexical's official @lexical/code package.
 *
 * Architecture:
 * - `CodeHighlightPlugin` from @lexical/react handles all tokenization and
 *   DOM class injection automatically. It reads the `language` attribute on
 *   CodeNode and applies Prism.js token classes.
 * - We wrap it with a language-switcher UI so users can change the language
 *   of a focused code block without leaving the editor.
 * - CodeNode and CodeHighlightNode MUST be registered in editorNodes.js.
 *
 * Supported languages (Prism.js built-in via @lexical/code):
 *   javascript, typescript, python, css, html, sql, bash, java, json, markdown
 *
 * Toolbar integration:
 *   The "Code Block" option in the block-type <select> already works via
 *   formatBlockType('code') which calls $createCodeNode(). This plugin adds
 *   the language switcher overlay that appears above focused code blocks.
 */
import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical';
import { $isCodeNode, registerCodeHighlighting } from '@lexical/code';

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'java', label: 'Java' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'plaintext', label: 'Plain Text' },
];

export function CodeBlockPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeCodeNode, setActiveCodeNode] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState('javascript');

  // Register syntax highlighting listeners for code blocks
  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  // Track when cursor enters/leaves a CodeNode to show the language switcher
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setActiveCodeNode(null);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        // Walk up the tree to find a CodeNode parent
        let node = anchorNode;
        while (node !== null) {
          if ($isCodeNode(node)) {
            setActiveCodeNode(node.getKey());
            setActiveLanguage(node.getLanguage() ?? 'javascript');
            return;
          }
          node = node.getParent?.() ?? null;
        }
        setActiveCodeNode(null);
      });
    });
  }, [editor]);

  // Change language of the focused CodeNode
  const handleLanguageChange = useCallback((language) => {
    if (!activeCodeNode) return;
    setActiveLanguage(language);
    editor.update(() => {
      const { $getNodeByKey } = require('lexical');
      const node = $getNodeByKey(activeCodeNode);
      if ($isCodeNode(node)) {
        node.setLanguage(language);
      }
    });
  }, [editor, activeCodeNode]);

  return (
    <>
      {/* Language switcher — only shown when cursor is inside a code block */}
      {activeCodeNode && (
        <div
          className="editor-code-lang-switcher"
          role="toolbar"
          aria-label="Code block language"
        >
          <label
            htmlFor="editor-code-lang-select"
            className="editor-code-lang-label"
          >
            Language:
          </label>
          <select
            id="editor-code-lang-select"
            value={activeLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="editor-code-lang-select"
            aria-label="Select syntax highlighting language"
          >
            {SUPPORTED_LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
