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
};

export const DashboardMotionHero: React.FC<DashboardMotionHeroProps> = ({
  title,
  subtitle,
  metrics,
  icons,
  extra,
  onDashboardClick,
  onExportClick,
}) => {
  const [heroColor, setHeroColor] = React.useState('#3b82f6');
  const navigate = useNavigate();
  const defaultGoHome = React.useCallback(() => navigate('/'), [navigate]);

  return (
    <div style={{ ['--hero-accent' as any]: heroColor }}>
      <SalesMotionHero
        title={title}
        subtitle={subtitle}
        metrics={metrics}
        primaryAction={{ label: 'View Dashboard', onClick: onDashboardClick ?? defaultGoHome }}
        secondaryAction={extra || !onExportClick ? undefined : { label: 'Export Report', onClick: onExportClick }}
        compact
        onColorChange={setHeroColor}
        icons={icons}
        extra={extra}
      />
    </div>
  );
};

export default DashboardMotionHero;
