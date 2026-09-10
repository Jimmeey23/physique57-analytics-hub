import React, { useMemo } from 'react';
import { countConvertedLeads, calculateConversionRate } from '@/utils/leadConversions';
import {
  Users,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Zap,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';

interface FunnelMetricCardsProps {
  data: LeadsData[];
  onCardClick?: (title: string, data: LeadsData[], metricType: string) => void;
}

export const FunnelMetricCards: React.FC<FunnelMetricCardsProps> = ({ data, onCardClick }) => {
  const metrics = useMemo(() => {
    if (!data || !data.length) {
      return {
        leadsReceived: 0,
        trialsCompleted: 0,
        trialsScheduled: 0,
        proximityIssues: 0,
        convertedLeads: 0,
        trialToMemberConversion: 0,
        leadToTrialConversion: 0,
        leadToMemberConversion: 0,
        avgLTV: 0,
        avgVisitsPerLead: 0,
        pipelineHealth: 0
      };
    }

    const leadsReceived = data.length;
    // Prefer trialStatus over stage to avoid double-counting
    const trialsCompleted = data.filter(
      lead => lead.trialStatus === 'Trial Completed' || lead.stage === 'Trial Completed'
    ).length;
    const trialsScheduled = data.filter(lead => {
      const ts = (lead.trialStatus || '').toLowerCase();
      const st = (lead.stage || '').toLowerCase();
      // Count scheduled/booked trials but exclude completed
      const statusSuggestsTrial = ts.includes('trial') && !ts.includes('completed');
      const stageSuggestsTrial = st.includes('trial') && !st.includes('completed');
      return statusSuggestsTrial || stageSuggestsTrial;
    }).length;
    const proximityIssues = data.filter(lead => lead.stage?.includes('Proximity') || lead.remarks?.toLowerCase().includes('proximity')).length;
    const convertedLeads = countConvertedLeads(data); // Use unified conversion logic
    
    const trialToMemberConversion = trialsCompleted > 0 ? (convertedLeads / trialsCompleted) * 100 : 0;
    const leadToTrialConversion = leadsReceived > 0 ? (trialsScheduled / leadsReceived) * 100 : 0;
    const leadToMemberConversion = calculateConversionRate(data); // Use unified conversion rate calculation
    
    const totalLTV = data.reduce((sum, lead) => sum + (lead.ltv || 0), 0);
    const avgLTV = leadsReceived > 0 ? totalLTV / leadsReceived : 0;
    
    const totalVisits = data.reduce((sum, lead) => sum + (lead.visits || 0), 0);
    const avgVisitsPerLead = leadsReceived > 0 ? totalVisits / leadsReceived : 0;
    
    const pipelineHealth = Math.min(100, Math.round(
      (leadToTrialConversion * 0.3) + 
      (trialToMemberConversion * 0.4) + 
      (avgVisitsPerLead * 10 * 0.2) + 
      ((leadsReceived - proximityIssues) / leadsReceived * 100 * 0.1)
    ));

    return {
      leadsReceived,
      trialsCompleted,
      trialsScheduled,
      proximityIssues,
      convertedLeads,
      trialToMemberConversion,
      leadToTrialConversion,
      leadToMemberConversion,
      avgLTV,
      avgVisitsPerLead,
      pipelineHealth
    };
  }, [data]);

  const cards = [
    {
      id: 'leadsReceived',
      title: 'Leads Received',
      value: formatNumber(metrics.leadsReceived),
      icon: Users,
      subtitle: 'Total incoming leads',
      description: 'Total number of leads received in the selected period',
    },
    {
      id: 'trialsCompleted',
      title: 'Trials Completed',
      value: formatNumber(metrics.trialsCompleted),
      icon: CheckCircle,
      subtitle: 'Successful trial sessions',
      description: 'Number of trial sessions that were successfully completed',
    },
    {
      id: 'convertedLeads',
      title: 'Converted Leads',
      value: formatNumber(metrics.convertedLeads),
      icon: Target,
      subtitle: 'Successfully converted',
      description: 'Number of leads successfully converted to paying members',
    },
    {
      id: 'trialToMemberRate',
      title: 'Trial → Member %',
      value: `${metrics.trialToMemberConversion.toFixed(1)}%`,
      icon: TrendingUp,
      subtitle: 'Trial conversion efficiency',
      description: 'Percentage of completed trials that converted to memberships',
    },
    {
      id: 'leadToMemberRate',
      title: 'Lead → Member %',
      value: `${metrics.leadToMemberConversion.toFixed(1)}%`,
      icon: Zap,
      subtitle: 'Overall conversion rate',
      description: 'Overall percentage of leads converted to paying members',
    },
    {
      id: 'avgLTV',
      title: 'Average LTV',
      value: formatCurrency(metrics.avgLTV),
      icon: DollarSign,
      subtitle: 'Lifetime value per lead',
      description: 'Average lifetime value generated per lead',
    },
    {
      id: 'avgVisitsPerLead',
      title: 'Avg Visits/Lead',
      value: (metrics.avgVisitsPerLead).toLocaleString('en-IN'),
      icon: Eye,
      subtitle: 'Engagement frequency',
      description: 'Average number of visits per lead during the funnel process',
    },
    {
      id: 'pipelineHealth',
      title: 'Pipeline Health',
      value: `${metrics.pipelineHealth.toFixed(1)}%`,
      icon: metrics.pipelineHealth >= 70 ? CheckCircle : metrics.pipelineHealth >= 50 ? Clock : AlertTriangle,
      subtitle: 'Overall funnel performance',
      description: 'Composite score based on conversion rates, engagement, and lead quality',
    },
  ];

  return (
    <MetricGrid cols={4}>
      {cards.map((card) => (
        <MetricCard
          key={card.id}
          label={card.title}
          value={card.value}
          sub={card.subtitle}
          icon={card.icon}
          details={card.description}
          detailsTitle="About this metric"
          onSelect={onCardClick ? () => onCardClick(card.title, data, card.id) : undefined}
        />
      ))}
    </MetricGrid>
  );
};
