import React, { useMemo, useEffect } from 'react';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useNewCsvData } from '@/hooks/useNewCsvData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { OutlierAnalysisSection } from '@/components/dashboard/OutlierAnalysisSection';

const OutlierAnalysisContent = () => {
  const { data: salesData, loading: salesLoading } = useNewCsvData();
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();
  const { setLoading } = useGlobalLoading();

  const loading = salesLoading || sessionsLoading;

  // Sync loading state with global loader
  useEffect(() => {
    setLoading(loading, 'Loading outlier analysis data...');
  }, [loading, setLoading]);

  const heroMetrics = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    // Filter for April 2025 and August 2025
    const april2025Data = salesData.filter(item => {
      const date = new Date(item.paymentDate);
      return date.getFullYear() === 2025 && date.getMonth() === 3; // April = month 3
    });

    const august2025Data = salesData.filter(item => {
      const date = new Date(item.paymentDate);
      return date.getFullYear() === 2025 && date.getMonth() === 7; // August = month 7
    });

    const aprilRevenue = april2025Data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const augustRevenue = august2025Data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    
    const aprilTransactions = april2025Data.length;
    const augustTransactions = august2025Data.length;

    const aprilNewClients = new Set(
      april2025Data
        .filter(item => item.productName?.toLowerCase().includes('intro') || 
                       item.productName?.toLowerCase().includes('new client'))
        .map(item => item.memberId || item.customerEmail)
    ).size;

    const augustNewClients = new Set(
      august2025Data
        .filter(item => item.productName?.toLowerCase().includes('intro') || 
                       item.productName?.toLowerCase().includes('new client'))
        .map(item => item.memberId || item.customerEmail)
    ).size;

    return [
      {
        location: 'April 2025',
        label: 'Total Revenue',
        value: formatCurrency(aprilRevenue),
        subValue: `${formatNumber(aprilTransactions)} transactions`
      },
      {
        location: 'August 2025',
        label: 'Total Revenue',
        value: formatCurrency(augustRevenue),
        subValue: `${formatNumber(augustTransactions)} transactions`
      },
      {
        location: 'April 2025',
        label: 'New Clients',
        value: formatNumber(aprilNewClients),
        subValue: 'First-time purchases'
      },
      {
        location: 'August 2025',
        label: 'New Clients',
        value: formatNumber(augustNewClients),
        subValue: 'First-time purchases'
      }
    ];
  }, [salesData]);

  if (loading) {
    return null; // Global loader handles this
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-white/40 backdrop-blur-[0.5px]"></div>
      <div className="relative z-10">
        <DashboardMotionHero 
          title="Outlier Analysis: April & August 2025"
          subtitle="Deep dive into performance drivers, client acquisition patterns, and revenue composition for exceptional months"
          metrics={heroMetrics}
          onExportClick={() => console.log('Exporting outlier analysis data...')}
        />

        <div className="container mx-auto px-6 py-8">
          <OutlierAnalysisSection 
            salesData={salesData || []}
            sessionsData={sessionsData || []}
          />
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

const OutlierAnalysis = () => {
  return <OutlierAnalysisContent />;
};

export default OutlierAnalysis;
