import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Percent, ShoppingCart, CreditCard, DollarSign, Target, Activity, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useDiscountMetrics } from '@/hooks/useDiscountMetrics';

interface DiscountsAnimatedMetricCardsProps {
  data: SalesData[];
  historicalData?: SalesData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onMetricClick?: (metricData: any) => void;
}

const iconMap = {
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

  // For drill down context, compute some derived totals from current period subset of data
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || DollarSign;
        
        return (
          <Card 
            key={metric.title}
            className={cn(
              "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-out cursor-pointer",
              "bg-gradient-to-br from-white via-orange-50/30 to-orange-100/50",
              "hover:scale-105 hover:-translate-y-1"
            )}
            onClick={() => handleMetricClick(metric)}
            style={{ 
              animationDelay: `${index * 100}ms`,
              animation: 'slideInUp 0.6s ease-out forwards'
            }}
          >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </h3>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {metric.value}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {metric.description}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-300",
                    "bg-orange-100 text-orange-600",
                    "group-hover:bg-orange-200 group-hover:scale-110"
                  )}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  {typeof metric.change === 'number' && (
                    <Badge 
                      className={cn(
                        "text-xs font-medium px-2 py-1",
                        metric.change > 0
                          ? "bg-green-100 text-green-700 border-green-200" 
                          : metric.change < 0
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      )}
                    >
                      {metric.change > 0 && <ArrowUpRight className="w-3 h-3 mr-1" />}
                      {metric.change < 0 && <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {`${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}%`}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              {/* Period label and previous value */}
              {metric.periodLabel && (
                <div className="mt-3 text-xs text-gray-500">
                  {metric.periodLabel}: <span className="font-medium">{metric.previousValue}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};