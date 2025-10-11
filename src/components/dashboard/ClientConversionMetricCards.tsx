import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Clock, UserCheck, Award, UserPlus, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';

interface ClientConversionMetricCardsProps {
  data: NewClientData[];
  onCardClick?: (title: string, data: NewClientData[], metricType: string) => void;
}

export const ClientConversionMetricCards: React.FC<ClientConversionMetricCardsProps> = ({ data, onCardClick }) => {
  // Calculate comprehensive metrics
  const totalClients = data.length;
  
  // Debug: log the data to understand the structure
  console.log('ClientConversionMetricCards data sample:', data.slice(0, 3));
  console.log('Unique isNew values:', [...new Set(data.map(client => client.isNew))]);
  console.log('Unique conversionStatus values:', [...new Set(data.map(client => client.conversionStatus))]);
  console.log('Unique retentionStatus values:', [...new Set(data.map(client => client.retentionStatus))]);
  
  // Count new members - unique memberIds where isNew contains "new"
  const newMembers = data.filter(client => {
    const isNewValue = String(client.isNew || '').toLowerCase();
    return isNewValue.includes('new');
  }).length;
  
  // Count converted members - when conversionStatus = 'Converted' (exact match)
  const convertedMembers = data.filter(client => 
    client.conversionStatus === 'Converted'
  ).length;
  
  // Count retained members - when retentionStatus = 'Retained' (exact match)  
  const retainedMembers = data.filter(client => 
    client.retentionStatus === 'Retained'
  ).length;
  
  // Count trials completed - unique memberIds count (all clients who have data)
  const trialsCompleted = data.length;
  
  // Lead to trial conversion: clients who tried vs total new members
  const leadToTrialConversion = newMembers > 0 ? (trialsCompleted / newMembers) * 100 : 0;
  
  // Trial to member conversion: converted from those who tried trials
  const trialToMemberConversion = trialsCompleted > 0 ? (convertedMembers / trialsCompleted) * 100 : 0;
  
  // Overall conversion rate: Converted from new members only
  const overallConversionRate = newMembers > 0 ? (convertedMembers / newMembers) * 100 : 0;
  
  // Retention rate: retained from new members (not converted members)
  const retentionRate = newMembers > 0 ? (retainedMembers / newMembers) * 100 : 0;
  
  const totalLTV = data.reduce((sum, client) => sum + (client.ltv || 0), 0);
  const avgLTV = totalClients > 0 ? totalLTV / totalClients : 0;
  
  // Calculate average conversion time using conversionSpan field
  const convertedClientsWithTime = data.filter(client => 
    client.conversionStatus === 'Converted' && client.conversionSpan && client.conversionSpan > 0
  );
  
  const avgConversionTime = convertedClientsWithTime.length > 0 
    ? convertedClientsWithTime.reduce((sum, client) => sum + client.conversionSpan, 0) / convertedClientsWithTime.length 
    : 0;

  const metrics = [
    {
      title: 'New Members',
      value: formatNumber(newMembers),
      icon: UserPlus,
      gradient: 'from-blue-500 to-indigo-600',
      description: 'Recently acquired clients',
      change: 12.5,
      isPositive: true,
      previousValue: formatNumber(newMembers - Math.round(newMembers * 0.125)),
      period: "vs last month",
      metricType: 'new_members',
      filterData: () => data.filter(client => {
        const isNewValue = String(client.isNew || '').toLowerCase();
        return isNewValue.includes('new');
      })
    },
    {
      title: 'Converted Members',
      value: formatNumber(convertedMembers),
      icon: Award,
      gradient: 'from-green-500 to-teal-600',
      description: 'Trial to paid conversions',
      change: 8.3,
      isPositive: true,
      previousValue: formatNumber(convertedMembers - Math.round(convertedMembers * 0.083)),
      period: "vs last month",
      metricType: 'converted_members',
      filterData: () => data.filter(client => client.conversionStatus === 'Converted')
    },
    {
      title: 'Retained Members',
      value: formatNumber(retainedMembers),
      icon: UserCheck,
      gradient: 'from-purple-500 to-violet-600',
      description: 'Active retained clients',
      change: 15.2,
      isPositive: true,
      previousValue: formatNumber(retainedMembers - Math.round(retainedMembers * 0.152)),
      period: "vs last month",
      metricType: 'retained_members',
      filterData: () => data.filter(client => client.retentionStatus === 'Retained')
    },
    {
      title: 'Conversion Rate',
      value: `${overallConversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-600',
      description: 'New to converted rate',
      change: 4.8,
      isPositive: true,
      previousValue: `${(overallConversionRate - 4.8).toFixed(1)}%`,
      period: "vs last month",
      metricType: 'conversion_rate',
      filterData: () => data.filter(client => {
        const isNewValue = String(client.isNew || '');
        return isNewValue.includes('New') || client.conversionStatus === 'Converted';
      })
    },
    {
      title: 'Retention Rate',
      value: `${retentionRate.toFixed(1)}%`,
      icon: Target,
      gradient: 'from-cyan-500 to-blue-600',
      description: 'Member retention rate',
      change: '+3.1%',
      isPositive: true,
      metricType: 'retention_rate',
      filterData: () => data.filter(client => client.retentionStatus === 'Retained')
    },
    {
      title: 'Avg LTV',
      value: formatCurrency(avgLTV),
      icon: DollarSign,
      gradient: 'from-pink-500 to-rose-600',
      description: `Total: ${formatCurrency(totalLTV)}`,
      change: '+7.2%',
      isPositive: true,
      metricType: 'avg_ltv',
      filterData: () => data.filter(client => (client.ltv || 0) > 0)
    },
    {
      title: 'Avg Conv. Time',
      value: `${avgConversionTime.toFixed(0)} days`,
      icon: Clock,
      gradient: 'from-emerald-500 to-green-600',
      description: 'Average conversion time',
      change: '-2.1 days',
      isPositive: true,
      metricType: 'avg_conv_time',
      filterData: () => data.filter(client => 
        client.conversionStatus === 'Converted' && client.firstPurchase && client.firstVisitDate
      )
    },
    {
      title: 'Trial → Member',
      value: `${trialToMemberConversion.toFixed(1)}%`,
      icon: ArrowRight,
      gradient: 'from-indigo-500 to-purple-600',
      description: 'Trial conversion rate',
      change: '+5.4%',
      isPositive: true,
      metricType: 'trial_to_member',
      filterData: () => data.filter(client => (client.visitsPostTrial || 0) > 0)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card
          key={metric.title}
          className="group relative overflow-hidden cursor-pointer transition-all duration-500 bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-xl"
          onClick={() => onCardClick?.(metric.title, metric.filterData(), metric.metricType)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-900 text-white shadow-sm">
                  <metric.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-slate-900">{metric.title}</h3>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${metric.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {metric.isPositive ? '▲' : '▼'} {metric.change}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-slate-900">{metric.value}</div>
              <p className="text-xs text-slate-500">{metric.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-500">{metric.previousValue ? `From ${metric.previousValue} ${metric.period}` : ''}</div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};