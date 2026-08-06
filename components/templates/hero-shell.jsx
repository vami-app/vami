import { cn } from '@/lib/utils';

/**
 * HeroShell — hero section wrapper (replaces `.hero-section`).
 * @param {{ children: import('react').ReactNode, className?: string, as?: string }} props
 */
export function HeroShell({ children, className, as: Comp = 'section', ...props }) {
  return (
    <Comp className={cn('hero-section', className)} {...props}>
      {children}
    </Comp>
  );
}
