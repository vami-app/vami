import { cn } from '@/lib/utils';

/**
 * MarketingSection — constrained content width used across marketing pages.
 * @param {{
 *   children: import('react').ReactNode,
 *   className?: string,
 *   innerClassName?: string,
 *   tone?: 'default' | 'muted' | 'bordered',
 *   as?: string,
 * }} props
 */
export function MarketingSection({
  children,
  className,
  innerClassName,
  tone = 'default',
  as: Comp = 'section',
  ...props
}) {
  const toneClass =
    tone === 'muted'
      ? 'bg-surface border-y border-border-subtle'
      : tone === 'bordered'
        ? 'border-y border-border-subtle'
        : '';

  return (
    <Comp className={cn('w-full', toneClass, className)} {...props}>
      <div
        className={cn(
          'w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]',
          innerClassName,
        )}
      >
        {children}
      </div>
    </Comp>
  );
}
