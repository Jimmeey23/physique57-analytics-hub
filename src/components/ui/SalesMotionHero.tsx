import * as React from 'react';
import { Download, LayoutDashboard } from 'lucide-react';
import { PageHero, HeroStat } from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';

type MetricCardData = {
  label: string;
  value: string;
  change?: string;
};

export interface SalesMotionHeroProps {
  title: string;
  subtitle: string;
  metrics: MetricCardData[];
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; onClick?: () => void };
  compact?: boolean;
  onColorChange?: (color: string) => void;
  icons?: Array<{ Icon: React.ElementType; color: string }>;
  extra?: React.ReactNode;
}

function toHeroStats(metrics: MetricCardData[]): HeroStat[] {
  return metrics.map((m) => {
    let tone: HeroStat['deltaTone'] = 'flat';
    if (m.change) {
      if (m.change.trim().startsWith('-')) tone = 'down';
      else if (m.change.trim().startsWith('+') || /up|growth|increase/i.test(m.change)) tone = 'up';
    }
    return { label: m.label, value: m.value, delta: m.change, deltaTone: tone };
  });
}

/**
 * Canonical motion hero — now a calm, polished banner over PageHero.
 * Props preserved for backward compatibility.
 */
export const SalesMotionHero: React.FC<SalesMotionHeroProps> = ({
  title,
  subtitle,
  metrics,
  primaryAction,
  secondaryAction,
  extra,
}) => {
  return (
    <PageHero
      eyebrow="Physique 57 · Analytics"
      title={title}
      description={subtitle}
      stats={toHeroStats(metrics)}
      actions={
        <>
          {extra}
          {primaryAction && (
            <Button
              size="sm"
              onClick={primaryAction.onClick}
              className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <LayoutDashboard className="h-4 w-4" />
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="sm"
              onClick={secondaryAction.onClick}
              className="gap-2 bg-white text-ink hover:bg-white/90 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Download className="h-4 w-4" />
              {secondaryAction.label}
            </Button>
          )}
        </>
      }
    />
  );
};

export default SalesMotionHero;
