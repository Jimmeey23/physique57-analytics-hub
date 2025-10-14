import React, { useEffect, useState, useMemo } from 'react';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useSectionNavigation } from '@/contexts/SectionNavigationContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { NewClientFilterOptions } from '@/types/dashboard';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { getPreviousMonthDateRange, getCurrentMonthDateRange, parseDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { AiNotes } from '@/components/ui/AiNotes';

// Import new components for rebuilt client conversion tab
import { EnhancedClientConversionFilterSection } from '@/components/dashboard/EnhancedClientConversionFilterSection';
import { ClientConversionMetricCards } from '@/components/dashboard/ClientConversionMetricCards';
import { ClientConversionSimplifiedRanks } from '@/components/dashboard/ClientConversionSimplifiedRanks';
import { ClientConversionEnhancedCharts } from '@/components/dashboard/ClientConversionEnhancedCharts';
import { ClientConversionDataTableSelector } from '@/components/dashboard/ClientConversionDataTableSelector';
import { ClientConversionMonthOnMonthByTypeTable } from '@/components/dashboard/ClientConversionMonthOnMonthByTypeTable';
import { ClientRetentionMonthByTypePivot } from '@/components/dashboard/ClientRetentionMonthByTypePivot';
import ClientRetentionYearOnYearPivot from '@/components/dashboard/ClientRetentionYearOnYearPivotNew';
import { ClientConversionMembershipTable } from '@/components/dashboard/ClientConversionMembershipTable';
import { ClientHostedClassesTable } from '@/components/dashboard/ClientHostedClassesTable';
import { ClientConversionDrillDownModalV3 } from '@/components/dashboard/ClientConversionDrillDownModalV3';
import NotesBlock from '@/components/ui/NotesBlock';
import { SectionTimelineNav } from '@/components/ui/SectionTimelineNav';
import { WithContextualInfo } from '@/components/ui/WithContextualInfo';
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
    isLoading,
    setLoading
  } = useGlobalLoading();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [activeTable, setActiveTable] = useState('monthonmonthbytype');
  const [selectedMetric, setSelectedMetric] = useState('conversion'); // New state for metric selection
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    client: null,
    title: '',
    data: null,
    type: 'month' as any
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
      if (client.homeLocation && mainLocations.includes(client.homeLocation)) {
        locations.add(client.homeLocation);
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

    // Apply location filter - check both firstVisitLocation and homeLocation
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(client => {
        const firstLocation = client.firstVisitLocation || '';
        const homeLocation = client.homeLocation || '';

        // For Kenkere House, try more flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          const matchesFirst = firstLocation.toLowerCase().includes('kenkere') || firstLocation.toLowerCase().includes('bengaluru') || firstLocation === 'Kenkere House';
          const matchesHome = homeLocation.toLowerCase().includes('kenkere') || homeLocation.toLowerCase().includes('bengaluru') || homeLocation === 'Kenkere House';
          return matchesFirst || matchesHome;
        }

        // For other locations, use exact match
        return firstLocation === selectedLocation || homeLocation === selectedLocation;
      });
    }

    // Apply additional filters
    if (filters.location.length > 0) {
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || '') || filters.location.includes(client.homeLocation || ''));
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
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || '') || filters.location.includes(client.homeLocation || ''));
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
    const kwality = countFor(c => (c.firstVisitLocation === 'Kwality House, Kemps Corner') || (c.homeLocation === 'Kwality House, Kemps Corner'));
    const supreme = countFor(c => (c.firstVisitLocation === 'Supreme HQ, Bandra') || (c.homeLocation === 'Supreme HQ, Bandra'));
    const kenkere = countFor(c => matchKenkere(c.firstVisitLocation || '') || matchKenkere(c.homeLocation || ''));

    return { all, kwality, supreme, kenkere };
  }, [filteredByFiltersOnly]);

  // Special filtered data for month-on-month and year-on-year tables - ignores date range but applies location filter
  const filteredDataNoDateRange = React.useMemo(() => {
    let filtered = data;

    // Apply location filter - check both firstVisitLocation and homeLocation
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(client => {
        const firstLocation = client.firstVisitLocation || '';
        const homeLocation = client.homeLocation || '';

        // For Kenkere House, try more flexible matching
        if (selectedLocation === 'Kenkere House, Bengaluru') {
          const matchesFirst = firstLocation.toLowerCase().includes('kenkere') || firstLocation.toLowerCase().includes('bengaluru') || firstLocation === 'Kenkere House';
          const matchesHome = homeLocation.toLowerCase().includes('kenkere') || homeLocation.toLowerCase().includes('bengaluru') || homeLocation === 'Kenkere House';
          return matchesFirst || matchesHome;
        }

        // For other locations, use exact match
        return firstLocation === selectedLocation || homeLocation === selectedLocation;
      });
    }

    // Apply additional filters (but NOT date range)
    if (filters.location.length > 0) {
      filtered = filtered.filter(client => filters.location.includes(client.firstVisitLocation || '') || filters.location.includes(client.homeLocation || ''));
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
        location: 'Overview',
        label: 'Total Trials',
        value: formatNumber(totalTrials),
        subtext: `${formatNumber(newMembers)} new members`
      },
      {
        location: 'Conversion',
        label: 'Conversion Rate',
        value: formatPercentage(conversionRate),
        subtext: `${formatNumber(converted)} converted`
      },
      {
        location: 'Retention',
        label: 'Retention Rate',
        value: formatPercentage(retentionRate),
        subtext: `${formatNumber(retained)} retained`
      },
      {
        location: 'LTV',
        label: 'Avg LTV',
        value: formatCurrency(avgLTV),
        subtext: `${formatCurrency(totalLTV)} total`
      }
    ];
  }, [filteredData]);
  
  // Build section-wise processed export maps (not raw sheet rows)
  const exportAdditionalData = React.useMemo(() => {
    // Export visible pivot table data
    const momByTypeExport: any[] = [];
    const yoyExport: any[] = [];
    const membershipExport: any[] = [];
    const hostedClassesExport: any[] = [];
    
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

    return {
      'Client Retention • Month on Month by Type': momByTypeExport,
      'Client Retention • Year on Year': yoyExport,
      'Client Retention • Memberships': membershipExport,
      'Client Retention • Hosted Classes': hostedClassesExport
    };
  }, [filteredDataNoDateRange]);

  const exportButton = <AdvancedExportButton additionalData={exportAdditionalData} defaultFileName={`client-retention-${selectedLocation.replace(/\s+/g, '-').toLowerCase()}`} size="sm" variant="ghost" buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/50" />;
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
            <div className="flex justify-center mb-8" id="location-tabs">
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-4 location-tabs">
                  {[
                    { id: 'All Locations', name: 'All Locations', sub: `(${tabCounts.all})` },
                    { id: 'Kwality House, Kemps Corner', name: 'Kwality House', sub: `Kemps Corner (${tabCounts.kwality})` },
                    { id: 'Supreme HQ, Bandra', name: 'Supreme HQ', sub: `Bandra (${tabCounts.supreme})` },
                    { id: 'Kenkere House, Bengaluru', name: 'Kenkere House', sub: `Bengaluru (${tabCounts.kenkere})` },
                  ].map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc.id)}
                      className={`location-tab-trigger group ${selectedLocation === loc.id ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                      data-state={selectedLocation === loc.id ? 'active' : 'inactive'}
                    >
                      <span className="relative z-10 flex flex-col items-center leading-tight">
                        <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">{loc.name}</span>
                        <span className="text-xs sm:text-sm opacity-90">{loc.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Filter Section */}
            <div className="glass-card modern-card-hover p-6 rounded-2xl" id="filters">
              <EnhancedClientConversionFilterSection filters={filters} onFiltersChange={setFilters} locations={uniqueLocations} trainers={uniqueTrainers} membershipTypes={uniqueMembershipTypes} />
            </div>

          {/* Enhanced Metric Cards */}
          <WithContextualInfo
            dataType="clientRetentionData"
            currentLocation={selectedLocation}
            title="Client Retention Intelligence"
            iconPosition="top-right"
            iconSize="md"
          >
            <div className="glass-card modern-card-hover rounded-2xl p-6 soft-bounce stagger-2" id="metrics">
              <ClientConversionMetricCards 
                data={filteredData}
                historicalData={data}
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
          </WithContextualInfo>

          {/* Enhanced Simplified Ranking System */}
          <div className="glass-card modern-card-hover rounded-2xl p-6 slide-in-right stagger-3" id="rankings">
            <ClientConversionSimplifiedRanks 
              data={filteredData} 
              payrollData={filteredPayrollData}
              allPayrollData={payrollData}
              allClientData={data}
              selectedLocation={selectedLocation}
              dateRange={filters.dateRange}
              selectedMetric={selectedMetric}
              onDrillDown={(type, item, metric) => {
                // Enhanced filtering
                const relatedClients = filteredData.filter(client => {
                  let match = false;
                  if (type === 'trainer') {
                    match = client.trainerName === item.name;
                  } else if (type === 'location') {
                    match = client.firstVisitLocation === item.name || client.homeLocation === item.name;
                  } else if (type === 'membership') {
                    match = client.membershipUsed === item.name;
                  }
                  return match;
                });

                const relatedPayroll = filteredPayrollData.filter(payroll => {
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
          </div>

          {/* Enhanced Interactive Charts - Collapsed by default */}
          <div className="space-y-4 slide-in-left stagger-4" id="charts">
            <div className="glass-card rounded-2xl border-0 shadow-lg">
              <details className="group">
                <summary className="cursor-pointer p-6 font-semibold text-slate-800 border-b border-white/20 group-open:bg-gradient-to-r group-open:from-purple-50/50 group-open:to-pink-50/50 rounded-t-2xl transition-all duration-300">
                  📊 Interactive Charts & Visualizations
                </summary>
                <div className="p-6 bg-gradient-to-br from-white to-slate-50/50">
                  <ClientConversionEnhancedCharts data={filteredData} />
                </div>
              </details>
            </div>
          </div>

          {/* Enhanced Data Table Selector */}
          <div className="glass-card modern-card-hover rounded-2xl p-6 slide-in-right stagger-5" id="table-selector">
            <ClientConversionDataTableSelector activeTable={activeTable} onTableChange={setActiveTable} dataLength={filteredData.length} />
          </div>

          {/* Selected Data Table */}
          <div className="space-y-8">
            {activeTable === 'monthonmonthbytype' && <>
              <div id="monthonmonthbytype-table">
                <ClientConversionMonthOnMonthByTypeTable 
                data={filteredData} 
                visitsSummary={visitsSummary}
                onRowClick={rowData => setDrillDownModal({
              isOpen: true,
              client: null,
              title: `${rowData.month} - ${rowData.type} Analysis`,
              data: rowData,
              type: 'month'
            })} />
              </div>
              <NotesBlock tableKey="clientRetention:monthOnMonthByType" sectionId="retention-mom-by-type" />
            </>}

            {activeTable === 'monthonmonth' && <>
              <div id="monthonmonth-table">
                {/* Pivoted MoM by Client Type with months as columns, independent from date range */}
                <ClientRetentionMonthByTypePivot
                  data={filteredDataNoDateRange}
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
              <NotesBlock tableKey="clientRetention:monthOnMonth" sectionId="retention-mom" />
            </>}

            {activeTable === 'yearonyear' && <>
              <div id="yearonyear-table">
                {/* Pivoted YoY with months as columns and prev/curr values */}
                <ClientRetentionYearOnYearPivot 
                  data={filteredDataNoDateRange}
                  onRowClick={rowData => setDrillDownModal({
                    isOpen: true,
                    client: null,
                    title: `${rowData.rowKey} - Year Comparison`,
                    data: rowData,
                    type: 'year'
                  })}
                />
              </div>
              <NotesBlock tableKey="clientRetention:yearOnYear" sectionId="retention-yoy" />
            </>}

            {activeTable === 'hostedclasses' && <>
              <div id="hostedclasses-table">
                <ClientHostedClassesTable data={filteredData} onRowClick={rowData => setDrillDownModal({
              isOpen: true,
              client: null,
              title: `${rowData.className} - ${rowData.month}`,
              data: rowData,
              type: 'class'
            })} />
              </div>
              <NotesBlock tableKey="clientRetention:hostedClasses" sectionId="retention-hosted-classes" />
            </>}

            {activeTable === 'memberships' && <>
              <div id="memberships-table">
                <ClientConversionMembershipTable data={filteredData} />
              </div>
              <NotesBlock tableKey="clientRetention:memberships" sectionId="retention-memberships" />
            </>}
            
            <div className="mt-8">
              <AiNotes 
                location="client-retention"
                sectionId="retention-analytics" 
                tableKey={`client-retention-${activeTable}`}
                author="Client Retention Analyst"
              />
            </div>
          </div>
        </main>

        {/* Enhanced Drill Down Modal */}
        <ClientConversionDrillDownModalV3 
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
