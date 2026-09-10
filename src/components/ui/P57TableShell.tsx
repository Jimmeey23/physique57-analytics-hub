import React, { useState } from 'react';
import { Search, Download, Rows3, X, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type P57Density = 'comfortable' | 'compact';

export interface P57TableShellProps {
  icon: LucideIcon;
  title: string;
  /** 1–2 line plain-language description of what the table shows. */
  description?: string;
  rowCount?: number;
  rowCountLabel?: string;
  /** Render a search box; called debounced-ish on every keystroke. */
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  /** Render CSV export button. */
  onExportCsv?: () => void;
  exportLabel?: string;
  /** Density switch (comfortable/compact). Omit both to hide. */
  density?: P57Density;
  onDensityChange?: (density: P57Density) => void;
  /** Extra header controls (switches, selects, custom buttons). */
  actions?: React.ReactNode;
  /** Footer meta strip (e.g. "Showing 24 of 120 · Updated …"). */
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Canonical table shell: animated icon tile, title + description,
 * advanced controls (search / density / export / custom actions),
 * scroll body, meta footer. Pair with `.p57-scope` table markup inside.
 */
export const P57TableShell: React.FC<P57TableShellProps> = ({
  icon: Icon,
  title,
  description,
  rowCount,
  rowCountLabel = 'rows',
  onSearch,
  searchPlaceholder = 'Search rows…',
  onExportCsv,
  exportLabel = 'CSV',
  density,
  onDensityChange,
  actions,
  meta,
  className,
  children,
}) => {
  const [query, setQuery] = useState('');
  const [innerDensity, setInnerDensity] = useState<P57Density>('comfortable');
  const activeDensity = density ?? innerDensity;
  const showDensity = onDensityChange !== undefined || density === undefined;

  const setDensity = (d: P57Density) => {
    setInnerDensity(d);
    onDensityChange?.(d);
  };

  return (
    <section className={cn('p57-shell', className)} aria-label={title}>
      <div className="p57-shell-head">
        <span className="p57-shell-ic" aria-hidden="true">
          <Icon />
        </span>
        <div className="min-w-0">
          <h3 className="p57-shell-title">
            {title}
            {typeof rowCount === 'number' && (
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {rowCount.toLocaleString('en-IN')} {rowCountLabel}
              </span>
            )}
          </h3>
          {description && <p className="p57-shell-desc">{description}</p>}
        </div>
        <div className="p57-shell-controls">
          {onSearch && (
            <span className="p57-ctl-search-wrap">
              <Search />
              <input
                className="p57-ctl-search"
                value={query}
                placeholder={searchPlaceholder}
                aria-label={`Search ${title}`}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onSearch(e.target.value);
                }}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setQuery('');
                    onSearch('');
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          )}
          {actions}
          {(onDensityChange || density === undefined) && (
            <button
              type="button"
              className="p57-ctl-btn"
              data-active={activeDensity === 'compact'}
              title={activeDensity === 'compact' ? 'Comfortable density' : 'Compact density'}
              aria-label="Toggle row density"
              aria-pressed={activeDensity === 'compact'}
              onClick={() => setDensity(activeDensity === 'compact' ? 'comfortable' : 'compact')}
            >
              <Rows3 />
            </button>
          )}
          {onExportCsv && (
            <button type="button" className="p57-ctl-btn" onClick={onExportCsv} title={`Export ${title} as CSV`}>
              <Download />
              {exportLabel}
            </button>
          )}
        </div>
      </div>
      <div
        className="p57-shell-body p57-scope"
        data-density={density ?? (showDensity ? activeDensity : undefined)}
      >
        {children}
      </div>
      {meta && <div className="p57-shell-meta">{meta}</div>}
    </section>
  );
};

export default P57TableShell;
