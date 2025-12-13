
import * as React from 'react';
import { ReactNode } from 'react';
import { getPreviousMonthDateRange } from '@/utils/dateUtils';

interface GlobalFilters {
  dateRange: {
    start: string;
    end: string;
  };
  location: string[];
  category: string[];
  product: string[];
  soldBy: string[];
  paymentMethod: string[];
  source: string[];
  associate: string[];
  stage: string[];
  status: string[];
  channel: string[];
  trialStatus: string[];
  conversionStatus: string[];
  retentionStatus: string[];
  minLTV?: number;
  maxLTV?: number;
}

interface GlobalFiltersContextType {
  filters: GlobalFilters;
  updateFilters: (newFilters: Partial<GlobalFilters>) => void;
  clearFilters: () => void;
  resetToDefaultDates: () => void;
}

const GlobalFiltersContext = React.createContext<GlobalFiltersContextType | undefined>(undefined);

export const useGlobalFilters = () => {
  const context = React.useContext(GlobalFiltersContext);
  if (!context) {
    // Instead of throwing, log the error and return a fallback
    console.error('useGlobalFilters must be used within a GlobalFiltersProvider. Returning fallback values.');
    
    const fallbackDateRange = getPreviousMonthDateRange();
    // Return a fallback context with default values
    return {
      filters: {
        dateRange: fallbackDateRange,
        location: [],
        category: [],
        product: [],
        soldBy: [],
        paymentMethod: [],
        source: [],
        associate: [],
        stage: [],
        status: [],
        channel: [],
        trialStatus: [],
        conversionStatus: [],
        retentionStatus: [],
      },
      updateFilters: () => {},
      clearFilters: () => {},
      resetToDefaultDates: () => {},
      // Computed properties
      activeLocations: [],
      startDate: fallbackDateRange.start,
      endDate: fallbackDateRange.end,
    };
  }
  
  // Add computed properties to the context
  return {
    ...context,
    activeLocations: context.filters.location,
    startDate: context.filters.dateRange.start,
    endDate: context.filters.dateRange.end,
  };
};

interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export const GlobalFiltersProvider: React.FC<GlobalFiltersProviderProps> = ({ children }) => {
  const [filters, setFilters] = React.useState<GlobalFilters>(() => {
    const previousMonth = getPreviousMonthDateRange();
    return {
      dateRange: previousMonth,
      location: [],
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: [],
      source: [],
      associate: [],
      stage: [],
      status: [],
      channel: [],
      trialStatus: [],
      conversionStatus: [],
      retentionStatus: [],
      minLTV: undefined,
      maxLTV: undefined
    };
  });

  const updateFilters = (newFilters: Partial<GlobalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    const previousMonth = getPreviousMonthDateRange();
    setFilters({
      dateRange: previousMonth,
      location: [],
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: [],
      source: [],
      associate: [],
      stage: [],
      status: [],
      channel: [],
      trialStatus: [],
      conversionStatus: [],
      retentionStatus: [],
      minLTV: undefined,
      maxLTV: undefined
    });
  };

  const resetToDefaultDates = () => {
    const previousMonth = getPreviousMonthDateRange();
    updateFilters({ dateRange: previousMonth });
  };

  return (
    <GlobalFiltersContext.Provider value={{
      filters,
      updateFilters,
      clearFilters,
      resetToDefaultDates
    }}>
      {children}
    </GlobalFiltersContext.Provider>
  );
};
