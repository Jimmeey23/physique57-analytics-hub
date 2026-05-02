import { useState, useEffect } from 'react';

export type GoalMetric = 'revenue' | 'attendance' | 'conversion_rate' | 'retention_rate' | 'new_members' | 'fill_rate';

export interface Goal {
  id: string;
  metric: GoalMetric;
  label: string;
  target: number;
  unit: string;
  period: 'monthly' | 'yearly';
  createdAt: string;
}

const STORAGE_KEY = 'p57-goals';

export const useGoalTracking = () => {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse goals', e);
      }
    }
  }, []);

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const updateGoal = (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    const updated = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
};
