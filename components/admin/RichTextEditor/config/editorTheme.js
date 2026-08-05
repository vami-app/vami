/**
 * components/admin/RichTextEditor/config/editorTheme.js
 *
 * Maps Lexical's internal node types and format flags to CSS class names.
 *
 * Architecture rule: styles live in RichTextEditor.css — never inline here.
 * This file is the bridge between Lexical's rendering engine and the CSS layer.
 * When a new node type is added (e.g. ImageNode in Phase 3), add its class here.
 */
export const editorTheme = {
  root: 'editor-root',
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-h1',
    h2: 'editor-h2',
    h3: 'editor-h3',
    h4: 'editor-h4',
    h5: 'editor-h5',
    h6: 'editor-h6',
  },
  list: {
    nested: { listitem: 'editor-nested-listitem' },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
    listitemChecked: 'editor-listitem-checked',
    listitemUnchecked: 'editor-listitem-unchecked',
  },
  quote: 'editor-quote',
  code: 'editor-code',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underline-strikethrough',
    code: 'editor-text-code',
  },
  hr: 'editor-hr',
  // Phase 3 additions:
  image: 'editor-image',
  // Phase 4 additions:
  table: 'editor-table',
  tableCell: 'editor-table-cell',
  tableCellHeader: 'editor-table-cell-header',
  tableRow: 'editor-table-row',
};
