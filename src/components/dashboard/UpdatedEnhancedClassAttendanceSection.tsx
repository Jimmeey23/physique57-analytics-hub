import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';

// Import all the new enhanced components
import { ModernMetricCards } from './ModernMetricCards';
import { EnhancedClassAttendanceFilterSection } from './EnhancedClassAttendanceFilterSection';
import { AdvancedClassAttendanceTable } from './ModernAdvancedClassAttendanceTable';
import { MonthOnMonthClassTable } from './MonthOnMonthClassTable';
import { DualRankingLists } from './DualRankingLists';
import { InteractivePerformanceAnalytics } from './InteractivePerformanceAnalytics';
import { DrillDownAnalyticsModal } from './DrillDownAnalyticsModal';
import { LocationTabs } from './LocationTabs';
import { ClassFormatAnalytics } from './ClassFormatAnalytics';

export const UpdatedEnhancedClassAttendanceSection: React.FC = () => {
  const { data: sessionsData, loading } = useSessionsData();
  const filteredData = useFilteredSessionsData(sessionsData || []);
  const { data: payrollData } = usePayrollData();
  
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('all');

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
    <div className="w-full space-y-8">
      {/* Location Filter Tabs */}
      <LocationTabs 
        data={filteredData}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
      >
        {(locationFilteredData) => (
          <>
            {/* Enhanced Metric Cards */}
            <div className="space-y-6">
              <ModernMetricCards 
                data={locationFilteredData}
                payrollData={payrollData}
                onMetricClick={handleDrillDown}
              />
            </div>

            {/* Filter Section */}
            <EnhancedClassAttendanceFilterSection data={locationFilteredData} />

            {/* Main Analytics Tabs */}
            <Tabs defaultValue="comprehensive" className="w-full">
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

              <TabsContent value="comprehensive" className="mt-6 w-full overflow-x-auto">
                <AdvancedClassAttendanceTable 
                  data={locationFilteredData}
                  location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
                  onDrillDown={handleDrillDown}
                />
              </TabsContent>

              <TabsContent value="month-on-month" className="mt-6 w-full overflow-x-auto">
                <MonthOnMonthClassTable 
                  data={sessionsData || []} // Use unfiltered data as requested
                  location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
                />
              </TabsContent>

              <TabsContent value="rankings" className="mt-6">
                <DualRankingLists 
                  data={locationFilteredData}
                  location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
                />
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <InteractivePerformanceAnalytics 
                  data={locationFilteredData}
                  onDrillDown={handleDrillDown}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <ClassFormatAnalytics data={locationFilteredData} />
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
        )}
      </LocationTabs>

      {/* Drill-Down Modal */}
      <DrillDownAnalyticsModal
        isOpen={isDrillDownOpen}
        onClose={closeDrillDown}
        data={drillDownData || { title: '', sessions: [] }}
      />
    </div>
  );
};