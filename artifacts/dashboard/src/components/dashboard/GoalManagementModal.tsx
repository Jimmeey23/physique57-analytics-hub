import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoalMetric, Goal } from '@/hooks/useGoalTracking';

interface GoalManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  initialGoal?: Goal;
}

const METRICS: { value: GoalMetric; label: string; unit: string }[] = [
  { value: 'revenue', label: 'Revenue', unit: '₹' },
  { value: 'attendance', label: 'Attendance', unit: 'check-ins' },
  { value: 'conversion_rate', label: 'Conversion Rate', unit: '%' },
  { value: 'retention_rate', label: 'Retention Rate', unit: '%' },
  { value: 'new_members', label: 'New Members', unit: 'members' },
  { value: 'fill_rate', label: 'Fill Rate', unit: '%' },
];

export const GoalManagementModal: React.FC<GoalManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
}) => {
  const [metric, setMetric] = useState<GoalMetric>(initialGoal?.metric || 'revenue');
  const [label, setLabel] = useState(initialGoal?.label || '');
  const [target, setTarget] = useState(initialGoal?.target?.toString() || '');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(initialGoal?.period || 'monthly');

  const handleSave = () => {
    const selectedMetric = METRICS.find(m => m.value === metric);
    onSave({
      metric,
      label: label || selectedMetric?.label || '',
      target: parseFloat(target),
      unit: selectedMetric?.unit || '',
      period,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="metric" className="text-right">Metric</Label>
            <Select value={metric} onValueChange={(v) => setMetric(v as GoalMetric)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Monthly Revenue Target"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target" className="text-right">Target</Label>
            <Input
              id="target"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period" className="text-right">Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as 'monthly' | 'yearly')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
