import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg font-semibold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
  {
    variants: {
      variant: {
        default: "bg-surface-subtle text-text-secondary border border-border-subtle",
        primary: "bg-primary text-primary-foreground",
      },
      size: {
        default: "px-3 py-1 text-[10px] uppercase",
        sm: "px-2 py-0.5 text-[9px] uppercase",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({ className, variant, size, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
