import { cn } from '@/lib/utils';

/**
 * PageShell — public page outer wrapper (replaces `.layout-main`).
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function PageShell({ children, className }) {
  return (
    <div className={cn('layout-main', className)}>
      {children}
    </div>
  );
}
