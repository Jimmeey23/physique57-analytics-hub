import React from 'react';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { KpiTicker, type TickerItem } from '@/components/ui/KpiTicker';
import { MetricDefinitions, type MetricDefinition } from '@/components/ui/MetricDefinitions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AnalyticsPageShellProps {
  title: string;
  subtitle: string;
  /** Hero stat strip. Also feeds the ticker when `tickerItems` is omitted. */
  heroMetrics?: Array<{ label: string; value: string; change?: string }>;
  tickerItems?: TickerItem[];
  /** Hero-right slot: export buttons and other page-level actions. */
  actions?: React.ReactNode;
  /** Studio/location tabs, rendered above the filter row. */
  locationTabs?: React.ReactNode;
  /** Filter section for the page. */
  filters?: React.ReactNode;
  /** Primary view switcher (SectionTabs), rendered above the content. */
  sectionTabs?: React.ReactNode;
  definitions?: MetricDefinition[];
  error?: string | null;
  errorTitle?: string;
  className?: string;
  children: React.ReactNode;
}

const PageError: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="p57-page flex min-h-screen items-center justify-center p-6">
    <div className="max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-[#2a2a2e] dark:bg-[#141416]">
      <h1 className="text-xl font-bold text-rose-600">{title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  </div>
);

/**
 * One page skeleton for every analytics tab: hero → ticker → location tabs →
 * filters → view switcher → content → metric definitions.
 *
 * Pages differ only in what they put in those slots, so Discounts, Client
 * Retention, Funnel and Expirations read as the same product rather than four
 * separately styled dashboards.
 */
export const AnalyticsPageShell: React.FC<AnalyticsPageShellProps> = ({
  title,
  subtitle,
  heroMetrics,
  tickerItems,
  actions,
  locationTabs,
  filters,
  sectionTabs,
  definitions,
  error,
  errorTitle = 'Data access issue',
  className,
  children,
}) => {
  if (error) return <PageError title={errorTitle} message={error} />;

  const ticker = tickerItems ?? (heroMetrics || []).map((metric) => ({ label: metric.label, value: metric.value }));

  return (
    <div className={cn('p57-page min-h-screen', className)}>
      <DashboardMotionHero title={title} subtitle={subtitle} metrics={heroMetrics || []} extra={actions} />

      {ticker.length > 0 && (
        <div className="container mx-auto px-6 pt-5">
          <KpiTicker items={ticker} />
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        <main className="min-w-0 space-y-8">
          {locationTabs ? <div className="min-w-0">{locationTabs}</div> : null}
          {filters ? <div className="min-w-0" id="filters">{filters}</div> : null}
          {sectionTabs ? <div className="min-w-0">{sectionTabs}</div> : null}
          {children}
          {definitions && definitions.length > 0 ? <MetricDefinitions items={definitions} /> : null}
        </main>
      </div>
    </div>
  );
};

export default AnalyticsPageShell;
