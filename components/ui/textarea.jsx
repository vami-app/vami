import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary placeholder:text-text-muted resize-none disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
