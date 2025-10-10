import React, { useEffect, useMemo } from 'react';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { EnhancedTrainerPerformanceSection } from '@/components/dashboard/EnhancedTrainerPerformanceSection';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatCurrency } from '@/utils/formatters';

const TrainerPerformance = () => {
  const { data: payrollData, isLoading } = usePayrollData();
  const { isLoading: globalLoading, setLoading } = useGlobalLoading();

  useEffect(() => {
    setLoading(isLoading, 'Analyzing trainer performance metrics and insights...');
  }, [isLoading, setLoading]);

  const heroMetrics = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];

    const locations = [
      { key: 'Kwality House, Kemps Corner', name: 'Kwality' },
      { key: 'Supreme HQ, Bandra', name: 'Supreme' },
      { key: 'Kenkere House', name: 'Kenkere' }
    ];

    return locations.map(location => {
      const locationData = payrollData.filter(item => 
        location.key === 'Kenkere House' 
          ? item.location?.includes('Kenkere') || item.location === 'Kenkere House'
          : item.location === location.key
      );
      
  const totalSessions = locationData.reduce((sum, item) => sum + (item.totalSessions || 0), 0);
      
      return {
        location: location.name,
        label: 'Total Sessions',
        value: totalSessions.toString()
      };
    });
  }, [payrollData]);

  if (globalLoading) {
    return null; // Global loader will handle this
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <DashboardMotionHero 
        title="Trainer Performance Analytics"
        subtitle="Comprehensive trainer performance metrics, insights, and development opportunities"
        metrics={heroMetrics}
        onExportClick={() => console.log('Exporting trainer data...')}
      />

      <div className="container mx-auto px-6 py-8">
        <main className="space-y-8">
          <EnhancedTrainerPerformanceSection />
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default TrainerPerformance;