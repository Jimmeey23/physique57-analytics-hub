import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Target, DollarSign, Clock, UserCheck, Award, ArrowRight, Eye } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';
import { isConverted, isNewClient, isRetained } from '@/utils/clientRetention';
import { conversionRate as calcConversionRate, retentionRate as calcRetentionRate } from '@/utils/retentionRates';

interface EnhancedClientMetricCardsProps {
  data: NewClientData[];
  onCardClick?: (title: string, data: NewClientData[], metricType: string) => void;
}

export const EnhancedClientMetricCards: React.FC<EnhancedClientMetricCardsProps> = ({ data, onCardClick }) => {
  // Get unique "is new" categories and calculate metrics for each
  const isNewCategories = [...new Set(data.map(client => client.isNew).filter(Boolean))];
  
  // Calculate metrics by "is new" category
  const metricsByCategory = isNewCategories.map(category => {
    const categoryData = data.filter(client => client.isNew === category);
    const totalClients = categoryData.length;
    const newMembers = categoryData.filter(isNewClient).length;
    const convertedMembers = categoryData.filter(isConverted).length;
    const retainedMembers = categoryData.filter(isRetained).length;
    const totalLTV = categoryData.reduce((sum, client) => sum + (client.ltv || 0), 0);
    const avgLTV = totalClients > 0 ? totalLTV / totalClients : 0;
    
    // Additional metrics
    const avgVisitsPostTrial = totalClients > 0 ? categoryData.reduce((sum, client) => sum + (client.visitsPostTrial || 0), 0) / totalClients : 0;
    const avgPurchaseCountPostTrial = totalClients > 0 ? categoryData.reduce((sum, client) => sum + (client.purchaseCountPostTrial || 0), 0) / totalClients : 0;
    const avgConversionSpan = categoryData
      .filter(client => (client.conversionSpan || 0) > 0)
      .reduce((sum, client, _, arr) => sum + (client.conversionSpan || 0) / arr.length, 0);
    const avgVisits = totalClients > 0 ? categoryData.reduce((sum, client) => sum + (client.classNo || 0), 0) / totalClients : 0;

    const conversionRate = calcConversionRate(convertedMembers, newMembers);
    const retentionRate = calcRetentionRate(retainedMembers, newMembers);

    return {
      category,
      data: categoryData,
      metrics: [
        {
          title: 'Total Clients',
          value: formatNumber(totalClients),
          icon: Users,
          description: `${category} clients`,
          metricType: 'total_clients'
        },
        {
          title: 'Visits Post Trial',
          value: avgVisitsPostTrial.toFixed(1),
          icon: Eye,
          description: 'Avg visits after trial',
          metricType: 'visits_post_trial'
        },
        {
          title: 'Purchase Count',
          value: avgPurchaseCountPostTrial.toFixed(1),
          icon: Target,
          description: 'Avg purchases post trial',
          metricType: 'purchase_count'
        },
        {
          title: 'Avg LTV',
          value: formatCurrency(avgLTV),
          icon: DollarSign,
          description: 'Average lifetime value',
          metricType: 'avg_ltv'
        },
        {
          title: 'Conversion Span',
          value: `${avgConversionSpan.toFixed(0)} days`,
          icon: Clock,
          description: 'Avg conversion time',
          metricType: 'conversion_span'
        },
        {
          title: 'Conversion Rate',
          value: formatPercentage(conversionRate),
          icon: UserCheck,
          description: `${formatNumber(convertedMembers)} of ${formatNumber(newMembers)} new clients`,
          metricType: 'conversion_rate'
        },
        {
          title: 'Retention Rate',
          value: formatPercentage(retentionRate),
          icon: Award,
          description: `${formatNumber(retainedMembers)} of ${formatNumber(newMembers)} new clients`,
          metricType: 'retention_rate'
        },
        {
          title: 'Total Visits',
          value: avgVisits.toFixed(1),
          icon: ArrowRight,
          description: 'Avg total visits',
          metricType: 'total_visits'
        }
      ]
    };
  });

  return (
    <div className="space-y-8">
      {metricsByCategory.map((categoryGroup) => (
        <div key={categoryGroup.category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-800">{categoryGroup.category} Metrics</h3>
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
              {categoryGroup.data.length} clients
            </Badge>
          </div>
          <MetricGrid cols={4}>
            {categoryGroup.metrics.map((metric) => (
              <MetricCard
                key={`${categoryGroup.category}-${metric.title}`}
                label={metric.title}
                value={metric.value}
                sub={metric.description}
                icon={metric.icon}
                details={metric.description}
                detailsTitle="About this metric"
                onSelect={
                  onCardClick
                    ? () => onCardClick(metric.title, categoryGroup.data, metric.metricType)
                    : undefined
                }
              />
            ))}
          </MetricGrid>
        </div>
      ))}
    </div>
  );
};
