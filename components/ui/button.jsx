import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        destructive: "border border-border-base text-red-600 hover:bg-red-50 hover:border-red-100",
        outline: "border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
        ghost: "text-text-muted hover:text-primary",
        ghostDestructive: "text-text-muted hover:text-red-600 hover:bg-red-50",
      },
      size: {
        default: "px-6 py-2.5 rounded-lg uppercase tracking-wider text-xs",
        sm: "px-4 py-2 rounded-lg uppercase tracking-wider text-[10px]",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
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
