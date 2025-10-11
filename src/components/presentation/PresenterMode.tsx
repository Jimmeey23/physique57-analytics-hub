import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Presentation, 
  Share2, 
  RefreshCw, 
  Maximize, 
  Minimize, 
  Play, 
  Pause,
  ChevronLeft,
  ChevronRight,
  Copy,
  Link,
  Users,
  Eye,
  Settings,
  X
} from 'lucide-react';

// Import existing components
import { FormatMetricsAnalysis } from '../dashboard/FormatMetricsAnalysis';
import { usePayrollData } from '@/hooks/usePayrollData';
import { FormatFilters } from '../dashboard/FormatAnalysisFilters';

interface PresenterModeProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  initialFilters?: FormatFilters;
}

interface PresenterState {
  currentTab: string;
  filters: FormatFilters;
  autoRefresh: boolean;
  refreshInterval: number;
  isFullscreen: boolean;
  showControls: boolean;
  viewers: number;
}

export const PresenterMode: React.FC<PresenterModeProps> = ({
  isOpen,
  onClose,
  initialTab = 'overview',
  initialFilters
}) => {
  const { data: payrollData, loading, error, refetch } = usePayrollData();
  
  const [presenterState, setPresenterState] = useState<PresenterState>({
    currentTab: initialTab,
    filters: initialFilters || {
      dateRange: {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(),
        preset: 'ytd'
      },
      locations: [],
      formats: ['cycle', 'barre', 'strength'],
      comparisonType: 'absolute'
    },
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    isFullscreen: false,
    showControls: true,
    viewers: 1
  });

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [shareUrl, setShareUrl] = useState('');

  // Auto-refresh functionality
  useEffect(() => {
    if (!presenterState.autoRefresh || !isOpen) return;

    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, presenterState.refreshInterval);

    return () => clearInterval(interval);
  }, [presenterState.autoRefresh, presenterState.refreshInterval, isOpen, refetch]);

  // Generate shareable URL with current state
  const generateShareUrl = useCallback(() => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      presenter: 'true',
      tab: presenterState.currentTab,
      formats: presenterState.filters.formats.join(','),
      locations: presenterState.filters.locations.join(','),
      datePreset: presenterState.filters.dateRange.preset,
      autoRefresh: presenterState.autoRefresh.toString()
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    setShareUrl(url);
    return url;
  }, [presenterState]);

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    const url = generateShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case ' ':
          event.preventDefault();
          toggleAutoRefresh();
          break;
        case 'c':
        case 'C':
          event.ctrlKey && copyShareUrl();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          refetch();
          setLastRefresh(new Date());
          break;
        case 'h':
        case 'H':
          setPresenterState(prev => ({ ...prev, showControls: !prev.showControls }));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setPresenterState(prev => ({ ...prev, isFullscreen: true }));
      } else {
        await document.exitFullscreen();
        setPresenterState(prev => ({ ...prev, isFullscreen: false }));
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const toggleAutoRefresh = () => {
    setPresenterState(prev => ({ 
      ...prev, 
      autoRefresh: !prev.autoRefresh 
    }));
  };

  const updateFilters = (newFilters: FormatFilters) => {
    setPresenterState(prev => ({ 
      ...prev, 
      filters: newFilters 
    }));
  };

  const changeTab = (tab: string) => {
    setPresenterState(prev => ({ 
      ...prev, 
      currentTab: tab 
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Presenter Controls Header */}
      <div className={`absolute top-0 left-0 right-0 z-60 transition-all duration-300 ${
        presenterState.showControls ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="bg-black/80 backdrop-blur-sm text-white p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            {/* Left Section - Mode Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-blue-400" />
                <span className="font-semibold">Presenter Mode</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Users className="h-4 w-4" />
                <span>{presenterState.viewers} viewer{presenterState.viewers !== 1 ? 's' : ''}</span>
              </div>

              <Badge 
                variant={presenterState.autoRefresh ? "default" : "secondary"}
                className={presenterState.autoRefresh ? "bg-green-600" : ""}
              >
                {presenterState.autoRefresh ? (
                  <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Auto-refresh</>
                ) : (
                  <><Pause className="h-3 w-3 mr-1" /> Paused</>
                )}
              </Badge>

              <span className="text-xs text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>

            {/* Right Section - Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyShareUrl}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoRefresh}
                className="text-white hover:bg-white/20"
              >
                {presenterState.autoRefresh ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {presenterState.autoRefresh ? 'Pause' : 'Resume'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  refetch();
                  setLastRefresh(new Date());
                }}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {presenterState.isFullscreen ? (
                  <Minimize className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize className="h-4 w-4 mr-2" />
                )}
                {presenterState.isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`h-full overflow-auto transition-all duration-300 ${
        presenterState.showControls ? 'pt-20' : 'pt-2'
      }`}>
        <div className="container mx-auto p-6 h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-xl">Loading presentation data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="text-red-400 text-xl mb-4">Failed to load data</div>
                <Button onClick={refetch} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <FormatMetricsAnalysis 
                data={payrollData || []}
                initialFilters={presenterState.filters}
                onFiltersChange={updateFilters}
                presenterMode={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Control Hints */}
      <div className={`absolute bottom-4 left-4 text-white/70 text-sm transition-all duration-300 ${
        presenterState.showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 space-y-1">
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">H</kbd> to hide/show controls</div>
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">F</kbd> for fullscreen</div>
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">Space</kbd> to toggle auto-refresh</div>
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">Esc</kbd> to exit</div>
        </div>
      </div>
    </div>
  );
};