import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/atoms/icon"
import { ChevronDown } from "lucide-react"

/**
 * @typedef {React.SelectHTMLAttributes<HTMLSelectElement>} SelectProps
 */

export const Select = React.forwardRef(/** @param {SelectProps} props */ ({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "block w-full appearance-none py-2.5 pl-3.5 pr-10 bg-surface-muted border border-input rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:border-text-primary transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <Icon icon={ChevronDown} size="sm" className="text-text-muted" />
      </div>
    </div>
  )
})
Select.displayName = "Select"
