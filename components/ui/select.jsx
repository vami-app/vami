'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Custom listbox — same visual language as Products sidebar + Navbar product menu.
 * options: string[] | { value: string, label: string }[]
 */
export function Select({
  value,
  options = [],
  onChange,
  open: openControlled,
  onOpenChange,
  placeholder = 'Select…',
  size = 'default',
  className,
  triggerClassName,
  menuClassName,
  disabled = false,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = openControlled !== undefined;
  const open = isControlled ? openControlled : uncontrolledOpen;

  const setOpen = (next) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  const selected = normalized.find((o) => o.value === value);
  const display = selected?.label ?? placeholder;

  const sm = size === 'sm';

  return (
    <div className={cn('relative', className)}>
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      <div className={cn('relative', open ? 'z-30' : 'z-10')}>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={cn(
            sm
              ? 'w-full py-2.5 px-4 bg-surface/50 border rounded-lg outline-none text-left flex justify-between items-center text-sm transition-all'
              : 'w-full py-3.5 px-5 bg-surface/50 border rounded-lg outline-none text-left flex justify-between items-center transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)]',
            open
              ? 'border-text-primary ring-1 ring-text-primary bg-surface'
              : 'border-border-subtle hover:border-border-base',
            disabled && 'opacity-50 cursor-not-allowed',
            triggerClassName
          )}
        >
          <span
            className={cn(
              'text-text-primary truncate',
              !sm && 'font-medium',
              !selected && 'text-text-muted font-normal'
            )}
          >
            {display}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-text-muted flex-shrink-0 transition-transform ml-2',
              open && 'rotate-180'
            )}
          />
        </button>
        <div
          role="listbox"
          className={cn(
            'absolute top-[calc(100%+8px)] left-0 w-full bg-surface/95 backdrop-blur-xl border border-border-base rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden p-2 z-40',
            open
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none',
            'transition-all duration-200 ease-[cubic-bezier(0.2,0.7,0.3,1)] origin-top',
            menuClassName
          )}
        >
          <div className="max-h-60 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
            {normalized.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg text-sm transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
