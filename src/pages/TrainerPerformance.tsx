import React, { useEffect, useMemo } from 'react';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { EnhancedTrainerPerformanceSection } from '@/components/dashboard/EnhancedTrainerPerformanceSection';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatCurrency } from '@/utils/formatters';
import '@/components/dashboard/trainer-performance-styles.css';

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
      
      const totalTrainers = new Set(locationData.map(item => item.teacherName)).size;
      const totalSessions = locationData.reduce((sum, item) => sum + (item.totalSessions || 0), 0);
      const totalRevenue = locationData.reduce((sum, item) => sum + (item.totalPaid || 0), 0);
      const avgRevenuePerTrainer = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;
      
      return {
        location: location.name,
        label: `${totalTrainers} Trainers`,
        value: formatCurrency(avgRevenuePerTrainer),
        subtitle: `Avg ₹${(avgRevenuePerTrainer/1000).toFixed(0)}K/trainer`
      };
    });
  }, [payrollData]);

  if (globalLoading) {
    return null; // Global loader will handle this
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full floating-animation stagger-1"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-blue-200/15 to-cyan-200/15 rounded-full floating-animation stagger-3"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full morph-shape stagger-2"></div>
      </div>
      
      <div className="relative z-10 slide-in-from-left">
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
    </div>
  );
};

export default TrainerPerformance;