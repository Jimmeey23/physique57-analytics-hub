import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionTabOption<T extends string = string> {
  key: T;
  label: string;
  shortLabel?: string;
  description?: string;
  icon?: React.ElementType;
  count?: number;
}

export interface SectionTabsProps<T extends string = string> {
  options: Array<SectionTabOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Section heading shown above the tabs. */
  heading?: string;
  /** Right-aligned status text (record counts, loading hints). */
  meta?: React.ReactNode;
  ariaLabel: string;
  /** Show the active option's description under the bar. */
  showDescription?: boolean;
  className?: string;
}

/**
 * The canonical in-page view switcher. Shares the `p57-tablist` /
 * `p57-tabtrigger` treatment with the Radix tabs, so button-driven switchers
 * and Radix tabs look identical across every analytics page.
 */
export function SectionTabs<T extends string = string>({
  options,
  value,
  onChange,
  heading,
  meta,
  ariaLabel,
  showDescription = true,
  className,
}: SectionTabsProps<T>) {
  const active = options.find((option) => option.key === value) ?? options[0];

  return (
    <div className={cn('min-w-0 space-y-3', className)}>
      {(heading || meta) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {heading ? <h2 className="text-lg font-bold tracking-[-0.01em] text-slate-900 dark:text-slate-100">{heading}</h2> : <span />}
          {meta ? <span role="status" className="text-xs font-medium text-slate-600 dark:text-slate-400">{meta}</span> : null}
        </div>
      )}

      <nav
        aria-label={ariaLabel}
        className="p57-tablist flex flex-wrap gap-1 rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)] p-1.5 shadow-[0_10px_26px_-18px_rgba(14,23,41,0.55)] dark:border-[#2a2a2e] dark:bg-[linear-gradient(180deg,#141416_0%,#0f0f11_100%)]"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = option.key === active?.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={isActive}
              data-state={isActive ? 'active' : 'inactive'}
              onClick={() => onChange(option.key)}
              className="p57-tabtrigger inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-[13.5px] font-bold tracking-[-0.01em] text-slate-500 transition-all duration-150 hover:-translate-y-[1px] hover:bg-white hover:text-slate-900 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              <span>{option.label}</span>
              {typeof option.count === 'number' ? (
                <span className="rounded-full bg-slate-900/[0.06] px-2 py-0.5 text-[11px] font-bold tabular-nums">
                  {option.count.toLocaleString()}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {showDescription && active?.description ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">{active.description}</p>
      ) : null}
    </div>
  );
}

export default SectionTabs;
