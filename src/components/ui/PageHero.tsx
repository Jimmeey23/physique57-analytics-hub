import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeroStat {
  value: string;
  label: string;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
}

interface PageHeroProps {
  eyebrow: string;
  icon?: LucideIcon;
  title: string;
  /** Wrap the accent word in <em> via `accentWord`, e.g. title="Sales *Analytics*" */
  description?: string;
  stats?: HeroStat[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function renderTitle(title: string) {
  // Support "Word *accent*" → serif italic blue accent (Athena wordmark style)
  const parts = title.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

/**
 * The single canonical page hero: white panel, blue glow, serif title,
 * pastel eyebrow badge, serif KPI strip. Dark-aware.
 */
export const PageHero: React.FC<PageHeroProps> = ({
  eyebrow,
  icon: Icon,
  title,
  description,
  stats = [],
  actions,
  children,
  className,
}) => {
  return (
    <section className={cn('p57-hero p57-enter', className)}>
      <div className="relative z-10 px-5 py-6 md:px-7 md:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <span className="p57-hero-badge">
              {Icon && <Icon className="h-3 w-3" />}
              {eyebrow}
            </span>
            <h1 className="p57-hero-title mt-3">{renderTitle(title)}</h1>
            {description && <p className="p57-hero-sub mt-2">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        {stats.length > 0 && (
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-3 lg:grid-cols-4">
            {stats.slice(0, 8).map((s, i) => (
              <div key={i} className="min-w-0">
                <dd className="p57-hero-stat-value truncate">
                  {s.value}
                  {s.delta && (
                    <span
                      className={cn(
                        'ml-2 align-middle font-sans text-[11px] font-bold',
                        s.deltaTone === 'down'
                          ? 'text-[#c23333] dark:text-[#fb7185]'
                          : s.deltaTone === 'flat'
                            ? 'text-muted-foreground'
                            : 'text-[#147153] dark:text-[#4ade9e]'
                      )}
                    >
                      {s.delta}
                    </span>
                  )}
                </dd>
                <dt className="p57-hero-stat-label truncate">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}

        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  );
};

export default PageHero;
