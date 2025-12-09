
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3, 
  Calendar, 
  Eye,
  Activity,
  UserCheck,
  Zap,
  ShoppingCart,
  TrendingDown,
  Percent,
  Clock,
  Home,
  Play,
  Pause,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { ExecutiveLocationSelector } from './ExecutiveLocationSelector';
import { ExecutiveMetricCardsGrid } from './ExecutiveMetricCardsGrid';
import { ExecutiveChartsGrid } from './ExecutiveChartsGrid';
import { EnhancedExecutiveDataTables } from './EnhancedExecutiveDataTables';
import { ExecutiveTopPerformersGrid } from './ExecutiveTopPerformersGrid';
import { ExecutiveDiscountsTab } from './ExecutiveDiscountsTab';
import { ExecutiveFilterSection } from './ExecutiveFilterSection';
import { StudioLocationTabs } from '../ui/StudioLocationTabs';
import { PowerCycleBarreStrengthComparison } from './PowerCycleBarreStrengthComparison';
import { SourceDataModal } from '@/components/ui/SourceDataModal';
import { ExpirationMetricCards } from './ExpirationMetricCards';
import { ExpirationDataTables } from './ExpirationDataTables';
import { ExpirationChartsGrid } from './ExpirationChartsGrid';
import { ImprovedLeadMetricCards } from './ImprovedLeadMetricCards';
import { LeadMonthOnMonthTable } from './LeadMonthOnMonthTable';
import { ImprovedLeadTopLists } from './ImprovedLeadTopLists';
import { LeadInteractiveChart } from './LeadInteractiveChart';
import { SessionsMetricCards } from './SessionsMetricCards';
import { SessionsGroupedTable } from './SessionsGroupedTable';
import { SessionsAttendanceAnalytics } from './SessionsAttendanceAnalytics';
import { LateCancellationsMetricCards } from './LateCancellationsMetricCards';
import { LateCancellationsMonthOnMonthTable } from './LateCancellationsMonthOnMonthTable';
import { EnhancedLateCancellationsDataTables } from './EnhancedLateCancellationsDataTables';
import { LateCancellationsInteractiveCharts } from './LateCancellationsInteractiveCharts';
import { ClientConversionMetricCards } from './ClientConversionMetricCards';
import { ClientConversionMonthOnMonthByTypeTable } from './ClientConversionMonthOnMonthByTypeTable';
import { ClientRetentionMonthByTypePivot } from './ClientRetentionMonthByTypePivot';
import { ClientConversionEnhancedCharts } from './ClientConversionEnhancedCharts';
import InfoPopover from '@/components/ui/InfoSidebar';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { getSummaryText } from '@/services/infoSummaryService';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { generateHTMLPDFReport, generateMultiLocationHTMLPDFReports } from '@/services/htmlPDFService';

// Helper function to get location ID for InfoPopover
const getLocationId = (location: string | undefined): 'kwality' | 'supreme' | 'kenkere' | 'all' => {
  if (!location) return 'all';
  const loc = location.toLowerCase();
  if (loc.includes('kwality') || loc.includes('kemps')) return 'kwality';
  if (loc.includes('supreme') || loc.includes('bandra')) return 'supreme';
  if (loc.includes('kenkere') || loc.includes('bengaluru')) return 'kenkere';
  return 'all';
};

// Summary card component
const SummaryCard: React.FC<{ context: string; locationId: 'kwality' | 'supreme' | 'kenkere' | 'all' }> = ({ context, locationId }) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mb-6">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Executive Context
          <InfoPopover context={context as any} locationId={locationId} size={20} />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-blue-800 space-y-2">
        {/* InfoPopover content will be shown when clicked */}
        <p className="italic">Click the info icon to view location-specific insights and strategic context.</p>
      </CardContent>
    </Card>
  );
};

