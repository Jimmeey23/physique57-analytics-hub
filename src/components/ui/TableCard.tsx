import React, { useRef, forwardRef } from 'react';
import CopyTableButton from './CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { cn } from '@/lib/utils';

interface TableCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showCopyButton?: boolean;
  headerControls?: React.ReactNode;
  onCopyAllTabs?: () => Promise<string>;
  disableAutoRegistry?: boolean;
  contextInfo?: {
    selectedMetric?: string;
    dateRange?: { start: string; end: string };
    filters?: Record<string, any>;
    additionalInfo?: Record<string, any>;
  };
}

/**
 * Canonical table wrapper: gradient header band, copy/export actions,
 * framed table body (inherits global `.p57-scope` table styling).
 */
export const TableCard = forwardRef<HTMLDivElement, TableCardProps>(({
  title,
  subtitle,
  children,
  className,
  showCopyButton = true,
  headerControls,
  onCopyAllTabs,
  disableAutoRegistry = false,
  contextInfo
}, ref) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const metricsRegistry = useMetricsTablesRegistry();

  React.useEffect(() => {
    if (disableAutoRegistry) return;
    if (!metricsRegistry) return;
    if (!title) return;
    const refEl = tableRef.current;
    if (!refEl) return;
    const getTextContent = () => {
      const table = refEl.querySelector('table') || refEl;
      let text = `${title}\n`;
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    metricsRegistry.register({ id: title, getTextContent });
    return () => metricsRegistry.unregister(title);
  }, [metricsRegistry, title, disableAutoRegistry]);

  return (
    <div className={cn('p57-card overflow-hidden', className)} ref={ref}>
      {(title || showCopyButton || headerControls) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-gradient-to-b from-white to-[#f8fafc] px-4 py-2.5 dark:from-[#111216] dark:to-[#090a0d]">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate font-display text-[14px] font-bold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {headerControls}
            {showCopyButton && (
              <CopyTableButton
                tableRef={tableRef}
                tableName={title || 'Table'}
                size="sm"
                onCopyAllTabs={
                  onCopyAllTabs ?
                    (() => onCopyAllTabs().then(r => r)) :
                    (metricsRegistry ? async () => metricsRegistry.getAllTabsContent() : undefined)
                }
                contextInfo={contextInfo}
              />
            )}
          </div>
        </div>
      )}
      <div ref={tableRef} className="[&_table]:rounded-none [&_.p57-table-frame]:rounded-none [&_.p57-table-frame]:border-0 [&_.p57-table-frame]:shadow-none">
        {children}
      </div>
    </div>
  );
});

TableCard.displayName = 'TableCard';

export default TableCard;
