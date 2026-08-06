import { Text } from "@/components/atoms/text";

/**
 * Minimal center-aligned layout for authentication pages
 */
export function AuthLayoutTemplate({ children, title, subtitle }) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-surface items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {(title || subtitle) && (
          <div className="text-center space-y-2">
            {title && (
              <Text as="h1" variant="headline" className="text-3xl font-bold tracking-tight">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant="body" className="text-text-muted">
                {subtitle}
              </Text>
            )}
          </div>
        )}
        <div className="bg-background border border-border-subtle rounded-[var(--outer-radius)] p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
