import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Award, Download, Share2, TrendingUp, TrendingDown, Users, Calendar, Target, Activity, BarChart3 } from 'lucide-react';
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

interface TrainerDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  trainerData: any;
}

export const TrainerDrillDownModal: React.FC<TrainerDrillDownModalProps> = ({
  isOpen,
  onClose,
  trainerName,
  trainerData
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Process the actual trainer data from props
  const processedData = useMemo(() => {
    if (!trainerData) return null;

    const monthlyData = trainerData.monthlyData || {};
    const months = trainerData.months || Object.keys(monthlyData);

    // Calculate totals and averages from actual data
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

    // Build monthly trend data
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

    // Use direct values if provided (fallback)
    if (trainerData.totalSessions) totalSessions = trainerData.totalSessions;
    if (trainerData.totalCustomers) totalCustomers = trainerData.totalCustomers;
    if (trainerData.totalRevenue) totalRevenue = trainerData.totalRevenue;
    if (trainerData.cycleSessions) cycleSessions = trainerData.cycleSessions;
    if (trainerData.barreSessions) barreSessions = trainerData.barreSessions;
    if (trainerData.strengthSessions) strengthSessions = trainerData.strengthSessions;

    // Calculate averages
    const classAverage = totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0;
    const fillRate = totalSessions > 0 ? ((totalNonEmptySessions / totalSessions) * 100) : 0;
    const revenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const conversionRate = newMembers > 0 ? (convertedMembers / newMembers) * 100 : 0;
    const retentionRate = newMembers > 0 ? (retainedMembers / newMembers) * 100 : 0;

    // Get previous period data for change calculation
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

    // Format distribution for pie chart
    const formatDistribution = [
      { name: 'Cycle', value: cycleSessions, color: '#3b82f6' },
      { name: 'Barre', value: barreSessions, color: '#10b981' },
      { name: 'Strength', value: strengthSessions, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    // Revenue distribution
    const revenueDistribution = [
      { name: 'Cycle', value: cycleRevenue, color: '#3b82f6' },
      { name: 'Barre', value: barreRevenue, color: '#10b981' },
      { name: 'Strength', value: strengthRevenue, color: '#f59e0b' }
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
      revenueDistribution,
      monthlyTrend: monthlyTrend.reverse(), // Show chronological order
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

  // Individual sessions data from monthly records
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
        capacity: (data.totalSessions || 0) * 10,
        fillRate: data.totalSessions > 0 
          ? Math.round((data.nonEmptySessions / data.totalSessions) * 100) 
          : 0,
        booked: data.totalCustomers || 0,
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
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] max-h-[900px] overflow-hidden p-0 bg-white border-0 shadow-2xl rounded-xl">
        <div className="flex h-full">
          {/* Left Side - Full Height Trainer Profile with Image */}
          <div className="w-[340px] min-w-[340px] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 z-30 rounded-full w-8 h-8 p-0 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Full height trainer image */}
            <div className="flex-1 relative overflow-hidden">
              <img
                src={getTrainerAvatar(trainerName)}
                alt={trainerName}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
                <span className="text-[120px] font-bold text-white/30">
                  {getTrainerInitials(trainerName)}
                </span>
              </div>
              
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
            </div>

            {/* Trainer info at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-2xl font-bold mb-1">{trainerName}</h1>
              <p className="text-blue-200 text-sm mb-4">{processedData.location}</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-blue-200 uppercase tracking-wider">Sessions</div>
                  <div className="text-xl font-bold">{formatNumber(processedData.totalSessions)}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-blue-200 uppercase tracking-wider">Members</div>
                  <div className="text-xl font-bold">{formatNumber(processedData.totalCustomers)}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-blue-200 uppercase tracking-wider">Revenue</div>
                  <div className="text-xl font-bold">{formatCurrency(processedData.totalRevenue)}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-blue-200 uppercase tracking-wider">Fill Rate</div>
                  <div className="text-xl font-bold">{processedData.fillRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Analytics Dashboard */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="p-5 bg-white border-b border-gray-200 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{trainerName} Performance Analytics</h2>
                <p className="text-sm text-gray-500 mt-1">Detailed metrics and insights • {processedData.months?.length || 0} months of data</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs">
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
                <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Key Metrics Row */}
            <div className="p-5 bg-white border-b border-gray-200 shrink-0">
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-slate-800 text-white rounded-xl p-4">
                  <div className="text-xs text-gray-300 uppercase tracking-wider mb-1">Total Sessions</div>
                  <div className="text-2xl font-bold">{formatNumber(processedData.totalSessions)}</div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${processedData.sessionsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {processedData.sessionsChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(processedData.sessionsChange).toFixed(1)}% vs prev
                  </div>
                </div>
                <div className="bg-slate-800 text-white rounded-xl p-4">
                  <div className="text-xs text-gray-300 uppercase tracking-wider mb-1">Total Members</div>
                  <div className="text-2xl font-bold">{formatNumber(processedData.totalCustomers)}</div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${processedData.customersChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {processedData.customersChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(processedData.customersChange).toFixed(1)}% vs prev
                  </div>
                </div>
                <div className="bg-slate-800 text-white rounded-xl p-4">
                  <div className="text-xs text-gray-300 uppercase tracking-wider mb-1">Class Average</div>
                  <div className="text-2xl font-bold">{processedData.classAverage.toFixed(1)}</div>
                  <div className="text-xs text-gray-400 mt-1">per session</div>
                </div>
                <div className="bg-slate-800 text-white rounded-xl p-4">
                  <div className="text-xs text-gray-300 uppercase tracking-wider mb-1">Fill Rate</div>
                  <div className="text-2xl font-bold">{processedData.fillRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400 mt-1">non-empty sessions</div>
                </div>
                <div className="bg-slate-800 text-white rounded-xl p-4">
                  <div className="text-xs text-gray-300 uppercase tracking-wider mb-1">Revenue</div>
                  <div className="text-2xl font-bold">{formatCurrency(processedData.totalRevenue)}</div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${processedData.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {processedData.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(processedData.revenueChange).toFixed(1)}% vs prev
                  </div>
                </div>
              </div>
            </div>

            {/* Tabbed Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-5 pt-4 shrink-0">
                  <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="breakdown" className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
                      Format Breakdown
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
                      Trends
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
                      Sessions ({sessionsData.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Secondary Metrics */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            Performance Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                              <div className="text-xs text-yellow-700 uppercase tracking-wider mb-1">Rev/Session</div>
                              <div className="text-xl font-bold text-yellow-900">{formatCurrency(processedData.revenuePerSession)}</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                              <div className="text-xs text-blue-700 uppercase tracking-wider mb-1">Empty Sessions</div>
                              <div className="text-xl font-bold text-blue-900">{formatNumber(processedData.totalEmptySessions)}</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                              <div className="text-xs text-green-700 uppercase tracking-wider mb-1">Conversion Rate</div>
                              <div className="text-xl font-bold text-green-900">{processedData.conversionRate.toFixed(1)}%</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                              <div className="text-xs text-purple-700 uppercase tracking-wider mb-1">Retention Rate</div>
                              <div className="text-xl font-bold text-purple-900">{processedData.retentionRate.toFixed(1)}%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Format Distribution */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            Class Format Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {processedData.formatDistribution.length > 0 ? (
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={processedData.formatDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {processedData.formatDistribution.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="h-48 flex items-center justify-center text-gray-400">
                              No format data available
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Member Metrics */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          Member Acquisition & Retention
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">New Members</span>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {formatNumber(processedData.newMembers)}
                              </Badge>
                            </div>
                            <Progress value={processedData.newMembers > 0 ? 100 : 0} className="h-2" />
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Converted</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {formatNumber(processedData.convertedMembers)}
                              </Badge>
                            </div>
                            <Progress 
                              value={processedData.newMembers > 0 ? (processedData.convertedMembers / processedData.newMembers) * 100 : 0} 
                              className="h-2" 
                            />
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Retained</span>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {formatNumber(processedData.retainedMembers)}
                              </Badge>
                            </div>
                            <Progress 
                              value={processedData.newMembers > 0 ? (processedData.retainedMembers / processedData.newMembers) * 100 : 0} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Format Breakdown Tab */}
                  <TabsContent value="breakdown" className="mt-0 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Cycle */}
                      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            Cycle Classes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sessions</span>
                            <span className="font-bold text-blue-900">{formatNumber(processedData.cycleSessions)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue</span>
                            <span className="font-bold text-blue-900">{formatCurrency(processedData.cycleRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">% of Total</span>
                            <span className="font-bold text-blue-900">
                              {processedData.totalSessions > 0 
                                ? ((processedData.cycleSessions / processedData.totalSessions) * 100).toFixed(1) 
                                : 0}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Barre */}
                      <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-green-800 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Barre Classes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sessions</span>
                            <span className="font-bold text-green-900">{formatNumber(processedData.barreSessions)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue</span>
                            <span className="font-bold text-green-900">{formatCurrency(processedData.barreRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">% of Total</span>
                            <span className="font-bold text-green-900">
                              {processedData.totalSessions > 0 
                                ? ((processedData.barreSessions / processedData.totalSessions) * 100).toFixed(1) 
                                : 0}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Strength */}
                      <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            Strength Classes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sessions</span>
                            <span className="font-bold text-amber-900">{formatNumber(processedData.strengthSessions)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue</span>
                            <span className="font-bold text-amber-900">{formatCurrency(processedData.strengthRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">% of Total</span>
                            <span className="font-bold text-amber-900">
                              {processedData.totalSessions > 0 
                                ? ((processedData.strengthSessions / processedData.totalSessions) * 100).toFixed(1) 
                                : 0}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Revenue by Format */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Revenue by Class Format</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { name: 'Cycle', sessions: processedData.cycleSessions, revenue: processedData.cycleRevenue },
                              { name: 'Barre', sessions: processedData.barreSessions, revenue: processedData.barreRevenue },
                              { name: 'Strength', sessions: processedData.strengthSessions, revenue: processedData.strengthRevenue }
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                              <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} />
                              <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                              <Tooltip 
                                formatter={(value: number, name: string) => 
                                  name === 'revenue' ? formatCurrency(value) : formatNumber(value)
                                }
                                contentStyle={{ 
                                  backgroundColor: '#f8fafc', 
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Legend />
                              <Bar yAxisId="left" dataKey="sessions" fill="#3b82f6" name="Sessions" radius={[4, 4, 0, 0]} />
                              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Trends Tab */}
                  <TabsContent value="trends" className="mt-0 space-y-4">
                    {/* Monthly Trend Chart */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          Monthly Performance Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {processedData.monthlyTrend.length > 0 ? (
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={processedData.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                                <Tooltip 
                                  formatter={(value: number, name: string) => {
                                    if (name === 'revenue') return formatCurrency(value);
                                    if (name === 'fillRate') return `${value.toFixed(1)}%`;
                                    return formatNumber(value);
                                  }}
                                  contentStyle={{ 
                                    backgroundColor: '#f8fafc', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                  }} 
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} name="Sessions" dot={{ fill: '#3b82f6' }} />
                                <Line yAxisId="left" type="monotone" dataKey="customers" stroke="#8b5cf6" strokeWidth={2} name="Customers" dot={{ fill: '#8b5cf6' }} />
                                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" dot={{ fill: '#10b981' }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-72 flex items-center justify-center text-gray-400">
                            No trend data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Fill Rate Trend */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          Fill Rate Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {processedData.monthlyTrend.length > 0 ? (
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={processedData.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                                <Tooltip 
                                  formatter={(value: number) => `${value.toFixed(1)}%`}
                                  contentStyle={{ 
                                    backgroundColor: '#f8fafc', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                  }} 
                                />
                                <Bar dataKey="fillRate" fill="#3b82f6" name="Fill Rate %" radius={[4, 4, 0, 0]}>
                                  {processedData.monthlyTrend.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.fillRate >= 70 ? '#10b981' : entry.fillRate >= 40 ? '#f59e0b' : '#ef4444'} 
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-gray-400">
                            No fill rate data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Sessions Tab */}
                  <TabsContent value="sessions" className="mt-0">
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Session History by Month
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Sessions</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Check-ins</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Empty</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Fill Rate</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sessionsData.length > 0 ? (
                                sessionsData.map((session, index) => (
                                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-gray-900">{session.date}</td>
                                    <td className="py-3 px-4 text-center">{session.sessions}</td>
                                    <td className="py-3 px-4 text-center text-blue-600 font-medium">{session.checkIns}</td>
                                    <td className="py-3 px-4 text-center text-red-500">{session.empty}</td>
                                    <td className="py-3 px-4 text-center">
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          session.fillRate >= 70 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : session.fillRate >= 40 
                                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                              : 'bg-red-50 text-red-700 border-red-200'
                                        }
                                      >
                                        {session.fillRate}%
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(session.revenue)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-gray-400">
                                    No session data available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            {sessionsData.length > 0 && (
                              <tfoot>
                                <tr className="bg-gray-100 font-semibold">
                                  <td className="py-3 px-4 text-gray-900">TOTALS</td>
                                  <td className="py-3 px-4 text-center">{processedData.totalSessions}</td>
                                  <td className="py-3 px-4 text-center text-blue-600">{processedData.totalCustomers}</td>
                                  <td className="py-3 px-4 text-center text-red-500">{processedData.totalEmptySessions}</td>
                                  <td className="py-3 px-4 text-center">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      {processedData.fillRate.toFixed(1)}%
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-600">{formatCurrency(processedData.totalRevenue)}</td>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
