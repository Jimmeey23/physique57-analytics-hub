import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Clock, UserCheck, Award, UserPlus, ArrowRight, CalendarDays, Repeat } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { useClientConversionMetrics } from '@/hooks/useClientConversionMetrics';

interface ClientConversionMetricCardsProps {
  data: NewClientData[];
  historicalData?: NewClientData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onCardClick?: (title: string, data: NewClientData[], metricType: string) => void;
}

const ClientConversionMetricCardsComponent: React.FC<ClientConversionMetricCardsProps> = ({ data, historicalData, dateRange, onCardClick }) => {
  const { metrics } = useClientConversionMetrics(data, historicalData, { dateRange });
  
  // Calculate additional metrics
  const avgConversionTime = React.useMemo(() => {
    const withSpan = data.filter(c => c.conversionSpan && c.conversionSpan > 0);
    if (withSpan.length === 0) return 0;
    return withSpan.reduce((sum, c) => sum + (c.conversionSpan || 0), 0) / withSpan.length;
  }, [data]);

  const avgVisitsPostTrial = React.useMemo(() => {
    const withVisits = data.filter(c => c.visitsPostTrial && c.visitsPostTrial > 0);
    if (withVisits.length === 0) return 0;
    return withVisits.reduce((sum, c) => sum + (c.visitsPostTrial || 0), 0) / withVisits.length;
  }, [data]);
  
  const iconMap: Record<string, any> = {
    'New Members': UserPlus,
    'Converted Members': Award,
    'Retained Members': UserCheck,
    'Conversion Rate': TrendingUp,
    'Retention Rate': Target,
    'Avg LTV': DollarSign,
    'Avg Conversion Time': CalendarDays,
    'Avg Visits Post-Trial': Repeat,
  };
  
  const metricCards = [
    ...metrics.map(m => ({
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
    })),
    {
      title: 'Avg Conversion Time',
      value: `${Math.round(avgConversionTime)} days`,
      icon: CalendarDays,
      gradient: 'from-slate-700 to-slate-800',
      description: 'Average days to convert',
      change: undefined,
      previousValue: '',
      period: '',
      metricType: 'avg_conversion_time',
      filterData: () => data.filter(c => c.conversionSpan && c.conversionSpan > 0)
    },
    {
      title: 'Avg Visits Post-Trial',
      value: avgVisitsPostTrial.toFixed(1),
      icon: Repeat,
      gradient: 'from-slate-700 to-slate-800',
      description: 'Average visits after trial',
      change: undefined,
      previousValue: '',
      period: '',
      metricType: 'avg_visits_post_trial',
      filterData: () => data.filter(c => c.visitsPostTrial && c.visitsPostTrial > 0)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => (
        <Card
          key={metric.title}
          className="group relative overflow-hidden cursor-pointer transition-all duration-300 bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-2xl hover:-translate-y-0.5"
          onClick={() => onCardClick?.(metric.title, metric.filterData(), metric.metricType)}
        >
          {/* Top colored border */}
          <div className={`absolute inset-x-0 top-0 h-2 ${
            index % 4 === 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
            index % 4 === 1 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
            index % 4 === 2 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
            'bg-gradient-to-r from-rose-500 to-pink-500'
          }`} />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-900 text-white shadow-md group-hover:shadow-lg transition-shadow">
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
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{metric.value}</div>
              <p className="text-xs text-slate-500">{metric.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-500">{metric.previousValue ? `${metric.period}: ${metric.previousValue}` : metric.period || ' '}</div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const ClientConversionMetricCards = React.memo(ClientConversionMetricCardsComponent);