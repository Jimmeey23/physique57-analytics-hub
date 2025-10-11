import { useState, useEffect, useCallback } from 'react';
import { FormatFilters } from '@/components/dashboard/FormatAnalysisFilters';

interface UsePresenterModeOptions {
  autoRefreshInterval?: number;
  enableUrlSync?: boolean;
}

interface PresenterSession {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  filters: FormatFilters;
  currentTab: string;
  viewers: number;
}

export const usePresenterMode = (options: UsePresenterModeOptions = {}) => {
  const { 
    autoRefreshInterval = 30000,
    enableUrlSync = true
  } = options;

  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [session, setSession] = useState<PresenterSession | null>(null);
  
  // Parse URL parameters on mount
  useEffect(() => {
    if (!enableUrlSync) return;

    const params = new URLSearchParams(window.location.search);
    const isPresenter = params.get('presenter') === 'true';
    
    if (isPresenter) {
      const filters: FormatFilters = {
        dateRange: {
          start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          period: (params.get('datePreset') as any) || 'ytd'
        },
        locations: params.get('locations')?.split(',').filter(Boolean) || [],
        formats: params.get('formats')?.split(',').filter(Boolean) as ('cycle' | 'barre' | 'strength')[] || ['cycle', 'barre', 'strength'],
        compareBy: 'format',
        showEmpty: true
      };

      const currentTab = params.get('tab') || 'overview';
      
      enterPresenterMode(filters, currentTab);
    }
  }, [enableUrlSync]);

  // Generate session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Enter presenter mode
  const enterPresenterMode = useCallback((
    initialFilters?: FormatFilters, 
    initialTab?: string
  ) => {
    const newSession: PresenterSession = {
      id: generateSessionId(),
      createdAt: new Date(),
      lastActivity: new Date(),
      viewers: 1,
      currentTab: initialTab || 'overview',
      filters: initialFilters || {
        dateRange: {
          start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          period: 'ytd'
        },
        locations: [],
        formats: ['cycle', 'barre', 'strength'],
        compareBy: 'format',
        showEmpty: true
      }
    };

    setSession(newSession);
    setIsPresenterMode(true);

    // Update URL if sync is enabled
    if (enableUrlSync && !window.location.search.includes('presenter=true')) {
      const params = new URLSearchParams({
        presenter: 'true',
        tab: newSession.currentTab,
        formats: newSession.filters.formats.join(','),
        locations: newSession.filters.locations.join(','),
        datePreset: newSession.filters.dateRange.period
      });
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [enableUrlSync]);

  // Exit presenter mode
  const exitPresenterMode = useCallback(() => {
    setIsPresenterMode(false);
    setSession(null);

    // Clean URL if sync is enabled
    if (enableUrlSync) {
      const url = new URL(window.location.href);
      url.searchParams.delete('presenter');
      url.searchParams.delete('tab');
      url.searchParams.delete('formats');
      url.searchParams.delete('locations');
      url.searchParams.delete('datePreset');
      
      const cleanUrl = url.searchParams.toString() 
        ? `${url.pathname}?${url.searchParams.toString()}`
        : url.pathname;
      
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [enableUrlSync]);

  // Update session state
  const updateSession = useCallback((updates: Partial<PresenterSession>) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: new Date()
    };

    setSession(updatedSession);

    // Update URL if sync is enabled
    if (enableUrlSync && (updates.filters || updates.currentTab)) {
      const params = new URLSearchParams(window.location.search);
      
      if (updates.currentTab) {
        params.set('tab', updates.currentTab);
      }
      
      if (updates.filters) {
        params.set('formats', updates.filters.formats.join(','));
        params.set('locations', updates.filters.locations.join(','));
        params.set('datePreset', updates.filters.dateRange.period);
      }
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [session, enableUrlSync]);

  // Generate shareable URL
  const generateShareableUrl = useCallback(() => {
    if (!session) return '';

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({
      presenter: 'true',
      tab: session.currentTab,
      formats: session.filters.formats.join(','),
      locations: session.filters.locations.join(','),
      datePreset: session.filters.dateRange.period,
      sessionId: session.id
    });

    return `${baseUrl}?${params.toString()}`;
  }, [session]);

  // Copy share URL to clipboard
  const sharePresentation = useCallback(async () => {
    const url = generateShareableUrl();
    if (!url) return false;

    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      console.error('Failed to copy URL:', err);
      return false;
    }
  }, [generateShareableUrl]);

  // Join existing session (for shared links)
  const joinSession = useCallback(async (sessionId: string) => {
    // In a real implementation, you would fetch session data from a server
    // For now, we'll simulate it with URL parameters
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('sessionId') === sessionId) {
      const filters: FormatFilters = {
        dateRange: {
          start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          period: (params.get('datePreset') as any) || 'ytd'
        },
        locations: params.get('locations')?.split(',').filter(Boolean) || [],
        formats: params.get('formats')?.split(',').filter(Boolean) as ('cycle' | 'barre' | 'strength')[] || ['cycle', 'barre', 'strength'],
        compareBy: 'format',
        showEmpty: true
      };

      const currentTab = params.get('tab') || 'overview';
      
      // Create a viewer session (not the main presenter)
      const viewerSession: PresenterSession = {
        id: sessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
        viewers: 1, // This would be fetched from server in real implementation
        currentTab,
        filters
      };

      setSession(viewerSession);
      setIsPresenterMode(true);
      return true;
    }

    return false;
  }, []);

  return {
    // State
    isPresenterMode,
    session,
    
    // Actions
    enterPresenterMode,
    exitPresenterMode,
    updateSession,
    sharePresentation,
    joinSession,
    generateShareableUrl,
    
    // Utils
    sessionId: session?.id,
    viewers: session?.viewers || 0,
    isActive: isPresenterMode && session !== null
  };
};

export default usePresenterMode;