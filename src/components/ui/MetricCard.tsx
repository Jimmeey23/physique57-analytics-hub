import React from 'react';
import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricDelta {
  value: string;
  tone: 'up' | 'down' | 'flat';
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: MetricDelta;
  icon?: LucideIcon;
  accent?: string;
  className?: string;
}

/**
 * Canonical KPI card: eyebrow label, serif numeral, pastel delta chip.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  accent,
  className,
}) => {
  return (
    <div
      className={cn('p57-metric', className)}
      style={accent ? ({ '--p57-accent': accent } as React.CSSProperties) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="p57-metric-label">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="p57-metric-value">
        <span key={String(value)} className="p57-value-swap">{value}</span>
      </p>
      {(sub || delta) && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {delta && (
            <span
              className={cn(
                'p57-delta',
                delta.tone === 'up' && 'p57-delta-up',
                delta.tone === 'down' && 'p57-delta-down',
                delta.tone === 'flat' && 'p57-delta-flat'
              )}
            >
              {delta.tone === 'up' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : delta.tone === 'down' ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {delta.value}
            </span>
          )}
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  );
};

export const MetricGrid: React.FC<{ children: React.ReactNode; className?: string; cols?: 2 | 3 | 4 | 5 | 6 }> = ({
  children,
  className,
  cols = 4,
}) => {
  const colsClass =
    cols === 2
      ? 'sm:grid-cols-2'
      : cols === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : cols === 5
          ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
          : cols === 6
            ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
            : 'sm:grid-cols-2 xl:grid-cols-4';
  return <div className={cn('grid grid-cols-1 gap-3 md:gap-4', colsClass, className)}>{children}</div>;
};

export default MetricCard;
