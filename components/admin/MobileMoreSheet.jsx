'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { LogOut, X } from 'lucide-react';
import {
  MOBILE_MORE_GROUP_LABELS,
  MOBILE_MORE_GROUP_ORDER,
  isAdminNavActive,
} from '@/config/admin';

/**
 * iOS/Material-style overflow sheet for destinations not in the primary tab bar.
 */
export default function MobileMoreSheet({ open, onClose, items = [], pathname }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sections = MOBILE_MORE_GROUP_ORDER.map((group) => ({
    group,
    label: MOBILE_MORE_GROUP_LABELS[group],
    items: items.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0 || section.group === 'system');

  const ungrouped = items.filter(
    (item) => !item.group || !MOBILE_MORE_GROUP_ORDER.includes(item.group)
  );

  return (
    <div
      className="fixed inset-0 z-[60] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-more-sheet-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[min(85dvh,36rem)] flex flex-col rounded-t-2xl border border-border-subtle border-b-0 bg-surface shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-border-subtle shrink-0">
          <div className="min-w-0">
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-subtle"
              aria-hidden="true"
            />
            <h2
              id="mobile-more-sheet-title"
              className="text-lg font-headline font-light text-text-primary tracking-tight"
            >
              More
            </h2>
            <p className="text-xs text-text-muted mt-0.5">All other admin sections</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {ungrouped.length > 0 ? (
            <ul className="space-y-0.5 mb-4">
              {ungrouped.map(({ name, href, icon: Icon }) => {
                const active = isAdminNavActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={[
                        'flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
                      ].join(' ')}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon
                        className={[
                          'h-5 w-5 shrink-0',
                          active ? 'text-primary-foreground' : 'text-text-muted',
                        ].join(' ')}
                        aria-hidden="true"
                      />
                      <span className="truncate">{name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {sections.map((section) => (
            <div key={section.group} className="mb-4 last:mb-2">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ name, href, icon: Icon }) => {
                  const active = isAdminNavActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        className={[
                          'flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
                        ].join(' ')}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon
                          className={[
                            'h-5 w-5 shrink-0',
                            active ? 'text-primary-foreground' : 'text-text-muted',
                          ].join(' ')}
                          aria-hidden="true"
                        />
                        <span className="truncate">{name}</span>
                      </Link>
                    </li>
                  );
                })}
                {section.group === 'system' ? (
                  <li>
                    <Link
                      href="/admin/logout"
                      onClick={onClose}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>Sign out</span>
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
