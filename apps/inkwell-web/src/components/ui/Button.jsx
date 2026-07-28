import { cx } from "@/lib/utils";

/**
 * @param {{
 *  variant?: 'primary'|'secondary'|'ghost'|'danger',
 *  size?: 'sm'|'md'|'lg',
 *  className?: string,
 *  children: React.ReactNode
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2";
  const variants = {
    primary: "bg-accent-600 text-white hover:bg-accent-700",
    secondary: "border border-ink text-ink hover:bg-ink hover:text-white",
    ghost: "text-ink-soft hover:text-ink hover:bg-gray-100",
    danger: "border border-red-500 text-red-600 hover:bg-red-500 hover:text-white",
  };
  // min-h-[44px] on md/lg keeps touch targets accessible on mobile
  const sizes = {
    sm: "text-sm px-3 py-1.5 min-h-[36px]",
    md: "text-sm px-5 py-2.5 min-h-[44px]",
    lg: "text-base px-6 py-3 min-h-[48px]",
  };
  return (
    <button className={cx(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
