
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrainerMetricType } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface TrainerMetricTabsProps {
  value: TrainerMetricType;
  onValueChange: (value: TrainerMetricType) => void;
  className?: string;
}

export const TrainerMetricTabs: React.FC<TrainerMetricTabsProps> = ({
  value,
  onValueChange,
  className = ""
}) => {
  const triggerClassName = "rounded-lg border border-transparent px-3 py-3 h-auto flex-col gap-1 font-medium text-slate-700 transition-all duration-200 data-[state=active]:border-slate-800/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:via-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-slate-100";

  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList className={cn("grid w-full grid-cols-4 md:grid-cols-8 gap-1 h-auto rounded-lg border border-slate-300 bg-white p-2 shadow-sm", className)}>
        <TabsTrigger
          value="totalSessions"
          className={triggerClassName}
        >
          <span className="font-semibold">Total</span>
          <span className="text-[10px] opacity-80">Sessions</span>
        </TabsTrigger>
        <TabsTrigger
          value="totalCustomers"
          className={triggerClassName}
        >
          <span className="font-semibold">Total</span>
          <span className="text-[10px] opacity-80">Members</span>
        </TabsTrigger>
        <TabsTrigger
          value="totalPaid"
          className={triggerClassName}
        >
          <span className="font-semibold">Total</span>
          <span className="text-[10px] opacity-80">Revenue</span>
        </TabsTrigger>
        <TabsTrigger
          value="classAverageExclEmpty"
          className={triggerClassName}
        >
          <span className="font-semibold">Class</span>
          <span className="text-[10px] opacity-80">Average</span>
        </TabsTrigger>
        <TabsTrigger
          value="emptySessions"
          className={triggerClassName}
        >
          <span className="font-semibold">Empty</span>
          <span className="text-[10px] opacity-80">Sessions</span>
        </TabsTrigger>
        <TabsTrigger
          value="conversionRate"
          className={triggerClassName}
        >
          <span className="font-semibold">Conversion</span>
          <span className="text-[10px] opacity-80">Rate</span>
        </TabsTrigger>
        <TabsTrigger
          value="retentionRate"
          className={triggerClassName}
        >
          <span className="font-semibold">Retention</span>
          <span className="text-[10px] opacity-80">Rate</span>
        </TabsTrigger>
        <TabsTrigger
          value="newMembers"
          className={triggerClassName}
        >
          <span className="font-semibold">New</span>
          <span className="text-[10px] opacity-80">Members</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
