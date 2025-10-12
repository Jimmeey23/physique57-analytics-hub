import React, { useEffect, useState, useMemo } from 'react';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { NewClientFilterOptions } from '@/types/dashboard';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { formatNumber } from '@/utils/formatters';
import { getPreviousMonthDateRange, getCurrentMonthDateRange, parseDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

// Import new components for rebuilt client conversion tab
import { EnhancedClientConversionFilterSection } from '@/components/dashboard/EnhancedClientConversionFilterSection';
import { ClientConversionMetricCards } from '@/components/dashboard/ClientConversionMetricCards';
import { ClientConversionSimplifiedRanks } from '@/components/dashboard/ClientConversionSimplifiedRanks';
import { ClientConversionEnhancedCharts } from '@/components/dashboard/ClientConversionEnhancedCharts';
import { ClientConversionDataTableSelector } from '@/components/dashboard/ClientConversionDataTableSelector';
import { ClientConversionMonthOnMonthTable } from '@/components/dashboard/ClientConversionMonthOnMonthTable';
import { ClientConversionMonthOnMonthByTypeTable } from '@/components/dashboard/ClientConversionMonthOnMonthByTypeTable';
import { ClientConversionYearOnYearTable } from '@/components/dashboard/ClientConversionYearOnYearTable';
import { ClientConversionMembershipTable } from '@/components/dashboard/ClientConversionMembershipTable';
import { ClientHostedClassesTable } from '@/components/dashboard/ClientHostedClassesTable';
import { ClientConversionDrillDownModalV3 } from '@/components/dashboard/ClientConversionDrillDownModalV3';
import NotesBlock from '@/components/ui/NotesBlock';
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
    
    console.log(`Filtered payroll data: ${payrollData.length} -> ${filtered.length} records`);
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
    
    console.log('Visits summary for filtered data:', summary);
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
    console.log('Filtering data. Total records:', data.length, 'Selected location:', selectedLocation);
    console.log('Current filters:', filters);
    let filtered = data;

    // TEMPORARY: Show sample of raw data for debugging
    if (data.length > 0) {
      console.log('Sample client data for debugging:', {
        firstFewClients: data.slice(0, 3),
        dateFormats: data.slice(0, 10).map(c => c.firstVisitDate),
        dateRange: filters.dateRange
      });
    }

    // Apply date range filter FIRST - only if both start and end dates are provided
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start + 'T00:00:00') : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end + 'T23:59:59') : null;
      console.log('Date filter range:', {
        start: startDate,
        end: endDate
      });
      
      filtered = filtered.filter(client => {
        if (!client.firstVisitDate) {
          console.log('Client has no firstVisitDate:', client.memberId);
          return false;
        }
        
        const clientDate = parseDate(client.firstVisitDate);
        if (!clientDate) {
          console.warn('Invalid client date:', client.firstVisitDate, 'for client:', client.memberId);
          return false;
        }

        // Set client date to start of day for comparison
        clientDate.setHours(0, 0, 0, 0);
        const withinRange = (!startDate || clientDate >= startDate) && (!endDate || clientDate <= endDate);
        
        if (!withinRange) {
          console.log('Client filtered out by date:', {
            clientId: client.memberId,
            clientDate: clientDate.toISOString().split('T')[0],
            originalDate: client.firstVisitDate,
            startDate: startDate?.toISOString().split('T')[0],
            endDate: endDate?.toISOString().split('T')[0]
          });
        }
        return withinRange;
      });
      console.log(`Date filter applied: ${data.length} -> ${filtered.length} records`);
    } else {
      console.log('No date filter applied - showing all data:', filtered.length, 'records');
    }

    // Apply location filter - check both firstVisitLocation and homeLocation
    if (selectedLocation !== 'All Locations') {
      const beforeLocationFilter = filtered.length;

      // Debug: Check all unique locations for Kenkere House
      if (selectedLocation === 'Kenkere House, Bengaluru') {
        const uniqueFirstLocations = [...new Set(filtered.map(c => c.firstVisitLocation).filter(Boolean))];
        const uniqueHomeLocations = [...new Set(filtered.map(c => c.homeLocation).filter(Boolean))];
        console.log('All unique first visit locations:', uniqueFirstLocations.filter(loc => loc.includes('Kenkere') || loc.includes('Bengaluru')));
        console.log('All unique home locations:', uniqueHomeLocations.filter(loc => loc.includes('Kenkere') || loc.includes('Bengaluru')));
      }
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
      console.log(`Location filter ${selectedLocation}: ${beforeLocationFilter} -> ${filtered.length} records`);
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
    console.log('Final filtered data for metric cards:', filtered.length, 'records');
    
    // Log sample of final filtered data for debugging
    if (filtered.length > 0) {
      console.log('Sample filtered data:', {
        count: filtered.length,
        firstFew: filtered.slice(0, 2).map(c => ({
          memberId: c.memberId,
          isNew: c.isNew,
          conversionStatus: c.conversionStatus,
          retentionStatus: c.retentionStatus,
          ltv: c.ltv
        }))
      });
    } else {
      console.warn('No data remaining after filtering!');
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
    console.log('Creating filtered data without date range for month/year tables');
    let filtered = data;

    // Apply location filter - check both firstVisitLocation and homeLocation
    if (selectedLocation !== 'All Locations') {
      const beforeLocationFilter = filtered.length;

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
      console.log(`Location filter for month/year tables ${selectedLocation}: ${beforeLocationFilter} -> ${filtered.length} records`);
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
    console.log('Filtered data without date range:', filtered.length, 'records');
    return filtered;
  }, [data, selectedLocation, filters]);
  const heroMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const locations = [{
      key: 'Kwality House, Kemps Corner',
      name: 'Kwality'
    }, {
      key: 'Supreme HQ, Bandra',
      name: 'Supreme'
    }, {
      key: 'Kenkere House, Bengaluru',
      name: 'Kenkere'
    }];
    return locations.map(location => {
      const locationData = filteredData.filter(item => {
        const firstLocation = item.firstVisitLocation || '';
        const homeLocation = item.homeLocation || '';

        // For Kenkere House, use flexible matching
        if (location.key === 'Kenkere House, Bengaluru') {
          return firstLocation.toLowerCase().includes('kenkere') || firstLocation.toLowerCase().includes('bengaluru') || firstLocation === 'Kenkere House' || homeLocation.toLowerCase().includes('kenkere') || homeLocation.toLowerCase().includes('bengaluru') || homeLocation === 'Kenkere House';
        }

        // For other locations, use exact match
        return firstLocation === location.key || homeLocation === location.key;
      });
      const totalClients = locationData.length;
      return {
        location: location.name,
        label: 'Filtered Clients',
        value: formatNumber(totalClients)
      };
    });
  }, [filteredData]);
  
  // Remove individual loader - rely on global loader only
  console.log('Rendering ClientRetention with data:', data.length, 'records, filtered:', filteredData.length);
  // Build section-wise processed export maps (not raw sheet rows)
  const exportAdditionalData = React.useMemo(() => {
    // Provide compact, processed rows suitable for export (limit columns for readability)
    const safeMap = (arr: any[], pick: string[]) => arr.map(row => pick.reduce((obj, key) => { obj[key] = row[key]; return obj; }, {} as any));

    // Month on Month by Type: recompute via filteredData and visitsSummary from existing memos by leveraging the MoM-by-type table would be ideal; for now, export the drillable rows from displayed table by approximating with first-level fields.
    const momByType: any[] = []; // Placeholder for brevity; can be wired to table-level memo later
    const mom: any[] = []; // idem
    const yoy: any[] = []; // idem
    const hosted: any[] = []; // idem

    return {
      'Client Retention • MoM by Type': momByType,
      'Client Retention • MoM': mom,
      'Client Retention • YoY': yoy,
      'Client Retention • Hosted Classes': hosted
    };
  }, [filteredData, filteredDataNoDateRange, visitsSummary, visitsSummaryNoDateRange]);

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
            {/* Enhanced Location Tabs - unified styling (moved above filters) */}
            <div className="flex justify-center mb-8">
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
            <div className="glass-card modern-card-hover p-6 rounded-2xl">
              <EnhancedClientConversionFilterSection filters={filters} onFiltersChange={setFilters} locations={uniqueLocations} trainers={uniqueTrainers} membershipTypes={uniqueMembershipTypes} />
            </div>

          {/* Enhanced Metric Cards */}
          <div className="glass-card modern-card-hover rounded-2xl p-6 soft-bounce stagger-2">
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

          {/* Enhanced Simplified Ranking System */}
          <div className="glass-card modern-card-hover rounded-2xl p-6 slide-in-right stagger-3">
            <ClientConversionSimplifiedRanks 
              data={filteredData} 
              payrollData={filteredPayrollData}
              allPayrollData={payrollData}
              allClientData={data}
              selectedLocation={selectedLocation}
              dateRange={filters.dateRange}
              selectedMetric={selectedMetric}
              onDrillDown={(type, item, metric) => {
                // Enhanced filtering with debugging
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

                // Debug logging - simplified
                console.log('✅ Drill Down Initiated:', {
                  type,
                  itemName: item.name,
                  metric,
                  relatedClientsCount: relatedClients.length,
                  relatedPayrollCount: relatedPayroll.length
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
          <div className="space-y-4 slide-in-left stagger-4">
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
          <div className="glass-card modern-card-hover rounded-2xl p-6 slide-in-right stagger-5">
            <ClientConversionDataTableSelector activeTable={activeTable} onTableChange={setActiveTable} dataLength={filteredData.length} />
          </div>

          {/* Selected Data Table */}
          <div className="space-y-8">
            {activeTable === 'monthonmonthbytype' && <>
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
              <NotesBlock tableKey="clientRetention:monthOnMonthByType" sectionId="retention-mom-by-type" />
            </>}

            {activeTable === 'monthonmonth' && <>
              <ClientConversionMonthOnMonthTable 
              data={filteredDataNoDateRange} 
              visitsSummary={visitsSummaryNoDateRange}
              onRowClick={rowData => setDrillDownModal({
            isOpen: true,
            client: null,
            title: `${rowData.month} Analysis`,
            data: rowData,
            type: 'month'
          })} />
              <NotesBlock tableKey="clientRetention:monthOnMonth" sectionId="retention-mom" />
            </>}

            {activeTable === 'yearonyear' && <>
              <ClientConversionYearOnYearTable 
              data={filteredDataNoDateRange} 
              visitsSummary={visitsSummaryNoDateRange}
              onRowClick={rowData => setDrillDownModal({
            isOpen: true,
            client: null,
            title: `${rowData.month} Year Comparison`,
            data: rowData,
            type: 'year'
          })} />
              <NotesBlock tableKey="clientRetention:yearOnYear" sectionId="retention-yoy" />
            </>}

            {activeTable === 'hostedclasses' && <>
              <ClientHostedClassesTable data={filteredData} onRowClick={rowData => setDrillDownModal({
            isOpen: true,
            client: null,
            title: `${rowData.className} - ${rowData.month}`,
            data: rowData,
            type: 'class'
          })} />
              <NotesBlock tableKey="clientRetention:hostedClasses" sectionId="retention-hosted-classes" />
            </>}

            {activeTable === 'memberships' && <>
              <ClientConversionMembershipTable data={filteredData} />
              <NotesBlock tableKey="clientRetention:memberships" sectionId="retention-memberships" />
            </>}
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
