import React, { useMemo } from 'react';
import { MetricCard, MetricGrid } from '@/components/ui/MetricCard';
import { Percent, ShoppingCart, CreditCard, DollarSign, Target, Activity, Users, ArrowDownRight } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { useDiscountMetrics } from '@/hooks/useDiscountMetrics';

interface DiscountsAnimatedMetricCardsProps {
  data: SalesData[];
  historicalData?: SalesData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onMetricClick?: (metricData: any) => void;
}

const iconMap: Record<string, any> = {
  DollarSign,
  ShoppingCart,
  Activity,
  Users,
  Target,
  Percent,
  CreditCard,
  ArrowDownRight
};

export const DiscountsAnimatedMetricCards: React.FC<DiscountsAnimatedMetricCardsProps> = ({ 
  data,
  historicalData,
  dateRange,
  onMetricClick 
}) => {
  const { metrics } = useDiscountMetrics(data, historicalData, { dateRange });

  // Debug logging removed for production

  // For drill down context, compute some derived totals from current period subset of data
  // Note: Show ALL transactions, not just discounted ones - useful for seeing full sales picture even if no discounts
  const calculatedContext = useMemo(() => {
    const totalDiscounts = data.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalRevenue = data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const totalTransactions = data.length;
    const discountedTransactions = data.filter(item => (item.discountAmount || 0) > 0).length;
    const uniqueCustomers = new Set(data.map(item => item.memberId || item.customerEmail)).size;
    const customersWithDiscounts = new Set(
      data.filter(item => (item.discountAmount || 0) > 0)
          .map(item => item.memberId || item.customerEmail)
    ).size;
    const discountPenetration = totalTransactions > 0 ? (discountedTransactions / totalTransactions) * 100 : 0;
    const discountRate = totalRevenue + totalDiscounts > 0 ? (totalDiscounts / (totalRevenue + totalDiscounts)) * 100 : 0;
    
    // Debug: log removed for production
    
    return { totalDiscounts, totalRevenue, totalTransactions, discountedTransactions, uniqueCustomers, customersWithDiscounts, discountPenetration, discountRate };
  }, [data]);

  const { totalRevenue, totalDiscounts, totalTransactions, discountedTransactions, uniqueCustomers, customersWithDiscounts, discountPenetration, discountRate } = calculatedContext;

  const handleMetricClick = (metric: any) => {
    if (onMetricClick) {
      const drillDownData = {
        title: metric.title,
        name: metric.title,
        type: 'metric',
        totalRevenue,
        totalDiscounts,
        transactions: totalTransactions,
        discountedTransactions,
        uniqueCustomers,
        customersWithDiscounts,
        discountRate,
        discountPenetration,
        rawData: data,
        filteredTransactionData: data,
        isDynamic: true,
        calculatedFromFiltered: true
      };
      
      onMetricClick(drillDownData);
    }
  };

  return (
    <MetricGrid cols={4}>
      {metrics.map((metric) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || DollarSign;
        return (
          <MetricCard
            key={metric.title}
            label={metric.title}
            value={metric.value}
            sub={metric.description}
            icon={IconComponent}
            delta={{
              value: `${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}%`,
              tone: metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'flat',
            }}
            details={
              <span>
                {metric.periodLabel || 'vs previous month'}: <strong>{metric.previousValue}</strong>
              </span>
            }
            detailsTitle="Previous period"
            onSelect={onMetricClick ? () => handleMetricClick(metric) : undefined}
          />
        );
      })}
    </MetricGrid>
  );
};
