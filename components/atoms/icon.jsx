import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @typedef {Object} IconProps
 * @property {React.ElementType} icon - The Lucide icon component
 * @property {string} [className] - Additional classes
 * @property {"sm" | "md" | "lg" | "xl"} [size] - Predefined sizes
 */

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
}

export function Icon(/** @type {IconProps & React.SVGProps<SVGSVGElement>} */ { 
  icon: IconComponent, 
  className, 
  size = "md",
  ...props 
}) {
  return (
    <IconComponent
      className={cn(iconSizes[size], className)}
      {...props}
    />
  )
}
