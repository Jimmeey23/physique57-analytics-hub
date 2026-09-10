
import React from 'react';
import { Users, Target, TrendingUp, CreditCard, Activity, UserCheck, Zap, BarChart3 } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface ImprovedLeadMetricCardsProps {
  data: LeadsData[];
}

export const ImprovedLeadMetricCards: React.FC<ImprovedLeadMetricCardsProps> = ({ data }) => {
  const totalLeads = data.length;
  const convertedLeads = data.filter(item => item.conversionStatus === 'Converted').length;
  const trialsCompleted = data.filter(item => item.stage === 'Trial Completed').length;
  const totalLTV = data.reduce((sum, item) => sum + (item.ltv || 0), 0);
  const totalVisits = data.reduce((sum, item) => sum + (item.visits || 0), 0);
  const avgLTV = totalLeads > 0 ? totalLTV / totalLeads : 0;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const trialConversionRate = totalLeads > 0 ? (trialsCompleted / totalLeads) * 100 : 0;
  const avgVisitsPerLead = totalLeads > 0 ? totalVisits / totalLeads : 0;

  const metrics = [
    {
      title: 'Total Leads',
      value: formatNumber(totalLeads),
      description: 'Total leads in pipeline',
      icon: Users,
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      description: 'Lead to customer conversion',
      icon: Target,
    },
    {
      title: 'Trial Conversion',
      value: `${trialConversionRate.toFixed(1)}%`,
      description: 'Lead to trial conversion',
      icon: UserCheck,
    },
    {
      title: 'Average LTV',
      value: formatCurrency(avgLTV),
      description: 'Customer lifetime value',
      icon: CreditCard,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalLTV),
      description: 'Total pipeline value',
      icon: TrendingUp,
    },
    {
      title: 'Converted Leads',
      value: formatNumber(convertedLeads),
      description: 'Successfully converted leads',
      icon: Zap,
    },
    {
      title: 'Avg Visits/Lead',
      value: avgVisitsPerLead.toFixed(1),
      description: 'Average visits per lead',
      icon: Activity,
    },
    {
      title: 'Pipeline Health',
      value: totalLeads > 0 ? `${(((convertedLeads + trialsCompleted) / totalLeads) * 100).toFixed(1)}%` : '0.0%',
      description: 'Active + converted leads',
      icon: BarChart3,
    }
  ];

  return (
    <MetricGrid cols={4}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          label={metric.title}
          value={metric.value}
          sub={metric.description}
          icon={metric.icon}
        />
      ))}
    </MetricGrid>
  );
};
