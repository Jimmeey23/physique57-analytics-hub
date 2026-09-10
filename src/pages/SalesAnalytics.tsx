import React, { useEffect } from 'react';
import { SalesAnalyticsSection } from '@/components/dashboard/SalesAnalyticsSection';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const SalesAnalytics = () => {
  const { data, loading, error, refetch } = useGoogleSheets();
  const { setLoading } = useGlobalLoading();
  const handleReady = React.useCallback(() => {
    // Hide any global loader immediately when content is ready
    setLoading(false);
  }, [setLoading]);

  // Tie the global loader to the Google Sheets loading state
  useEffect(() => {
    setLoading(loading, 'Loading sales analytics data...');
  }, [loading, setLoading]);

  return (
    <GlobalFiltersProvider>
      <div className="min-h-screen bg-white relative overflow-hidden">
        
        <div className="relative z-10">
          {loading ? (
            <div className="container mx-auto px-6 py-10">
              <LoadingSkeleton type="full-page" />
            </div>
          ) : error ? (
            <div className="container mx-auto px-6 py-10">
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl shadow-sm">
                <div className="font-semibold text-lg mb-1">Failed to load sales data</div>
                <div className="text-sm opacity-90 mb-4">{String(error)}</div>
                <button
                  onClick={refetch}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white text-slate-800 slide-in-from-left">
              <SalesAnalyticsSection data={data} onReady={handleReady} />
            </div>
          )}
        </div>
      </div>
    </GlobalFiltersProvider>
  );
};

export default SalesAnalytics;