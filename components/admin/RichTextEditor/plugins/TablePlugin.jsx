'use client';

/**
 * components/admin/RichTextEditor/plugins/TablePlugin.jsx
 *
 * Table insertion and management using Lexical's official @lexical/table package.
 *
 * Architecture:
 * - `LexicalTablePlugin` provides all native table behavior:
 *     - Tab/Shift-Tab for cell navigation
 *     - Arrow key navigation between cells
 *     - Cell merge (hasCellMerge)
 *     - Proper keyboard trap boundaries
 * - TableNode, TableCellNode, and TableRowNode MUST be in editorNodes.js.
 * - `INSERT_TABLE_COMMAND` is dispatched from the toolbar button.
 * - The insert dialog (rows × columns) is a minimal popover on the toolbar button.
 *
 * Security: Tables generated internally by Lexical command system — no HTML
 * injection possible. The DOMPurify paste normalizer already handles table
 * tags in pasted content.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TablePlugin as LexicalTablePlugin } from '@lexical/react/LexicalTablePlugin';
import { INSERT_TABLE_COMMAND } from '@lexical/table';

// Re-export the command so ToolbarPlugin can import it without depending on @lexical/table directly
export { INSERT_TABLE_COMMAND };

export function TablePlugin() {
  return (
    <LexicalTablePlugin
      hasCellMerge={true}
      hasCellBackgroundColor={false}
      hasTabHandler={true}
    />
  );
}

/**
 * TableInsertButton
 *
 * A self-contained toolbar button that opens a rows × columns picker
 * and dispatches INSERT_TABLE_COMMAND on confirm.
 *
 * Designed to be rendered inside ToolbarPlugin's JSX so it stays
 * within the LexicalComposer context.
 */
export function TableInsertButton() {
  const [editor] = useLexicalComposerContext();
  const [showPicker, setShowPicker] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const pickerRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const handleInsert = useCallback(() => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: String(rows),
      columns: String(cols),
      includeHeaders: true,
    });
    setShowPicker(false);
    setRows(3);
    setCols(3);
  }, [editor, rows, cols]);

  return (
    <div className="editor-table-insert" ref={pickerRef}>
      <button
        id="editor-btn-insert-table"
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        aria-label="Insert table"
        aria-expanded={showPicker}
        aria-haspopup="dialog"
        title="Insert table"
        className="editor-toolbar-btn"
      >
        ⊞
      </button>

      {showPicker && (
        <div
          className="editor-table-picker"
          role="dialog"
          aria-label="Table size picker"
          aria-modal="false"
        >
          <p className="editor-table-picker-title">Insert Table</p>

          <div className="editor-table-picker-row">
            <label htmlFor="editor-table-rows" className="editor-table-picker-label">
              Rows
            </label>
            <input
              id="editor-table-rows"
              type="number"
              min={1}
              max={20}
              value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="editor-table-picker-input"
            />
          </div>

          <div className="editor-table-picker-row">
            <label htmlFor="editor-table-cols" className="editor-table-picker-label">
              Columns
            </label>
            <input
              id="editor-table-cols"
              type="number"
              min={1}
              max={10}
              value={cols}
              onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="editor-table-picker-input"
            />
          </div>

          <button
            type="button"
            onClick={handleInsert}
            className="editor-table-picker-confirm"
            aria-label={`Insert ${rows} by ${cols} table`}
          >
            Insert {rows}×{cols}
          </button>
        </div>
      )}
    </div>
  );
}
