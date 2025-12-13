import React from 'react';
import { Footer } from '@/components/ui/footer';
import { LocationReportComprehensive } from '@/components/dashboard/LocationReportComprehensive';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

const LocationReportPage = () => {
  const { setLoading } = useGlobalLoading();
  const [isReady, setIsReady] = React.useState(false);

  const handleReady = React.useCallback(() => {
    setIsReady(true);
    setLoading(false);
  }, [setLoading]);

  React.useEffect(() => {
    setLoading(true, 'Loading location reports...');
  }, [setLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Location Performance Reports</h1>
          <p className="text-gray-600 mt-2">Detailed analysis for each studio location with comprehensive metrics and insights</p>
        </div>

        <LocationReportComprehensive onReady={handleReady} />
      </div>

      <Footer />
    </div>
  );
};

export default LocationReportPage;
