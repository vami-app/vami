import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext(null)

export function Tabs({ defaultValue, value, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const activeValue = value !== undefined ? value : internalValue

  const changeValue = React.useCallback(
    (newValue) => {
      setInternalValue(newValue)
      if (onValueChange) {
        onValueChange(newValue)
      }
    },
    [onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: changeValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }) {
  return (
    <div className={cn("flex gap-1 bg-surface-muted rounded-2xl p-1 w-fit", className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")

  const isActive = context.value === value

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-surface text-text-primary shadow-sm border border-border-subtle"
          : "text-text-muted hover:text-text-primary",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")

  if (context.value !== value) return null

  return (
    <div className={cn("animate-in fade-in duration-300", className)}>
      {children}
    </div>
  )
}
