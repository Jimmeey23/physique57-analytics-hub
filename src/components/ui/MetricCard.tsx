import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus, RotateCw } from 'lucide-react';
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
  /**
   * Flip-side content (extra breakdown, sparkline data, prior period…).
   * When provided the card flips on click to reveal it.
   */
  details?: React.ReactNode;
  detailsTitle?: string;
  /**
   * Drill-down action. Without `details` the whole card triggers it (legacy
   * grid behaviour); with `details` the click flips and the back face shows
   * a drill button instead — flip and drill-down coexist.
   */
  onSelect?: () => void;
  selectLabel?: string;
}

/**
 * Canonical KPI card: eyebrow label, serif numeral, pastel delta chip.
 * Compact; flips on click when `details` are provided.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  accent,
  className,
  details,
  detailsTitle = 'Details',
  onSelect,
  selectLabel = 'Open details',
}) => {
  const [flipped, setFlipped] = useState(false);
  const flippable = details !== undefined && details !== null;

  const front = (
    <div
      className={cn('p57-metric p57-flip-face', flippable && 'cursor-pointer')}
      style={accent ? ({ '--p57-accent': accent } as React.CSSProperties) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="p57-metric-label">{label}</p>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
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
      {flippable && (
        <span className="p57-flip-hint" aria-hidden="true">
          <RotateCw />
          Flip
        </span>
      )}
    </div>
  );

  if (!flippable) {
    if (!onSelect) return <div className={className}>{front}</div>;
    return (
      <div
        className={cn('cursor-pointer', className)}
        role="button"
        tabIndex={0}
        aria-label={`${label}: ${value}. Activate to ${selectLabel.toLowerCase()}.`}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        {front}
      </div>
    );
  }

  return (
    <div className={cn('p57-flip', className)}>
      <div
        className="p57-flip-inner"
        data-flipped={flipped ? 'true' : 'false'}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label}: ${value}. Activate to flip for details.`}
          onClick={() => setFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFlipped((v) => !v);
            }
          }}
        >
          {front}
        </div>
        <div
          className="p57-metric p57-flip-face p57-flip-back cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={`${label} details. Activate to flip back.`}
          onClick={() => setFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFlipped((v) => !v);
            }
          }}
          style={accent ? ({ '--p57-accent': accent } as React.CSSProperties) : undefined}
        >
          <p className="p57-metric-label">{detailsTitle}</p>
          <div className="mt-1.5 text-[12px] font-medium leading-relaxed text-foreground/90">
            {details}
          </div>
          {onSelect && (
            <button
              type="button"
              className="p57-flip-drill"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {selectLabel} →
            </button>
          )}
          <span className="p57-flip-hint" aria-hidden="true">
            <RotateCw />
            Back
          </span>
        </div>
      </div>
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
