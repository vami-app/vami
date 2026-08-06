import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @typedef {React.LabelHTMLAttributes<HTMLLabelElement>} LabelProps
 */

const Label = React.forwardRef(/** @param {LabelProps} props */ ({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-sm font-medium text-text-secondary mb-1.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
