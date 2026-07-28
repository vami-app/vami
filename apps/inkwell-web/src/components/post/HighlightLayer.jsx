"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHighlights } from "@/hooks/useHighlights";
import HighlightPopover from "./HighlightPopover";

/**
 * Text selection wrapper and fuzzy DOM re-location engine for story highlights.
 * Ensures highlights are anchored by quote + context rather than static character offsets.
 */
export default function HighlightLayer({ slug, children, canHighlight = true }) {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const { highlights, createHighlight, updateNote, deleteHighlight } = useHighlights(slug);

  const [selectionPopover, setSelectionPopover] = useState(null);
  const [activePopover, setActivePopover] = useState(null);
  const [unlocatedHighlights, setUnlocatedHighlights] = useState([]);

  // Clear selections popover on click outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest(".highlight-popover")
      ) {
        setSelectionPopover(null);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  // Handle user text selection
  const handleMouseUp = () => {
    if (!user || !canHighlight) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    const range = selection.getRangeAt(0);
    if (!containerRef.current || !containerRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Extract surrounding context (~40 chars before and after)
    const fullContent = containerRef.current.textContent || "";
    const textOffset = fullContent.indexOf(selectedText);
    let contextBefore = "";
    let contextAfter = "";

    if (textOffset !== -1) {
      contextBefore = fullContent.substring(Math.max(0, textOffset - 40), textOffset);
      contextAfter = fullContent.substring(
        textOffset + selectedText.length,
        Math.min(fullContent.length, textOffset + selectedText.length + 40)
      );
    }

    setSelectionPopover({
      position: {
        top: rect.top - containerRect.top + window.scrollY - 10,
        left: rect.left - containerRect.left + rect.width / 2,
      },
      quote: selectedText,
      contextBefore,
      contextAfter,
    });
  };

  // Fuzzy re-location of highlights on DOM
  const relocateHighlights = useCallback(() => {
    if (!containerRef.current || !highlights || highlights.length === 0) {
      setUnlocatedHighlights([]);
      return;
    }

    const container = containerRef.current;
    // Remove existing highlight marks created previously
    const existingMarks = container.querySelectorAll("mark.inkwell-highlight");
    existingMarks.forEach((mark) => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    });

    const unlocated = [];

    highlights.forEach((h) => {
      const quote = h.quote;
      if (!quote) return;

      // Find text node containing quote
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      let currentNode;
      let matchedRange = null;

      while ((currentNode = walker.nextNode())) {
        const idx = currentNode.textContent.indexOf(quote);
        if (idx !== -1) {
          const range = document.createRange();
          range.setStart(currentNode, idx);
          range.setEnd(currentNode, idx + quote.length);
          matchedRange = range;
          break;
        }
      }

      if (matchedRange) {
        const mark = document.createElement("mark");
        mark.className =
          "inkwell-highlight bg-amber-200/80 dark:bg-amber-500/40 text-inherit cursor-pointer rounded px-0.5 transition hover:bg-amber-300 dark:hover:bg-amber-500/60";
        mark.dataset.highlightId = h.id || h._id;
        if (h.note) {
          mark.title = `Note: ${h.note}`;
        }
        mark.onclick = (e) => {
          e.stopPropagation();
          const rect = mark.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          setActivePopover({
            id: h.id || h._id,
            position: {
              top: rect.top - containerRect.top + window.scrollY - 10,
              left: rect.left - containerRect.left + rect.width / 2,
            },
            quote: h.quote,
            note: h.note || "",
          });
        };

        try {
          matchedRange.surroundContents(mark);
        } catch (err) {
          // If range spans across multiple tags, push to unlocated fallback
          unlocated.push(h);
        }
      } else {
        // Text no longer present in current story version
        unlocated.push(h);
      }
    });

    setUnlocatedHighlights(unlocated);
  }, [highlights]);

  useEffect(() => {
    relocateHighlights();
  }, [highlights, relocateHighlights]);

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className="relative">
      {children}

      {/* Unlocated highlights banner */}
      {unlocatedHighlights.length > 0 && (
        <div className="mx-auto mt-6 max-w-reading rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
          <p className="font-semibold mb-1">
            ⚠️ {unlocatedHighlights.length} highlight(s) could not be relocated in the current version of this story:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            {unlocatedHighlights.map((h) => (
              <li key={h.id || h._id}>
                &ldquo;{h.quote}&rdquo; {h.note && `— Note: ${h.note}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selection Popover for creating new highlight */}
      {selectionPopover && (
        <div className="highlight-popover">
          <HighlightPopover
            position={selectionPopover.position}
            initialQuote={selectionPopover.quote}
            onSave={async (note) => {
              await createHighlight({
                quote: selectionPopover.quote,
                contextBefore: selectionPopover.contextBefore,
                contextAfter: selectionPopover.contextAfter,
                note,
              });
              setSelectionPopover(null);
            }}
            onClose={() => setSelectionPopover(null)}
          />
        </div>
      )}

      {/* Active Popover for editing/deleting existing highlight */}
      {activePopover && (
        <div className="highlight-popover">
          <HighlightPopover
            isExisting
            position={activePopover.position}
            initialQuote={activePopover.quote}
            initialNote={activePopover.note}
            onSave={async (note) => {
              await updateNote(activePopover.id, note);
              setActivePopover(null);
            }}
            onDelete={async () => {
              await deleteHighlight(activePopover.id);
              setActivePopover(null);
            }}
            onClose={() => setActivePopover(null)}
          />
        </div>
      )}
    </div>
  );
}
