import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTrainerImage } from '@/components/ui/TrainerAvatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  Award,
  Activity,
  Clock,
  Star,
  BarChart3,
  Download,
  Share2,
  MapPin,
  X,
  ChevronRight,
  Sparkles,
  TrendingDown,
  Zap
} from 'lucide-react';
import { formatCurrency, formatNumber, formatRevenue } from '@/utils/formatters';

interface ModernTrainerDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  trainerData: any;
  initialTab?: string;
  highlightMetric?: string | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

export function ModernTrainerDrillDownModal({ 
  isOpen, 
  onClose, 
  trainerName, 
  trainerData, 
  initialTab = 'overview',
  highlightMetric = null
}: ModernTrainerDrillDownModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartView, setChartView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  // Respect initialTab when modal opens or when it changes
  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Process individual session data from trainerData.individualSessions
  const processedMetrics = useMemo(() => {
    console.log('🔍 Modal trainerData:', trainerData);
    
    if (!trainerData) {
      console.warn('⚠️ No trainer data provided');
      return {
        totals: { revenue: 0, sessions: 0, customers: 0, avgPerSession: 0, emptyClasses: 0 },
        classes: [],
        monthly: [],
        byLocation: [],
        byClassType: [],
        timeDistribution: [],
        performanceData: []
      };
    }

    // Use individualSessions if available (from handleRowClick with sessions data), otherwise use the aggregated data
    const sessions = trainerData.individualSessions || [];
    const hasDetailedData = trainerData.hasDetailedSessions ?? false;
    console.log(`📊 Processing ${sessions.length} individual sessions ${hasDetailedData ? '(from sessions sheet)' : '(from payroll sheet)'}`);
    
    if (sessions.length === 0) {
      console.log('📦 Using aggregated data as fallback');
      // Fallback to aggregated data
      const totals = {
        revenue: trainerData.totalRevenue || trainerData.totalPaid || 0,
        sessions: trainerData.totalSessions || 0,
        customers: trainerData.totalCustomers || 0,
        avgPerSession: trainerData.efficiency || 0,
        emptyClasses: trainerData.emptySessions || 0
      };

      return {
        totals,
        classes: [],
        monthly: [{
          month: 'Total',
          revenue: totals.revenue,
          sessions: totals.sessions,
          customers: totals.customers
        }],
        byLocation: [],
        byClassType: [],
        timeDistribution: [],
        performanceData: []
      };
    }


    // Calculate totals from individual sessions
    const totals = sessions.reduce((acc: any, session: any) => {
      const revenue = parseFloat(session.totalPaid || 0);
      const customers = parseInt(session.totalCustomers || 0);
      acc.revenue += revenue;
      acc.sessions += 1;
      acc.customers += customers;
      if (customers === 0) acc.emptyClasses += 1;
      return acc;
    }, { revenue: 0, sessions: 0, customers: 0, emptyClasses: 0 });

    totals.avgPerSession = totals.sessions > 0 ? totals.revenue / totals.sessions : 0;

    // Group by month
    const monthlyMap = new Map();
    sessions.forEach((session: any) => {
      const month = session.monthYear || 'Unknown';
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { revenue: 0, sessions: 0, customers: 0 });
      }
      const data = monthlyMap.get(month);
      data.revenue += parseFloat(session.totalPaid || 0);
      data.sessions += 1;
      data.customers += parseInt(session.totalCustomers || 0);
    });

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, data]: any) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by location
    const locationMap = new Map();
    sessions.forEach((session: any) => {
      const location = session.location || 'Unknown';
      if (!locationMap.has(location)) {
        locationMap.set(location, { name: location, revenue: 0, sessions: 0, customers: 0 });
      }
      const data = locationMap.get(location);
      data.revenue += parseFloat(session.totalPaid || 0);
      data.sessions += 1;
      data.customers += parseInt(session.totalCustomers || 0);
    });

    const byLocation = Array.from(locationMap.values());

    // Group by class type
    const classTypeMap = new Map();
    sessions.forEach((session: any) => {
      const classType = session.cleanedClass || session.className || 'Unknown';
      if (!classTypeMap.has(classType)) {
        classTypeMap.set(classType, { name: classType, value: 0, sessions: 0, customers: 0 });
      }
      const data = classTypeMap.get(classType);
      data.value += parseFloat(session.totalPaid || 0);
      data.sessions += 1;
      data.customers += parseInt(session.totalCustomers || 0);
    });

    const byClassType = Array.from(classTypeMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Time distribution (by hour if available, or just count)
    const timeMap = new Map();
    sessions.forEach((session: any) => {
      const time = session.time || session.classTime || 'Unknown';
      const hour = time.includes(':') ? time.split(':')[0] : time;
      if (!timeMap.has(hour)) {
        timeMap.set(hour, { time: hour, count: 0 });
      }
      timeMap.get(hour).count += 1;
    });

    const timeDistribution = Array.from(timeMap.values())
      .sort((a, b) => a.time.localeCompare(b.time));

    // Performance radar data
    const performanceData = [
      { 
        metric: 'Revenue', 
        value: Math.min((totals.avgPerSession / 2000) * 100, 100),
        fullMark: 100
      },
      { 
        metric: 'Attendance', 
        value: Math.min((totals.customers / totals.sessions / 15) * 100, 100),
        fullMark: 100
      },
      { 
        metric: 'Consistency', 
        value: Math.min((totals.sessions / monthly.length / 20) * 100, 100),
        fullMark: 100
      },
      { 
        metric: 'Engagement', 
        value: Math.min(((totals.sessions - totals.emptyClasses) / totals.sessions) * 100, 100),
        fullMark: 100
      },
      { 
        metric: 'Efficiency', 
        value: Math.min((byLocation.length / 3) * 100, 100),
        fullMark: 100
      }
    ];

    // Top individual classes with full details
    const classes = sessions
      .map((session: any) => ({
        className: session.cleanedClass || session.className || 'Class',
        location: session.location || 'Studio',
        date: session.date || 'N/A',
        monthYear: session.monthYear || 'N/A',
        time: session.time || session.classTime || 'N/A',
        dayOfWeek: session.dayOfWeek || 'N/A',
        revenue: parseFloat(session.totalPaid || 0),
        customers: parseInt(session.totalCustomers || 0),
        sessionId: session.sessionId || Math.random().toString(),
        // Additional metrics
        format: session.format || 'N/A',
        duration: session.duration || 'N/A',
        instructor: session.teacherName || trainerName
      }))
      .sort((a, b) => b.revenue - a.revenue);



    return {
      totals,
      classes,
      monthly,
      byLocation,
      byClassType,
      timeDistribution,
      performanceData
    };
  }, [trainerData]);

  // Calculate performance metrics
  const performanceScore = useMemo(() => {
    const { totals } = processedMetrics;
    if (totals.revenue === 0 || totals.sessions === 0) return 0;
    
    const avgRevenue = totals.avgPerSession;
    const avgCustomers = totals.customers / totals.sessions;
    const fillRate = ((totals.sessions - totals.emptyClasses) / totals.sessions) * 100;
    
    // Score based on revenue per session, customer engagement, and fill rate
    const revenueScore = Math.min((avgRevenue / 2000) * 35, 35); // Max 35 points
    const engagementScore = Math.min((avgCustomers / 15) * 35, 35); // Max 35 points
    const fillRateScore = Math.min((fillRate / 100) * 30, 30); // Max 30 points
    
    return revenueScore + engagementScore + fillRateScore;
  }, [processedMetrics]);

  const avgRevenuePerSession = processedMetrics.totals.avgPerSession;
  const avgCustomersPerSession = processedMetrics.totals.sessions > 0 
    ? processedMetrics.totals.customers / processedMetrics.totals.sessions 
    : 0;
  const activeMonths = processedMetrics.monthly.filter(m => m.revenue > 0).length;
  const fillRate = processedMetrics.totals.sessions > 0
    ? ((processedMetrics.totals.sessions - processedMetrics.totals.emptyClasses) / processedMetrics.totals.sessions) * 100
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] h-full p-0 bg-slate-50 border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex h-full overflow-hidden">
          {/* Left Panel - Trainer Profile */}
          <div className="w-72 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 flex flex-col overflow-y-auto border-r border-slate-300">
            {/* Close Button */}
            <Button 
              onClick={onClose} 
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 z-50 text-slate-600 hover:bg-slate-200 rounded-md p-2"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Large Trainer Image */}
            <div className="text-center mb-6">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="w-full h-full rounded-full overflow-hidden border-3 border-white/20 shadow-lg bg-gradient-to-br from-slate-600 to-slate-700">
                  <img 
                    src={getTrainerImage(trainerName)}
                    alt={trainerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const initials = trainerName.split(' ').map((n: string) => n[0]).join('');
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">${initials}</div>`;
                    }}
                  />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-1">{trainerName}</h2>
              <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 border-0 shadow-lg">
                <Star className="w-3 h-3 mr-1" />
                Elite Trainer
              </Badge>
            </div>

            {/* Performance Score */}
            <Card className="bg-white/10 border-white/20 mb-4">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Performance Score</span>
                  <span className="text-xl font-semibold">{performanceScore.toFixed(0)}</span>
                </div>
                <Progress value={performanceScore} className="h-1.5 bg-white/20" />
                <p className="text-xs text-white/70 mt-2">
                  {performanceScore >= 80 ? 'Outstanding' : performanceScore >= 60 ? 'Great' : performanceScore >= 40 ? 'Good' : 'Needs Improvement'}
                </p>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="space-y-3 flex-1">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur rounded-lg p-3 border border-green-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-green-100">Total Revenue</span>
                </div>
                <div className="text-xl font-bold">
                  {formatRevenue(processedMetrics.totals.revenue)}
                </div>
                <div className="text-xs text-green-200 mt-1">
                  Avg: {formatRevenue(avgRevenuePerSession)}/session
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur rounded-lg p-3 border border-blue-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-blue-100">Total Sessions</span>
                </div>
                <div className="text-xl font-bold">
                  {formatNumber(processedMetrics.totals.sessions)}
                </div>
                <div className="text-xs text-blue-200 mt-1">
                  {activeMonths} active months
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur rounded-lg p-3 border border-purple-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-100">Total Attendees</span>
                </div>
                <div className="text-xl font-bold">
                  {formatNumber(processedMetrics.totals.customers)}
                </div>
                <div className="text-xs text-purple-200 mt-1">
                  Avg: {avgCustomersPerSession.toFixed(1)}/session
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur rounded-lg p-3 border border-amber-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-100">Fill Rate</span>
                </div>
                <div className="text-xl font-bold">{fillRate.toFixed(1)}%</div>
                <div className="text-xs text-amber-200 mt-1">
                  {processedMetrics.totals.emptyClasses} empty classes
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-6 pt-6 border-t border-white/10">
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Full Report
              </Button>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Share Analytics
              </Button>
            </div>
          </div>

          {/* Right Panel - Detailed Analytics */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-slate-900 mb-1">Performance Analytics</h3>
              <p className="text-sm text-slate-600">Detailed breakdown of trainer metrics</p>
              <div className="h-px bg-slate-200 mt-3"></div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 border border-slate-200">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Insights
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {processedMetrics.monthly.length === 0 || !trainerData.individualSessions ? (
                  <Card className="bg-amber-50 border-2 border-amber-200">
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-amber-100 rounded-full">
                          <Activity className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-amber-900 mb-2">Limited Data Available</h3>
                          <p className="text-amber-700">
                            Showing summary metrics. Individual session details are not available for this trainer.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
                
                {/* Summary Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="group bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 border-0 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-5 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">YTD</Badge>
                      </div>
                      <p className="text-sm text-white/90 font-medium mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-white">{formatRevenue(processedMetrics.totals.revenue)}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                        <TrendingUp className="w-3 h-3" />
                        <span>Primary metric</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group bg-gradient-to-br from-purple-500 via-purple-600 to-pink-700 border-0 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-5 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">Count</Badge>
                      </div>
                      <p className="text-sm text-white/90 font-medium mb-1">Total Sessions</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(processedMetrics.totals.sessions)}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                        <Activity className="w-3 h-3" />
                        <span>Classes taught</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border-0 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-5 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">Total</Badge>
                      </div>
                      <p className="text-sm text-white/90 font-medium mb-1">Total Attendees</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(processedMetrics.totals.customers)}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                        <Users className="w-3 h-3" />
                        <span>Unique clients</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 border-0 shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-5 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">Avg</Badge>
                      </div>
                      <p className="text-sm text-white/90 font-medium mb-1">Avg/Session</p>
                      <p className="text-3xl font-bold text-white">{formatRevenue(avgRevenuePerSession)}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                        <Target className="w-3 h-3" />
                        <span>Per class</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Performance Table */}
                {processedMetrics.monthly.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      Monthly Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Month</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Revenue</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Sessions</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Attendees</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Avg/Session</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Avg Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {processedMetrics.monthly.map((month, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-900">{month.month}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatRevenue(month.revenue)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatNumber(month.sessions)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatNumber(month.customers)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatRevenue(month.revenue / month.sessions)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{(month.customers / month.sessions).toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* Location & Class Type Breakdown */}
                {(processedMetrics.byLocation.length > 0 || processedMetrics.byClassType.length > 0) && (
                <div className="grid grid-cols-2 gap-6">
                  {processedMetrics.byLocation.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-lg border-2 border-slate-200 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        By Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {processedMetrics.byLocation.map((loc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border">
                            <div>
                              <p className="font-semibold text-slate-900">{loc.name}</p>
                              <p className="text-sm text-slate-600">{loc.sessions} sessions · {loc.customers} attendees</p>
                            </div>
                            <p className="text-lg font-bold text-emerald-600">{formatRevenue(loc.revenue)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  )}

                  {processedMetrics.byClassType.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-lg border-2 border-slate-200 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        By Class Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {processedMetrics.byClassType.slice(0, 6).map((cls, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border">
                            <div>
                              <p className="font-semibold text-slate-900">{cls.name}</p>
                              <p className="text-sm text-slate-600">{cls.sessions} sessions · {cls.customers} attendees</p>
                            </div>
                            <p className="text-lg font-bold text-blue-600">{formatRevenue(cls.value)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  )}
                </div>
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                {/* Performance Radar */}
                <Card className="bg-white/90 backdrop-blur-lg border-2 border-slate-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      Multi-Dimensional Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={processedMetrics.performanceData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar name="Performance" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-green-800">Avg Revenue/Session</span>
                      </div>
                      <p className="text-3xl font-bold text-green-900">{formatRevenue(avgRevenuePerSession)}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {avgRevenuePerSession > 1500 ? '↑ Above Average' : '↓ Below Average'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-blue-800">Avg Attendance</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{avgCustomersPerSession.toFixed(1)}</p>
                      <p className="text-sm text-blue-600 mt-1">
                        {avgCustomersPerSession > 10 ? '↑ High Engagement' : '↓ Low Engagement'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500 rounded-lg">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-amber-800">Fill Rate</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-900">{fillRate.toFixed(1)}%</p>
                      <p className="text-sm text-amber-600 mt-1">
                        {fillRate > 85 ? '↑ Excellent' : fillRate > 70 ? '→ Good' : '↓ Needs Work'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Classes Tab */}
              <TabsContent value="classes" className="space-y-4">
                {processedMetrics.classes.length > 0 ? (
                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-lg">
                        <Award className="w-5 h-5 text-slate-600" />
                        All Classes ({processedMetrics.classes.length})
                      </div>
                      <Badge variant="outline" className="text-sm">
                        Total: {formatRevenue(processedMetrics.totals.revenue)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-semibold">#</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold">Class Name</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold">Date</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold">Day</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold">Time</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold">Location</th>
                            <th className="px-3 py-3 text-right text-xs font-semibold">Revenue</th>
                            <th className="px-3 py-3 text-right text-xs font-semibold">Attendees</th>
                            <th className="px-3 py-3 text-right text-xs font-semibold">$/Person</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedMetrics.classes.map((cls, index) => (
                            <tr key={cls.sessionId} className="border-b hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-3 text-sm font-medium text-slate-600">{index + 1}</td>
                              <td className="px-3 py-3">
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{cls.className}</p>
                                  {cls.format !== 'N/A' && (
                                    <p className="text-xs text-slate-500">{cls.format}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-sm text-slate-700">{cls.date}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{cls.dayOfWeek}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{cls.time}</td>
                              <td className="px-3 py-3">
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {cls.location}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">
                                {formatRevenue(cls.revenue)}
                              </td>
                              <td className="px-3 py-3 text-right text-sm font-medium text-slate-700">
                                {cls.customers}
                              </td>
                              <td className="px-3 py-3 text-right text-sm text-slate-700">
                                {cls.customers > 0 ? formatRevenue(cls.revenue / cls.customers) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 font-semibold">
                          <tr>
                            <td colSpan={6} className="px-3 py-3 text-sm text-slate-900">TOTALS</td>
                            <td className="px-3 py-3 text-right text-sm text-slate-900">
                              {formatRevenue(processedMetrics.totals.revenue)}
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-slate-900">
                              {formatNumber(processedMetrics.totals.customers)}
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-slate-900">
                              {formatRevenue(processedMetrics.totals.revenue / processedMetrics.totals.customers)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                ) : (
                  <Card className="border-slate-200">
                    <CardContent className="p-8 text-center">
                      <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">No class data available</p>
                      <p className="text-sm text-slate-500 mt-1">Individual session details not found for this trainer</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-900">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {fillRate > 85 && (
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Excellent fill rate at {fillRate.toFixed(1)}%</span>
                          </li>
                        )}
                        {avgRevenuePerSession > 1500 && (
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Above-average revenue per session</span>
                          </li>
                        )}
                        {processedMetrics.totals.sessions > 50 && (
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Highly active with {processedMetrics.totals.sessions}+ sessions</span>
                          </li>
                        )}
                        {processedMetrics.byLocation.length > 1 && (
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Multi-location presence ({processedMetrics.byLocation.length} studios)</span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="group bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 border-0 shadow-2xl hover:shadow-amber-500/50 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Growth Opportunities</h3>
                      </div>
                      <ul className="space-y-3">
                        {processedMetrics.totals.emptyClasses > 5 && (
                          <li className="flex items-start gap-3 text-sm text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="p-1 bg-white/20 rounded-full mt-0.5">
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            </div>
                            <span className="font-medium">Reduce empty classes ({processedMetrics.totals.emptyClasses} total)</span>
                          </li>
                        )}
                        {avgCustomersPerSession < 10 && (
                          <li className="flex items-start gap-3 text-sm text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="p-1 bg-white/20 rounded-full mt-0.5">
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            </div>
                            <span className="font-medium">Increase average attendance per class</span>
                          </li>
                        )}
                        {processedMetrics.monthly.length < 6 && (
                          <li className="flex items-start gap-3 text-sm text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="p-1 bg-white/20 rounded-full mt-0.5">
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            </div>
                            <span className="font-medium">Expand to more consistent monthly presence</span>
                          </li>
                        )}
                        {processedMetrics.byClassType.length < 3 && (
                          <li className="flex items-start gap-3 text-sm text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="p-1 bg-white/20 rounded-full mt-0.5">
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            </div>
                            <span className="font-medium">Diversify class format offerings</span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Stats */}
                <Card className="bg-gradient-to-r from-slate-900 to-blue-900 text-white border-0 shadow-2xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      Performance Summary
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-white/70">Total Classes</p>
                        <p className="text-2xl font-bold">{processedMetrics.classes.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Locations</p>
                        <p className="text-2xl font-bold">{processedMetrics.byLocation.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Class Types</p>
                        <p className="text-2xl font-bold">{processedMetrics.byClassType.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Performance</p>
                        <p className="text-2xl font-bold">{performanceScore.toFixed(0)}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
