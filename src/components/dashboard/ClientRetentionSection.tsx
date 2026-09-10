import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  TrendingDown,
  Heart,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters';
import { LocationReportMetrics } from '@/hooks/useLocationReportData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { parseDate } from '@/utils/dateUtils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface ClientRetentionSectionProps {
  metrics: LocationReportMetrics;
}

export const ClientRetentionSection: React.FC<ClientRetentionSectionProps> = ({
  metrics
}) => {
  // Client lifecycle data
  const clientLifecycleData = [
    { name: 'Active', value: Math.max(0, metrics.uniqueMembers - metrics.churnedMembers), color: '#10B981' },
    { name: 'Churned', value: metrics.churnedMembers, color: '#EF4444' },
    { name: 'New', value: metrics.newClientsAcquired, color: '#3B82F6' }
  ];

  // Real monthly trend (trailing 12 cohorts) computed from client first visits
  const { data: allClients = [] } = useNewClientData();
  const statusOf = (c: { retentionStatus?: string }) => String(c.retentionStatus || '').toLowerCase();
  const isRetainedStatus = (c: { retentionStatus?: string }) => statusOf(c) === 'retained' || statusOf(c).startsWith('retained ');
  const isChurnedStatus = (c: { retentionStatus?: string }) =>
    !isRetainedStatus(c) && /churn|lost|cancel|lapsed|expir|dropped|terminat/.test(statusOf(c));

  const retentionTrend = useMemo(() => {
    const byMonth = new Map<string, { label: string; sort: number; total: number; retained: number; churned: number }>();
    for (const c of allClients) {
      const d = parseDate(c.firstVisitDate);
      if (!d || isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' }) + ` '${String(d.getFullYear()).slice(2)}`;
      const sort = d.getFullYear() * 12 + d.getMonth();
      const entry = byMonth.get(key) || { label, sort, total: 0, retained: 0, churned: 0 };
      entry.total += 1;
      if (isRetainedStatus(c)) entry.retained += 1;
      if (isChurnedStatus(c)) entry.churned += 1;
      byMonth.set(key, entry);
    }
    return Array.from(byMonth.values())
      .sort((a, b) => a.sort - b.sort)
      .slice(-12)
      .map(m => ({
        month: m.label,
        retention: m.total > 0 ? Math.round((m.retained / m.total) * 1000) / 10 : 0,
        newClients: m.total,
        churn: m.churned,
      }));
  }, [allClients]);

  // LTV breakdown data — real tertiles by client LTV (no estimates)
  const ltvBreakdown = useMemo(() => {
    const withLtv = allClients.filter(c => (c.ltv || 0) > 0).sort((a, b) => (a.ltv || 0) - (b.ltv || 0));
    if (withLtv.length === 0) {
      return [
        { segment: 'High Value', clients: 0, avgLTV: 0, color: '#10B981' },
        { segment: 'Medium Value', clients: 0, avgLTV: 0, color: '#3B82F6' },
        { segment: 'Low Value', clients: 0, avgLTV: 0, color: '#F59E0B' },
      ];
    }
    const third = Math.ceil(withLtv.length / 3);
    const low = withLtv.slice(0, third);
    const mid = withLtv.slice(third, third * 2);
    const high = withLtv.slice(third * 2);
    const avg = (arr: typeof withLtv) => arr.length > 0 ? arr.reduce((s, c) => s + (c.ltv || 0), 0) / arr.length : 0;
    return [
      { segment: 'High Value', clients: high.length, avgLTV: avg(high), color: '#10B981' },
      { segment: 'Medium Value', clients: mid.length, avgLTV: avg(mid), color: '#3B82F6' },
      { segment: 'Low Value', clients: low.length, avgLTV: avg(low), color: '#F59E0B' },
    ];
  }, [allClients]);

  const clientMetrics = [
    {
      title: 'Retention Rate',
      value: formatPercentage(metrics.retentionRate),
      change: 0, // TODO: Add historical comparison
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isPositive: true
    },
    {
      title: 'Churn Rate',
      value: formatPercentage(metrics.churnRate),
      change: 0, // TODO: Add historical comparison
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      isPositive: false
    },
    {
      title: 'New Clients',
      value: formatNumber(metrics.newClientsAcquired),
      change: 0, // TODO: Add historical comparison
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isPositive: true
    },
    {
      title: 'Average LTV',
      value: formatCurrency(metrics.averageLTV),
      change: 0, // TODO: Add historical comparison
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isPositive: true
    },
    {
      title: 'Trial Conversion',
      value: formatPercentage(metrics.conversionRate),
      change: 0,
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      isPositive: true
    },
    {
      title: 'Avg Days to Convert',
      value: `${Math.round(metrics.avgConversionDays)} days`,
      change: 0,
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      isPositive: false
    }
  ];

  const getRetentionStatus = (retentionRate: number) => {
    if (retentionRate >= 85) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    if (retentionRate >= 75) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: UserCheck };
    if (retentionRate >= 65) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50', icon: UserX };
  };

  const retentionStatus = getRetentionStatus(metrics.retentionRate);

  const getTrendBadge = (change: number, isPositiveMetric: boolean = true) => {
    if (change === 0) return null;
    
    const isGoodChange = isPositiveMetric ? change > 0 : change < 0;
    const icon = change > 0 ? TrendingUp : TrendingDown;
    const colorClass = isGoodChange ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        {React.createElement(icon, { className: 'w-4 h-4 mr-1' })}
        <span className="text-sm">{Math.abs(change)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Client Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {clientMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                {getTrendBadge(metric.change, metric.isPositive)}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Retention Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Client Retention Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-6 rounded-lg ${retentionStatus.bgColor} flex items-center justify-between`}>
            <div className="flex items-center">
              <retentionStatus.icon className={`w-8 h-8 ${retentionStatus.color} mr-4`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.retentionRate)}</p>
                <p className={`text-lg font-medium ${retentionStatus.color}`}>{retentionStatus.status}</p>
                <p className="text-sm text-gray-600">Overall client retention rate</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Industry Benchmark: 80%+</p>
              <p className="text-xs text-gray-500">Fitness industry standard</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Lifecycle Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Client Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientLifecycleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                >
                  {clientLifecycleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} clients`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {clientLifecycleData.map((segment, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <span>{segment.name} Clients</span>
                  </div>
                  <span className="font-medium">{formatNumber(segment.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Retention Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Retention & Acquisition Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={retentionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'retention' ? `${value}%` : formatNumber(Number(value)),
                    name === 'retention' ? 'Retention Rate' : 
                    name === 'newClients' ? 'New Clients' : 'Churned Clients'
                  ]} 
                />
                <Area 
                  type="monotone" 
                  dataKey="retention" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="newClients" 
                  stackId="2" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* LTV Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Lifetime Value Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ltvBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'avgLTV' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                  name === 'avgLTV' ? 'Average LTV' : 'Client Count'
                ]} 
              />
              <Bar dataKey="avgLTV" fill="#3B82F6" name="avgLTV" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {ltvBreakdown.map((segment, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full mx-auto mb-2" 
                  style={{ backgroundColor: segment.color }}
                />
                <p className="font-medium text-gray-900">{segment.segment}</p>
                <p className="text-2xl font-bold" style={{ color: segment.color }}>
                  {formatCurrency(segment.avgLTV)}
                </p>
                <p className="text-sm text-gray-600">{formatNumber(segment.clients)} clients</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Retention Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              Retention Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.retentionRate >= 80 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">Strong Retention</p>
                  <p className="text-sm text-green-700">
                    {formatPercentage(metrics.retentionRate)} retention exceeds industry standards
                  </p>
                </div>
              )}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">Active Client Base</p>
                <p className="text-sm text-blue-700">
                  {formatNumber(metrics.uniqueMembers - metrics.churnedMembers)} active members
                </p>
              </div>
              {metrics.averageLTV > 500 && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-800">High Client Value</p>
                  <p className="text-sm text-purple-700">
                    Average LTV of {formatCurrency(metrics.averageLTV)} indicates strong engagement
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.churnRate > 20 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">High Churn Risk</p>
                  <p className="text-sm text-red-700">
                    {formatPercentage(metrics.churnRate)} churn rate needs attention
                  </p>
                </div>
              )}
              {metrics.newClientsAcquired < metrics.churnedMembers && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-800">Acquisition Gap</p>
                  <p className="text-sm text-orange-700">
                    New client acquisition not keeping pace with churn
                  </p>
                </div>
              )}
              {metrics.averageLTV < 400 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">LTV Opportunity</p>
                  <p className="text-sm text-yellow-700">
                    Focus on increasing client lifetime value through engagement
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Client Retention Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.uniqueMembers)}</p>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-xs text-gray-500">Current client base</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.retentionRate)}</p>
              <p className="text-sm text-gray-600">Retention Rate</p>
              <p className="text-xs text-gray-500">Members retained</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.newClientsAcquired)}</p>
              <p className="text-sm text-gray-600">New Acquisitions</p>
              <p className="text-xs text-gray-500">This period</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.averageLTV)}</p>
              <p className="text-sm text-gray-600">Average LTV</p>
              <p className="text-xs text-gray-500">Per client value</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <UserX className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.churnedMembers)}</p>
              <p className="text-sm text-gray-600">Churned Clients</p>
              <p className="text-xs text-gray-500">Lost this period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientRetentionSection;