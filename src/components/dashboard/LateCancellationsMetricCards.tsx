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

  if (metrics.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm animate-pulse">
            <CardContent className="p-5">
              <div className="h-16 bg-slate-100 rounded-xl"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        const isPositive = metric.change > 0;
        const showChange = metric.showPercentage !== false;
        
        return (
          <Card 
            key={index} 
            className={cn(
              "bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 group cursor-pointer",
              "hover:shadow-lg"
            )}
            onClick={() => handleMetricClick(metric)}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-white",
                    metric.color === 'red' && 'bg-red-500',
                    metric.color === 'orange' && 'bg-orange-500',
                    metric.color === 'blue' && 'bg-blue-500',
                    metric.color === 'purple' && 'bg-purple-500',
                    metric.color === 'green' && 'bg-green-500',
                    metric.color === 'cyan' && 'bg-cyan-500'
                  )}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 text-sm">{metric.title}</h3>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">{metric.value}</p>
                  </div>
                </div>
                {showChange && (
                  <div className={cn(
                    "text-xs font-medium px-2 py-1 rounded-md",
                    isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  )}>
                    {isPositive ? '+' : ''}{metric.change.toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};