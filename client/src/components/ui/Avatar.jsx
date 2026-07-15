import { resolveMedia } from "@/lib/api";
import { initials, cx } from "@/lib/utils";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

/**
 * Circular avatar with initials fallback. Uses a plain <img> (not next/image)
 * so it works uniformly for remote + local uploaded avatars.
 * @param {{ src?: string, name?: string, size?: keyof typeof SIZES, className?: string }} props
 */
export default function Avatar({ src, name = "", size = "md", className = "" }) {
  const url = resolveMedia(src);
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-100 font-semibold text-accent-700",
        SIZES[size],
        className
      )}
      aria-label={name}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
