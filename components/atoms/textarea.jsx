import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @typedef {React.TextareaHTMLAttributes<HTMLTextAreaElement>} TextareaProps
 */

const Textarea = React.forwardRef(/** @param {TextareaProps} props */ ({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "block w-full py-2.5 px-3.5 bg-surface-muted border border-input rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-text-primary transition-all resize-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
