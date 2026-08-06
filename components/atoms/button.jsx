import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * @typedef {import("class-variance-authority").VariantProps<typeof buttonVariants>} ButtonVariants
 * @typedef {React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants & { asChild?: boolean }} ButtonProps
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-base disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xl hover:opacity-90 hover:scale-[1.03]",
        destructive: "border border-border-base text-destructive hover:bg-red-50 hover:border-red-100",
        outline: "border border-border-base bg-surface hover:bg-surface-subtle text-text-primary hover:scale-[1.02]",
        ghost: "text-text-muted hover:text-text-primary",
        ghostDestructive: "text-text-muted hover:text-destructive hover:bg-red-50",
      },
      size: {
        default: "px-5 py-2.5 rounded-full text-sm",
        sm: "px-4 py-2 rounded-xl text-sm",
        lg: "px-8 py-4 rounded-full text-[var(--text-cta)]",
        icon: "h-8 w-8 rounded-full text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(/** @param {ButtonProps} props */ ({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
