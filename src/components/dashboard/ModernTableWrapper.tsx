import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, ExpandIcon, ShrinkIcon, Filter, Calendar, TrendingUp, BarChart3, DollarSign, Users, ShoppingCart, Target, Package, Activity, Percent, Trophy, Medal, Award, Crown, Star, Eye, Percent as PercentIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import CopyTableButton from '@/components/ui/CopyTableButton';

interface ModernTableWrapperProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  totalItems?: number;
  filterCount?: number;
  className?: string;
  headerControls?: React.ReactNode;
  collapsedGroups?: Set<string>;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
  showCollapseControls?: boolean;
  showDisplayToggle?: boolean;
  displayMode?: 'values' | 'growth';
  onDisplayModeChange?: (mode: 'values' | 'growth') => void;
  showCopyButton?: boolean;
  tableRef?: React.RefObject<HTMLTableElement>;
  onCopyAllTabs?: () => Promise<string>;
}

export const ModernTableWrapper: React.FC<ModernTableWrapperProps> = ({
  title,
  description,
  icon,
  children,
  totalItems,
  filterCount,
  className,
  headerControls,
  collapsedGroups = new Set(),
  onCollapseAll,
  onExpandAll,
  showCollapseControls = true,
  showDisplayToggle = false,
  displayMode = 'values',
  onDisplayModeChange,
  showCopyButton = true,
  tableRef,
  onCopyAllTabs
}) => {
  const internalTableRef = useRef<HTMLDivElement>(null);
  return (
    <Card className={cn(
      "w-full shadow-lg border border-slate-300 bg-white",
      className
    )}>
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-sm">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-slate-300 text-sm font-medium">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {totalItems && (
              <Badge variant="secondary" className="bg-white/20 text-white font-semibold">
                {totalItems} items
              </Badge>
            )}
            
            {showDisplayToggle && onDisplayModeChange && (
              <div className="flex items-center space-x-1 mr-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDisplayModeChange('values')}
                  className={`font-medium text-xs px-2 py-1 h-7 ${
                    displayMode === 'values' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Values
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDisplayModeChange('growth')}
                  className={`font-medium text-xs px-2 py-1 h-7 ${
                    displayMode === 'growth' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <PercentIcon className="w-3 h-3 mr-1" />
                  Growth
                </Button>
              </div>
            )}
            
            {showCollapseControls && onCollapseAll && onExpandAll && (
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCollapseAll}
                  className="text-white hover:bg-white/20 font-medium text-xs px-2 py-1 h-7"
                >
                  <ShrinkIcon className="w-3 h-3 mr-1" />
                  Collapse All
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onExpandAll}
                  className="text-white hover:bg-white/20 font-medium text-xs px-2 py-1 h-7"
                >
                  <ExpandIcon className="w-3 h-3 mr-1" />
                  Expand All
                </Button>
              </div>
            )}

            {/* Copy Table Button */}
            {showCopyButton && (
              <CopyTableButton 
                tableRef={tableRef || internalTableRef}
                tableName={title}
                size="sm"
                className="text-white hover:bg-white/20"
                onCopyAllTabs={onCopyAllTabs}
              />
            )}

            {headerControls}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0" ref={internalTableRef}>
        {children}
      </CardContent>
    </Card>
  );
};

interface ModernGroupBadgeProps {
  count: number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  className?: string;
}

export const ModernGroupBadge: React.FC<ModernGroupBadgeProps> = ({ 
  count, 
  label, 
  variant = 'default', 
  className = '' 
}) => {
  return (
    <div className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300 rounded-sm ${className} shrink-0`}>
      <span className="font-bold">{count}</span>
      <span className="ml-1.5 font-medium">{label}</span>
    </div>
  );
};

interface ModernMetricTabsProps {
  metrics: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
  }>;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  className?: string;
}

// Standard metrics for all tables
export const STANDARD_METRICS = [
  { key: 'revenue', label: 'Revenue', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'units', label: 'Units Sold', icon: <Package className="w-4 h-4" /> },
  { key: 'transactions', label: 'Transactions', icon: <ShoppingCart className="w-4 h-4" /> },
  { key: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
  { key: 'auv', label: 'AUV', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'atv', label: 'ATV', icon: <Target className="w-4 h-4" /> },
  { key: 'asv', label: 'ASV', icon: <Activity className="w-4 h-4" /> },
  { key: 'upt', label: 'UPT', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'vat', label: 'VAT', icon: <Percent className="w-4 h-4" /> },
  { key: 'discountAmount', label: 'Discount ₹', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'discountPercentage', label: 'Discount %', icon: <Percent className="w-4 h-4" /> },
  { key: 'purchaseFrequency', label: 'Purchase Freq.', icon: <Activity className="w-4 h-4" /> }
];

export const ModernMetricTabs: React.FC<ModernMetricTabsProps> = ({
  metrics,
  selectedMetric,
  onMetricChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 p-4 bg-white rounded-lg border border-slate-300 shadow-sm ${className}`}>
      <div className="flex items-center space-x-2 text-slate-700 font-semibold text-sm mr-4">
        <BarChart3 className="w-4 h-4 text-slate-500" />
        <span>Metrics:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => onMetricChange(metric.key)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-sm font-medium text-sm transition-all duration-200 whitespace-nowrap ${
              selectedMetric === metric.key
                ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            {metric.icon}
            <span>{metric.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};