import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Clock, UserCheck, Award, UserPlus, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { useClientConversionMetrics } from '@/hooks/useClientConversionMetrics';

interface ClientConversionMetricCardsProps {
  data: NewClientData[];
  historicalData?: NewClientData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onCardClick?: (title: string, data: NewClientData[], metricType: string) => void;
}

export const ClientConversionMetricCards: React.FC<ClientConversionMetricCardsProps> = ({ data, historicalData, dateRange, onCardClick }) => {
  const { metrics } = useClientConversionMetrics(data, historicalData, { dateRange });
  const iconMap: Record<string, any> = {
    'New Members': UserPlus,
    'Converted Members': Award,
    'Retained Members': UserCheck,
    'Conversion Rate': TrendingUp,
    'Retention Rate': Target,
    'Avg LTV': DollarSign,
  };
  const metricCards = metrics.map(m => ({
    title: m.title,
    value: m.value,
    icon: iconMap[m.title] || Users,
    gradient: 'from-slate-700 to-slate-800',
    description: m.description,
    change: m.change,
    previousValue: m.previousValue,
    period: m.periodLabel || 'vs previous month',
    metricType: m.title.toLowerCase().replace(/\s+/g, '_'),
    filterData: () => {
      switch (m.title) {
        case 'New Members':
          return data.filter(client => String(client.isNew || '').toLowerCase().includes('new'));
        case 'Converted Members':
          return data.filter(client => client.conversionStatus === 'Converted');
        case 'Retained Members':
          return data.filter(client => client.retentionStatus === 'Retained');
        default:
          return data;
      }
    }
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => (
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
                {typeof metric.change === 'number' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${metric.change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {metric.change >= 0 ? '▲' : '▼'} {`${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}%`}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-slate-900">{metric.value}</div>
              <p className="text-xs text-slate-500">{metric.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-500">{metric.previousValue ? `${metric.period}: ${metric.previousValue}` : ''}</div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};