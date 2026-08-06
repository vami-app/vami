import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    variant: {
      body: "text-text-muted font-light leading-relaxed",
      bodyStrong: "text-text-secondary font-normal leading-relaxed",
      caption: "text-xs text-text-muted tracking-wide",
      eyebrow: "text-xs font-semibold text-text-muted tracking-[0.2em] uppercase",
      muted: "text-text-muted font-light",
      cta: "font-medium",
      display: "font-headline font-light text-text-primary leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
      headline: "font-headline font-light text-text-primary leading-tight text-3xl sm:text-4xl lg:text-5xl",
    },
    size: {
      default: "",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    variant: "body",
    size: "default",
  },
})

/**
 * @typedef {import("class-variance-authority").VariantProps<typeof textVariants>} TextVariants
 * @typedef {React.HTMLAttributes<HTMLElement> & TextVariants & { asChild?: boolean, as?: React.ElementType }} TextProps
 */

const Text = React.forwardRef(/** @param {TextProps} props */ ({ className, variant, size, as: Tag = "p", asChild = false, ...props }, ref) => {
  return (
    <Tag
      className={cn(textVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Text.displayName = "Text"

export { Text, textVariants }
