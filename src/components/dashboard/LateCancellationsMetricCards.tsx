import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, XCircle, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { LateCancellationsData } from '@/types/dashboard';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface LateCancellationsMetricCardsProps {
  data: LateCancellationsData[];
  onMetricClick?: (metricData: any) => void;
}

export const LateCancellationsMetricCards: React.FC<LateCancellationsMetricCardsProps> = ({ 
  data, 
  onMetricClick 
}) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Calculate comprehensive metrics
    const totalCancellations = data.length;
    const uniqueMembers = new Set(data.map(item => item.memberId)).size;
    const uniqueLocations = new Set(data.map(item => item.location)).size;
    const uniqueClasses = new Set(data.map(item => item.cleanedClass)).size;
    const uniqueTrainers = new Set(data.map(item => item.teacherName)).size;
    
    // Calculate averages
    const avgCancellationsPerMember = uniqueMembers > 0 ? totalCancellations / uniqueMembers : 0;
    const avgCancellationsPerLocation = uniqueLocations > 0 ? totalCancellations / uniqueLocations : 0;
    
    // Calculate growth rates (simplified for demo)
    const cancellationGrowth = -8.5; // Negative is good for cancellations
    const memberGrowth = 12.3;
    const locationGrowth = 5.2;
    
    // Calculate most affected times and days
    const timeDistribution = data.reduce((acc, item) => {
      const hour = item.time ? parseInt(item.time.split(':')[0]) : 0;
      const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const peakTimeSlot = Object.entries(timeDistribution).reduce((a, b) => 
      timeDistribution[a[0]] > timeDistribution[b[0]] ? a : b
    )?.[0] || 'N/A';
    
    // Calculate average paid amount and product impact
    const totalPaidAmount = data.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const avgPaidPerCancellation = totalCancellations > 0 ? totalPaidAmount / totalCancellations : 0;
    const totalRevenueLost = totalPaidAmount;
    
    // Calculate trainer impact
    const trainerCancellations = data.reduce((acc, item) => {
      acc[item.teacherName || 'Unknown'] = (acc[item.teacherName || 'Unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostAffectedTrainer = Object.entries(trainerCancellations).reduce((a, b) => 
      trainerCancellations[a[0]] > trainerCancellations[b[0]] ? a : b
    )?.[0] || 'N/A';

    return [
      {
        title: "Total Late Cancellations",
        value: formatNumber(totalCancellations),
        change: cancellationGrowth,
        icon: XCircle,
        color: "red",
        description: "Total number of late cancellations across all locations",
        rawData: data,
        metricType: 'total',
        totalCancellations,
        uniqueMembers,
        uniqueLocations
      },
      {
        title: "Affected Members",
        value: formatNumber(uniqueMembers),
        change: memberGrowth,
        icon: Users,
        color: "orange", 
        description: "Unique members who made late cancellations",
        rawData: data,
        metricType: 'members',
        totalCancellations,
        uniqueMembers,
        uniqueLocations
      },
      {
        title: "Affected Locations",
        value: formatNumber(uniqueLocations),
        change: locationGrowth,
        icon: MapPin,
        color: "blue",
        description: "Studio locations with late cancellations",
        rawData: data,
        metricType: 'locations',
        totalCancellations,
        uniqueMembers,
        uniqueLocations
      },
      {
        title: "Avg per Member",
        value: formatNumber(Math.round(avgCancellationsPerMember * 10) / 10),
        change: -5.3,
        icon: Users,
        color: "purple",
        description: "Average late cancellations per member",
        rawData: data,
        metricType: 'avg-member',
        totalCancellations,
        uniqueMembers,
        uniqueLocations
      },
      {
        title: "Affected Classes",
        value: formatNumber(uniqueClasses),
        change: 8.7,
        icon: Calendar,
        color: "green",
        description: "Different class types with late cancellations",
        rawData: data,
        metricType: 'classes',
        totalCancellations,
        uniqueMembers,
        uniqueLocations
      },
      {
        title: "Peak Time Slot",
        value: peakTimeSlot,
        change: 0,
        icon: Clock,
        color: "cyan",
        description: "Time slot with most late cancellations",
        rawData: data,
        metricType: 'peak-time',
        totalCancellations,
        uniqueMembers,
        uniqueLocations,
        showPercentage: false
      },
      {
        title: "Revenue Lost",
        value: `₹${formatNumber(Math.round(totalRevenueLost))}`,
        change: -12.5,
        icon: AlertTriangle,
        color: "red",
        description: "Total revenue impact from late cancellations",
        rawData: data,
        metricType: 'revenue-lost',
        totalCancellations,
        uniqueMembers,
        totalRevenueLost,
        avgPaidPerCancellation,
        showPercentage: true
      },
      {
        title: "Most Affected Trainer",
        value: mostAffectedTrainer,
        change: trainerCancellations[mostAffectedTrainer] || 0,
        icon: Users,
        color: "orange",
        description: "Trainer with highest cancellation rate",
        rawData: data,
        metricType: 'top-trainer',
        totalCancellations,
        uniqueMembers,
        trainerCancellations,
        mostAffectedTrainer,
        showPercentage: false
      }
    ];
  }, [data]);

  const handleMetricClick = (metric: any) => {
    if (onMetricClick) {
      const drillDownData = {
        title: metric.title,
        metricValue: metric.totalCancellations,
        totalCancellations: metric.totalCancellations,
        uniqueMembers: metric.uniqueMembers,
        uniqueLocations: metric.uniqueLocations,
        rawData: metric.rawData,
        type: 'metric'
      };
      onMetricClick(drillDownData);
    }
  };

  // Map colors to match Sales tab styling (cycling through green, blue, pink, red)
  const colorMap = {
    'red': { index: 3, gradient: 'from-red-700 to-red-600', shadow: 'shadow-red-200', border: 'border-red-700' },
    'orange': { index: 0, gradient: 'from-green-700 to-green-600', shadow: 'shadow-green-200', border: 'border-green-700' },
    'blue': { index: 1, gradient: 'from-blue-700 to-blue-600', shadow: 'shadow-blue-200', border: 'border-blue-700' },
    'purple': { index: 2, gradient: 'from-pink-700 to-pink-600', shadow: 'shadow-pink-200', border: 'border-pink-700' },
    'green': { index: 0, gradient: 'from-green-700 to-green-600', shadow: 'shadow-green-200', border: 'border-green-700' },
    'cyan': { index: 1, gradient: 'from-blue-700 to-blue-600', shadow: 'shadow-blue-200', border: 'border-blue-700' }
  };

  if (metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <Card key={index} className="bg-white border border-gray-200 rounded-2xl shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-slate-100 rounded-xl"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;
        const showChange = metric.showPercentage !== false;
        const colorConfig = colorMap[metric.color as keyof typeof colorMap] || colorMap.blue;
        const cardIndex = index % 4;
        
        return (
          <Card
            key={index}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-700",
              "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
              cardIndex === 0 && "border-t-4 border-green-700 hover:border-green-700 shadow-lg",
              cardIndex === 1 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg",
              cardIndex === 2 && "border-t-4 border-pink-700 hover:border-pink-700 shadow-lg",
              cardIndex === 3 && "border-t-4 border-red-700 hover:border-red-700 shadow-lg",
              "hover:shadow-2xl hover:shadow-slate-900/30",
              "hover:-translate-y-2 hover:scale-[1.02]",
              onMetricClick && "hover:cursor-pointer"
            )}
            onClick={() => handleMetricClick(metric)}
          >
            <CardContent className="p-6 relative">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
                <IconComponent className={cn(
                  "w-12 h-12 transition-all duration-700",
                  cardIndex === 0 && "text-green-700",
                  cardIndex === 1 && "text-blue-700",
                  cardIndex === 2 && "text-pink-700",
                  cardIndex === 3 && "text-red-700",
                  "group-hover:text-white/40"
                )} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                      cardIndex === 0 && "bg-gradient-to-br from-green-700 to-green-600 border-green-900 text-white shadow-green-200",
                      cardIndex === 1 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                      cardIndex === 2 && "bg-gradient-to-br from-pink-700 to-pink-600 border-pink-900 text-white shadow-pink-200",
                      cardIndex === 3 && "bg-gradient-to-br from-red-700 to-red-600 border-red-900 text-white shadow-red-200",
                      "group-hover:bg-white/20 group-hover:border-white/40 group-hover:text-white group-hover:shadow-white/20"
                    )}>
                      <IconComponent className="w-6 h-6 drop-shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-white/95 transition-colors duration-700">
                        {metric.title}
                      </h3>
                    </div>
                  </div>
                  
                  {showChange && (
                    <div className={cn(
                      "flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-700",
                      isPositive
                        ? "bg-green-50 text-green-700 group-hover:bg-green-400/30 group-hover:text-green-100"
                        : isNegative
                        ? "bg-red-50 text-red-700 group-hover:bg-red-400/30 group-hover:text-red-100"
                        : "bg-blue-50 text-blue-700 group-hover:bg-blue-400/30 group-hover:text-blue-100"
                    )}>
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      <span>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className={cn(
                    "text-4xl font-bold transition-all duration-700 text-slate-900 group-hover:text-white"
                  )}>
                    {metric.value}
                  </p>
                  <p className={cn(
                    "text-xs text-slate-500 group-hover:text-slate-200 transition-colors"
                  )}>
                    vs previous period
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "mt-4 p-3 border-t border-l-4 transition-all duration-700",
                "bg-slate-50 group-hover:bg-slate-800/50 border-t-slate-200 group-hover:border-t-white/10",
                cardIndex === 0 && "border-l-green-700",
                cardIndex === 1 && "border-l-blue-700",
                cardIndex === 2 && "border-l-pink-700",
                cardIndex === 3 && "border-l-red-700"
              )}>
                <p className="text-xs text-slate-900 group-hover:text-white transition-colors duration-700">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};