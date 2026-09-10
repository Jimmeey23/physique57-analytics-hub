import React from 'react';
import { Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHero } from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';

interface MetricData {
  label: string;
  value: string;
  location: string;
  change?: number;
  trend?: 'strong' | 'moderate' | 'weak';
  icon?: React.ComponentType<any>;
}

export interface ModernHeroSectionProps {
  title: string;
  subtitle: string;
  variant: 'sales' | 'client' | 'trainer' | 'sessions' | 'discounts' | 'funnel' | 'attendance' | 'powercycle' | 'expiration' | 'cancellations' | 'summary';
  onExport?: () => void;
  showHomeButton?: boolean;
  metrics?: MetricData[];
  exportButton?: React.ReactNode;
  location?: string;
  compact?: boolean;
}

const VARIANT_EYEBROW: Record<ModernHeroSectionProps['variant'], string> = {
  sales: 'Sales Analytics',
  client: 'Client Analytics',
  trainer: 'Trainer Analytics',
  sessions: 'Sessions Analytics',
  discounts: 'Discounts & Promotions',
  funnel: 'Funnel & Leads',
  attendance: 'Class Attendance',
  powercycle: 'PowerCycle vs Barre',
  expiration: 'Expiration Analytics',
  cancellations: 'Late Cancellations',
  summary: 'Executive Summary',
};

/**
 * Modern hero — unified over PageHero. Props preserved for compatibility.
 */
export const ModernHeroSection: React.FC<ModernHeroSectionProps> = ({
  title,
  subtitle,
  variant,
  onExport,
  showHomeButton = true,
  metrics = [],
  exportButton,
}) => {
  const navigate = useNavigate();

  return (
    <PageHero
      eyebrow={VARIANT_EYEBROW[variant] ?? 'Analytics'}
      title={title}
      description={subtitle}
      stats={metrics.map((m) => ({
        label: m.location ? `${m.label} · ${m.location}` : m.label,
        value: m.value,
        delta: typeof m.change === 'number' ? `${m.change > 0 ? '+' : ''}${m.change}%` : undefined,
        deltaTone: typeof m.change === 'number' ? (m.change > 0 ? 'up' : m.change < 0 ? 'down' : 'flat') : 'flat',
      }))}
      actions={
        <>
          {showHomeButton && (
            <Button
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          )}
          {exportButton}
          {!exportButton && onExport && (
            <Button size="sm" onClick={onExport} className="gap-2 bg-white text-ink hover:bg-white/90 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </>
      }
    />
  );
};

export default ModernHeroSection;
