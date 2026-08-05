'use client';

/**
 * components/admin/RichTextEditor/plugins/ToolbarPlugin.jsx
 *
 * Production toolbar for the Lexical rich text editor.
 *
 * Architecture:
 * - Registers a single updateListener to track the active selection's format state.
 *   This is the only correct way to know whether Bold/Italic should be "pressed" —
 *   by reading the selection's hasFormat() on every state update.
 * - Registers CAN_UNDO_COMMAND / CAN_REDO_COMMAND to manage button disabled state.
 * - All buttons have unique IDs (browser testing requirement), aria-label, and
 *   aria-pressed (WCAG 2.1 requirement for toggle buttons).
 * - Block type dropdown uses a <select> for keyboard accessibility.
 * - All formatting commands go through editor.dispatchCommand() — never direct
 *   DOM manipulation. This ensures undo/redo and collaboration stay in sync.
 */
import { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $createParagraphNode,
  $isRootOrShadowRoot,
} from 'lexical';
import { $isHeadingNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { $getNearestNodeOfType, $findMatchingParent } from '@lexical/utils';
import { ListNode } from '@lexical/list';

// ─── Block type label map ──────────────────────────────────────────────────
const BLOCK_TYPE_LABELS = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  quote: 'Quote',
  bullet: 'Bullet List',
  number: 'Numbered List',
};

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  // Active inline format state — drives aria-pressed on toggle buttons
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
  });

  // Current block type — drives the block type <select>
  const [blockType, setBlockType] = useState('paragraph');

  // Undo/redo availability
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ─── Selection listener — runs on every editor state update ─────────────
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Inline format state
        setActiveFormats({
          bold: selection.hasFormat('bold'),
          italic: selection.hasFormat('italic'),
          underline: selection.hasFormat('underline'),
          strikethrough: selection.hasFormat('strikethrough'),
          code: selection.hasFormat('code'),
        });

        // Block type detection
        const anchorNode = selection.anchor.getNode();
        let element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : $findMatchingParent(anchorNode, (e) => {
                const parent = e.getParent();
                return parent !== null && $isRootOrShadowRoot(parent);
              });

        if (element === null) {
          element = anchorNode.getTopLevelElementOrThrow();
        }

        const elementKey = element.getKey();
        const elementDOM = editor.getElementByKey(elementKey);

        if (elementDOM !== null) {
          if ($isListNode(element)) {
            const parentList = $getNearestNodeOfType(anchorNode, ListNode);
            const type = parentList
              ? parentList.getListType()
              : element.getListType();
            setBlockType(type); // 'bullet' or 'number'
          } else {
            const type = $isHeadingNode(element)
              ? element.getTag()
              : element.getType();
            setBlockType(type);
          }
        }
      });
    });
  }, [editor]);

  // ─── Undo/redo command availability ──────────────────────────────────────
  useEffect(() => {
    const unsubUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => { setCanUndo(payload); return false; },
      COMMAND_PRIORITY_CRITICAL
    );
    const unsubRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => { setCanRedo(payload); return false; },
      COMMAND_PRIORITY_CRITICAL
    );
    return () => { unsubUndo(); unsubRedo(); };
  }, [editor]);

  // ─── Format block type ────────────────────────────────────────────────────
  const formatBlockType = useCallback((type) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (type === 'bullet') {
        if (blockType !== 'bullet') {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        return;
      }

      if (type === 'number') {
        if (blockType !== 'number') {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        return;
      }

      // Transform selection's top-level block to new type
      selection.getNodes().forEach((node) => {
        const topLevel = node.getTopLevelElementOrThrow();

        if (type === 'paragraph') {
          const paragraph = $createParagraphNode();
          topLevel.replace(paragraph, true);
        } else if (type === 'quote') {
          const quote = $createQuoteNode();
          topLevel.replace(quote, true);
        } else if (['h1', 'h2', 'h3', 'h4'].includes(type)) {
          const heading = $createHeadingNode(type);
          topLevel.replace(heading, true);
        }
      });
    });
  }, [editor, blockType]);

  // ─── Inline format buttons config ────────────────────────────────────────
  const inlineFormats = [
    { format: 'bold', label: 'Bold (Ctrl+B)', symbol: 'B', id: 'editor-btn-bold' },
    { format: 'italic', label: 'Italic (Ctrl+I)', symbol: 'I', id: 'editor-btn-italic' },
    { format: 'underline', label: 'Underline (Ctrl+U)', symbol: 'U', id: 'editor-btn-underline' },
    { format: 'strikethrough', label: 'Strikethrough', symbol: 'S̶', id: 'editor-btn-strikethrough' },
    { format: 'code', label: 'Inline Code', symbol: '<>', id: 'editor-btn-code' },
  ];

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting toolbar">

      {/* ── Undo / Redo ──────────────────────────────────────────────────── */}
      <button
        id="editor-btn-undo"
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        aria-label="Undo (Ctrl+Z)"
        title="Undo"
        className="editor-toolbar-btn"
      >
        ↩
      </button>
      <button
        id="editor-btn-redo"
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        aria-label="Redo (Ctrl+Y)"
        title="Redo"
        className="editor-toolbar-btn"
      >
        ↪
      </button>

      <div className="editor-toolbar-divider" aria-hidden="true" />

      {/* ── Inline formats ───────────────────────────────────────────────── */}
      {inlineFormats.map(({ format, label, symbol, id }) => (
        <button
          key={format}
          id={id}
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
          aria-label={label}
          aria-pressed={activeFormats[format]}
          title={label}
          className={`editor-toolbar-btn${activeFormats[format] ? ' editor-toolbar-btn--active' : ''}`}
        >
          {symbol}
        </button>
      ))}

      <div className="editor-toolbar-divider" aria-hidden="true" />

      {/* ── Block type selector ──────────────────────────────────────────── */}
      <select
        id="editor-select-block-type"
        value={blockType}
        onChange={(e) => formatBlockType(e.target.value)}
        aria-label="Block type"
        className="editor-toolbar-select"
      >
        {Object.entries(BLOCK_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* ── Text alignment ───────────────────────────────────────────────── */}
      <div className="editor-toolbar-divider" aria-hidden="true" />
      {[
        { align: 'left', label: 'Align Left', id: 'editor-btn-align-left', symbol: '⬛◻◻' },
        { align: 'center', label: 'Align Center', id: 'editor-btn-align-center', symbol: '◻⬛◻' },
        { align: 'right', label: 'Align Right', id: 'editor-btn-align-right', symbol: '◻◻⬛' },
      ].map(({ align, label, id, symbol }) => (
        <button
          key={align}
          id={id}
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align)}
          aria-label={label}
          title={label}
          className="editor-toolbar-btn"
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
