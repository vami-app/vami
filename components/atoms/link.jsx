import * as React from "react"
import NextLink from "next/link"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const linkVariants = cva(
  "transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "text-primary font-medium hover:underline",
        muted: "text-text-muted hover:text-text-primary",
        nav: "text-text-secondary hover:text-text-primary hover:bg-surface-subtle",
        cta: "text-primary hover:opacity-70 inline-flex items-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * @typedef {import("class-variance-authority").VariantProps<typeof linkVariants>} LinkVariants
 * @typedef {import("next/link").LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & LinkVariants} LinkProps
 */

const Link = React.forwardRef(/** @param {LinkProps} props */ ({ className, variant, ...props }, ref) => {
  return (
    <NextLink
      ref={ref}
      className={cn(linkVariants({ variant, className }))}
      {...props}
    />
  )
})
Link.displayName = "Link"

export { Link, linkVariants }
