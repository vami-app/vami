import { forwardRef } from "react";
import { cx } from "@/lib/utils";

/**
 * @type {React.ForwardRefExoticComponent<{
 *   label?: string, error?: string, className?: string, as?: 'input'|'textarea'
 * } & React.InputHTMLAttributes<HTMLInputElement>>}
 */
const Input = forwardRef(function Input(
  { label, error, className = "", as = "input", ...rest },
  ref
) {
  const Tag = as;
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <Tag
        ref={ref}
        className={cx(
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint",
          "focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500",
          error ? "border-red-400" : "border-gray-300",
          as === "textarea" && "min-h-[100px] resize-y",
          className
        )}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export default Input;
