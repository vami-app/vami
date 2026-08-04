import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function FormField({ label, hint, children, className, htmlFor }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
