import { useState, useEffect, useCallback } from 'react';
import { listOfflineDatasets } from '@/lib/offlineDataStore';
import { seedBundledOfflineDatasets } from '@/lib/offlineDataStore';
import { OfflineDatasetSummary } from '@/types/offlineData';

export const useDataFreshness = () => {
  const [datasets, setDatasets] = useState<OfflineDatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFreshness = useCallback(async () => {
    setLoading(true);
    try {
      const summaries = await listOfflineDatasets();
      setDatasets(summaries);
    } catch (error) {
      console.error('Failed to fetch data freshness:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await seedBundledOfflineDatasets();
      await fetchFreshness();
    } catch (error) {
      console.error('Failed to refresh datasets:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFreshness]);

  useEffect(() => {
    fetchFreshness();
    
    // Refresh whenever an upload might have happened
    const handleRefresh = () => fetchFreshness();
    window.addEventListener('p57-datasets-updated', handleRefresh);
    return () => window.removeEventListener('p57-datasets-updated', handleRefresh);
  }, [fetchFreshness]);

  return { datasets, loading, refresh: refreshData };
};
