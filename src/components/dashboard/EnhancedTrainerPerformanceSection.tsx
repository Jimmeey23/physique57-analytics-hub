
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayrollData } from '@/hooks/usePayrollData';
import { TrainerYearOnYearTable } from './TrainerYearOnYearTable';
import { TrainerPerformanceDetailTable } from './TrainerPerformanceDetailTable';
import { TrainerEfficiencyAnalysisTable } from './TrainerEfficiencyAnalysisTable';
import { MonthOnMonthTrainerTable } from './MonthOnMonthTrainerTable';
import { DynamicTrainerDrillDownModal } from './DynamicTrainerDrillDownModal';
import { TrainerFilterSection } from './TrainerFilterSection';
import { TrainerMetricTabs } from './TrainerMetricTabs';
import { EnhancedTrainerRankings } from './EnhancedTrainerRankings';
import { PersistentTableFooter } from './PersistentTableFooter';
import { EnhancedTrainerMetricCards } from './EnhancedTrainerMetricCards';
import { AdvancedNotesModal } from '@/components/ui/AdvancedNotesModal';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { processTrainerData } from './TrainerDataProcessor';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Users, Calendar, TrendingUp, AlertCircle, Award, Target, DollarSign, Activity, FileDown } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const EnhancedTrainerPerformanceSection = () => {
  const { data: payrollData, isLoading, error } = usePayrollData();
  const [selectedTab, setSelectedTab] = useState('month-on-month');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [filters, setFilters] = useState({ 
    location: '', 
    trainer: '', 
    month: '' // Start with no month filter to show all data
  });

  // Base processed data
  const baseProcessed = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    return processTrainerData(payrollData);
  }, [payrollData]);

  // Data with all filters applied (including month) for cards, charts, efficiency, and detail tables
  const processedData = useMemo(() => {
    let data = [...baseProcessed];
    // Apply location (tabs) and explicit location filter
    if (selectedLocation !== 'All Locations') {
      data = data.filter(d => {
        const location = d.location || '';
        // For Kenkere House, use flexible matching like Client Retention
        if (selectedLocation === 'Kenkere House') {
          return location.toLowerCase().includes('kenkere') || location === 'Kenkere House';
        }
        // For other locations, use exact match
        return location === selectedLocation;
      });
    }
    if (filters.location) {
      data = data.filter(d => d.location === filters.location);
    }
    // Apply trainer filter
    if (filters.trainer) {
      data = data.filter(d => d.trainerName === filters.trainer);
    }
    // Apply month filter
    if (filters.month) {
      data = data.filter(d => d.monthYear === filters.month);
    }
    return data;
  }, [baseProcessed, filters, selectedLocation]);

  // Data that ignores the month filter (but respects location/trainer) for MoM/YoY
  const processedDataNoMonth = useMemo(() => {
    let data = [...baseProcessed];
    if (selectedLocation !== 'All Locations') {
      data = data.filter(d => {
        const location = d.location || '';
        // For Kenkere House, use flexible matching
        if (selectedLocation === 'Kenkere House') {
          return location.toLowerCase().includes('kenkere') || location === 'Kenkere House';
        }
        // For other locations, use exact match
        return location === selectedLocation;
      });
    }
    if (filters.location) {
      data = data.filter(d => d.location === filters.location);
    }
    if (filters.trainer) {
      data = data.filter(d => d.trainerName === filters.trainer);
    }
    // Intentionally DO NOT apply filters.month here
    return data;
  }, [baseProcessed, filters.location, filters.trainer, selectedLocation]);

  const handleRowClick = (trainer: string, data: any) => {
    // Get individual session data for this trainer
    const trainerSessions = payrollData?.filter(session => 
      session.teacherName === trainer && 
      (!filters.location || session.location === filters.location) &&
      (!filters.month || session.monthYear === filters.month)
    ) || [];
    
    setSelectedTrainer(trainer);
    setDrillDownData({
      ...data,
      individualSessions: trainerSessions,
      trainerName: trainer
    });
  };

  const closeDrillDown = () => {
    setSelectedTrainer(null);
    setDrillDownData(null);
  };

  // Calculate summary statistics and metrics
  const summaryStats = useMemo(() => {
    if (!processedData.length) return null;

    const totalTrainers = new Set(processedData.map(d => d.trainerName)).size;
    const totalSessions = processedData.reduce((sum, d) => sum + d.totalSessions, 0);
    const totalRevenue = processedData.reduce((sum, d) => sum + d.totalPaid, 0);
    const totalCustomers = processedData.reduce((sum, d) => sum + d.totalCustomers, 0);
    const avgClassSize = totalSessions > 0 ? totalCustomers / totalSessions : 0;
    const avgRevenue = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;

    return {
      totalTrainers,
      totalSessions,
      totalRevenue,
      totalCustomers,
      avgClassSize,
      avgRevenue
    };
  }, [processedData]);

  // Top and bottom performers
  const topBottomPerformers = useMemo(() => {
    if (!processedData.length) return { top: [], bottom: [] };

    const trainerStats = processedData.reduce((acc, trainer) => {
      if (!acc[trainer.trainerName]) {
        acc[trainer.trainerName] = {
          name: trainer.trainerName,
          totalSessions: 0,
          totalRevenue: 0,
          totalCustomers: 0,
          location: trainer.location
        };
      }
      acc[trainer.trainerName].totalSessions += trainer.totalSessions;
      acc[trainer.trainerName].totalRevenue += trainer.totalPaid;
      acc[trainer.trainerName].totalCustomers += trainer.totalCustomers;
      return acc;
    }, {} as Record<string, any>);

    const trainers = Object.values(trainerStats);
    const sortedByRevenue = [...trainers].sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    return {
      top: sortedByRevenue.slice(0, 5),
      bottom: sortedByRevenue.slice(-5).reverse()
    };
  }, [processedData]);

  // Chart data
  const chartData = useMemo(() => {
    if (!processedData.length) return [];

    const monthlyData = processedData.reduce((acc, trainer) => {
      const month = trainer.monthYear;
      if (!acc[month]) {
        acc[month] = { month, sessions: 0, revenue: 0, customers: 0 };
      }
      acc[month].sessions += trainer.totalSessions;
      acc[month].revenue += trainer.totalPaid;
      acc[month].customers += trainer.totalCustomers;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [processedData]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
                 <BrandSpinner size="sm" />
            <span className="text-slate-600">Loading trainer performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading trainer data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!processedData.length) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <p className="text-center text-slate-600">No trainer performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Location Tabs - matching Client Retention styling */}
      <div className="flex justify-center mb-8" id="location-tabs">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-4 location-tabs">
            {[
              { id: 'All Locations', name: 'All Locations', sub: `(${new Set(processedData.map(d => d.trainerName)).size} trainers)` },
              { id: 'Kwality House, Kemps Corner', name: 'Kwality House', sub: `Kemps Corner (${new Set(processedData.filter(d => d.location === 'Kwality House, Kemps Corner').map(d => d.trainerName)).size})` },
              { id: 'Supreme HQ, Bandra', name: 'Supreme HQ', sub: `Bandra (${new Set(processedData.filter(d => d.location === 'Supreme HQ, Bandra').map(d => d.trainerName)).size})` },
              { id: 'Kenkere House', name: 'Kenkere House', sub: `Bengaluru (${new Set(processedData.filter(d => d.location.includes('Kenkere')).map(d => d.trainerName)).size})` },
            ].map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`location-tab-trigger group ${selectedLocation === loc.id ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                data-state={selectedLocation === loc.id ? 'active' : 'inactive'}
              >
                <span className="relative z-10 flex flex-col items-center leading-tight">
                  <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">{loc.name}</span>
                  <span className="text-xs sm:text-sm opacity-90">{loc.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass-card modern-card-hover p-6 rounded-2xl mb-6" id="filters">

        <TrainerFilterSection
          data={payrollData || []}
          onFiltersChange={setFilters}
          isCollapsed={isFiltersCollapsed}
          onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
        />
      </div>

      {/* Enhanced Metric Cards - matching Sales styling */}
      <div className="glass-card modern-card-hover rounded-2xl p-6 soft-bounce stagger-2" id="metrics">
        <EnhancedTrainerMetricCards 
          data={processedData} 
          onCardClick={(title, data) => {
            // Open drill-down modal with trainer data
            setSelectedTrainer(title);
            setDrillDownData(data);
          }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Monthly Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} name="Revenue" />
                <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={2} name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Sessions vs Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#10B981" name="Sessions" />
                <Bar dataKey="customers" fill="#8B5CF6" name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Rankings */}
      <EnhancedTrainerRankings 
        data={processedData} 
        onTrainerClick={handleRowClick}
      />

      {/* Analysis Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 p-1 rounded-xl shadow-sm h-14">
          <TabsTrigger
            value="month-on-month"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4" />
            Month-on-Month
          </TabsTrigger>
          <TabsTrigger
            value="year-on-year"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-emerald-700"
          >
            <TrendingUp className="w-4 h-4" />
            Year-on-Year
          </TabsTrigger>
          <TabsTrigger
            value="efficiency-analysis"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-orange-700"
          >
            <Target className="w-4 h-4" />
            Efficiency
          </TabsTrigger>
          <TabsTrigger
            value="performance-detail"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-purple-700"
          >
            <Award className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

  <TabsContent value="month-on-month" className="space-y-6">
          <div className="flex justify-end mb-4">
            <AdvancedExportButton 
              payrollData={payrollData || []}
              defaultFileName="month-on-month-trainer-analysis"
              size="sm"
              variant="outline"
            />
          </div>
          <div className="flex items-center gap-2 -mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">Ignoring Month Filter</Badge>
            <button onClick={() => setFilters(prev => ({...prev, location: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Location: {filters.location || selectedLocation || 'All Locations'}</Badge>
            </button>
            <button onClick={() => setFilters(prev => ({...prev, trainer: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Trainer: {filters.trainer || 'All Trainers'}</Badge>
            </button>
          </div>
          <MonthOnMonthTrainerTable
            data={processedDataNoMonth}
            defaultMetric="totalSessions"
            onRowClick={handleRowClick}
          />
          <PersistentTableFooter
            tableId="trainer-month-on-month"
            tableName="Trainer Month-on-Month Analysis"
            tableContext="Per-trainer monthly metrics and changes"
            tableData={processedData}
          />
          <AdvancedNotesModal 
            pageId="month-on-month-trainer"
            title="Month-on-Month Analysis Notes"
          />
        </TabsContent>

  <TabsContent value="year-on-year" className="space-y-6">
          <div className="flex justify-end mb-4">
            <AdvancedExportButton 
              payrollData={payrollData || []}
              defaultFileName="year-on-year-trainer-analysis"
              size="sm"
              variant="outline"
            />
          </div>
          <div className="flex items-center gap-2 -mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">Ignoring Month Filter</Badge>
            <button onClick={() => setFilters(prev => ({...prev, location: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Location: {filters.location || selectedLocation || 'All Locations'}</Badge>
            </button>
            <button onClick={() => setFilters(prev => ({...prev, trainer: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Trainer: {filters.trainer || 'All Trainers'}</Badge>
            </button>
          </div>
          
          <TrainerYearOnYearTable
            data={processedDataNoMonth}
            onRowClick={handleRowClick}
          />
          <PersistentTableFooter
            tableId="trainer-year-on-year"
            tableName="Trainer Year-on-Year Comparison"
            tableContext="This compares current year vs previous year trainer performance"
            tableData={processedData}
          />
          
          <AdvancedNotesModal 
            pageId="year-on-year-trainer"
            title="Year-on-Year Analysis Notes"
          />
        </TabsContent>

        <TabsContent value="efficiency-analysis" className="space-y-6">
          <div className="flex justify-end mb-4">
            <AdvancedExportButton 
              payrollData={payrollData || []}
              defaultFileName="trainer-efficiency-analysis"
              size="sm"
              variant="outline"
            />
          </div>
          
          <TrainerEfficiencyAnalysisTable
            data={processedData}
            onRowClick={handleRowClick}
          />
          <PersistentTableFooter
            tableId="trainer-efficiency-analysis"
            tableName="Trainer Efficiency & Productivity"
            tableContext="Composite efficiency score with utilization, revenue per hour, retention, impact, and quality indices"
            tableData={processedData}
          />
          
          <AdvancedNotesModal 
            pageId="efficiency-analysis-trainer"
            title="Efficiency Analysis Notes"
          />
        </TabsContent>

        <TabsContent value="performance-detail" className="space-y-6">
          <div className="flex justify-end mb-4">
            <AdvancedExportButton 
              payrollData={payrollData || []}
              defaultFileName="trainer-performance-detail"
              size="sm"
              variant="outline"
            />
          </div>
          
          <TrainerPerformanceDetailTable
            data={processedData}
            onRowClick={handleRowClick}
          />
          <PersistentTableFooter
            tableId="trainer-performance-detail"
            tableName="Trainer Performance Detail"
            tableContext="Aggregated trainer-level sessions, customers, revenue, and derived metrics"
            tableData={processedData}
          />
          
          <AdvancedNotesModal 
            pageId="performance-detail-trainer"
            title="Performance Detail Notes"
          />
        </TabsContent>
      </Tabs>

      {/* Dynamic Drill Down Modal */}
      {selectedTrainer && drillDownData && (
        <DynamicTrainerDrillDownModal
          isOpen={!!selectedTrainer}
          onClose={closeDrillDown}
          trainerName={selectedTrainer}
          trainerData={drillDownData}
        />
      )}
    </div>
  );
};
