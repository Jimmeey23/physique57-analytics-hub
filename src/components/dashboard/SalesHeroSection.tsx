import React from 'react';
import SalesMotionHero from '@/components/ui/SalesMotionHero';
import { ComprehensiveSalesExportButton } from './ComprehensiveSalesExportButton';
import { useNavigate } from 'react-router-dom';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { SalesData } from '@/types/dashboard';

interface SalesHeroSectionProps {
  data: SalesData[];
  historicalData?: SalesData[];
  dateRange?: { start: string | Date; end: string | Date };
  currentLocation: string;
  locationName: string;
}

export const SalesHeroSection: React.FC<SalesHeroSectionProps> = ({ data, historicalData, dateRange, currentLocation, locationName }) => {
  const { metrics } = useSalesMetrics(data, historicalData, { dateRange });
  const [heroColor, setHeroColor] = React.useState<string>('#3b82f6');
  const navigate = useNavigate();
  const exportOpenRef = React.useRef<{ open: () => void }>(null);

  // Make hero accent available globally so components outside the hero (like location tabs) can react.
  React.useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.getPropertyValue('--hero-accent');
    root.style.setProperty('--hero-accent', heroColor);
    console.log('Sales: Setting --hero-accent to:', heroColor);
    return () => {
      // Restore previous value on unmount to avoid leaking across pages
      if (prev) {
        root.style.setProperty('--hero-accent', prev);
      } else {
        root.style.removeProperty('--hero-accent');
      }
    };
  }, [heroColor]);

  // Select only 3 key metrics for hero section
  const metricOrder = [
    'Transactions',
    'Sales Revenue', 
    'Unique Members'
  ];
  
  const heroMetrics = metricOrder
    .map(title => metrics.find(metric => metric.title === title))
    .filter(Boolean)
    .map(metric => ({
      location: metric!.title,
      label: metric!.description,
      value: metric!.value,
      icon: metric!.icon,
      change: metric!.change,
      trend: metric!.changeDetails.trend,
      previousValue: metric!.previousValue
    }));

  return (
    <div style={{ ['--hero-accent' as any]: heroColor }}>
      <SalesMotionHero
        title="Sales & Revenue Analytics"
        subtitle="Track all transactional and payment metrics in one place with real-time, location-aware analytics"
      metrics={heroMetrics.map(m => ({
        label: m.location,
        value: m.value,
        change: m.change != null 
          ? `${m.change > 0 ? '+' : ''}${m.change.toFixed(1)}%`
          : undefined
      }))}
      primaryAction={{ label: 'View Dashboard', onClick: () => navigate('/') }}
      secondaryAction={{ label: 'Export All Sales Data', onClick: () => exportOpenRef.current?.open() }}
        compact
        onColorChange={setHeroColor}
        extra={<ComprehensiveSalesExportButton 
          data={data} 
          currentLocation={currentLocation} 
          locationName={locationName}
          renderTrigger={false}
          openRef={exportOpenRef}
        />}
      />
    </div>
  );
};