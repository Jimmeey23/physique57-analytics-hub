import React, { useState } from 'react';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { formatDistanceToNow, parseISO, differenceInHours } from 'date-fns';
import { 
  Database, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  RefreshCw, 
  Cloud, 
  FileBox, 
  Upload,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const DataFreshnessBar: React.FC = () => {
  const { datasets, loading, refresh } = useDataFreshness();
  const [isExpanded, setIsExpanded] = useState(false);

  if (datasets.length === 0 && !loading) return null;

  const oldestDataset = datasets
    .filter(d => d.updatedAt)
    .sort((a, b) => new Date(a.updatedAt!).getTime() - new Date(b.updatedAt!).getTime())[0];

  const hasStaleData = datasets.some(d => {
    if (!d.updatedAt) return false;
    return differenceInHours(new Date(), parseISO(d.updatedAt)) > 24;
  });

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'remote':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 h-5 text-[10px] py-0"><Cloud className="h-3 w-3" /> Remote</Badge>;
      case 'bundle':
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1 h-5 text-[10px] py-0"><FileBox className="h-3 w-3" /> Bundle</Badge>;
      case 'upload':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 h-5 text-[10px] py-0"><Upload className="h-3 w-3" /> Upload</Badge>;
      default:
        return null;
    }
  };

  const formatFreshness = (dateStr?: string) => {
    if (!dateStr) return 'No data';
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg transition-all duration-300 ease-in-out",
      isExpanded ? "max-h-96" : "max-h-12"
    )}>
      {/* Header / Summary Bar */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 h-12 cursor-pointer hover:bg-slate-50",
          hasStaleData && !isExpanded && "bg-amber-50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Database className={cn("h-4 w-4", hasStaleData ? "text-amber-500" : "text-blue-500")} />
          <span className="text-sm font-medium whitespace-nowrap">Data Freshness</span>
          
          {!isExpanded && (
            <div className="hidden md:flex items-center gap-2 overflow-hidden">
              <span className="text-xs text-muted-foreground truncate">
                {oldestDataset ? `Last updated: ${formatFreshness(oldestDataset.updatedAt)}` : 'Loading status...'}
              </span>
              {hasStaleData && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] h-5 py-0 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Stale Data Warning
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => {
                    e.stopPropagation();
                    refresh();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t bg-white overflow-y-auto max-h-[calc(96px*3)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {datasets.map((dataset) => {
              const isStale = dataset.updatedAt && differenceInHours(new Date(), parseISO(dataset.updatedAt)) > 24;
              
              return (
                <div 
                  key={dataset.key} 
                  className={cn(
                    "p-3 rounded-lg border flex flex-col gap-1.5 transition-colors",
                    isStale ? "bg-amber-50/50 border-amber-100" : "bg-slate-50/50 border-slate-100"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-tight text-slate-600">{dataset.label}</span>
                    {getSourceBadge(dataset.source)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatFreshness(dataset.updatedAt)}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white border border-slate-200">
                      {dataset.rowCount.toLocaleString()} rows
                    </span>
                  </div>

                  {isStale && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Older than 24 hours
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Cloud className="h-3 w-3 text-green-500" /> Remote API</span>
              <span className="flex items-center gap-1"><FileBox className="h-3 w-3 text-slate-500" /> Built-in Demo Data</span>
              <span className="flex items-center gap-1"><Upload className="h-3 w-3 text-blue-500" /> User CSV Upload</span>
            </div>
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              Dataset status is tracked locally in your browser.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
