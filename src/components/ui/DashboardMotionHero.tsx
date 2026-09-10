import React from 'react';
import { useNavigate } from 'react-router-dom';
import SalesMotionHero from '@/components/ui/SalesMotionHero';

export type DashboardMotionHeroProps = {
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string; change?: string }>;
  icons?: Array<{ Icon: React.ElementType; color: string }>;
  extra?: React.ReactNode;
  onDashboardClick?: () => void;
  onExportClick?: () => void;
  compact?: boolean;
};

export const DashboardMotionHero: React.FC<DashboardMotionHeroProps> = ({
  title,
  subtitle,
  metrics,
  icons,
  extra,
  onDashboardClick,
  onExportClick,
  compact = true,
}) => {
  const navigate = useNavigate();
  const defaultGoHome = React.useCallback(() => navigate('/'), [navigate]);

  return (
    <SalesMotionHero
      title={title}
      subtitle={subtitle}
      metrics={metrics}
      primaryAction={{ label: 'View Dashboard', onClick: onDashboardClick ?? defaultGoHome }}
      secondaryAction={extra || !onExportClick ? undefined : { label: 'Export Report', onClick: onExportClick }}
      compact={compact}
      icons={icons}
      extra={extra}
    />
  );
};

export default DashboardMotionHero;
