"use client";

import { useState } from "react";

/**
 * Renders prominent AI Authorship badge per §5 of specification.
 * - 'edited': "AI-edited" (AI copyedited / refined structure)
 * - 'co-written': "AI co-written" (AI generated narrative sections)
 * - 'none' or null/undefined: Renders NOTHING (empty string).
 *
 * @param {{ aiAssisted?: 'none'|'edited'|'co-written'|string, size?: 'sm'|'md' }} props
 */
export default function AiAuthorshipBadge({ aiAssisted = "none", size = "sm" }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!aiAssisted || aiAssisted === "none") {
    return null;
  }

  const isCoWritten = aiAssisted === "co-written";
  const label = isCoWritten ? "AI co-written" : "AI-edited";
  const explainer = isCoWritten
    ? "AI co-written: Artificial intelligence generated substantive narrative or draft text in this story, as self-disclosed by the author."
    : "AI-edited: Artificial intelligence assisted with copyediting, grammar, or structural refining, as self-disclosed by the author.";

  const badgeStyles = isCoWritten
    ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
    : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Authorship disclosure: ${label}`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium transition-colors ${badgeStyles} ${
          size === "sm" ? "text-[11px]" : "text-xs"
        }`}
      >
        <SparklesIcon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>{label}</span>
      </button>

      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-xl"
        >
          <div className="font-semibold text-gray-200 mb-0.5">{label}</div>
          {explainer}
          <div className="absolute top-full left-1/2 -mt-1 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

function SparklesIcon({ className = "h-3 w-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M7.757 16.243l-2.121 2.121m12.728 0l-2.121-2.121M7.757 7.757L5.636 5.636"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
