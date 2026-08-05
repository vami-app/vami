/**
 * components/admin/RichTextEditor/config/editorNodes.js
 *
 * The canonical node registry for this editor instance.
 *
 * Architecture rule: ALL custom and built-in Lexical nodes used anywhere in
 * the editor MUST be declared here. If a node is not in this array and the
 * editor encounters it in serialized JSON (e.g. from MongoDB), it will throw
 * a runtime error. This file is the single source of truth for what content
 * structures are supported by this editor.
 *
 * Phase progression:
 * - Phase 1: Core text nodes (headings, lists, links, quotes)
 * - Phase 3: ImageNode ✅
 * - Phase 4: Tables + Code blocks ✅
 */
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ImageNode } from '../nodes/ImageNode';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { CodeNode, CodeHighlightNode } from '@lexical/code';

export const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  ImageNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  CodeNode,
  CodeHighlightNode,
];


