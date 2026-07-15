/**
 * Inkwell wordmark — an original inkwell + nib mark, distinct from Medium's "M".
 * @param {{ className?: string, showText?: boolean }} props
 */
export default function Logo({ className = "", showText = true }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="6" y="16" width="16" height="11" rx="3" className="fill-accent-600" />
        <rect x="9" y="12" width="10" height="5" rx="1.5" className="fill-accent-700" />
        <path d="M20 4l7 7-2 2-7-7 2-2z" className="fill-ink" />
        <path d="M18 6l6 6-9.5 9.5a3 3 0 01-1.4.8L9 23l.7-4.1a3 3 0 01.8-1.4L18 6z" className="fill-accent-500" />
      </svg>
      {showText && (
        <span className="font-serif text-2xl font-bold tracking-tight text-ink">
          Inkwell
        </span>
      )}
    </span>
  );
}
