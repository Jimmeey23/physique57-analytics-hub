import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { InfoPopover } from '@/components/ui/InfoPopover';

// Import all the new enhanced components
import { ModernMetricCards } from './ModernMetricCards';
import { EnhancedClassAttendanceFilterSection } from './EnhancedClassAttendanceFilterSection';
import { AdvancedClassAttendanceTable } from './ModernAdvancedClassAttendanceTable';
import { MonthOnMonthClassTable } from './MonthOnMonthClassTable';
import { DualRankingLists } from './DualRankingLists';
import { InteractivePerformanceAnalytics } from './InteractivePerformanceAnalytics';
import { DrillDownAnalyticsModal } from './DrillDownAnalyticsModal';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { ClassFormatAnalytics } from './ClassFormatAnalytics';
import { FormatFocusedAnalytics } from './FormatFocusedAnalytics';

export const UpdatedEnhancedClassAttendanceSection: React.FC = () => {
  const { data: sessionsData, loading } = useSessionsData();
  const filteredData = useFilteredSessionsData(sessionsData || []);
  const { data: payrollData } = usePayrollData();
  
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('kwality');
  const [activeTab, setActiveTab] = useState<string>('comprehensive');

  const handleDrillDown = (data: any) => {
    setDrillDownData(data);
    setIsDrillDownOpen(true);
  };

  const closeDrillDown = () => {
    setIsDrillDownOpen(false);
    setDrillDownData(null);
  };

  if (loading) {
    return null; // Global loader will handle this
  }

  return (
    <div className="space-y-8">
      {/* Location Filter Tabs */}
      <StudioLocationTabs 
        activeLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        showInfoPopover={true}
        infoPopoverContext="class-attendance-overview"
      />
      
      <>
        {/* Enhanced Metric Cards */}
        <div className="space-y-6">
          <ModernMetricCards 
            data={filteredData}
            payrollData={payrollData}
            onMetricClick={handleDrillDown}
          />
        </div>

        {/* Filter Section - hidden on Analytics tab to avoid duplicate filters */}
        {activeTab !== 'analytics' && (
          <EnhancedClassAttendanceFilterSection data={filteredData} />
        )}

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="modern-tabs grid grid-cols-6 w-full">
            <TabsTrigger 
              value="comprehensive" 
              className="modern-tab-trigger tab-variant-blue"
            >
              Comprehensive
            </TabsTrigger>
            <TabsTrigger 
              value="month-on-month"
              className="modern-tab-trigger tab-variant-emerald"
            >
              Month-on-Month
            </TabsTrigger>
            <TabsTrigger 
              value="rankings"
              className="modern-tab-trigger tab-variant-purple"
            >
              Rankings
            </TabsTrigger>
            <TabsTrigger 
              value="performance"
              className="modern-tab-trigger tab-variant-blue"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="modern-tab-trigger tab-variant-rose"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="insights"
              className="modern-tab-trigger tab-variant-purple"
            >
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comprehensive" className="mt-6">
            <AdvancedClassAttendanceTable 
              data={filteredData}
              location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
              onDrillDown={handleDrillDown}
            />
          </TabsContent>

          <TabsContent value="month-on-month" className="mt-6">
            <MonthOnMonthClassTable 
              data={sessionsData || []} // Use unfiltered data as requested
              location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
            />
          </TabsContent>

          <TabsContent value="rankings" className="mt-6">
            <DualRankingLists 
              data={filteredData}
              location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <InteractivePerformanceAnalytics 
              data={filteredData}
              onDrillDown={handleDrillDown}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <FormatFocusedAnalytics data={filteredData} />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <Card className="bg-white border-slate-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  AI-Powered Insights
                </h3>
                <p className="text-slate-500">
                  Machine learning-driven recommendations and business insights will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </>

      {/* Drill-Down Modal */}
      <DrillDownAnalyticsModal
        isOpen={isDrillDownOpen}
        onClose={closeDrillDown}
        data={drillDownData || { title: '', sessions: [] }}
      />
    </div>
  );
};