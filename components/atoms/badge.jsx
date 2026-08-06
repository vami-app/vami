import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-surface-subtle text-text-secondary",
        primary: "bg-primary text-primary-foreground",
      },
      size: {
        default: "px-3 py-1 text-xs tracking-wide",
        sm: "px-2 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * @typedef {import("class-variance-authority").VariantProps<typeof badgeVariants>} BadgeVariants
 * @typedef {React.HTMLAttributes<HTMLSpanElement> & BadgeVariants} BadgeProps
 */

function Badge(/** @type {BadgeProps} */ { className, variant, size, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
