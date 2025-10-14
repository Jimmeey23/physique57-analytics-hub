import { useState, useEffect } from 'react';
import { externalDocumentService, ExternalDocumentData } from '@/services/externalDocumentService';

interface UseExternalDocumentDataProps {
  isKwalitySelected: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseExternalDocumentDataReturn {
  data: ExternalDocumentData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing external document data when Kwality House is selected
 * Automatically fetches data when Kwality is selected and manages caching
 */
export const useExternalDocumentData = ({
  isKwalitySelected,
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutes
}: UseExternalDocumentDataProps): UseExternalDocumentDataReturn => {
  const [data, setData] = useState<ExternalDocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isKwalitySelected) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const documentData = await externalDocumentService.fetchDocumentData();
      setData(documentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch external data');
      console.error('External document data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when Kwality is selected
  useEffect(() => {
    if (isKwalitySelected) {
      fetchData();
    } else {
      setData(null);
      setError(null);
    }
  }, [isKwalitySelected]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isKwalitySelected) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isKwalitySelected]);

  const refresh = async () => {
    externalDocumentService.clearCache();
    await fetchData();
  };

  return {
    data,
    loading,
    error,
    refresh
  };
};