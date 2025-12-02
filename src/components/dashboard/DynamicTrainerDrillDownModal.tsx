import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Download, Share2, TrendingUp, TrendingDown, Users, Calendar, Target, Activity, BarChart3 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { getTrainerAvatar, getTrainerInitials } from '@/utils/trainerAvatars';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface DynamicTrainerDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  trainerData: any;
}

// Theme colors - Attractive blue and silver palette
const PRIMARY_BLUE = '#0f4c81';      // Rich ocean blue - main brand color
const PRIMARY_BLUE_DARK = '#0a3a63'; // Darker blue for hover/accents
const PRIMARY_BLUE_LIGHT = '#1a6cb3'; // Lighter blue for gradients
const SILVER = '#94a3b8';
const SILVER_LIGHT = '#e2e8f0';
const SILVER_DARK = '#64748b';
const WHITE = '#ffffff';

export const DynamicTrainerDrillDownModal: React.FC<DynamicTrainerDrillDownModalProps> = ({
  isOpen,
  onClose,
  trainerName,
  trainerData
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const processedData = useMemo(() => {
    if (!trainerData) return null;

    const monthlyData = trainerData.monthlyData || {};
    const months = trainerData.months || Object.keys(monthlyData);

    let totalSessions = 0;
    let totalCustomers = 0;
    let totalRevenue = 0;
    let totalEmptySessions = 0;
    let totalNonEmptySessions = 0;
    let cycleSessions = 0;
    let barreSessions = 0;
    let strengthSessions = 0;
    let cycleRevenue = 0;
    let barreRevenue = 0;
    let strengthRevenue = 0;
    let newMembers = 0;
    let convertedMembers = 0;
    let retainedMembers = 0;

    const monthlyTrend: { month: string; sessions: number; customers: number; revenue: number; fillRate: number }[] = [];

    months.forEach((month: string) => {
      const data = monthlyData[month];
      if (data) {
        totalSessions += data.totalSessions || 0;
        totalCustomers += data.totalCustomers || 0;
        totalRevenue += data.totalPaid || 0;
        totalEmptySessions += data.emptySessions || 0;
        totalNonEmptySessions += data.nonEmptySessions || 0;
        cycleSessions += data.cycleSessions || 0;
        barreSessions += data.barreSessions || 0;
        strengthSessions += data.strengthSessions || 0;
        cycleRevenue += data.cycleRevenue || 0;
        barreRevenue += data.barreRevenue || 0;
        strengthRevenue += data.strengthRevenue || 0;
        newMembers += data.newMembers || 0;
        convertedMembers += data.convertedMembers || 0;
        retainedMembers += data.retainedMembers || 0;

        const fillRate = data.totalSessions > 0 
          ? ((data.nonEmptySessions || 0) / (data.totalSessions || 1)) * 100 
          : 0;

        monthlyTrend.push({
          month: month.split('-')[0] || month.split(' ')[0] || month,
          sessions: data.totalSessions || 0,
          customers: data.totalCustomers || 0,
          revenue: data.totalPaid || 0,
          fillRate: Math.min(fillRate, 100)
        });
      }
    });

    if (trainerData.totalSessions) totalSessions = trainerData.totalSessions;
    if (trainerData.totalCustomers) totalCustomers = trainerData.totalCustomers;
    if (trainerData.totalRevenue) totalRevenue = trainerData.totalRevenue;
    if (trainerData.cycleSessions) cycleSessions = trainerData.cycleSessions;
    if (trainerData.barreSessions) barreSessions = trainerData.barreSessions;
    if (trainerData.strengthSessions) strengthSessions = trainerData.strengthSessions;

    const classAverage = totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0;
    const fillRate = totalSessions > 0 ? ((totalNonEmptySessions / totalSessions) * 100) : 0;
    const revenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const conversionRate = newMembers > 0 ? (convertedMembers / newMembers) * 100 : 0;
    const retentionRate = newMembers > 0 ? (retainedMembers / newMembers) * 100 : 0;

    const currentMonthData = monthlyData[months[0]] || {};
    const previousMonthData = monthlyData[months[1]] || {};

    const sessionsChange = previousMonthData.totalSessions 
      ? ((currentMonthData.totalSessions - previousMonthData.totalSessions) / previousMonthData.totalSessions) * 100 
      : 0;
    const customersChange = previousMonthData.totalCustomers 
      ? ((currentMonthData.totalCustomers - previousMonthData.totalCustomers) / previousMonthData.totalCustomers) * 100 
      : 0;
    const revenueChange = previousMonthData.totalPaid 
      ? ((currentMonthData.totalPaid - previousMonthData.totalPaid) / previousMonthData.totalPaid) * 100 
      : 0;

    const formatDistribution = [
      { name: 'Cycle', value: cycleSessions, color: PRIMARY_BLUE },
      { name: 'Barre', value: barreSessions, color: SILVER_DARK },
      { name: 'Strength', value: strengthSessions, color: SILVER }
    ].filter(item => item.value > 0);

    return {
      totalSessions,
      totalCustomers,
      totalRevenue,
      totalEmptySessions,
      totalNonEmptySessions,
      classAverage,
      fillRate,
      revenuePerSession,
      conversionRate,
      retentionRate,
      sessionsChange,
      customersChange,
      revenueChange,
      formatDistribution,
      monthlyTrend: monthlyTrend.reverse(),
      cycleSessions,
      barreSessions,
      strengthSessions,
      cycleRevenue,
      barreRevenue,
      strengthRevenue,
      newMembers,
      convertedMembers,
      retainedMembers,
      location: trainerData.location || 'All Locations',
      months
    };
  }, [trainerData]);

  const sessionsData = useMemo(() => {
    if (!trainerData?.monthlyData) return [];
    
    const sessions: any[] = [];
    const monthlyData = trainerData.monthlyData || {};
    
    Object.entries(monthlyData).forEach(([month, data]: [string, any]) => {
      sessions.push({
        date: month,
        trainer: trainerName,
        checkIns: data.totalCustomers || 0,
        empty: data.emptySessions || 0,
        fillRate: data.totalSessions > 0 
          ? Math.round(((data.nonEmptySessions || 0) / data.totalSessions) * 100) 
          : 0,
        sessions: data.totalSessions || 0,
        revenue: data.totalPaid || 0
      });
    });

    return sessions.sort((a, b) => {
      const dateA = new Date(a.date.replace('-', ' '));
      const dateB = new Date(b.date.replace('-', ' '));
      return dateB.getTime() - dateA.getTime();
    });
  }, [trainerData, trainerName]);

  if (!processedData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 border-0 shadow-2xl rounded-xl"
        style={{ 
          width: '95vw',
          maxWidth: '1400px',
          height: '90vh',
          maxHeight: '900px',
          overflow: 'hidden'
        }}
      >
        <div className="flex h-full">
          {/* Left Side - Trainer Profile */}
          <div 
            className="w-[300px] min-w-[300px] flex flex-col relative"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-3 right-3 z-30 rounded-full w-7 h-7 p-0 hover:bg-white/20 text-white border border-white/30"
            >
              <X className="w-3.5 h-3.5" />
            </Button>

            {/* Trainer Image */}
            <div className="p-5 pt-10">
              <div 
                className="w-full rounded-xl overflow-hidden shadow-lg"
                style={{ aspectRatio: '1', backgroundColor: PRIMARY_BLUE_DARK }}
              >
                <img
                  src={getTrainerAvatar(trainerName)}
                  alt={trainerName}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  className="w-full h-full items-center justify-center hidden"
                  style={{ backgroundColor: PRIMARY_BLUE_DARK }}
                >
                  <span className="text-5xl font-bold text-white/40">
                    {getTrainerInitials(trainerName)}
                  </span>
                </div>
              </div>
            </div>

            {/* Trainer Info */}
            <div className="px-5 pb-3 text-white">
              <h1 className="text-xl font-bold">{trainerName}</h1>
              <p className="text-sm" style={{ color: SILVER_LIGHT }}>{processedData.location}</p>
            </div>

            {/* Quick Stats */}
            <div className="px-5 pb-5 flex-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: SILVER_LIGHT }}>Sessions</div>
                  <div className="text-lg font-bold text-white">{formatNumber(processedData.totalSessions)}</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: SILVER_LIGHT }}>Members</div>
                  <div className="text-lg font-bold text-white">{formatNumber(processedData.totalCustomers)}</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: SILVER_LIGHT }}>Revenue</div>
                  <div className="text-lg font-bold text-white">{formatCurrency(processedData.totalRevenue)}</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: SILVER_LIGHT }}>Fill Rate</div>
                  <div className="text-lg font-bold text-white">{processedData.fillRate.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: SILVER_LIGHT }}>Class Average</span>
                  <span className="text-white font-medium">{processedData.classAverage.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: SILVER_LIGHT }}>Rev/Session</span>
                  <span className="text-white font-medium">{formatCurrency(processedData.revenuePerSession)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: SILVER_LIGHT }}>Empty Sessions</span>
                  <span className="text-white font-medium">{processedData.totalEmptySessions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 flex flex-col" style={{ backgroundColor: WHITE }}>
            {/* Header */}
            <div 
              className="p-4 flex justify-between items-center shrink-0"
              style={{ borderBottom: `1px solid ${SILVER_LIGHT}` }}
            >
              <div>
                <h2 className="text-lg font-bold" style={{ color: PRIMARY_BLUE }}>{trainerName} Analytics</h2>
                <p className="text-xs" style={{ color: SILVER }}>{processedData.months?.length || 0} months of data</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-8"
                  style={{ borderColor: SILVER_LIGHT, color: SILVER_DARK }}
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
                <Button 
                  size="sm" 
                  className="text-xs h-8 text-white"
                  style={{ backgroundColor: PRIMARY_BLUE }}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="p-4 shrink-0" style={{ borderBottom: `1px solid ${SILVER_LIGHT}` }}>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'Sessions', value: formatNumber(processedData.totalSessions), change: processedData.sessionsChange },
                  { label: 'Members', value: formatNumber(processedData.totalCustomers), change: processedData.customersChange },
                  { label: 'Class Avg', value: processedData.classAverage.toFixed(1), change: null },
                  { label: 'Fill Rate', value: `${processedData.fillRate.toFixed(0)}%`, change: null },
                  { label: 'Revenue', value: formatCurrency(processedData.totalRevenue), change: processedData.revenueChange }
                ].map((metric, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-lg p-3 text-white"
                    style={{ backgroundColor: PRIMARY_BLUE }}
                  >
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: SILVER_LIGHT }}>{metric.label}</div>
                    <div className="text-xl font-bold">{metric.value}</div>
                    {metric.change !== null && (
                      <div className="text-[10px] flex items-center gap-0.5" style={{ color: SILVER_LIGHT }}>
                        {metric.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {Math.abs(metric.change).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs with Scrollable Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-3 shrink-0">
                <TabsList 
                  className="grid w-full grid-cols-4 p-1 rounded-lg h-9"
                  style={{ backgroundColor: SILVER_LIGHT }}
                >
                  {['overview', 'breakdown', 'trends', 'sessions'].map((tab) => (
                    <TabsTrigger 
                      key={tab}
                      value={tab} 
                      className="text-xs rounded-md capitalize transition-all data-[state=active]:text-white data-[state=active]:shadow-md"
                      style={{ 
                        color: activeTab === tab ? WHITE : SILVER_DARK,
                        backgroundColor: activeTab === tab ? PRIMARY_BLUE : 'transparent'
                      }}
                    >
                      {tab === 'sessions' ? `Sessions (${sessionsData.length})` : tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Scrollable Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-4 h-auto">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Performance Metrics */}
                    <Card style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: PRIMARY_BLUE }}>
                          <Activity className="w-4 h-4" />
                          Performance Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg p-3" style={{ backgroundColor: `${PRIMARY_BLUE}10` }}>
                            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: SILVER }}>Rev/Session</div>
                            <div className="text-lg font-bold" style={{ color: PRIMARY_BLUE }}>{formatCurrency(processedData.revenuePerSession)}</div>
                          </div>
                          <div className="rounded-lg p-3" style={{ backgroundColor: `${PRIMARY_BLUE}10` }}>
                            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: SILVER }}>Empty Sessions</div>
                            <div className="text-lg font-bold" style={{ color: PRIMARY_BLUE }}>{formatNumber(processedData.totalEmptySessions)}</div>
                          </div>
                          <div className="rounded-lg p-3" style={{ backgroundColor: `${PRIMARY_BLUE}10` }}>
                            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: SILVER }}>Conversion</div>
                            <div className="text-lg font-bold" style={{ color: PRIMARY_BLUE }}>{processedData.conversionRate.toFixed(1)}%</div>
                          </div>
                          <div className="rounded-lg p-3" style={{ backgroundColor: `${PRIMARY_BLUE}10` }}>
                            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: SILVER }}>Retention</div>
                            <div className="text-lg font-bold" style={{ color: PRIMARY_BLUE }}>{processedData.retentionRate.toFixed(1)}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Format Distribution */}
                    <Card style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: PRIMARY_BLUE }}>
                          <BarChart3 className="w-4 h-4" />
                          Class Format Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {processedData.formatDistribution.length > 0 ? (
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={processedData.formatDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={60}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {processedData.formatDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatNumber(value)} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-40 flex items-center justify-center" style={{ color: SILVER }}>
                            No format data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Member Metrics */}
                  <Card style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: PRIMARY_BLUE }}>
                        <Users className="w-4 h-4" />
                        Member Acquisition & Retention
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'New Members', value: processedData.newMembers },
                          { label: 'Converted', value: processedData.convertedMembers },
                          { label: 'Retained', value: processedData.retainedMembers }
                        ].map((item, idx) => (
                          <div 
                            key={idx} 
                            className="rounded-lg p-3"
                            style={{ border: `1px solid ${SILVER_LIGHT}` }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs" style={{ color: SILVER }}>{item.label}</span>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: PRIMARY_BLUE, color: PRIMARY_BLUE }}
                              >
                                {formatNumber(item.value)}
                              </Badge>
                            </div>
                            <div 
                              className="h-1.5 rounded-full"
                              style={{ backgroundColor: SILVER_LIGHT }}
                            >
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${processedData.newMembers > 0 ? (item.value / processedData.newMembers) * 100 : 0}%`,
                                  backgroundColor: PRIMARY_BLUE
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Format Breakdown Tab */}
                <TabsContent value="breakdown" className="mt-0 space-y-4 h-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Cycle', sessions: processedData.cycleSessions, revenue: processedData.cycleRevenue },
                      { name: 'Barre', sessions: processedData.barreSessions, revenue: processedData.barreRevenue },
                      { name: 'Strength', sessions: processedData.strengthSessions, revenue: processedData.strengthRevenue }
                    ].map((format, idx) => (
                      <Card key={idx} style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: PRIMARY_BLUE }}>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIMARY_BLUE }} />
                            {format.name} Classes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span style={{ color: SILVER }}>Sessions</span>
                            <span className="font-semibold" style={{ color: PRIMARY_BLUE }}>{formatNumber(format.sessions)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span style={{ color: SILVER }}>Revenue</span>
                            <span className="font-semibold" style={{ color: PRIMARY_BLUE }}>{formatCurrency(format.revenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span style={{ color: SILVER }}>% of Total</span>
                            <span className="font-semibold" style={{ color: PRIMARY_BLUE }}>
                              {processedData.totalSessions > 0 ? ((format.sessions / processedData.totalSessions) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Revenue by Format Chart */}
                  <Card style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold" style={{ color: PRIMARY_BLUE }}>Revenue by Class Format</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Cycle', sessions: processedData.cycleSessions, revenue: processedData.cycleRevenue },
                            { name: 'Barre', sessions: processedData.barreSessions, revenue: processedData.barreRevenue },
                            { name: 'Strength', sessions: processedData.strengthSessions, revenue: processedData.strengthRevenue }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke={SILVER_LIGHT} />
                            <XAxis dataKey="name" stroke={SILVER} fontSize={11} />
                            <YAxis yAxisId="left" stroke={PRIMARY_BLUE} fontSize={11} />
                            <YAxis yAxisId="right" orientation="right" stroke={SILVER} fontSize={11} />
                            <Tooltip 
                              formatter={(value: number, name: string) => name === 'revenue' ? formatCurrency(value) : formatNumber(value)}
                              contentStyle={{ backgroundColor: WHITE, border: `1px solid ${SILVER_LIGHT}`, borderRadius: '8px', fontSize: '11px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar yAxisId="left" dataKey="sessions" fill={PRIMARY_BLUE} name="Sessions" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="revenue" fill={SILVER} name="Revenue" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Trends Tab */}
                <TabsContent value="trends" className="mt-0 space-y-4 h-auto">
                  <Card style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: PRIMARY_BLUE }}>
                        <TrendingUp className="w-4 h-4" />
                        Monthly Performance Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {processedData.monthlyTrend.length > 0 ? (
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedData.monthlyTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke={SILVER_LIGHT} />
                              <XAxis dataKey="month" stroke={SILVER} fontSize={11} />
                              <YAxis yAxisId="left" stroke={PRIMARY_BLUE} fontSize={11} />
                              <YAxis yAxisId="right" orientation="right" stroke={SILVER} fontSize={11} />
                              <Tooltip 
                                formatter={(value: number, name: string) => {
                                  if (name === 'revenue') return formatCurrency(value);
                                  if (name === 'fillRate') return `${value.toFixed(1)}%`;
                                  return formatNumber(value);
                                }}
                                contentStyle={{ backgroundColor: WHITE, border: `1px solid ${SILVER_LIGHT}`, borderRadius: '8px', fontSize: '11px' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Line yAxisId="left" type="monotone" dataKey="sessions" stroke={PRIMARY_BLUE} strokeWidth={2} name="Sessions" dot={{ fill: PRIMARY_BLUE, r: 3 }} />
                              <Line yAxisId="left" type="monotone" dataKey="customers" stroke={PRIMARY_BLUE_LIGHT} strokeWidth={2} name="Customers" dot={{ fill: PRIMARY_BLUE_LIGHT, r: 3 }} />
                              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={SILVER} strokeWidth={2} name="Revenue" dot={{ fill: SILVER, r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-56 flex items-center justify-center" style={{ color: SILVER }}>
                          No trend data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: PRIMARY_BLUE }}>
                        <Target className="w-4 h-4" />
                        Fill Rate Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {processedData.monthlyTrend.length > 0 ? (
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedData.monthlyTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke={SILVER_LIGHT} />
                              <XAxis dataKey="month" stroke={SILVER} fontSize={11} />
                              <YAxis stroke={SILVER} fontSize={11} domain={[0, 100]} />
                              <Tooltip 
                                formatter={(value: number) => `${value.toFixed(1)}%`}
                                contentStyle={{ backgroundColor: WHITE, border: `1px solid ${SILVER_LIGHT}`, borderRadius: '8px', fontSize: '11px' }}
                              />
                              <Bar dataKey="fillRate" fill={PRIMARY_BLUE} name="Fill Rate %" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center" style={{ color: SILVER }}>
                          No fill rate data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="sessions" className="mt-0 h-auto">
                  <Card style={{ border: `1px solid ${SILVER_LIGHT}` }}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: PRIMARY_BLUE }}>
                        <Calendar className="w-4 h-4" />
                        Session History by Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${SILVER_LIGHT}`, backgroundColor: `${PRIMARY_BLUE}08` }}>
                              <th className="text-left py-2.5 px-3 font-semibold" style={{ color: PRIMARY_BLUE }}>Month</th>
                              <th className="text-center py-2.5 px-3 font-semibold" style={{ color: PRIMARY_BLUE }}>Sessions</th>
                              <th className="text-center py-2.5 px-3 font-semibold" style={{ color: PRIMARY_BLUE }}>Check-ins</th>
                              <th className="text-center py-2.5 px-3 font-semibold" style={{ color: PRIMARY_BLUE }}>Empty</th>
                              <th className="text-center py-2.5 px-3 font-semibold" style={{ color: PRIMARY_BLUE }}>Fill Rate</th>
                              <th className="text-right py-2.5 px-3 font-semibold" style={{ color: PRIMARY_BLUE }}>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionsData.length > 0 ? (
                              sessionsData.map((session, index) => (
                                <tr 
                                  key={index} 
                                  className="hover:bg-slate-50 transition-colors"
                                  style={{ borderBottom: `1px solid ${SILVER_LIGHT}` }}
                                >
                                  <td className="py-2.5 px-3 font-medium" style={{ color: PRIMARY_BLUE }}>{session.date}</td>
                                  <td className="py-2.5 px-3 text-center" style={{ color: SILVER_DARK }}>{session.sessions}</td>
                                  <td className="py-2.5 px-3 text-center font-medium" style={{ color: PRIMARY_BLUE }}>{session.checkIns}</td>
                                  <td className="py-2.5 px-3 text-center" style={{ color: SILVER_DARK }}>{session.empty}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs"
                                      style={{ borderColor: PRIMARY_BLUE, color: PRIMARY_BLUE }}
                                    >
                                      {session.fillRate}%
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-medium" style={{ color: PRIMARY_BLUE }}>{formatCurrency(session.revenue)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-8 text-center" style={{ color: SILVER }}>
                                  No session data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                          {sessionsData.length > 0 && (
                            <tfoot>
                              <tr style={{ backgroundColor: `${PRIMARY_BLUE}10` }}>
                                <td className="py-2.5 px-3 font-bold" style={{ color: PRIMARY_BLUE }}>TOTALS</td>
                                <td className="py-2.5 px-3 text-center font-bold" style={{ color: PRIMARY_BLUE }}>{processedData.totalSessions}</td>
                                <td className="py-2.5 px-3 text-center font-bold" style={{ color: PRIMARY_BLUE }}>{processedData.totalCustomers}</td>
                                <td className="py-2.5 px-3 text-center font-bold" style={{ color: SILVER_DARK }}>{processedData.totalEmptySessions}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{ borderColor: PRIMARY_BLUE, color: PRIMARY_BLUE }}
                                  >
                                    {processedData.fillRate.toFixed(1)}%
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold" style={{ color: PRIMARY_BLUE }}>{formatCurrency(processedData.totalRevenue)}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
