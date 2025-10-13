
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface LoadingStep {
  id: string;
  name: string;
  weight: number;
  completed: boolean;
  startTime?: number;
  endTime?: number;
}

interface GlobalLoadingState {
  isLoading: boolean;
  loadingMessage: string;
  progress: number;
  loadingStartTime: number | null;
  steps: LoadingStep[];
  currentStepId: string | null;
  autoProgressEnabled: boolean;
  setLoading: (loading: boolean, message?: string) => void;
  setProgress: (progress: number) => void;
  resetProgress: () => void;
  addStep: (id: string, name: string, weight?: number) => void;
  completeStep: (id: string) => void;
  setCurrentStep: (id: string) => void;
  enableAutoProgress: (enabled: boolean) => void;
  getStepProgress: () => number;
}

export const useGlobalLoading = create<GlobalLoadingState>()(
  subscribeWithSelector((set, get) => ({
    isLoading: false,
    loadingMessage: 'Loading...',
    progress: 0,
    loadingStartTime: null,
    steps: [],
    currentStepId: null,
    autoProgressEnabled: true,
    
    setLoading: (loading, message = 'Loading...') => {
      set({ 
        isLoading: loading, 
        loadingMessage: message,
        loadingStartTime: loading ? Date.now() : null,
        progress: loading ? 0 : 100,
        steps: loading ? [] : get().steps, // Clear steps when starting new load
        currentStepId: null
      });
    },
    
    setProgress: (progress) => {
      const clampedProgress = Math.min(Math.max(progress, 0), 100);
      set({ progress: clampedProgress });
    },
    
    resetProgress: () => set({ progress: 0, steps: [], currentStepId: null }),
    
    addStep: (id, name, weight = 1) => {
      const steps = get().steps;
      if (!steps.find(step => step.id === id)) {
        set({
          steps: [...steps, { id, name, weight, completed: false, startTime: Date.now() }]
        });
      }
    },
    
    completeStep: (id) => {
      const state = get();
      const updatedSteps = state.steps.map(step =>
        step.id === id ? { ...step, completed: true, endTime: Date.now() } : step
      );
      
      const totalWeight = updatedSteps.reduce((sum, step) => sum + step.weight, 0);
      const completedWeight = updatedSteps
        .filter(step => step.completed)
        .reduce((sum, step) => sum + step.weight, 0);
      
      const stepProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
      
      set({
        steps: updatedSteps,
        progress: stepProgress
      });
    },
    
    setCurrentStep: (id) => {
      set({ currentStepId: id });
    },
    
    enableAutoProgress: (enabled) => {
      set({ autoProgressEnabled: enabled });
    },
    
    getStepProgress: () => {
      const state = get();
      const totalWeight = state.steps.reduce((sum, step) => sum + step.weight, 0);
      const completedWeight = state.steps
        .filter(step => step.completed)
        .reduce((sum, step) => sum + step.weight, 0);
      
      return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    }
  }))
);
