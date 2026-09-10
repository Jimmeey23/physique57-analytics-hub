import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TickerItem {
  label: string;
  value: string;
  delta?: string;
  tone?: 'up' | 'down' | 'flat';
}

/**
 * Athena-style KPI marquee ticker. The strip is duplicated for a
 * seamless loop; pauses on hover; edges fade via CSS mask.
 */
export const KpiTicker: React.FC<{ items: TickerItem[]; className?: string }> = ({ items, className }) => {
  if (!items.length) return null;
  const row = (ariaHidden: boolean) => (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 whitespace-nowrap px-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {item.label}
          </span>
          <span className="font-serif text-[17px] tracking-tight text-foreground">{item.value}</span>
          {item.delta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums',
                item.tone === 'down'
                  ? 'text-[#DB1300] dark:text-[#FF5C7A]'
                  : item.tone === 'flat'
                    ? 'text-muted-foreground'
                    : 'text-[#147153] dark:text-[#3DFFA0]'
              )}
            >
              {item.tone === 'down' ? (
                <TrendingDown className="h-3 w-3" />
              ) : item.tone === 'flat' ? (
                <Minus className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {item.delta}
            </span>
          )}
          <span className="ml-5 h-1 w-1 rounded-full bg-border" />
        </div>
      ))}
    </div>
  );
  return (
    <div className={cn('p57-ticker-mask rounded-2xl border border-border shadow-card', className)}>
      <div className="p57-ticker">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
};

export default KpiTicker;
