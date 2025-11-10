import React, { useMemo, useEffect } from 'react';
import { Footer } from '@/components/ui/footer';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { OutlierAnalysisSection } from '@/components/dashboard/OutlierAnalysisSection';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';

const OutlierAnalysisContent = () => {
  const { data: salesData, loading: salesLoading, error: salesError, refetch } = useGoogleSheets();
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();
  const { data: checkinsData, loading: checkinsLoading } = useCheckinsData();
  const { data: expirationsData, loading: expirationsLoading } = useExpirationsData();
  const { data: leadsData, loading: leadsLoading } = useLeadsData();
  const { data: newClientData, loading: newClientLoading } = useNewClientData();
  const { setLoading } = useGlobalLoading();

  const loading = salesLoading || sessionsLoading || checkinsLoading || expirationsLoading || leadsLoading || newClientLoading;
  const error = salesError;

  const handleReady = React.useCallback(() => {
    // Hide any global loader immediately when content is ready
    setLoading(false);
  }, [setLoading]);

  // Tie the global loader to the loading state
  useEffect(() => {
    setLoading(loading, 'Loading outlier analysis data...');
  }, [loading, setLoading]);

  const heroMetrics = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    console.log('🔍 Outlier Analysis - Total sales data records:', salesData.length);
    
    // Sample a few dates to understand the format
    if (salesData.length > 0) {
      console.log('📅 Sample payment dates:', salesData.slice(0, 5).map(item => ({
        original: item.paymentDate,
        parsed: new Date(item.paymentDate),
        year: new Date(item.paymentDate).getFullYear(),
        month: new Date(item.paymentDate).getMonth()
      })));
    }

    const april2025Data = salesData.filter(item => {
      if (!item.paymentDate) return false;
      const date = new Date(item.paymentDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      return year === 2025 && month === 3; // April = month 3 (0-indexed)
    });

    const august2025Data = salesData.filter(item => {
      if (!item.paymentDate) return false;
      const date = new Date(item.paymentDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      return year === 2025 && month === 7; // August = month 7 (0-indexed)
    });

    console.log('📊 April 2025 records:', april2025Data.length);
    console.log('📊 August 2025 records:', august2025Data.length);

    const aprilRevenue = april2025Data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const augustRevenue = august2025Data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    
    console.log('💰 April 2025 revenue:', aprilRevenue);
    console.log('💰 August 2025 revenue:', augustRevenue);
    
    const aprilTransactions = april2025Data.length;
    const augustTransactions = august2025Data.length;

    const aprilNewClients = new Set(
      april2025Data
        .filter(item => {
          const product = (item.cleanedProduct || item.paymentItem || '').toLowerCase();
          return product.includes('intro') || product.includes('new client') || product.includes('trial') || product.includes('first time');
        })
        .map(item => item.memberId || item.customerEmail)
    ).size;

    const augustNewClients = new Set(
      august2025Data
        .filter(item => {
          const product = (item.cleanedProduct || item.paymentItem || '').toLowerCase();
          return product.includes('intro') || product.includes('new client') || product.includes('trial') || product.includes('first time');
        })
        .map(item => item.memberId || item.customerEmail)
    ).size;

    return [
      { location: 'April 2025', label: 'Total Revenue', value: formatCurrency(aprilRevenue), subValue: `${formatNumber(aprilTransactions)} transactions` },
      { location: 'August 2025', label: 'Total Revenue', value: formatCurrency(augustRevenue), subValue: `${formatNumber(augustTransactions)} transactions` },
      { location: 'April 2025', label: 'New Clients', value: formatNumber(aprilNewClients), subValue: 'First-time purchases' },
      { location: 'August 2025', label: 'New Clients', value: formatNumber(augustNewClients), subValue: 'First-time purchases' }
    ];
  }, [salesData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="container mx-auto px-6 py-10">
            <LoadingSkeleton type="full-page" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
        </div>
        
        <div className="relative z-10">
          <div className="container mx-auto px-6 py-10">
            <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl shadow-sm">
              <div className="font-semibold text-lg mb-1">Failed to load outlier analysis data</div>
              <div className="text-sm opacity-90 mb-4">{String(error)}</div>
              <button 
                onClick={refetch} 
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
      </div>
      
      <div className="relative z-10">
        <div className="bg-white text-slate-800 slide-in-from-left">
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
              checkinsData={checkinsData || []}
              expirationsData={expirationsData || []}
              leadsData={leadsData || []}
              newClientData={newClientData || []}
            />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

const OutlierAnalysis = () => {
  return (
    <GlobalFiltersProvider>
      <OutlierAnalysisContent />
    </GlobalFiltersProvider>
  );
};

export default OutlierAnalysis;