export const ComprehensiveExecutiveDashboard = React.memo(() => {
  const [showSourceData, setShowSourceData] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { filters, updateFilters } = useGlobalFilters();
  const { setLoading } = useGlobalLoading();
  const { toast } = useToast();

  // Load real data from hooks
  const { data: salesData, loading: salesLoading } = useSalesData();
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();
  const { data: newClientsData, loading: newClientsLoading } = useNewClientData();
  const { data: leadsData, loading: leadsLoading } = useLeadsData();
  const { data: discountData, loading: discountLoading } = useDiscountAnalysis();
  const { data: lateCancellationsData, loading: lateCancellationsLoading } = useLateCancellationsData();
  const { data: expirationsData, loading: expirationsLoading } = useExpirationsData();

  const isLoading = salesLoading || sessionsLoading || payrollLoading || newClientsLoading || leadsLoading || discountLoading || lateCancellationsLoading || expirationsLoading;

  useEffect(() => {
    setLoading(isLoading, 'Loading executive dashboard overview...');
  }, [isLoading, setLoading]);

  // Ensure Executive Summary defaults to November 2025 when this component mounts
  useEffect(() => {
    try {
      // Force the Executive Summary to November 2025 on mount
      updateFilters({ dateRange: { start: '2025-11-01', end: '2025-11-30' } });
    } catch (e) {
      console.warn('Failed to set default Executive Summary date range:', e);
    }
    // Intentionally only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique locations for the selector
  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    
    salesData?.forEach(sale => {
      if (sale.calculatedLocation) locations.add(sale.calculatedLocation);
    });
    
    sessionsData?.forEach(session => {
      if (session.location) locations.add(session.location);
    });
    
    newClientsData?.forEach(client => {
      if (client.homeLocation) locations.add(client.homeLocation);
    });
    
    payrollData?.forEach(payroll => {
      if (payroll.location) locations.add(payroll.location);
    });

    return Array.from(locations).sort();
  }, [salesData, sessionsData, newClientsData, payrollData]);

  // Filter data to previous month and by location
  const previousMonthData = useMemo(() => {
    // If a specific dateRange is set in filters, use that; otherwise use last 3 months
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;
    if (filters?.dateRange && filters.dateRange.start && filters.dateRange.end) {
      rangeStart = new Date(filters.dateRange.start + 'T00:00:00');
      rangeEnd = new Date(filters.dateRange.end + 'T23:59:59');
    } else {
      const now = new Date();
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      rangeEnd = new Date();
    }

    const filterByRecentMonths = (dateStr: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      if (!rangeStart || !rangeEnd) return false;
      return date >= rangeStart && date <= rangeEnd;
    };

    const filterByLocation = (items: any[], locationKey: string) => {
      if (!filters.location || (Array.isArray(filters.location) && filters.location.length === 0)) return items;
      const locationFilter = Array.isArray(filters.location) ? filters.location[0] : filters.location;
      // Treat 'all' or 'All Locations' as no filtering
      if (!locationFilter || ['all', 'all locations'].includes(String(locationFilter).toLowerCase())) {
        return items;
      }

      return items.filter(item => {
        const itemLocation = item[locationKey];
        if (!itemLocation) return false;
        
        // Flexible location matching
        if (locationFilter === 'Kwality House, Kemps Corner') {
          return itemLocation.includes('Kwality') || itemLocation.includes('Kemps Corner');
        } else if (locationFilter === 'Supreme HQ, Bandra') {
          return itemLocation.includes('Supreme') || itemLocation.includes('Bandra');
        } else if (locationFilter === 'Kenkere House, Bengaluru') {
          return itemLocation.includes('Kenkere') || itemLocation.includes('Bengaluru') || itemLocation === 'Kenkere House';
        }
        return itemLocation === locationFilter;
      });
    };

    const filteredSales = filterByLocation(
      salesData?.filter(item => filterByRecentMonths(item.paymentDate)) || [],
      'calculatedLocation'
    );

    const filteredSessions = filterByLocation(
      sessionsData?.filter(item => filterByRecentMonths(item.date)) || [],
      'location'
    );

    // For payroll, use last 3 months
    const filteredPayroll = filterByLocation(
      payrollData || [],
      'location'
    );

    const filteredNewClients = filterByLocation(
      newClientsData?.filter(item => filterByRecentMonths(item.firstVisitDate)) || [],
      'homeLocation'
    );

    const filteredLeads = filterByLocation(
      (leadsData?.filter(item => {
        return item.createdAt ? filterByRecentMonths(item.createdAt) : false;
      }) || []),
      'center'
    );

    const filteredDiscounts = filterByLocation(
      discountData?.filter(item => filterByRecentMonths(item.paymentDate)) || [],
      'location'
    );

    // Filter late cancellations
    const filteredLateCancellations = filterByLocation(
      lateCancellationsData?.filter(item => {
        const dateStr = item.dateIST || '';
        return typeof dateStr === 'string' && filterByRecentMonths(dateStr);
      }) || [],
      'location'
    );

    // Filter expirations
    const filteredExpirations = filterByLocation(
      expirationsData?.filter(item => filterByRecentMonths(item.endDate || item.orderAt)) || [],
      'homeLocation'
    );

    // Debug logging
    console.log('Executive Dashboard Data Counts:', {
      sales: filteredSales.length,
      sessions: filteredSessions.length,
      payroll: filteredPayroll.length,
      newClients: filteredNewClients.length,
      leads: filteredLeads.length,
      discounts: filteredDiscounts.length,
      lateCancellations: filteredLateCancellations.length,
      expirations: filteredExpirations.length,
      selectedLocation: filters.location
    });

      // Debug sessions data structure
      if (filteredSessions.length > 0) {
        console.log('Sample session data:', filteredSessions[0]);
        console.log('Sessions fields check:', {
          hasCleanedClass: 'cleanedClass' in filteredSessions[0],
          hasCapacity: 'capacity' in filteredSessions[0],
          hasCheckedInCount: 'checkedInCount' in filteredSessions[0],
          hasTotalPaid: 'totalPaid' in filteredSessions[0]
        });
      }

      // Debug new clients data structure
      if (filteredNewClients.length > 0) {
        console.log('Sample client data:', filteredNewClients[0]);
        console.log('Client fields check:', {
          hasFirstVisitDate: 'firstVisitDate' in filteredNewClients[0],
          hasConversionStatus: 'conversionStatus' in filteredNewClients[0],
          hasRetentionStatus: 'retentionStatus' in filteredNewClients[0],
          hasLTV: 'ltv' in filteredNewClients[0],
          hasIsNew: 'isNew' in filteredNewClients[0]
        });
      }

    return {
      sales: filteredSales,
      sessions: filteredSessions,
      payroll: filteredPayroll,
      newClients: filteredNewClients,
      leads: filteredLeads,
      discounts: filteredDiscounts,
      lateCancellations: filteredLateCancellations,
      expirations: filteredExpirations
    };
  }, [salesData, sessionsData, payrollData, newClientsData, leadsData, discountData, lateCancellationsData, expirationsData, filters.location, filters.dateRange]);

  // All data for last 3 months (for MoM comparison calculations)
  const allDataLast3Months = useMemo(() => {
    // Respect filters.dateRange when provided; otherwise default to last 3 months
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;
    if (filters?.dateRange && filters.dateRange.start && filters.dateRange.end) {
      rangeStart = new Date(filters.dateRange.start + 'T00:00:00');
      rangeEnd = new Date(filters.dateRange.end + 'T23:59:59');
    } else {
      const now = new Date();
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      rangeEnd = new Date();
    }

    const filterByLast3Months = (dateStr: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      if (!rangeStart || !rangeEnd) return false;
      return date >= rangeStart && date <= rangeEnd;
    };

    const filterByLocation = (items: any[], locationKey: string) => {
      if (!filters.location || (Array.isArray(filters.location) && filters.location.length === 0)) return items;
      const locationFilter = Array.isArray(filters.location) ? filters.location[0] : filters.location;
      if (!locationFilter || ['all', 'all locations'].includes(String(locationFilter).toLowerCase())) {
        return items;
      }
      return items.filter(item => item[locationKey] === locationFilter);
    };

    const allSales = filterByLocation(
      salesData?.filter(item => filterByLast3Months(item.paymentDate)) || [],
      'calculatedLocation'
    );

    const allSessions = filterByLocation(
      sessionsData?.filter(item => filterByLast3Months(item.date)) || [],
      'location'
    );

    const allPayroll = filterByLocation(
      payrollData || [],
      'location'
    );

    const allNewClients = filterByLocation(
      newClientsData?.filter(item => filterByLast3Months(item.firstVisitDate)) || [],
      'homeLocation'
    );

    const allLeads = filterByLocation(
      leadsData?.filter(item => filterByLast3Months(item.createdAt || '')) || [],
      'center'
    );

    const allDiscounts = filterByLocation(
      discountData?.filter(item => filterByLast3Months(item.paymentDate)) || [],
      'location'
    );

    return {
      sales: allSales,
      sessions: allSessions,
      payroll: allPayroll,
      newClients: allNewClients,
      leads: allLeads,
      discounts: allDiscounts
    };
  }, [salesData, sessionsData, payrollData, newClientsData, leadsData, discountData, filters.location, filters.dateRange]);

  if (isLoading) {
    return null; // Global loader will handle this
  }

  const selectedLocation = Array.isArray(filters.location) ? filters.location[0] : filters.location;

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Select audio source based on location
        const audioSrc = selectedLocation === 'Kwality House' 
          ? '/kwality-house-audio.mp3' 
          : '/placeholder-audio.mp3';
        
        audioRef.current.src = audioSrc;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownloadPDFReports = async () => {
    setIsGeneratingPDF(true);
    
    try {
        // Prepare report data
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const dateRange = `${threeMonthsAgo.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

        // Defensive helpers
        const safeNumber = (val) => (typeof val === 'number' && !isNaN(val) ? val : 0);
        const safeArray = (arr) => Array.isArray(arr) ? arr : [];
        const safeString = (str) => typeof str === 'string' ? str : '';

        // Calculate avgResponseTime for leads
        let avgResponseTime = 0;
        if (previousMonthData.leads.length > 0) {
          const responseTimes = previousMonthData.leads
            .map(l => safeNumber(l.responseTimeHours))
            .filter(rt => rt > 0);
          avgResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
            : 0;
        }

        // Calculate avgDaysToExpiry for expirations
        let avgDaysToExpiry = 0;
        if (previousMonthData.expirations.length > 0) {
          const daysArr = previousMonthData.expirations
            .map(e => safeNumber(e.daysToExpiry))
            .filter(d => d > 0);
          avgDaysToExpiry = daysArr.length > 0
            ? daysArr.reduce((sum, d) => sum + d, 0) / daysArr.length
            : 0;
        }

        // Map to InfoSummary location id
        const locationId = getLocationId(selectedLocation);

        // Defensive construction of reportData
        const reportData = {
          location: safeString(selectedLocation) || 'All Locations',
          dateRange,
          sales: {
            totalRevenue: safeArray(previousMonthData.sales).reduce((sum, s) => sum + safeNumber(s.paymentValue), 0),
            transactions: safeArray(previousMonthData.sales).length,
            avgTransaction: safeArray(previousMonthData.sales).length > 0
              ? safeArray(previousMonthData.sales).reduce((sum, s) => sum + safeNumber(s.paymentValue), 0) / safeArray(previousMonthData.sales).length
              : 0,
            uniqueCustomers: new Set(safeArray(previousMonthData.sales).map(s => safeString(s.customerName))).size,
          },
          clients: {
            newMembers: safeArray(previousMonthData.newClients).filter(c => safeString(c.isNew).toLowerCase().includes('new')).length,
            convertedMembers: safeArray(previousMonthData.newClients).filter(c => safeString(c.conversionStatus) === 'Converted').length,
            retentionRate: safeArray(previousMonthData.newClients).length > 0
              ? (safeArray(previousMonthData.newClients).filter(c => safeString(c.retentionStatus) === 'Retained').length / safeArray(previousMonthData.newClients).length) * 100
              : 0,
            avgLTV: safeArray(previousMonthData.newClients).length > 0
              ? safeArray(previousMonthData.newClients).reduce((sum, c) => sum + safeNumber(c.ltv), 0) / safeArray(previousMonthData.newClients).length
              : 0,
          },
          sessions: {
            totalSessions: safeArray(previousMonthData.sessions).length,
            avgClassSize: safeArray(previousMonthData.sessions).length > 0
              ? safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.checkedInCount), 0) / safeArray(previousMonthData.sessions).length
              : 0,
            avgFillRate: safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.capacity), 0) > 0
              ? (safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.checkedInCount), 0) / safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.capacity), 0)) * 100
              : 0,
            totalAttendance: safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.checkedInCount), 0),
          },
          trainers: {
            totalTrainers: new Set(safeArray(previousMonthData.payroll).map(p => safeString(p.teacherName))).size,
            totalSessions: safeArray(previousMonthData.payroll).reduce((sum, p) => sum + safeNumber(p.totalSessions), 0),
            totalPaid: safeArray(previousMonthData.payroll).reduce((sum, p) => sum + safeNumber(p.totalPaid), 0),
            avgPerSession: safeArray(previousMonthData.payroll).reduce((sum, p) => sum + safeNumber(p.totalSessions), 0) > 0
              ? safeArray(previousMonthData.payroll).reduce((sum, p) => sum + safeNumber(p.totalPaid), 0) / safeArray(previousMonthData.payroll).reduce((sum, p) => sum + safeNumber(p.totalSessions), 0)
              : 0,
          },
          discounts: {
            discountedSales: safeArray(previousMonthData.discounts).length,
            totalDiscount: safeArray(previousMonthData.discounts).reduce((sum, d) => sum + safeNumber(d.discountAmount), 0),
            avgDiscountPercent: safeArray(previousMonthData.discounts).length > 0
              ? (safeArray(previousMonthData.discounts).reduce((sum, d) => sum + safeNumber(d.discountPercentage), 0) / safeArray(previousMonthData.discounts).length)
              : 0,
            revenueImpact: safeArray(previousMonthData.discounts).reduce((sum, d) => sum + safeNumber(d.paymentValue), 0),
          },
          leads: {
            totalLeads: safeArray(previousMonthData.leads).length,
            converted: safeArray(previousMonthData.leads).filter(l => safeString(l.status) === 'Converted').length,
            conversionRate: safeArray(previousMonthData.leads).length > 0
              ? (safeArray(previousMonthData.leads).filter(l => safeString(l.status) === 'Converted').length / safeArray(previousMonthData.leads).length) * 100
              : 0,
            avgResponseTime,
          },
          expirations: {
            total: safeArray(previousMonthData.expirations).length,
            value: safeArray(previousMonthData.expirations).reduce((sum, e) => sum + safeNumber(e.orderValue), 0),
            avgDaysToExpiry,
          },
          cancellations: {
            total: safeArray(previousMonthData.lateCancellations).length,
            rate: safeArray(previousMonthData.sessions).length > 0
              ? (safeArray(previousMonthData.lateCancellations).length / safeArray(previousMonthData.sessions).length) * 100
              : 0,
            pattern: 'Peak times: Early morning and evening classes',
          },
          summaries: {
            executive: getSummaryText('executive', locationId),
            sales: getSummaryText('sales-overview', locationId),
            clients: getSummaryText('clients-overview', locationId),
            sessions: getSummaryText('sessions-overview', locationId),
            trainers: getSummaryText('trainer-overview', locationId),
            discounts: getSummaryText('discounts-overview', locationId),
            leads: getSummaryText('leads-overview', locationId),
            expirations: getSummaryText('expiration-analytics-overview', locationId),
            cancellations: getSummaryText('late-cancellations-overview', locationId),
            recommendations: getSummaryText('recommendations', locationId),
          },
        };

        toast({
          title: "Generating PDF Report",
          description: `Creating structured HTML-based report for ${reportData.location}...`,
        });

        await generateHTMLPDFReport(reportData);

        toast({
          title: "Success!",
          description: `PDF report generated successfully for ${reportData.location}`,
          duration: 5000,
        });
    } catch (error) {
      console.error('Error generating PDF reports:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 p-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} preload="metadata">
        <source src="/placeholder-audio.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Visible Action Toolbar */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Button
            onClick={handleDownloadPDFReports}
            disabled={isGeneratingPDF}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <BrandSpinner size="xs" className="mr-2" />
                  Generating PDF Report...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                  Download PDF Report
                <Download className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Hidden toolbar so hero can trigger actions without duplicating UI */}
        <div className="hidden items-center justify-end gap-3">
          <Button 
            onClick={handlePlayAudio}
            className="rounded-xl border border-slate-300/60 bg-transparent text-slate-800 hover:border-slate-500/60 px-5 py-2.5 text-sm font-semibold"
            variant="ghost"
          >
            {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <AdvancedExportButton 
            salesData={previousMonthData.sales}
            sessionsData={previousMonthData.sessions}
            newClientData={previousMonthData.newClients}
            payrollData={previousMonthData.payroll}
            lateCancellationsData={[]}
            discountData={previousMonthData.discounts}
            defaultFileName="executive-dashboard-export"
            size="sm"
            variant="ghost"
            buttonClassName="rounded-xl border border-slate-300/60 text-slate-800 hover:border-slate-500/60"
          />
          <Button
            id="exec-pdf-trigger"
            onClick={handleDownloadPDFReports}
            disabled={isGeneratingPDF}
            className="rounded-xl border border-slate-300/60 bg-transparent text-slate-800 hover:border-slate-500/60 px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            variant="ghost"
          >
            {isGeneratingPDF ? (
              <>
                <BrandSpinner size="xs" className="mr-2" />
                Generating PDFs...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF Reports
                <Download className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          <Button 
            onClick={() => window.location.href = '/'}
            className="rounded-xl border border-slate-300/60 bg-transparent text-slate-800 hover:border-slate-500/60 px-5 py-2.5 text-sm font-semibold"
            variant="ghost"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Main Dashboard
          </Button>
        </div>

        {/* Location Tabs - Easy Switching Between Locations */}
        <StudioLocationTabs 
          activeLocation={selectedLocation || 'all'}
          onLocationChange={(locationId) => {
            updateFilters({ location: locationId === 'all' ? null : locationId });
          }}
          showInfoPopover={true}
          infoPopoverContext="executive-overview"
        />

        {/* Quick Summary Metrics Banner */}
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0 shadow-2xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-xs text-white/80 font-medium mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${(previousMonthData.sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0) / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-white/60">{previousMonthData.sales.length} sales</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/80 font-medium mb-1">Sessions</p>
                <p className="text-2xl font-bold">{previousMonthData.sessions.length}</p>
                <p className="text-xs text-white/60">
                  {previousMonthData.sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0)} attended
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/80 font-medium mb-1">New Clients</p>
                <p className="text-2xl font-bold">{previousMonthData.newClients.length}</p>
                <p className="text-xs text-white/60">
                  {previousMonthData.newClients.filter(c => c.retentionStatus === 'Retained').length} retained
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/80 font-medium mb-1">Trainers</p>
                <p className="text-2xl font-bold">
                  {new Set(previousMonthData.payroll.map(p => p.teacherName)).size}
                </p>
                <p className="text-xs text-white/60">
                  {previousMonthData.payroll.reduce((sum, p) => sum + (p.totalSessions || 0), 0)} sessions
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/80 font-medium mb-1">Leads</p>
                <p className="text-2xl font-bold">{previousMonthData.leads.length}</p>
                <p className="text-xs text-white/60">
                  {previousMonthData.leads.filter(l => l.conversionStatus === 'Converted').length} converted
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/80 font-medium mb-1">Fill Rate</p>
                <p className="text-2xl font-bold">
                  {previousMonthData.sessions.reduce((sum, s) => sum + (s.capacity || 0), 0) > 0 ?
                    ((previousMonthData.sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) / 
                      previousMonthData.sessions.reduce((sum, s) => sum + (s.capacity || 0), 0)) * 100).toFixed(0) :
                    0}%
                </p>
                <p className="text-xs text-white/60">capacity utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Section with Location Selector */}
        <ExecutiveFilterSection availableLocations={availableLocations} />

        {/* Key Performance Metrics - 12 Cards with real data */}
        <div id="executive-metrics">
          <ExecutiveMetricCardsGrid data={previousMonthData} historical={allDataLast3Months} />
        </div>

        {/* Interactive Charts Section - 4 Charts with real data */}
        <div id="executive-charts">
          <ExecutiveChartsGrid data={previousMonthData} />
        </div>

        {/* Main Content Sections */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden" id="executive-tables">
          <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white border-0">
            <CardTitle className="text-2xl font-bold flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              Comprehensive Performance Analytics - All 12 Dashboards
              <Badge className="bg-white/20 text-white backdrop-blur-sm px-3 py-1">
                12 Dashboard Tabs
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 grid grid-cols-6 gap-1 w-full max-w-7xl mx-auto overflow-x-auto mb-8">
                <TabsTrigger 
                  value="sales" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <DollarSign className="w-3 h-3 mr-1 inline" />
                  Sales
                </TabsTrigger>
                <TabsTrigger 
                  value="clients" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <UserCheck className="w-3 h-3 mr-1 inline" />
                  Clients
                </TabsTrigger>
                <TabsTrigger 
                  value="trainers" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Users className="w-3 h-3 mr-1 inline" />
                  Trainers
                </TabsTrigger>
                <TabsTrigger 
                  value="attendance" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Activity className="w-3 h-3 mr-1 inline" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger 
                  value="formats" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Zap className="w-3 h-3 mr-1 inline" />
                  Formats
                </TabsTrigger>
                <TabsTrigger 
                  value="discounts" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Percent className="w-3 h-3 mr-1 inline" />
                  Discounts
                </TabsTrigger>
                <TabsTrigger 
                  value="sessions" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Calendar className="w-3 h-3 mr-1 inline" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger 
                  value="expirations" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Clock className="w-3 h-3 mr-1 inline" />
                  Expirations
                </TabsTrigger>
                <TabsTrigger 
                  value="cancellations" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <TrendingDown className="w-3 h-3 mr-1 inline" />
                  Cancellations
                </TabsTrigger>
                <TabsTrigger 
                  value="leads" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Target className="w-3 h-3 mr-1 inline" />
                  Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="patterns" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <TrendingUp className="w-3 h-3 mr-1 inline" />
                  Patterns
                </TabsTrigger>
                <TabsTrigger 
                  value="overview" 
                  className="relative rounded-xl px-3 py-2 font-semibold text-xs transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3 mr-1 inline" />
                  All Tables
                </TabsTrigger>
              </TabsList>

              <div className="space-y-6">
                {/* Tab 1: Sales Analytics */}
                <TabsContent value="sales" className="space-y-6 mt-0">
                    <SummaryCard context="sales-overview" locationId={getLocationId(selectedLocation)} />
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Sales Analytics Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${(previousMonthData.sales.reduce((sum, s) => sum + s.paymentValue, 0) / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Transactions</p>
                          <p className="text-2xl font-bold text-blue-700">{previousMonthData.sales.length}</p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Avg Transaction</p>
                          <p className="text-2xl font-bold text-purple-700">
                            ${previousMonthData.sales.length > 0 ? 
                              (previousMonthData.sales.reduce((sum, s) => sum + s.paymentValue, 0) / previousMonthData.sales.length).toFixed(0) : 
                              0}
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Unique Customers</p>
                          <p className="text-2xl font-bold text-orange-700">
                            {new Set(previousMonthData.sales.map(s => s.customerName)).size}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <ExecutiveChartsGrid data={previousMonthData} showTrends={true} />
                </TabsContent>

                {/* Tab 2: Client Retention */}
                <TabsContent value="clients" className="space-y-6 mt-0">
                    <SummaryCard context="client-retention-overview" locationId={getLocationId(selectedLocation)} />
                  <ClientConversionMetricCards 
                    data={previousMonthData.newClients}
                    historicalData={allDataLast3Months.newClients}
                  />
                  <ClientConversionEnhancedCharts 
                    data={previousMonthData.newClients}
                  />
                  <ClientConversionMonthOnMonthByTypeTable 
                    data={previousMonthData.newClients}
                  />
                  <ClientRetentionMonthByTypePivot 
                    data={previousMonthData.newClients}
                    visitsSummary={{}}
                    onRowClick={() => {}}
                  />
                </TabsContent>

                {/* Tab 3: Trainer Performance */}
                <TabsContent value="trainers" className="space-y-6 mt-0">
                  <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-purple-800 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Trainer Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Total Trainers</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {new Set(previousMonthData.payroll.map(p => p.teacherName)).size}
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Total Sessions</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {previousMonthData.payroll.reduce((sum, p) => sum + (p.totalSessions || 0), 0)}
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Total Paid</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${(previousMonthData.payroll.reduce((sum, p) => sum + (p.totalPaid || 0), 0) / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Avg per Trainer</p>
                          <p className="text-2xl font-bold text-orange-700">
                            ${new Set(previousMonthData.payroll.map(p => p.teacherName)).size > 0 ?
                              (previousMonthData.payroll.reduce((sum, p) => sum + (p.totalPaid || 0), 0) / 
                               new Set(previousMonthData.payroll.map(p => p.teacherName)).size / 1000).toFixed(0) :
                              0}K
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <ExecutiveTopPerformersGrid data={previousMonthData} />
                </TabsContent>

                {/* Tab 4: Class Attendance */}
                <TabsContent value="attendance" className="space-y-6 mt-0">
                    <SummaryCard context="class-attendance-overview" locationId={getLocationId(selectedLocation)} />
                  <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-orange-800 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Class Attendance Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Total Classes</p>
                          <p className="text-2xl font-bold text-orange-700">{previousMonthData.sessions.length}</p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Total Attendance</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {previousMonthData.sessions.reduce((sum, s) => sum + s.checkedInCount, 0)}
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Avg Attendance</p>
                          <p className="text-2xl font-bold text-green-700">
                            {previousMonthData.sessions.length > 0 ?
                              (previousMonthData.sessions.reduce((sum, s) => sum + s.checkedInCount, 0) / previousMonthData.sessions.length).toFixed(1) :
                              0}
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Fill Rate</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {previousMonthData.sessions.reduce((sum, s) => sum + s.capacity, 0) > 0 ?
                              ((previousMonthData.sessions.reduce((sum, s) => sum + s.checkedInCount, 0) / 
                                previousMonthData.sessions.reduce((sum, s) => sum + s.capacity, 0)) * 100).toFixed(1) :
                              0}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 5: Class Formats (PowerCycle vs Barre) */}
                <TabsContent value="formats" className="space-y-6 mt-0">
                    <SummaryCard context="class-formats-overview" locationId={getLocationId(selectedLocation)} />
                  <PowerCycleBarreStrengthComparison data={{
                    sessions: previousMonthData.sessions,
                    payroll: previousMonthData.payroll,
                    sales: previousMonthData.sales
                  }} />
                </TabsContent>

                {/* Tab 6: Discounts & Promotions */}
                <TabsContent value="discounts" className="space-y-6 mt-0">
                    <SummaryCard context="discounts-promotions-overview" locationId={getLocationId(selectedLocation)} />
                  <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200">
                    <CardHeader>
                      <CardTitle className="text-pink-800 flex items-center gap-2">
                        <Percent className="w-5 h-5" />
                        Discounts & Promotions Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Discounted Sales</p>
                          <p className="text-2xl font-bold text-pink-700">{previousMonthData.discounts.length}</p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Total Discount</p>
                          <p className="text-2xl font-bold text-red-700">
                            ${(previousMonthData.discounts.reduce((sum, d) => sum + d.discountAmount, 0) / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Avg Discount %</p>
                          <p className="text-2xl font-bold text-orange-700">
                            {previousMonthData.discounts.length > 0 ?
                              (previousMonthData.discounts.reduce((sum, d) => sum + d.discountPercentage, 0) / previousMonthData.discounts.length).toFixed(1) :
                              0}%
                          </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Revenue Impact</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${(previousMonthData.discounts.reduce((sum, d) => sum + d.paymentValue, 0) / 1000).toFixed(0)}K
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <ExecutiveDiscountsTab data={previousMonthData.discounts} selectedLocation={selectedLocation} />
                </TabsContent>

                {/* Tab 7: Sessions Overview */}
                <TabsContent value="sessions" className="space-y-6 mt-0">
                    <SummaryCard context="sessions-overview" locationId={getLocationId(selectedLocation)} />
                  <SessionsMetricCards data={previousMonthData.sessions} />
                  <SessionsAttendanceAnalytics data={previousMonthData.sessions} />
                  <SessionsGroupedTable data={previousMonthData.sessions} />
                </TabsContent>

                {/* Tab 8: Expirations */}
                <TabsContent value="expirations" className="space-y-6 mt-0">
                    <SummaryCard context="expiration-analytics-overview" locationId={getLocationId(selectedLocation)} />
                  <ExpirationMetricCards data={previousMonthData.expirations || []} />
                  <ExpirationChartsGrid data={previousMonthData.expirations || []} />
                  <ExpirationDataTables data={previousMonthData.expirations || []} />
                </TabsContent>

                {/* Tab 9: Late Cancellations */}
                <TabsContent value="cancellations" className="space-y-6 mt-0">
                    <SummaryCard context="late-cancellations-overview" locationId={getLocationId(selectedLocation)} />
                  <LateCancellationsMetricCards data={previousMonthData.lateCancellations || []} />
                  <LateCancellationsInteractiveCharts data={previousMonthData.lateCancellations || []} />
                  <EnhancedLateCancellationsDataTables data={previousMonthData.lateCancellations || []} />
                  <LateCancellationsMonthOnMonthTable data={previousMonthData.lateCancellations || []} />
                </TabsContent>

                {/* Tab 10: Leads & Funnel */}
                <TabsContent value="leads" className="space-y-6 mt-0">
                    <SummaryCard context="funnel-leads-overview" locationId={getLocationId(selectedLocation)} />
                  <ImprovedLeadMetricCards data={previousMonthData.leads} />
                  <LeadInteractiveChart 
                    data={previousMonthData.leads} 
                    title="Lead Trends" 
                    activeMetric="totalLeads" 
                  />
                  <ImprovedLeadTopLists data={previousMonthData.leads} />
                </TabsContent>

                {/* Tab 11: Patterns & Trends */}
                <TabsContent value="patterns" className="space-y-6 mt-0">
                    <SummaryCard 
                      context={`patterns-trends-${getLocationId(selectedLocation)}`} 
                      locationId={getLocationId(selectedLocation)} 
                    />
                  <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200">
                    <CardHeader>
                      <CardTitle className="text-violet-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Patterns & Trends Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ExecutiveChartsGrid data={previousMonthData} showTrends={true} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 12: All Tables Overview */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <EnhancedExecutiveDataTables data={previousMonthData} selectedLocation={selectedLocation} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Source Data Modal */}
        {showSourceData && (
          <SourceDataModal
            open={showSourceData}
            onOpenChange={setShowSourceData}
            sources={[
              {
                name: "Sales Data (Previous Month)",
                data: previousMonthData.sales
              },
              {
                name: "Sessions Data (Previous Month)",
                data: previousMonthData.sessions
              },
              {
                name: "New Clients Data (Previous Month)",
                data: previousMonthData.newClients
              },
              {
                name: "Leads Data (Previous Month)",
                data: previousMonthData.leads
              },
              {
                name: "Payroll Data (Previous Month)",
                data: previousMonthData.payroll
              },
              {
                name: "Discounts Data (Previous Month)",
                data: previousMonthData.discounts
              }
            ]}
          />
        )}
      </div>

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
        
        .delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
});

ComprehensiveExecutiveDashboard.displayName = 'ComprehensiveExecutiveDashboard';
