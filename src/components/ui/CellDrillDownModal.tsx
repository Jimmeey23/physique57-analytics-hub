import React from 'react';
import { Crosshair } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface DrillContextChip {
  label: string;
  value: string;
}

export interface DrillColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
}

export interface CellDrillDownModalProps {
  open: boolean;
  onClose: () => void;
  /** e.g. "Revenue · Strength · Jan 2025" — the clicked cell. */
  title: string;
  subtitle?: string;
  /** Row + column + filter context chips (NOT generalised). */
  context: DrillContextChip[];
  columns: DrillColumn[];
  /** Item-level rows backing the clicked cell. */
  rows: Array<Record<string, React.ReactNode>>;
  footer?: React.ReactNode;
  emptyText?: string;
  wide?: boolean;
}

/**
 * Canonical context-aware drill-down: shows the exact row/column/filter
 * context of the clicked cell plus the item-level rows behind the value.
 */
export const CellDrillDownModal: React.FC<CellDrillDownModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  context,
  columns,
  rows,
  footer,
  emptyText = 'No item-level records back this cell for the current filters.',
  wide = true,
}) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className={cn('p57-scope max-h-[86vh] overflow-hidden p-0', wide && 'sm:max-w-3xl')}>
      <div className="border-b border-border px-5 py-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <span className="p57-shell-ic !h-7 !w-7 !rounded-lg" aria-hidden="true">
              <Crosshair className="!h-3.5 !w-3.5" />
            </span>
            {title}
          </DialogTitle>
          {subtitle && <DialogDescription className="text-xs">{subtitle}</DialogDescription>}
        </DialogHeader>
        {context.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Cell context">
            {context.map((c, i) => (
              <span
                key={`${c.label}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 py-1 pl-2.5 pr-3 text-[11px]"
              >
                <span className="font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <span className="font-bold text-foreground">{c.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="max-h-[52vh] overflow-auto px-5 py-4">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <table className="min-w-full tabular-nums">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      c.align === 'center' && 'text-center',
                      c.align === 'right' && 'text-right'
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        c.align === 'center' && 'text-center',
                        c.align === 'right' && 'text-right',
                        c.mono && 'font-mono text-[12px]'
                      )}
                    >
                      {r[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <p className="text-[11px] font-semibold text-muted-foreground">
          {rows.length.toLocaleString('en-IN')} item{rows.length === 1 ? '' : 's'} · click any table cell to drill in
        </p>
        {footer}
      </div>
    </DialogContent>
  </Dialog>
);

export default CellDrillDownModal;
