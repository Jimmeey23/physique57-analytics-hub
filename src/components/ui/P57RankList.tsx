import React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { getRankingBadgeStyle } from '@/styles/tableStyles';
import { cn } from '@/lib/utils';

export interface P57RankItem {
  rank: number;
  name: string;
  sub?: string;
  value: string;
  /** 0–100 bar fill relative to the top item. */
  barPct?: number;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
}

export interface P57RankListProps {
  items: P57RankItem[];
  onSelect?: (item: P57RankItem) => void;
  emptyText?: string;
  maxItems?: number;
}

/**
 * Canonical ranking list — identical medals, bars, values and deltas
 * on every tab. Click a row to drill into that ranked entity.
 */
export const P57RankList: React.FC<P57RankListProps> = ({
  items,
  onSelect,
  emptyText = 'No ranked items for the current filters.',
  maxItems,
}) => {
  const visible = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;
  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
        {emptyText}
      </p>
    );
  }
  return (
    <ol>
      {visible.map((item) => (
        <li
          key={`${item.rank}-${item.name}`}
          className="p57-rankrow"
          onClick={() => onSelect?.(item)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
              e.preventDefault();
              onSelect(item);
            }
          }}
          tabIndex={onSelect ? 0 : undefined}
          role={onSelect ? 'button' : undefined}
          aria-label={onSelect ? `Drill into ${item.name}` : undefined}
        >
          <span className={getRankingBadgeStyle(item.rank)} aria-hidden="true">
            {item.rank}
          </span>
          <span className="min-w-0">
            <span className="p57-rankrow-name block">{item.name}</span>
            {item.sub && <span className="p57-rankrow-sub block">{item.sub}</span>}
          </span>
          {typeof item.barPct === 'number' && (
            <span className="p57-rankbar ml-auto" aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(100, item.barPct))}%` }} />
            </span>
          )}
          <span className={cn('p57-rankrow-val', typeof item.barPct === 'number' && '!ml-0')}>
            {item.value}
          </span>
          {item.delta && (
            <span
              className={cn(
                'p57-delta',
                item.deltaTone === 'down'
                  ? 'p57-delta-down'
                  : item.deltaTone === 'flat'
                    ? 'p57-delta-flat'
                    : 'p57-delta-up'
              )}
            >
              {item.deltaTone === 'down' ? (
                <TrendingDown className="h-3 w-3" />
              ) : item.deltaTone === 'flat' ? (
                <Minus className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {item.delta}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
};

export default P57RankList;
