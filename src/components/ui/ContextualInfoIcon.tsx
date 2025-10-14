import React, { useState } from 'react';
import { Info, X, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ContextualInfo {
  title: string;
  insights?: string[];
  recommendations?: string[];
  trends?: string[];
  actionItems?: string[];
  metrics?: Array<{
    name: string;
    performance: string;
    metrics: string;
  }>;
  notes?: string[];
  tips?: string[];
  analysis?: string[];
  stories?: string[];
  peakTimes?: string[];
  utilization?: string[];
  optimization?: string[];
  marketTrends?: string[];
  opportunities?: string[];
  keyMetrics?: string[];
  topProducts?: string[];
  topCategories?: string[];
  topPerformers?: string[];
  bottomPerformers?: string[];
  strategies?: string[];
  preferences?: string[];
}

interface ContextualInfoIconProps {
  info: ContextualInfo;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
  onRefresh?: () => void;
  loading?: boolean;
}

export const ContextualInfoIcon: React.FC<ContextualInfoIconProps> = ({
  info,
  className = '',
  size = 'sm',
  variant = 'outline',
  onRefresh,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const renderInfoSection = (title: string, items: string[] | undefined, icon?: React.ReactNode) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-sm text-gray-800">{title}</h4>
        </div>
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderMetricsSection = (metrics: Array<{ name: string; performance: string; metrics: string }> | undefined) => {
    if (!metrics || metrics.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-800">Top Performers</h4>
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded-md">
              <div className="font-medium text-xs text-gray-800">{metric.name}</div>
              <div className="text-xs text-gray-600 mt-0.5">{metric.performance}</div>
              <Badge variant="secondary" className="text-xs mt-1">{metric.metrics}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasContent = info.insights?.length || 
                   info.recommendations?.length || 
                   info.trends?.length || 
                   info.actionItems?.length ||
                   info.metrics?.length ||
                   info.notes?.length ||
                   info.tips?.length ||
                   info.analysis?.length ||
                   info.stories?.length ||
                   info.peakTimes?.length ||
                   info.utilization?.length ||
                   info.optimization?.length ||
                   info.marketTrends?.length ||
                   info.opportunities?.length ||
                   info.keyMetrics?.length ||
                   info.topProducts?.length ||
                   info.topCategories?.length ||
                   info.topPerformers?.length ||
                   info.bottomPerformers?.length ||
                   info.strategies?.length ||
                   info.preferences?.length;

  if (!hasContent) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={`${buttonSizeClasses[size]} ${className} hover:bg-blue-50 hover:text-blue-600 transition-colors`}
        >
          <Info className={sizeClasses[size]} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="right" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">{info.title}</h3>
              <Badge variant="outline" className="text-xs">Kwality Insights</Badge>
            </div>
            <div className="flex items-center gap-1">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {/* Metrics Section */}
              {info.metrics && renderMetricsSection(info.metrics)}
              
              {/* Insights */}
              {renderInfoSection('Key Insights', info.insights, '💡')}
              
              {/* Recommendations */}
              {renderInfoSection('Recommendations', info.recommendations, '🎯')}
              
              {/* Trends */}
              {renderInfoSection('Trends', info.trends, '📈')}
              
              {/* Action Items */}
              {renderInfoSection('Action Items', info.actionItems, '✅')}
              
              {/* Notes */}
              {renderInfoSection('Performance Notes', info.notes, '📝')}
              
              {/* Tips */}
              {renderInfoSection('Tips', info.tips, '💡')}
              
              {/* Analysis */}
              {renderInfoSection('Analysis', info.analysis, '🔍')}
              
              {/* Success Stories */}
              {renderInfoSection('Success Stories', info.stories, '🌟')}
              
              {/* Peak Times */}
              {renderInfoSection('Peak Times', info.peakTimes, '⏰')}
              
              {/* Utilization */}
              {renderInfoSection('Utilization', info.utilization, '📊')}
              
              {/* Optimization */}
              {renderInfoSection('Optimization', info.optimization, '⚡')}
              
              {/* Market Trends */}
              {renderInfoSection('Market Trends', info.marketTrends, '🌍')}
              
              {/* Opportunities */}
              {renderInfoSection('Opportunities', info.opportunities, '🚀')}
              
              {/* Key Metrics */}
              {renderInfoSection('Key Metrics', info.keyMetrics, '📊')}
              
              {/* Top Products */}
              {renderInfoSection('Top Products', info.topProducts, '🥇')}
              
              {/* Top Categories */}
              {renderInfoSection('Top Categories', info.topCategories, '🏆')}
              
              {/* Top Performers */}
              {renderInfoSection('Top Performers', info.topPerformers, '⭐')}
              
              {/* Bottom Performers */}
              {renderInfoSection('Bottom Performers', info.bottomPerformers, '📉')}
              
              {/* Strategies */}
              {renderInfoSection('Strategies', info.strategies, '🎯')}
              
              {/* Payment Preferences */}
              {renderInfoSection('Payment Preferences', info.preferences, '💳')}
            </div>
          </ScrollArea>
          
          <Separator className="my-3" />
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>External insights for Kwality House</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-blue-600"
              onClick={() => window.open('https://docs.google.com/document/d/1p-hxVjAHFvuyBo1l04ibxRQIkNj4-VzcFO1-viFN3gw/edit?tab=t.0', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Source
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};