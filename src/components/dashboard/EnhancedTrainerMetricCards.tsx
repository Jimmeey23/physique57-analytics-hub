import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  DollarSign, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ProcessedTrainerData } from './TrainerDataProcessor';
import { cn } from '@/lib/utils';

interface EnhancedTrainerMetricCardsProps {
  data: ProcessedTrainerData[];
  onCardClick?: (title: string, data: any) => void;
}

export const EnhancedTrainerMetricCards: React.FC<EnhancedTrainerMetricCardsProps> = ({ data, onCardClick }) => {
  const summaryStats = React.useMemo(() => {
    if (!data.length) return null;

    const totalTrainers = new Set(data.map(d => d.trainerName)).size;
    const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.totalPaid, 0);
    const totalCustomers = data.reduce((sum, d) => sum + d.totalCustomers, 0);
    const avgClassSize = totalSessions > 0 ? totalCustomers / totalSessions : 0;
    const avgRevenue = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;
    const avgRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    
    // Calculate utilization rate (non-empty sessions / total sessions)
    const totalNonEmptySessions = data.reduce((sum, d) => sum + d.nonEmptySessions, 0);
    const utilizationRate = totalSessions > 0 ? (totalNonEmptySessions / totalSessions) * 100 : 0;

    // Calculate weighted conversion and retention rates (by new members)
    const totalNewMembers = data.reduce((sum, d) => sum + (d.newMembers || 0), 0);
    const totalConverted = data.reduce((sum, d) => sum + (d.convertedMembers || 0), 0);
    const totalRetained = data.reduce((sum, d) => sum + (d.retainedMembers || 0), 0);
    const avgConversionRate = totalNewMembers > 0 ? (totalConverted / totalNewMembers) * 100 : 0;
    const avgRetentionRate = totalNewMembers > 0 ? (totalRetained / totalNewMembers) * 100 : 0;

    return {
      totalTrainers,
      totalSessions,
      totalRevenue,
      totalCustomers,
      avgClassSize,
      avgRevenue,
      avgRevenuePerSession,
      utilizationRate,
      avgConversionRate,
      avgRetentionRate
    };
  }, [data]);

  if (!summaryStats) {
    return null;
  }

  const metricCards = [
    {
      title: 'Active Trainers',
      value: formatNumber(summaryStats.totalTrainers),
      subtitle: 'Total instructors',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      change: '+5.2%',
      changeType: 'positive' as const,
      details: [
        { label: 'Avg Sessions/Trainer', value: (summaryStats.totalSessions / summaryStats.totalTrainers).toFixed(1) },
        { label: 'Avg Revenue/Trainer', value: formatCurrency(summaryStats.avgRevenue) }
      ]
    },
    {
      title: 'Total Sessions',
      value: formatNumber(summaryStats.totalSessions),
      subtitle: 'Classes conducted',
      icon: Activity,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      change: '+12.8%',
      changeType: 'positive' as const,
      details: [
        { label: 'Utilization Rate', value: `${summaryStats.utilizationRate.toFixed(1)}%` },
        { label: 'Avg Class Size', value: summaryStats.avgClassSize.toFixed(1) }
      ]
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(summaryStats.totalRevenue),
      subtitle: 'Generated income',
      icon: DollarSign,
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200',
      change: '+8.7%',
      changeType: 'positive' as const,
      details: [
        { label: 'Revenue/Session', value: formatCurrency(summaryStats.avgRevenuePerSession) },
        { label: 'Revenue/Customer', value: formatCurrency(summaryStats.totalRevenue / summaryStats.totalCustomers) }
      ]
    },
    {
      title: 'Total Members',
      value: formatNumber(summaryStats.totalCustomers),
      subtitle: 'Class attendees',
      icon: Target,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      change: '+15.3%',
      changeType: 'positive' as const,
      details: [
        { label: 'Members/Session', value: summaryStats.avgClassSize.toFixed(1) },
        { label: 'Total Unique', value: formatNumber(summaryStats.totalCustomers) }
      ]
    },
    {
      title: 'Efficiency Score',
      value: `${summaryStats.utilizationRate.toFixed(1)}%`,
      subtitle: 'Session utilization',
      icon: Zap,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      change: '+3.2%',
      changeType: 'positive' as const,
      details: [
        { label: 'Fill Rate', value: `${summaryStats.utilizationRate.toFixed(1)}%` },
        { label: 'Performance', value: 'Excellent' }
      ]
    },
    {
      title: 'Conversion Rate',
      value: `${summaryStats.avgConversionRate.toFixed(1)}%`,
      subtitle: 'Member conversion',
      icon: TrendingUp,
      gradient: 'from-teal-500 to-green-600',
      bgGradient: 'from-teal-50 to-green-50',
      borderColor: 'border-teal-200',
      change: '+2.1%',
      changeType: 'positive' as const,
      details: [
        { label: 'Retention Rate', value: `${summaryStats.avgRetentionRate.toFixed(1)}%` },
        { label: 'Performance', value: 'Strong' }
      ]
    },
    {
      title: 'Revenue / Session',
      value: formatCurrency(summaryStats.avgRevenuePerSession),
      subtitle: 'Average per class',
      icon: BarChart3,
      gradient: 'from-fuchsia-500 to-pink-600',
      bgGradient: 'from-fuchsia-50 to-pink-50',
      borderColor: 'border-fuchsia-200',
      change: '+1.2%',
      changeType: 'positive' as const,
      details: [
        { label: 'Total Revenue', value: formatCurrency(summaryStats.totalRevenue) },
        { label: 'Total Sessions', value: formatNumber(summaryStats.totalSessions) }
      ]
    },
    {
      title: 'Retention Rate',
      value: `${summaryStats.avgRetentionRate.toFixed(1)}%`,
      subtitle: 'Weighted across months',
      icon: Award,
      gradient: 'from-sky-500 to-blue-600',
      bgGradient: 'from-sky-50 to-blue-50',
      borderColor: 'border-sky-200',
      change: '+0.8%',
      changeType: 'positive' as const,
      details: [
        { label: 'Conversion Rate', value: `${summaryStats.avgConversionRate.toFixed(1)}%` },
        { label: 'Utilization', value: `${summaryStats.utilizationRate.toFixed(1)}%` }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.slice(0, 8).map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            onClick={() => onCardClick?.(card.title, { ...summaryStats, metric: card.title })}
            className={cn(
              "group relative rounded-2xl p-6 transition-all duration-500 ease-out",
              "bg-gradient-to-br from-white via-white to-slate-50/50",
              "border border-slate-200/60 hover:border-slate-300",
              "shadow-lg hover:shadow-2xl",
              "hover:scale-[1.03] hover:-translate-y-1",
              "cursor-pointer overflow-hidden",
              "animate-fade-in"
            )}
            style={{
              animationDelay: `${index * 80}ms`,
              animationFillMode: 'both'
            }}
          >
            {/* Top gradient accent */}
            <div className={cn(
              "absolute inset-x-0 top-0 h-1 transition-all duration-500",
              "bg-gradient-to-r",
              index % 4 === 0 && "from-blue-500 via-blue-600 to-blue-500",
              index % 4 === 1 && "from-emerald-500 via-emerald-600 to-emerald-500",
              index % 4 === 2 && "from-purple-500 via-purple-600 to-purple-500",
              index % 4 === 3 && "from-amber-500 via-amber-600 to-amber-500",
              "group-hover:h-1.5"
            )} />
            
            {/* Background glow on hover */}
            <div className={cn(
              "absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10",
              "bg-gradient-to-br",
              index % 4 === 0 && "from-blue-500/20 to-cyan-500/20",
              index % 4 === 1 && "from-emerald-500/20 to-teal-500/20",
              index % 4 === 2 && "from-purple-500/20 to-pink-500/20",
              index % 4 === 3 && "from-amber-500/20 to-orange-500/20"
            )} />

            <div className="space-y-4">
              {/* Header with icon and change badge */}
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-3 rounded-xl transition-all duration-500",
                  "bg-gradient-to-br group-hover:scale-110 group-hover:rotate-3",
                  index % 4 === 0 && "from-blue-100 to-blue-200 text-blue-600",
                  index % 4 === 1 && "from-emerald-100 to-emerald-200 text-emerald-600",
                  index % 4 === 2 && "from-purple-100 to-purple-200 text-purple-600",
                  index % 4 === 3 && "from-amber-100 to-amber-200 text-amber-600"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                  "backdrop-blur-sm transition-all duration-500 group-hover:scale-110",
                  card.changeType === 'positive' 
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                    : "bg-red-100 text-red-700 border border-red-200"
                )}>
                  {card.changeType === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{card.change}</span>
                </div>
              </div>

              {/* Metric title */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <p className={cn(
                  "text-3xl font-black transition-all duration-500",
                  "bg-gradient-to-br bg-clip-text text-transparent",
                  "group-hover:scale-105 transform-gpu",
                  index % 4 === 0 && "from-blue-600 to-blue-800",
                  index % 4 === 1 && "from-emerald-600 to-emerald-800",
                  index % 4 === 2 && "from-purple-600 to-purple-800",
                  index % 4 === 3 && "from-amber-600 to-amber-800"
                )}>
                  {card.value}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {card.subtitle}
              </p>

              {/* Details */}
              <div className="space-y-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                {card.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{detail.label}</span>
                    <span className="font-semibold text-slate-700">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Add keyframes to the stylesheet
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);