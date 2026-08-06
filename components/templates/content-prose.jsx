import { cn } from '@/lib/utils';

/**
 * ContentProse — article / legal content width wrapper.
 * @param {{ children: import('react').ReactNode, className?: string, as?: string }} props
 */
export function ContentProse({ children, className, as: Comp = 'div', ...props }) {
  return (
    <Comp className={cn('w-full max-w-3xl mx-auto', className)} {...props}>
      {children}
    </Comp>
  );
}
