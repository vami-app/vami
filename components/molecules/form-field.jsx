import * as React from "react"
import { Label } from "@/components/atoms/label"
import { Text } from "@/components/atoms/text"
import { cn } from "@/lib/utils"

/**
 * @typedef {Object} FormFieldProps
 * @property {React.ReactNode} [label]
 * @property {React.ReactNode} [hint]
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {string} [htmlFor]
 */

export function FormField(/** @type {FormFieldProps} */ { label, hint, children, className, htmlFor }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <Text variant="caption">{hint}</Text>}
    </div>
  )
}
