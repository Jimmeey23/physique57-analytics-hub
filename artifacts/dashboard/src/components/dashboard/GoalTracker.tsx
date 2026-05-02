import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Settings2, Plus } from 'lucide-react';
import { Goal, useGoalTracking } from '@/hooks/useGoalTracking';
import { GoalManagementModal } from './GoalManagementModal';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface GoalTrackerProps {
  currentValues: Record<string, number>;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ currentValues }) => {
  const { goals, addGoal, deleteGoal } = useGoalTracking();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number, metric: string) => {
    if (metric === 'revenue') return formatCurrency(value);
    if (metric.includes('rate')) return formatPercentage(value / 100);
    return formatNumber(value);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Goal Tracker
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(true)} className="h-8 gap-1">
          <Settings2 className="h-4 w-4" />
          Manage
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-sm">No goals set yet.</p>
            <Button variant="link" size="sm" onClick={() => setIsModalOpen(true)}>
              Add your first goal
            </Button>
          </div>
        ) : (
          goals.map((goal) => {
            const current = currentValues[goal.metric] || 0;
            const percent = Math.min(Math.round((current / goal.target) * 100), 100);
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">{goal.label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{goal.period}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{formatValue(current, goal.metric)}</span>
                    <span className="text-xs text-muted-foreground ml-1">/ {formatValue(goal.target, goal.metric)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={percent} className="h-2" indicatorClassName={getProgressColor(percent)} />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>{percent}% of target</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-4 p-0 text-destructive hover:bg-transparent"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <GoalManagementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addGoal}
      />
    </Card>
  );
};
