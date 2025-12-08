import React, { useState, useMemo } from 'react';
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
import { 
  BarChart3, Calendar, Activity, TrendingUp, Lightbulb,
  Target, Users, Clock, MapPin
} from 'lucide-react';

export const UpdatedEnhancedClassAttendanceSection: React.FC = () => {
  const { data: sessionsData, loading } = useSessionsData();
  const filteredData = useFilteredSessionsData(sessionsData || []);
  const { data: payrollData } = usePayrollData();
  
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('kwality');
  const [activeTab, setActiveTab] = useState<string>('comprehensive');

  // Apply location filtering to the already filtered data
  const locationFilteredData = useMemo(() => {
    if (selectedLocation === 'all') {
      return filteredData;
    }
    
    const filtered = filteredData.filter(session => {
      const sessionLocation = (session.location || '').toLowerCase().trim();
      const targetLocation = selectedLocation.toLowerCase();
      
      // Handle various location name variations with exact and partial matching
      if (targetLocation === 'kwality') {
        return sessionLocation.includes('kwality') || 
               sessionLocation.includes('kh') || 
               sessionLocation.includes('kemps');
      }
      if (targetLocation === 'supreme') {
        return sessionLocation.includes('supreme') || 
               sessionLocation.includes('shq') || 
               sessionLocation.includes('bandra');
      }
      if (targetLocation.includes('soho')) {
        return sessionLocation.includes('soho');
      }
      
      // Default partial match
      return sessionLocation.includes(targetLocation);
    });
    
    return filtered;
  }, [filteredData, selectedLocation]);

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
            data={locationFilteredData}
            payrollData={payrollData}
            onMetricClick={handleDrillDown}
          />
        </div>

        {/* Filter Section - hidden on Analytics tab to avoid duplicate filters */}
        {activeTab !== 'analytics' && (
          <EnhancedClassAttendanceFilterSection data={locationFilteredData} />
        )}

        {/* Rankings Section - styled like sales tab */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">Top & Bottom Performers</h2>
          </div>
          <div data-ranking="top-bottom-performers">
            <DualRankingLists 
              data={locationFilteredData}
              location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
            />
          </div>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="modern-tabs grid grid-cols-5 w-full bg-white/90 backdrop-blur-sm shadow-xl border border-slate-200 rounded-2xl p-2 relative z-50">
            <TabsTrigger 
              value="comprehensive" 
              className="modern-tab-trigger tab-variant-blue relative z-50"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Comprehensive</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="month-on-month"
              className="modern-tab-trigger tab-variant-emerald relative z-50"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Month-on-Month</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="performance"
              className="modern-tab-trigger tab-variant-blue relative z-50"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Performance</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="modern-tab-trigger tab-variant-rose relative z-50"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="insights"
              className="modern-tab-trigger tab-variant-purple relative z-50"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span>Insights</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comprehensive" className="mt-6">
            <AdvancedClassAttendanceTable 
              data={locationFilteredData}
              location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
              onDrillDown={handleDrillDown}
            />
          </TabsContent>

          <TabsContent value="month-on-month" className="mt-6">
            <MonthOnMonthClassTable 
              data={locationFilteredData} // Use location-filtered data to respect filter selections
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
            <FormatFocusedAnalytics data={locationFilteredData} />
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