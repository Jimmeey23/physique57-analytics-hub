import React, {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { BarChart3, Clock3, Gauge, Rocket, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { NewClientFilterOptions } from '@/types/dashboard';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { getPreviousMonthDateRange, parseDate } from '@/utils/dateUtils';

// Import new components for rebuilt client conversion tab
import { EnhancedClientConversionFilterSection } from '@/components/dashboard/EnhancedClientConversionFilterSection';
import { ClientConversionMetricCards } from '@/components/dashboard/ClientConversionMetricCards';
import { ClientConversionDataTableSelector } from '@/components/dashboard/ClientConversionDataTableSelector';
import { LazyClientConversionDrillDownModalV3 } from '@/components/lazy/LazyModals';
import { ModalSuspense } from '@/components/lazy/ModalSuspense';
// Removed NotesBlock (AI summary/notes) per request
import { SectionTimelineNav } from '@/components/ui/SectionTimelineNav';

const ClientConversionSimplifiedRanks = lazy(() =>
  import('@/components/dashboard/ClientConversionSimplifiedRanks').then((module) => ({
    default: module.ClientConversionSimplifiedRanks,
  }))
);
const ClientConversionEnhancedCharts = lazy(() =>
  import('@/components/dashboard/ClientConversionEnhancedCharts').then((module) => ({
    default: module.ClientConversionEnhancedCharts,
  }))
);
const ClientConversionMonthOnMonthByTypeTable = lazy(() =>
  import('@/components/dashboard/ClientConversionMonthOnMonthByTypeTable').then((module) => ({
    default: module.ClientConversionMonthOnMonthByTypeTable,
  }))
);
const ClientRetentionMonthByTypePivot = lazy(() =>
  import('@/components/dashboard/ClientRetentionMonthByTypePivot').then((module) => ({
    default: module.ClientRetentionMonthByTypePivot,
  }))
);
const ClientRetentionYearOnYearPivot = lazy(() =>
  import('@/components/dashboard/ClientRetentionYearOnYearPivotNew').then((module) => ({
    default: module.default,
  }))
);
const ClientConversionMembershipTable = lazy(() =>
  import('@/components/dashboard/ClientConversionMembershipTable').then((module) => ({
    default: module.ClientConversionMembershipTable,
  }))
);
const ClientHostedClassesTable = lazy(() =>
  import('@/components/dashboard/ClientHostedClassesTable').then((module) => ({
    default: module.ClientHostedClassesTable,
  }))
);
const TeacherPerformanceTable = lazy(() =>
  import('@/components/dashboard/TeacherPerformanceTable').then((module) => ({
    default: module.TeacherPerformanceTable,
  }))
);
const NewClientMembershipPurchaseTable = lazy(() =>
  import('@/components/dashboard/NewClientMembershipPurchaseTable').then((module) => ({
    default: module.NewClientMembershipPurchaseTable,
  }))
);

type DrillDownType = 'month' | 'year' | 'class' | 'membership' | 'metric' | 'ranking';

interface DrillDownModalState {
  isOpen: boolean;
  client: null;
  title: string;
  data: unknown;
  type: DrillDownType;
}

type ExportValue = string | number;
type ExportRow = Record<string, ExportValue>;

interface MembershipPurchaseStats {
  units: number;
  clients: Set<string>;
  totalLTV: number;
  conversionSpans: number[];
  visitsPostTrial: number[];
  convertedClients: number;
}

const ClientRetention = () => {
  const {
    data,
    loading
  } = useNewClientData();
  const {
    data: sessionsData,
    loading: sessionsLoading
  } = useSessionsData();
  const {
    data: payrollData,
    isLoading: payrollLoading
  } = usePayrollData();
  const {
    setLoading
  } = useGlobalLoading();
  const [selectedLocation, setSelectedLocation] = useState('Kwality House, Kemps Corner');
  const [isPendingTableSwitch, startTableSwitch] = useTransition();
  const [rememberLastTable, setRememberLastTable] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('p57-retention-remember-table') !== '0';
  });
  const [activeTable, setActiveTable] = useState(() => {
    if (typeof window === 'undefined') return 'monthonmonthbytype';
    const remember = window.localStorage.getItem('p57-retention-remember-table') !== '0';
    const saved = window.localStorage.getItem('p57-retention-active-table');
    return remember && saved ? saved : 'monthonmonthbytype';
  });
  const [compactTableMode, setCompactTableMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('p57-retention-compact-mode') === '1';
  });
  const [prefetchDone, setPrefetchDone] = useState(false);
  const [selectedMetric] = useState('conversion');
  const [drillDownModal, setDrillDownModal] = useState<DrillDownModalState>({
    isOpen: false,
    client: null,
    title: '',
    data: null,
    type: 'month'
  });

  // Filters state
  const [filters, setFilters] = useState<NewClientFilterOptions>(() => {
    // Default to previous month date range
    const prev = getPreviousMonthDateRange();
    return {
      dateRange: { start: prev.start, end: prev.end },
      location: [],
      homeLocation: [],
      trainer: [],
      paymentMethod: [],
      retentionStatus: [],
      conversionStatus: [],
      isNew: [],
      minLTV: undefined,
      maxLTV: undefined
    };
  });
  useEffect(() => {
    setLoading(loading || sessionsLoading || payrollLoading, 'Analyzing client conversion and retention patterns...');
  }, [loading, sessionsLoading, payrollLoading, setLoading]);

  // Create comprehensive filtered payroll data matching all applied filters
  const filteredPayrollData = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    
    let filtered = payrollData;
    
    // Apply location filter
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(payroll => {
        const payrollLocation = payroll.location || '';
        
        // For Kenkere House, use flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return payrollLocation.toLowerCase().includes('kenkere') || 
                 payrollLocation.toLowerCase().includes('bengaluru') || 
                 payrollLocation === 'Kenkere House';
        }
        
        // For other locations, use exact match
        return payrollLocation === selectedLocation;
      });
    }
    
    // Apply date range filter to payroll data using monthYear field
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start + 'T00:00:00');
      const endDate = new Date(filters.dateRange.end + 'T23:59:59');
      
      filtered = filtered.filter(payroll => {
        if (!payroll.monthYear) return false;
        
        // Parse monthYear (format: "Jan 2024" or "2024-01")
        let payrollDate: Date;
        if (payroll.monthYear.includes('-')) {
          // Format: "2024-01"
          payrollDate = new Date(payroll.monthYear + '-01');
        } else {
          // Format: "Jan 2024"
          payrollDate = new Date(payroll.monthYear + ' 01');
        }
        
        if (isNaN(payrollDate.getTime())) return false;
        
        // Check if payroll month falls within the selected date range
        return payrollDate >= startDate && payrollDate <= endDate;
      });
    }
    
    // Apply trainer filter if specified
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(payroll => filters.trainer.includes(payroll.teacherName || ''));
    }
    
    return filtered;
  }, [payrollData, selectedLocation, filters]);

  // Create visits summary from filtered payroll data
  const visitsSummary = useMemo(() => {
    if (!filteredPayrollData || filteredPayrollData.length === 0) return {};
    
    const summary: Record<string, number> = {};
    filteredPayrollData.forEach(payroll => {
      if (payroll.monthYear && payroll.totalCustomers) {
        // Use monthYear directly as key (should be in format like "Jan 2024")
        const key = payroll.monthYear;
        summary[key] = (summary[key] || 0) + payroll.totalCustomers;
      }
    });
    
    return summary;
  }, [filteredPayrollData]);

  // Create visits summary without date range (for MoM tables that ignore date range)
  const filteredPayrollDataNoDateRange = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    let filtered = payrollData;

    // Apply location filter
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(payroll => {
        const payrollLocation = payroll.location || '';
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return payrollLocation.toLowerCase().includes('kenkere') ||
            payrollLocation.toLowerCase().includes('bengaluru') ||
            payrollLocation === 'Kenkere House';
        }
        return payrollLocation === selectedLocation;
      });
    }

    // Apply trainer filter if specified
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(payroll => filters.trainer.includes(payroll.teacherName || ''));
    }

    return filtered;
  }, [payrollData, selectedLocation, filters.trainer]);

  const visitsSummaryNoDateRange = useMemo(() => {
    if (!filteredPayrollDataNoDateRange || filteredPayrollDataNoDateRange.length === 0) return {};
    const summary: Record<string, number> = {};
    filteredPayrollDataNoDateRange.forEach(payroll => {
      if (payroll.monthYear && payroll.totalCustomers) {
        const key = payroll.monthYear; // Expect format like "Jan 2024"
        summary[key] = (summary[key] || 0) + payroll.totalCustomers;
      }
    });
    return summary;
  }, [filteredPayrollDataNoDateRange]);

  // Get unique values for filters (only 3 main locations)
  const uniqueLocations = React.useMemo(() => {
    const mainLocations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'];
    const locations = new Set<string>();
    data.forEach(client => {
      if (client.firstVisitLocation && mainLocations.includes(client.firstVisitLocation)) {
        locations.add(client.firstVisitLocation);
      }
    });
    return Array.from(locations).filter(Boolean);
  }, [data]);
  const uniqueTrainers = React.useMemo(() => {
    const trainers = new Set<string>();
    data.forEach(client => {
      if (client.trainerName) trainers.add(client.trainerName);
    });
    return Array.from(trainers).filter(Boolean);
  }, [data]);
  const uniqueMembershipTypes = React.useMemo(() => {
    const memberships = new Set<string>();
    data.forEach(client => {
      if (client.membershipUsed) memberships.add(client.membershipUsed);
    });
    return Array.from(memberships).filter(Boolean);
  }, [data]);

  // Filter data by selected location and filters
  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Apply date range filter FIRST - only if both start and end dates are provided
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start + 'T00:00:00') : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end + 'T23:59:59') : null;
      
      filtered = filtered.filter(client => {
        if (!client.firstVisitDate) return false;
        
        const clientDate = parseDate(client.firstVisitDate);
        if (!clientDate) return false;

        // Set client date to start of day for comparison
        clientDate.setHours(0, 0, 0, 0);
        return (!startDate || clientDate >= startDate) && (!endDate || clientDate <= endDate);
      });
    }

    // Apply location filter - check ONLY firstVisitLocation (where the trial/first visit occurred)
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(client => {
        const firstLocation = client.firstVisitLocation || '';

        // For Kenkere House, try more flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return firstLocation.toLowerCase().includes('kenkere') || 
                 firstLocation.toLowerCase().includes('bengaluru') || 
                 firstLocation === 'Kenkere House';
        }

        // For other locations, use exact match
        return firstLocation === selectedLocation;
      });
    }

    // Apply additional filters
    if (filters.location.length > 0) {
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || ''));
    }
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(client => filters.trainer.includes(client.trainerName || ''));
    }

    // Apply other filters
    if (filters.conversionStatus.length > 0) {
      filtered = filtered.filter(client => filters.conversionStatus.includes(client.conversionStatus || ''));
    }
    if (filters.retentionStatus.length > 0) {
      filtered = filtered.filter(client => filters.retentionStatus.includes(client.retentionStatus || ''));
    }
    if (filters.paymentMethod.length > 0) {
      filtered = filtered.filter(client => filters.paymentMethod.includes(client.paymentMethod || ''));
    }
    if (filters.isNew.length > 0) {
      filtered = filtered.filter(client => filters.isNew.includes(client.isNew || ''));
    }

    // Apply LTV filters
    if (filters.minLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) >= filters.minLTV!);
    }
    if (filters.maxLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) <= filters.maxLTV!);
    }
    
    return filtered;
  }, [data, selectedLocation, filters]);

  // Build a filtered dataset that applies ALL current filters EXCEPT the selectedLocation tab
  // This powers the tab counts to reflect the active filters rather than the entire dataset
  const filteredByFiltersOnly = React.useMemo(() => {
    let filtered = data;

    // Apply date range filter FIRST - only if both start and end dates are provided
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start + 'T00:00:00') : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end + 'T23:59:59') : null;

      filtered = filtered.filter(client => {
        if (!client.firstVisitDate) return false;
        const clientDate = parseDate(client.firstVisitDate);
        if (!clientDate) return false;
        clientDate.setHours(0, 0, 0, 0);
        return (!startDate || clientDate >= startDate) && (!endDate || clientDate <= endDate);
      });
    }

    // Apply additional filters (but NOT the selectedLocation tab filter)
    if (filters.location.length > 0) {
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || ''));
    }
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(client => filters.trainer.includes(client.trainerName || ''));
    }
    if (filters.conversionStatus.length > 0) {
      filtered = filtered.filter(client => filters.conversionStatus.includes(client.conversionStatus || ''));
    }
    if (filters.retentionStatus.length > 0) {
      filtered = filtered.filter(client => filters.retentionStatus.includes(client.retentionStatus || ''));
    }
    if (filters.paymentMethod.length > 0) {
      filtered = filtered.filter(client => filters.paymentMethod.includes(client.paymentMethod || ''));
    }
    if (filters.isNew.length > 0) {
      filtered = filtered.filter(client => filters.isNew.includes(client.isNew || ''));
    }
    if (filters.minLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) >= filters.minLTV!);
    }
    if (filters.maxLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) <= filters.maxLTV!);
    }

    return filtered;
  }, [data, filters]);

  // Compute counts per location using the current filters only (no selectedLocation tab filter)
  const tabCounts = React.useMemo(() => {
    const matchKenkere = (loc: string) => loc.toLowerCase().includes('kenkere') || loc.toLowerCase().includes('bengaluru') || loc === 'Kenkere House';

    const countFor = (predicate: (c: typeof data[number]) => boolean) => filteredByFiltersOnly.filter(predicate).length;

    const all = filteredByFiltersOnly.length;
    const kwality = countFor(c => c.firstVisitLocation === 'Kwality House, Kemps Corner');
    const supreme = countFor(c => c.firstVisitLocation === 'Supreme HQ, Bandra');
    const kenkere = countFor(c => matchKenkere(c.firstVisitLocation || ''));

    return { all, kwality, supreme, kenkere };
  }, [filteredByFiltersOnly]);

  // Special filtered data for month-on-month and year-on-year tables - ignores date range but applies location filter
  const filteredDataNoDateRange = React.useMemo(() => {
    let filtered = data;

    // Apply location filter - check ONLY firstVisitLocation (where the trial/first visit occurred)
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(client => {
        const firstLocation = client.firstVisitLocation || '';

        // For Kenkere House, try more flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          return firstLocation.toLowerCase().includes('kenkere') || 
                 firstLocation.toLowerCase().includes('bengaluru') || 
                 firstLocation === 'Kenkere House';
        }

        // For other locations, use exact match
        return firstLocation === selectedLocation;
      });
    }

    // Apply additional filters (but NOT date range)
    if (filters.location.length > 0) {
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || ''));
    }
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(client => filters.trainer.includes(client.trainerName || ''));
    }

    // Apply other filters
    if (filters.conversionStatus.length > 0) {
      filtered = filtered.filter(client => filters.conversionStatus.includes(client.conversionStatus || ''));
    }
    if (filters.retentionStatus.length > 0) {
      filtered = filtered.filter(client => filters.retentionStatus.includes(client.retentionStatus || ''));
    }
    if (filters.paymentMethod.length > 0) {
      filtered = filtered.filter(client => filters.paymentMethod.includes(client.paymentMethod || ''));
    }
    if (filters.isNew.length > 0) {
      filtered = filtered.filter(client => filters.isNew.includes(client.isNew || ''));
    }

    // Apply LTV filters
    if (filters.minLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) >= filters.minLTV!);
    }
    if (filters.maxLTV !== undefined) {
      filtered = filtered.filter(client => (client.ltv || 0) <= filters.maxLTV!);
    }
    
    return filtered;
  }, [data, selectedLocation, filters]);

  const deferredFilteredData = useDeferredValue(filteredData);
  const deferredFilteredDataNoDateRange = useDeferredValue(filteredDataNoDateRange);
  const deferredFilteredPayrollData = useDeferredValue(filteredPayrollData);

  const handleTableChange = useCallback((table: string) => {
    startTableSwitch(() => setActiveTable(table));
  }, [startTableSwitch]);

  const resetViewPreferences = useCallback(() => {
    setCompactTableMode(false);
    setRememberLastTable(true);
    setPrefetchDone(false);
    startTableSwitch(() => setActiveTable('monthonmonthbytype'));

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('p57-retention-compact-mode');
      window.localStorage.removeItem('p57-retention-active-table');
      window.localStorage.setItem('p57-retention-remember-table', '1');
    }
  }, [startTableSwitch]);

  const preloadHeavyRetentionViews = useCallback(() => {
    void import('@/components/dashboard/ClientConversionMonthOnMonthByTypeTable');
    void import('@/components/dashboard/ClientRetentionMonthByTypePivot');
    void import('@/components/dashboard/ClientRetentionYearOnYearPivotNew');
    void import('@/components/dashboard/ClientHostedClassesTable');
    void import('@/components/dashboard/ClientConversionMembershipTable');
    void import('@/components/dashboard/TeacherPerformanceTable');
    void import('@/components/dashboard/NewClientMembershipPurchaseTable');
    void import('@/components/dashboard/ClientConversionEnhancedCharts');
    void import('@/components/dashboard/ClientConversionSimplifiedRanks');
    setPrefetchDone(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (rememberLastTable) {
      window.localStorage.setItem('p57-retention-active-table', activeTable);
    }
  }, [activeTable, rememberLastTable]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('p57-retention-remember-table', rememberLastTable ? '1' : '0');
    if (!rememberLastTable) {
      window.localStorage.removeItem('p57-retention-active-table');
    }
  }, [rememberLastTable]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('p57-retention-compact-mode', compactTableMode ? '1' : '0');
  }, [compactTableMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const preload = () => preloadHeavyRetentionViews();
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(preload, { timeout: 3000 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(preload, 1200);
    return () => window.clearTimeout(timer);
  }, [preloadHeavyRetentionViews]);


  const heroMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const totalTrials = filteredData.length;
    const newMembers = filteredData.filter(c => String(c.isNew || '').toLowerCase().includes('new')).length;
    const converted = filteredData.filter(c => c.conversionStatus === 'Converted').length;
    const retained = filteredData.filter(c => c.retentionStatus === 'Retained').length;
    const conversionRate = newMembers > 0 ? (converted / newMembers) * 100 : 0;
    const retentionRate = newMembers > 0 ? (retained / newMembers) * 100 : 0;
    const totalLTV = filteredData.reduce((sum, c) => sum + (c.ltv || 0), 0);
    const avgLTV = totalTrials > 0 ? totalLTV / totalTrials : 0;
    
    return [
      {
        label: 'Total Trials',
        value: formatNumber(totalTrials)
      },
      {
        label: 'Conversion Rate',
        value: formatPercentage(conversionRate)
      },
      {
        label: 'Retention Rate',
        value: formatPercentage(retentionRate)
      },
      {
        label: 'Avg LTV',
        value: formatCurrency(avgLTV)
      }
    ];
  }, [filteredData]);
  
  // Build section-wise processed export maps (not raw sheet rows)
  const exportAdditionalData = React.useMemo(() => {
    // Export visible pivot table data
    const momByTypeExport: ExportRow[] = [];
    const yoyExport: ExportRow[] = [];
    const membershipExport: ExportRow[] = [];
    const hostedClassesExport: ExportRow[] = [];
    const newClientPurchasesExport: ExportRow[] = [];
    
    // For Month on Month by Type - build from client types
    const clientTypes = [...new Set(filteredDataNoDateRange.map(c => c.isNew || 'Unknown'))];
    clientTypes.forEach(type => {
      const typeData = filteredDataNoDateRange.filter(c => (c.isNew || 'Unknown') === type);
      momByTypeExport.push({
        'Client Type': type,
        'Total Trials': typeData.length,
        'New Members': typeData.filter(c => String(c.isNew || '').toLowerCase().includes('new')).length,
        'Converted': typeData.filter(c => c.conversionStatus === 'Converted').length,
        'Retained': typeData.filter(c => c.retentionStatus === 'Retained').length,
        'Total LTV': formatCurrency(typeData.reduce((s, c) => s + (c.ltv || 0), 0))
      });
    });

    // For Year on Year - build from membership types
    const membershipTypes = [...new Set(filteredDataNoDateRange.map(c => c.membershipUsed || 'Unknown'))];
    membershipTypes.forEach(type => {
      const typeData = filteredDataNoDateRange.filter(c => (c.membershipUsed || 'Unknown') === type);
      yoyExport.push({
        'Membership Type': type,
        'Total Trials': typeData.length,
        'New Members': typeData.filter(c => String(c.isNew || '').toLowerCase().includes('new')).length,
        'Converted': typeData.filter(c => c.conversionStatus === 'Converted').length,
        'Retained': typeData.filter(c => c.retentionStatus === 'Retained').length,
        'Total LTV': formatCurrency(typeData.reduce((s, c) => s + (c.ltv || 0), 0))
      });
    });

    // For New Client Purchases - build membership purchase stats
    const newClientsData = filteredDataNoDateRange.filter(c => String(c.isNew || '').toLowerCase().includes('new'));
    const membershipPurchaseStats: Record<string, MembershipPurchaseStats> = {};
    const getOrCreateStats = (membershipKey: string): MembershipPurchaseStats => {
      if (!membershipPurchaseStats[membershipKey]) {
        membershipPurchaseStats[membershipKey] = {
          units: 0,
          clients: new Set<string>(),
          totalLTV: 0,
          conversionSpans: [],
          visitsPostTrial: [],
          convertedClients: 0
        };
      }
      return membershipPurchaseStats[membershipKey];
    };
    
    newClientsData.forEach(client => {
      const membership = client.membershipsBoughtPostTrial || 'No Membership Purchase';
      const memberships = membership.split(',').map(m => m.trim()).filter(m => m);
      
      if (memberships.length === 0 || membership === '') {
        const noMembershipStats = getOrCreateStats('No Membership Purchase');
        if (client.memberId) {
          noMembershipStats.clients.add(String(client.memberId));
        }
        noMembershipStats.totalLTV += client.ltv || 0;
        return;
      }
      
      memberships.forEach(mem => {
        const stats = getOrCreateStats(mem);
        stats.units++;
        if (client.memberId) {
          stats.clients.add(String(client.memberId));
        }
        stats.totalLTV += client.ltv || 0;
        
        if (client.conversionStatus === 'Converted') {
          stats.convertedClients++;
          if (client.conversionSpan && client.conversionSpan > 0) {
            stats.conversionSpans.push(client.conversionSpan);
          }
        }
        
        if (client.visitsPostTrial) {
          stats.visitsPostTrial.push(client.visitsPostTrial);
        }
      });
    });
    
    Object.entries(membershipPurchaseStats).forEach(([membershipType, stats]) => {
      const newClientsCount = stats.clients.size;
      const avgDaysTaken = stats.conversionSpans.length > 0 
        ? stats.conversionSpans.reduce((sum: number, span: number) => sum + span, 0) / stats.conversionSpans.length 
        : 0;
      const avgVisitsPostTrial = stats.visitsPostTrial.length > 0
        ? stats.visitsPostTrial.reduce((sum: number, visits: number) => sum + visits, 0) / stats.visitsPostTrial.length
        : 0;
      const conversionRate = newClientsCount > 0 ? (stats.convertedClients / newClientsCount) * 100 : 0;
      
      newClientPurchasesExport.push({
        'Membership Type': membershipType,
        'Units Sold': stats.units,
        'New Clients': newClientsCount,
        'Total Value (LTV)': formatCurrency(stats.totalLTV),
        'Avg Value': formatCurrency(newClientsCount > 0 ? stats.totalLTV / newClientsCount : 0),
        'Avg Days to Convert': avgDaysTaken > 0 ? `${avgDaysTaken.toFixed(1)} days` : 'N/A',
        'Avg Visits': avgVisitsPostTrial.toFixed(1),
        'Conversion %': `${conversionRate.toFixed(1)}%`
      });
    });

    return {
      'Client Retention • Month on Month by Type': momByTypeExport,
      'Client Retention • Year on Year': yoyExport,
      'Client Retention • Memberships': membershipExport,
      'Client Retention • Hosted Classes': hostedClassesExport,
      'Client Retention • New Client Purchases': newClientPurchasesExport
    };
  }, [filteredDataNoDateRange]);

  const exportButton = <AdvancedExportButton additionalData={exportAdditionalData} defaultFileName={`client-retention-${selectedLocation.replace(/\s+/g, '-').toLowerCase()}`} size="sm" variant="ghost" buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/50" />;
  const lazySectionFallback = (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-sm font-medium text-slate-600">Loading section...</p>
    </div>
  );

  return <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
      </div>

      <div className="relative z-10">
        <div className="bg-white text-slate-800 slide-in-from-left">
          <DashboardMotionHero 
            title="Client Conversion & Retention" 
            subtitle="Comprehensive client acquisition and retention analysis across all customer touchpoints" 
            metrics={heroMetrics}
            extra={exportButton}
          />
        </div>

        <div className="container mx-auto px-6 py-8 bg-white min-h-screen">
          <main className="space-y-8 slide-in-from-right stagger-1">
            {/* Section Navigation */}
            <SectionTimelineNav />
            
            {/* Enhanced Location Tabs - unified styling (moved above filters) */}
            <StudioLocationTabs 
              activeLocation={selectedLocation === 'All Locations' ? 'all' : 
                selectedLocation.toLowerCase().includes('kwality') ? 'kwality' : 
                selectedLocation.toLowerCase().includes('supreme') ? 'supreme' : 
                selectedLocation.toLowerCase().includes('kenkere') ? 'kenkere' : 'all'}
              onLocationChange={(locationId) => {
                const locationMap: Record<string, string> = {
                  'all': 'All Locations',
                  'kwality': 'Kwality House, Kemps Corner',
                  'supreme': 'Supreme HQ, Bandra',
                  'kenkere': 'Kenkere House, Bengaluru'
                };
                setSelectedLocation(locationMap[locationId] || 'All Locations');
              }}
              showInfoPopover={true}
              infoPopoverContext="client-retention-overview"
            />

            {/* Enhanced Filter Section */}
            <div className="glass-card modern-card-hover p-6 rounded-2xl" id="filters">
              <EnhancedClientConversionFilterSection filters={filters} onFiltersChange={setFilters} locations={uniqueLocations} trainers={uniqueTrainers} membershipTypes={uniqueMembershipTypes} />
            </div>

          {/* Enhanced Metric Cards */}
          <div id="metrics" className="rounded-2xl p-0">
            <ClientConversionMetricCards 
              data={deferredFilteredData}
              historicalData={deferredFilteredDataNoDateRange}
              dateRange={filters.dateRange}
              onCardClick={(title, data, metricType) => setDrillDownModal({
              isOpen: true,
              client: null,
              title: `${title} - Detailed Analysis`,
              data: {
                clients: data,
                metricType
              },
              type: 'metric'
            })}
            />
          </div>

          {/* Enhanced Simplified Ranking System */}
          <div className="glass-card modern-card-hover rounded-2xl p-6 slide-in-right stagger-3" id="rankings">
            <Suspense fallback={lazySectionFallback}>
              <ClientConversionSimplifiedRanks 
              data={deferredFilteredData} 
              payrollData={deferredFilteredPayrollData}
              allPayrollData={payrollData}
              allClientData={data}
              selectedLocation={selectedLocation}
              dateRange={filters.dateRange}
              selectedMetric={selectedMetric}
              onDrillDown={(type, item, metric) => {
                // Enhanced filtering
                const relatedClients = deferredFilteredData.filter(client => {
                  let match = false;
                  if (type === 'trainer') {
                    match = client.trainerName === item.name;
                  } else if (type === 'location') {
                    match = client.firstVisitLocation === item.name;
                  } else if (type === 'membership') {
                    match = client.membershipUsed === item.name;
                  }
                  return match;
                });

                const relatedPayroll = deferredFilteredPayrollData.filter(payroll => {
                  if (type === 'trainer') return payroll.teacherName === item.name;
                  if (type === 'location') return payroll.location === item.name;
                  return false;
                });

                setDrillDownModal({
                  isOpen: true,
                  client: null,
                  title: `${item.name} - ${metric} Analysis`,
                  data: {
                    type,
                    item,
                    metric,
                    relatedClients,
                    relatedPayroll
                  },
                  type: 'ranking'
                });
              }}
            />
            </Suspense>
          </div>

          {/* Enhanced Interactive Charts - Collapsed by default */}
          <div className="space-y-4 slide-in-left stagger-4" id="charts">
            <div className="glass-card rounded-2xl border-0 shadow-lg">
              <details className="group">
                <summary className="cursor-pointer p-6 font-semibold text-slate-800 border-b border-white/20 group-open:bg-gradient-to-r group-open:from-purple-50/50 group-open:to-pink-50/50 rounded-t-2xl transition-all duration-300">
                  <span className="inline-flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-700" />
                    Interactive Charts & Visualizations
                  </span>
                </summary>
                <div className="p-6 bg-gradient-to-br from-white to-slate-50/50">
                  <Suspense fallback={lazySectionFallback}>
                    <ClientConversionEnhancedCharts data={deferredFilteredData} />
                  </Suspense>
                </div>
              </details>
            </div>
          </div>

          {/* Performance & view controls (collapsed by default to reduce clutter) */}
          <div className="glass-card modern-card-hover rounded-2xl border border-slate-200/80 shadow-lg" id="performance-controls">
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50/70">
                <SlidersHorizontal className="h-4 w-4 text-slate-700" />
                Performance & View Controls
              </summary>
              <div className="grid gap-4 border-t border-slate-200/80 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setCompactTableMode((prev) => !prev)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    compactTableMode
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Gauge className="h-4 w-4" />
                    Compact Table Density
                  </div>
                  <div className={`mt-1 text-xs ${compactTableMode ? 'text-slate-200' : 'text-slate-500'}`}>
                    Reduces row spacing for faster scanning.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRememberLastTable((prev) => !prev)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    rememberLastTable
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock3 className="h-4 w-4" />
                    Remember Last Table
                  </div>
                  <div className={`mt-1 text-xs ${rememberLastTable ? 'text-slate-200' : 'text-slate-500'}`}>
                    Reopens the last viewed table automatically.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={preloadHeavyRetentionViews}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    prefetchDone
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Rocket className="h-4 w-4" />
                    {prefetchDone ? 'Views Preloaded' : 'Preload Heavy Views'}
                  </div>
                  <div className={`mt-1 text-xs ${prefetchDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                    Loads heavy table modules ahead of tab switches.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={resetViewPreferences}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <RotateCcw className="h-4 w-4" />
                    Reset View Preferences
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Restores default table view controls.
                  </div>
                </button>
              </div>
            </details>
          </div>

          {/* Enhanced Data Table Selector */}
          <div className="glass-card modern-card-hover rounded-2xl p-6 slide-in-right stagger-5" id="table-selector">
            <ClientConversionDataTableSelector
              activeTable={activeTable}
              onTableChange={handleTableChange}
              dataLength={deferredFilteredData.length}
              isPending={isPendingTableSwitch}
            />
          </div>

          {/* Selected Data Table */}
          <div className="space-y-8">
            <Suspense fallback={lazySectionFallback}>
              {activeTable === 'monthonmonthbytype' && (
                <div
                  id="monthonmonthbytype-table"
                  className={`client-retention-sales-table rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientConversionMonthOnMonthByTypeTable
                    data={deferredFilteredData}
                    visitsSummary={visitsSummary}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      client: null,
                      title: `${rowData.month} - ${rowData.type} Analysis`,
                      data: rowData,
                      type: 'month'
                    })}
                  />
                </div>
              )}

              {activeTable === 'monthonmonth' && (
                <div
                  id="monthonmonth-table"
                  className={`client-retention-sales-table rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientRetentionMonthByTypePivot
                    data={deferredFilteredDataNoDateRange}
                    visitsSummary={visitsSummaryNoDateRange}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      client: null,
                      title: `${rowData.type} - Analysis`,
                      data: rowData,
                      type: 'month'
                    })}
                  />
                </div>
              )}

              {activeTable === 'yearonyear' && (
                <div
                  id="yearonyear-table"
                  className={`client-retention-sales-table rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientRetentionYearOnYearPivot
                    data={deferredFilteredDataNoDateRange}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      client: null,
                      title: `${rowData.rowKey} - Year Comparison`,
                      data: rowData,
                      type: 'year'
                    })}
                  />
                </div>
              )}

              {activeTable === 'hostedclasses' && (
                <div
                  id="hostedclasses-table"
                  className={`client-retention-sales-table rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientHostedClassesTable
                    data={deferredFilteredData}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      client: null,
                      title: `${rowData.className} - ${rowData.month}`,
                      data: rowData,
                      type: 'class'
                    })}
                  />
                </div>
              )}

              {activeTable === 'memberships' && (
                <div
                  id="memberships-table"
                  className={`client-retention-sales-table rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <ClientConversionMembershipTable data={deferredFilteredData} />
                </div>
              )}

              {activeTable === 'teacherperformance' && (
                <div
                  id="teacherperformance-table"
                  className={`client-retention-sales-table rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <TeacherPerformanceTable
                    data={deferredFilteredData}
                    onRowClick={rowData => setDrillDownModal({
                      isOpen: true,
                      client: null,
                      title: `${rowData.trainerName} - Teacher Performance Analysis`,
                      data: {
                        type: 'trainer',
                        item: { name: rowData.trainerName },
                        metric: 'performance',
                        relatedClients: deferredFilteredData.filter(client => client.trainerName === rowData.trainerName),
                        relatedPayroll: deferredFilteredPayrollData.filter(payroll => payroll.teacherName === rowData.trainerName)
                      },
                      type: 'ranking'
                    })}
                  />
                </div>
              )}

              {activeTable === 'newclientpurchases' && (
                <div
                  id="newclientpurchases-table"
                  className={`client-retention-sales-table rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden ${compactTableMode ? 'client-retention-compact' : ''}`}
                >
                  <NewClientMembershipPurchaseTable data={deferredFilteredData} />
                </div>
              )}
            </Suspense>
          </div>
        </main>

        {/* Enhanced Drill Down Modal - Lazy loaded */}
        <ModalSuspense>
          {drillDownModal.isOpen && (
            <LazyClientConversionDrillDownModalV3 
              isOpen={drillDownModal.isOpen} 
              onClose={() => setDrillDownModal({
                isOpen: false,
                client: null,
                title: '',
                data: null,
                type: 'month'
              })} 
              title={drillDownModal.title} 
              data={drillDownModal.data} 
              type={drillDownModal.type} 
            />
          )}
        </ModalSuspense>
        </div>
      </div>
      
      <Footer />

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>;
};
export default ClientRetention;
