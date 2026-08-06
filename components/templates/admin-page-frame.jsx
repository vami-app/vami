import { cn } from '@/lib/utils';
import { Text } from '@/components/atoms/text';

/**
 * AdminPageFrame — admin list/new/edit page chrome (title + optional actions).
 * @param {{
 *   title: import('react').ReactNode,
 *   description?: import('react').ReactNode,
 *   actions?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export function AdminPageFrame({ title, description, actions, children, className }) {
  return (
    <div className={cn(className)}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Text as="h1" className="text-xl font-semibold text-text-primary">
            {title}
          </Text>
          {description ? (
            <Text variant="muted" className="mt-1">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? <div className="flex-shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
