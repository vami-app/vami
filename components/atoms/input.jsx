import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @typedef {React.InputHTMLAttributes<HTMLInputElement>} InputProps
 */

const Input = React.forwardRef(/** @param {InputProps} props */ ({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "block w-full py-2.5 px-3.5 bg-surface-muted border border-input rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-text-primary transition-all disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
