
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
import { EnhancedTrainerMetricCards } from './EnhancedTrainerMetricCards';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { processTrainerData } from './TrainerDataProcessor';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Users, Calendar, TrendingUp, TrendingDown, AlertCircle, Award, Target, DollarSign, Activity, FileDown, Crown, Trophy, Medal } from 'lucide-react';
import { InfoPopover } from '@/components/ui/InfoPopover';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  // Interactive rankings controls (metric + show count)
  const [rankingMetric, setRankingMetric] = useState<'revenue' | 'sessions' | 'customers' | 'efficiency' | 'classAvg' | 'conversion' | 'retention' | 'emptySessions'>('revenue');
  const [rankingCount, setRankingCount] = useState<number>(5);

  // Build ranked trainers based on selected metric
  const rankedTrainers = useMemo(() => {
    if (!processedData.length) return [] as any[];

    const byTrainer = processedData.reduce((acc, r) => {
      const key = r.trainerName;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          location: r.location,
          totalRevenue: 0,
          totalSessions: 0,
          totalCustomers: 0,
          nonEmptySessions: 0,
          conversionSum: 0,
          retentionSum: 0,
          records: 0,
          emptySessions: 0
        } as any;
      }
      const t = acc[key];
      t.totalRevenue += r.totalPaid || 0;
      t.totalSessions += r.totalSessions || 0;
      t.totalCustomers += r.totalCustomers || 0;
      t.nonEmptySessions += r.nonEmptySessions || 0;
      t.conversionSum += r.conversionRate || 0;
      t.retentionSum += r.retentionRate || 0;
      t.emptySessions += r.emptySessions || 0;
      t.records += 1;
      return acc;
    }, {} as Record<string, any>);

    const trainers = Object.values(byTrainer).map((t: any) => {
      const efficiency = t.totalSessions > 0 ? t.totalRevenue / t.totalSessions : 0;
      const classAvg = t.totalSessions > 0 ? (t.nonEmptySessions > 0 ? (t.totalCustomers / t.nonEmptySessions) : (t.totalCustomers / t.totalSessions)) : 0;
      const conversionRate = t.records > 0 ? t.conversionSum / t.records : 0;
      const retentionRate = t.records > 0 ? t.retentionSum / t.records : 0;
      return { ...t, efficiency, classAvg, conversionRate, retentionRate };
    });

    const sortFn = (a: any, b: any) => {
      switch (rankingMetric) {
        case 'revenue': return b.totalRevenue - a.totalRevenue;
        case 'sessions': return b.totalSessions - a.totalSessions;
        case 'customers': return b.totalCustomers - a.totalCustomers;
        case 'efficiency': return b.efficiency - a.efficiency;
        case 'classAvg': return b.classAvg - a.classAvg;
        case 'conversion': return b.conversionRate - a.conversionRate;
        case 'retention': return b.retentionRate - a.retentionRate;
        case 'emptySessions': return b.emptySessions - a.emptySessions;
        default: return b.totalRevenue - a.totalRevenue;
      }
    };

    return trainers.sort(sortFn);
  }, [processedData, rankingMetric]);

  const topList = rankedTrainers.slice(0, rankingCount);
  const bottomList = rankedTrainers.slice(-rankingCount).reverse();

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
    return null; // Global loader handles this
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
      <div className="flex justify-center items-start mb-8" id="location-tabs">
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
        <div className="ml-3 mt-1">
          <InfoPopover context="sales-overview" locationId={selectedLocation === 'All Locations' ? 'all' : selectedLocation.toLowerCase().includes('kwality') ? 'kwality' : selectedLocation.toLowerCase().includes('supreme') ? 'supreme' : 'kenkere'} />
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

      {/* Top & Bottom Performers — styled like Sales with controls */}
      <Card className="bg-gradient-to-br from-white via-slate-50/20 to-white border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Trainer Top & Bottom Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Metric selection */}
            <div className="flex flex-wrap bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1">
              {[
                { key: 'revenue', label: 'Revenue', icon: DollarSign },
                { key: 'sessions', label: 'Sessions', icon: Activity },
                { key: 'customers', label: 'Members', icon: Users },
                { key: 'efficiency', label: 'Rev/Session', icon: DollarSign },
                { key: 'classAvg', label: 'Class Avg', icon: Users },
                { key: 'conversion', label: 'Conversion', icon: TrendingUp },
                { key: 'retention', label: 'Retention', icon: Target },
                { key: 'emptySessions', label: 'Empty', icon: Activity },
              ].map(({ key, label, icon: Icon }: any) => (
                <Button
                  key={key}
                  size="sm"
                  variant={rankingMetric === key ? 'default' : 'ghost'}
                  className={rankingMetric === key ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}
                  onClick={() => setRankingMetric(key)}
                >
                  <Icon className="w-3 h-3 mr-1" /> {label}
                </Button>
              ))}
            </div>
            {/* Count selection */}
            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
              {[5, 10, 15].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={rankingCount === n ? 'default' : 'ghost'}
                  className={rankingCount === n ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}
                  onClick={() => setRankingCount(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers Card */}
            <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Top Trainers</span>
                    <p className="text-sm text-slate-600 font-normal capitalize">By {rankingMetric === 'efficiency' ? 'Revenue/Session' : rankingMetric === 'classAvg' ? 'Class Average' : rankingMetric}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topList.map((t: any, index: number) => (
                  <div
                    key={t.name}
                    className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer hover:border-emerald-200/70"
                    onClick={() => handleRowClick(t.name, t)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={
                        `w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white ` +
                        (index === 0
                          ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500'
                          : index === 2
                          ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600'
                          : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700')
                      }>
                        {index === 0 ? (
                          <Crown className="w-6 h-6" />
                        ) : index === 1 ? (
                          <Trophy className="w-6 h-6" />
                        ) : index === 2 ? (
                          <Medal className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 whitespace-normal break-words group-hover:text-blue-600 transition-colors">{t.name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {formatNumber(t.totalSessions)} sessions
                          </Badge>
                          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                            Avg size: {(t.nonEmptySessions > 0 ? (t.totalCustomers / t.nonEmptySessions) : (t.totalSessions > 0 ? t.totalCustomers / t.totalSessions : 0)).toFixed(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                            Members: {formatNumber(t.totalCustomers)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                        {rankingMetric === 'revenue' ? formatCurrency(t.totalRevenue)
                          : rankingMetric === 'sessions' ? formatNumber(t.totalSessions)
                          : rankingMetric === 'customers' ? formatNumber(t.totalCustomers)
                          : rankingMetric === 'efficiency' ? formatCurrency(t.efficiency)
                          : rankingMetric === 'classAvg' ? (t.classAvg).toFixed(1)
                          : rankingMetric === 'conversion' ? `${t.conversionRate.toFixed(1)}%`
                          : rankingMetric === 'retention' ? `${t.retentionRate.toFixed(1)}%`
                          : formatNumber(t.emptySessions)}
                      </p>
                      <p className="text-sm text-slate-500">{t.location}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bottom Performers Card */}
            <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Bottom Trainers</span>
                    <p className="text-sm text-slate-600 font-normal capitalize">By {rankingMetric === 'efficiency' ? 'Revenue/Session' : rankingMetric === 'classAvg' ? 'Class Average' : rankingMetric}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bottomList.map((t: any, index: number) => (
                  <div
                    key={t.name}
                    className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer hover:border-rose-200/70"
                    onClick={() => handleRowClick(t.name, t)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white bg-gradient-to-br from-red-500 via-rose-600 to-red-700">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 whitespace-normal break-words group-hover:text-blue-600 transition-colors">{t.name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {formatNumber(t.totalSessions)} sessions
                          </Badge>
                          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                            Avg size: {(t.nonEmptySessions > 0 ? (t.totalCustomers / t.nonEmptySessions) : (t.totalSessions > 0 ? t.totalCustomers / t.totalSessions : 0)).toFixed(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">
                            Members: {formatNumber(t.totalCustomers)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                        {rankingMetric === 'revenue' ? formatCurrency(t.totalRevenue)
                          : rankingMetric === 'sessions' ? formatNumber(t.totalSessions)
                          : rankingMetric === 'customers' ? formatNumber(t.totalCustomers)
                          : rankingMetric === 'efficiency' ? formatCurrency(t.efficiency)
                          : rankingMetric === 'classAvg' ? (t.classAvg).toFixed(1)
                          : rankingMetric === 'conversion' ? `${t.conversionRate.toFixed(1)}%`
                          : rankingMetric === 'retention' ? `${t.retentionRate.toFixed(1)}%`
                          : formatNumber(t.emptySessions)}
                      </p>
                      <p className="text-sm text-slate-500">{t.location}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      

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
