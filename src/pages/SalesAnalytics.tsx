import React from 'react';
import { SalesAnalyticsSection } from '@/components/dashboard/SalesAnalyticsSection';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { Footer } from '@/components/ui/footer';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

const SalesAnalytics = () => {
  const { data } = useGoogleSheets();
  const { setLoading } = useGlobalLoading();
  const handleReady = React.useCallback(() => {
    // Hide any global loader immediately when content is ready
    setLoading(false);
  }, [setLoading]);

  return (
    <GlobalFiltersProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-blue-200/15 to-cyan-200/15 rounded-full floating-animation stagger-3"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full morph-shape stagger-2"></div>
        </div>
        
        <div className="relative z-10 slide-in-from-left">
          <SalesAnalyticsSection data={data} onReady={handleReady} />
        </div>
        <Footer />
      </div>
    </GlobalFiltersProvider>
  );
};

export default SalesAnalytics;