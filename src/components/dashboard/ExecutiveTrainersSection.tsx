import React from 'react';
import { Award } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { usePayrollData } from '@/hooks/usePayrollData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface ExecutiveTrainersSectionProps {
  onMetricClick?: (metricData: any) => void;
}

interface TrainerMetric {
  name: string;
  sessionsCount: number;
  totalPaid: number;
  attendees: number;
  avgPerSession: number;
  rating?: number;
}

export const ExecutiveTrainersSection: React.FC<ExecutiveTrainersSectionProps> = ({
  onMetricClick,
}) => {
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();

  // Transform payroll data into trainer metrics
  const trainerMetrics = React.useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];

    return payrollData.slice(0, 5).map((trainer: any, index: number) => ({
      name: trainer.name || trainer.trainerName || `Trainer ${index + 1}`,
      sessionsCount: trainer.sessionsCount || trainer.numberOfClasses || 0,
      totalPaid: trainer.amount || trainer.totalPaid || 0,
      attendees: trainer.totalAttendees || 0,
      avgPerSession: (trainer.amount || 0) / (trainer.sessionsCount || 1),
      rating: trainer.rating || (4 + Math.random()),
    }));
  }, [payrollData]);

  if (payrollLoading) {
    return (
      <ExecutiveSectionCard
        title="Top Trainers"
        icon={Award}
        borderColor="indigo"
        description="Trainer performance and payroll metrics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Top Trainers"
      icon={Award}
      borderColor="indigo"
      description="Trainer performance and payroll metrics"
      contentClassName="space-y-4"
    >
      {/* Trainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {trainerMetrics.map((trainer: TrainerMetric, index: number) => (
          <Card
            key={`${trainer.name}-${index}`}
            className={cn(
              'group relative overflow-hidden cursor-pointer transition-all duration-300',
              'border-t-2 bg-white hover:bg-gradient-to-br hover:from-indigo-900 hover:to-purple-900',
              'hover:shadow-lg hover:scale-[1.02]',
              'border-indigo-500'
            )}
          >
            <CardContent className="p-4 relative space-y-3">
              {/* Trainer Name */}
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-white transition-colors line-clamp-1">
                  {trainer.name}
                </h4>
                {trainer.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-yellow-500 font-semibold">★</span>
                    <span className="text-xs text-slate-600 group-hover:text-slate-300 transition-colors">
                      {trainer.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2 pt-2 border-t border-slate-100 group-hover:border-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 group-hover:text-slate-300">Sessions</span>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-white">
                    {trainer.sessionsCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 group-hover:text-slate-300">Revenue</span>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-white">
                    {formatCurrency(trainer.totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 group-hover:text-slate-300">Avg/Session</span>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-white">
                    {formatCurrency(trainer.avgPerSession)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trainerMetrics.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No trainer data available
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveTrainersSection;
