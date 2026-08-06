import * as React from "react"
import { useState } from "react"
import { Input } from "@/components/atoms/input"
import { Button } from "@/components/atoms/button"
import { Icon } from "@/components/atoms/icon"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export const PasswordInput = React.forwardRef(/** @param {React.InputHTMLAttributes<HTMLInputElement>} props */ ({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        ref={ref}
        {...props}
      />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <Icon icon={EyeOff} size="sm" />
        ) : (
          <Icon icon={Eye} size="sm" />
        )}
      </Button>
    </div>
  )
})
PasswordInput.displayName = "PasswordInput"
