import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * @typedef {React.HTMLAttributes<SVGSVGElement> & { size?: "sm" | "default" | "lg", color?: "primary" | "muted" | "current" }} SpinnerProps
 */

export function Spinner(/** @type {SpinnerProps} */ { className, size = "default", color = "current", ...props }) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        {
          "h-4 w-4": size === "sm",
          "h-5 w-5": size === "default",
          "h-8 w-8": size === "lg",
          "text-primary": color === "primary",
          "text-text-muted": color === "muted",
        },
        className
      )}
      {...props}
    />
  )
}
