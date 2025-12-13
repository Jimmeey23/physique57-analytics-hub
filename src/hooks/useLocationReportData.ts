import { useMemo, useCallback } from 'react';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useClientConversionMetrics } from '@/hooks/useClientConversionMetrics';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { useGeminiAnalysis } from '@/hooks/useGeminiAnalysis';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { parseDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

export interface LocationReportMetrics {
  // Revenue & Sales Performance
  totalRevenue: number;
  netRevenue: number;
  vatAmount: number;
  totalTransactions: number;
  uniqueMembers: number;
  avgTransactionValue: number;
  avgSpendPerMember: number;
  revenueGrowth: number;
  totalDiscounts: number;
  discountRate: number;

  // Session & Class Performance
  totalSessions: number;
  totalCheckIns: number;
  fillRate: number;
  capacityUtilization: number;
  powerCycleSessions: number;
  barreSessions: number;
  strengthSessions: number;
  lateCancellations: number;
  lateCancellationRevenueLoss: number;

  // Trainer Performance
  totalTrainers: number;
  sessionsPerTrainer: number;
  avgClassSize: number;
  revenuePerTrainer: number;
  topTrainerName: string;
  topTrainerRevenue: number;

  // Client Acquisition & Retention
  newClientsAcquired: number;
  conversionRate: number;
  retentionRate: number;
  averageLTV: number;
  churnRate: number;
  churnedMembers: number;

  // Lead Funnel
  totalLeads: number;
  leadsConverted: number;
  leadConversionRate: number;
  avgConversionDays: number;
  leadsBySource: { [key: string]: number };

  // Performance Indicators
  sessionUtilization: number;
  overallScore: number;
}

export interface LocationReportData {
  reportPeriod: {
    startDate: string;
    endDate: string;
    monthName: string;
  };
  location: string;
  metrics: LocationReportMetrics;
  insights: {
    highlights: string[];
    concerns: string[];
    recommendations: string[];
  };
  comparisons: {
    monthOverMonth: { [key: string]: number };
    yearOverYear: { [key: string]: number };
  };
}

export const useLocationReportData = () => {
  const { activeLocations } = useGlobalFilters(); // Only get location, ignore date filters
  const { generateQuickInsights } = useGeminiAnalysis();
  
  // Calculate previous month date range (independent of global filters)
  const previousMonthRange = useMemo(() => {
    const now = new Date();
    // Use last 3 months instead of just previous month to ensure data availability
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
      startDate: threeMonthsAgo.toISOString().split('T')[0],
      endDate: lastDayPreviousMonth.toISOString().split('T')[0]
    };
  }, []);
  
  console.log('Location Report Date Range (Last 3 Months):', previousMonthRange);
  
  // Fetch all required data
  const { data: salesData = [], loading: salesLoading } = useSalesData();
  const { data: sessionsData = [], loading: sessionsLoading } = useSessionsData();
  const { data: payrollData = [], isLoading: payrollLoading } = usePayrollData();
  const { data: newClientData = [], loading: clientsLoading } = useNewClientData();
  const { data: leadsData = [], loading: leadsLoading } = useLeadsData();
  const { data: discountData = [] } = useDiscountAnalysis();
  const { data: lateCancellationsData = [], loading: lateCancellationsLoading } = useLateCancellationsData();
  const { data: expirationsData = [], loading: expirationsLoading } = useExpirationsData();

  // Log raw data availability
  console.log('Raw Data Availability:', {
    salesData: salesData.length,
    sessionsData: sessionsData.length,
    payrollData: payrollData.length,
    newClientData: newClientData.length,
    leadsData: leadsData.length,
    discountData: discountData.length,
    lateCancellationsData: lateCancellationsData.length,
    expirationsData: expirationsData.length,
    isStillLoading: {
      sales: salesLoading,
      sessions: sessionsLoading,
      payroll: payrollLoading,
      clients: clientsLoading,
      leads: leadsLoading,
      lateCancellations: lateCancellationsLoading,
      expirations: expirationsLoading
    }
  });

  // Check if any data is still loading
  const isLoading = salesLoading || sessionsLoading || payrollLoading || 
                    clientsLoading || leadsLoading || 
                    lateCancellationsLoading || expirationsLoading;

  // Get the primary location for filtering
  const primaryLocation = activeLocations[0] || 'All Locations';

  // Filter data by location and date range
  const filteredData = useMemo(() => {
    // If no date range is set, use all available data
    // This ensures the report can still display even without explicit filters

    const filterByLocation = (item: any) => {
      // Temporarily make location filtering more lenient
      if (!primaryLocation || primaryLocation === 'All Locations' || activeLocations.length === 0) {
        return true;
      }
      
      const itemLocation = (item.location || item.calculatedLocation || item.studio || '').toLowerCase();
      const targetLocation = primaryLocation.toLowerCase();
      
      // More flexible matching - if location contains any key terms
      if (targetLocation.includes('kwality') || targetLocation.includes('kemps')) {
        return itemLocation.includes('kwality') || itemLocation.includes('kemps');
      }
      if (targetLocation.includes('supreme') || targetLocation.includes('bandra')) {
        return itemLocation.includes('supreme') || itemLocation.includes('bandra');
      }
      if (targetLocation.includes('kenkere') || targetLocation.includes('bengaluru')) {
        return itemLocation.includes('kenkere') || itemLocation.includes('bengaluru') || itemLocation.includes('bangalore');
      }
      
      // If no specific location match, include the item (less strict)
      return true;
    };

    const filterByDateRange = (item: any) => {
      // Always use previous month range, ignore global date filters
      if (!item.date && !item.timestamp && !item.createdAt) return true;
      
      const itemDate = parseDate(item.date || item.timestamp || item.createdAt);
      if (!itemDate) return true;
      
      const start = parseDate(previousMonthRange.startDate);
      const end = parseDate(previousMonthRange.endDate);
      
      return itemDate >= start && itemDate <= end;
    };

    const filteredSales = salesData.filter(item => filterByLocation(item) && filterByDateRange(item));
    const filteredSessions = sessionsData.filter(item => filterByLocation(item) && filterByDateRange(item));
    const filteredPayroll = payrollData.filter(item => filterByLocation(item) && filterByDateRange(item));
    const filteredNewClients = newClientData.filter(item => filterByLocation(item) && filterByDateRange(item));
    const filteredLeads = leadsData.filter(item => filterByLocation(item) && filterByDateRange(item));
    const filteredDiscounts = discountData.filter(item => filterByLocation(item) && filterByDateRange(item));
    const filteredLateCancellations = lateCancellationsData.filter(item => filterByLocation(item) && filterByDateRange(item));
    const filteredExpirations = expirationsData.filter(item => filterByLocation(item) && filterByDateRange(item));

    // Debug logging with sample data
    console.log('Location Report Debug Info:', {
      dateRange: previousMonthRange,
      primaryLocation,
      totalRawData: {
        sales: salesData.length,
        sessions: sessionsData.length,
        payroll: payrollData.length,
        newClients: newClientData.length,
        leads: leadsData.length
      },
      sampleSalesData: salesData.slice(0, 3).map(s => ({
        date: s.date || s.timestamp || s.createdAt,
        location: s.location || s.calculatedLocation || s.studio,
        amount: s.totalPaid
      })),
      sampleSessionsData: sessionsData.slice(0, 3).map(s => ({
        date: s.date || s.timestamp || s.createdAt,
        location: s.location || s.calculatedLocation || s.studio,
        sessionName: s.sessionName
      }))
    });
    
    console.log('Filtered Data Counts (Last 3 Months):', {
      sales: filteredSales.length,
      sessions: filteredSessions.length,
      payroll: filteredPayroll.length,
      newClients: filteredNewClients.length,
      leads: filteredLeads.length,
      discounts: filteredDiscounts.length,
      lateCancellations: filteredLateCancellations.length,
      expirations: filteredExpirations.length,
      primaryLocation,
      fixedDateRange: previousMonthRange
    });

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
  }, [
    salesData, sessionsData, payrollData, newClientData, leadsData, 
    discountData, lateCancellationsData, expirationsData,
    primaryLocation, previousMonthRange, activeLocations
  ]);

  // Generate AI insights based on metrics
  const generateAIInsights = useCallback(async (metrics: LocationReportMetrics) => {
    if (!metrics) return null;
    
    try {
      // Prepare data summary for AI analysis
      const reportData = [
        {
          metric: 'Total Revenue',
          value: metrics.totalRevenue,
          formatted: formatCurrency(metrics.totalRevenue),
          category: 'revenue'
        },
        {
          metric: 'Fill Rate',
          value: metrics.fillRate,
          formatted: formatPercentage(metrics.fillRate),
          category: 'sessions'
        },
        {
          metric: 'Retention Rate',
          value: metrics.retentionRate,
          formatted: formatPercentage(metrics.retentionRate),
          category: 'retention'
        },
        {
          metric: 'Conversion Rate',
          value: metrics.conversionRate,
          formatted: formatPercentage(metrics.conversionRate),
          category: 'leads'
        },
        {
          metric: 'New Clients',
          value: metrics.newClientsAcquired,
          formatted: formatNumber(metrics.newClientsAcquired),
          category: 'growth'
        },
        {
          metric: 'Churn Rate',
          value: metrics.churnRate,
          formatted: formatPercentage(metrics.churnRate),
          category: 'retention'
        },
        {
          metric: 'Avg Transaction Value',
          value: metrics.avgTransactionValue,
          formatted: formatCurrency(metrics.avgTransactionValue),
          category: 'revenue'
        },
        {
          metric: 'Discount Rate',
          value: metrics.discountRate,
          formatted: formatPercentage(metrics.discountRate),
          category: 'revenue'
        }
      ];

      const columns = [
        { header: 'Metric', key: 'metric', type: 'text' },
        { header: 'Value', key: 'value', type: 'number' },
        { header: 'Formatted', key: 'formatted', type: 'text' },
        { header: 'Category', key: 'category', type: 'text' }
      ];

      const result = await generateQuickInsights(
        reportData, 
        columns, 
        `${primaryLocation} Location Performance Report`
      );

      return {
        highlights: result.keyInsights?.slice(0, 3) || [],
        concerns: result.trends?.filter(trend => 
          trend.toLowerCase().includes('concern') || 
          trend.toLowerCase().includes('low') || 
          trend.toLowerCase().includes('decline')
        ) || [],
        recommendations: result.recommendations?.slice(0, 3) || []
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return null;
    }
  }, [generateQuickInsights, primaryLocation]);

  // Calculate metrics
  const metrics = useMemo((): LocationReportMetrics | null => {
    // Always return metrics even if filteredData is empty
    // This ensures the report can display with zero values
    if (!filteredData) {
      // Return empty metrics structure
      return {
        totalRevenue: 0,
        netRevenue: 0,
        vatAmount: 0,
        totalTransactions: 0,
        uniqueMembers: 0,
        avgTransactionValue: 0,
        avgSpendPerMember: 0,
        revenueGrowth: 0,
        totalDiscounts: 0,
        discountRate: 0,
        totalSessions: 0,
        totalCheckIns: 0,
        fillRate: 0,
        capacityUtilization: 0,
        powerCycleSessions: 0,
        barreSessions: 0,
        strengthSessions: 0,
        lateCancellations: 0,
        lateCancellationRevenueLoss: 0,
        totalTrainers: 0,
        sessionsPerTrainer: 0,
        avgClassSize: 0,
        revenuePerTrainer: 0,
        topTrainerName: 'N/A',
        topTrainerRevenue: 0,
        newClientsAcquired: 0,
        conversionRate: 0,
        retentionRate: 0,
        averageLTV: 0,
        churnRate: 0,
        churnedMembers: 0,
        totalLeads: 0,
        leadsConverted: 0,
        leadConversionRate: 0,
        avgConversionDays: 0,
        leadsBySource: {},
        sessionUtilization: 0,
        overallScore: 0
      };
    }

    const { sales, sessions, payroll, newClients, leads, discounts, lateCancellations, expirations } = filteredData;

    // Revenue & Sales Performance
    const totalRevenue = sales.reduce((sum, item) => sum + (parseFloat(item.totalPaid) || 0), 0);
    const vatAmount = sales.reduce((sum, item) => sum + (parseFloat(item.vatAmount) || 0), 0);
    const netRevenue = totalRevenue - vatAmount;
    const totalTransactions = sales.length;
    const uniqueMembers = new Set(sales.map(item => item.memberId || item.customerId)).size;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const avgSpendPerMember = uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
    const totalDiscounts = discounts.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0), 0);
    const discountRate = totalRevenue > 0 ? (totalDiscounts / totalRevenue) * 100 : 0;

    // Session & Class Performance
    const totalSessions = sessions.length;
    const totalCheckIns = sessions.reduce((sum, item) => sum + (parseInt(item.checkedInCount) || 0), 0);
    const totalCapacity = sessions.reduce((sum, item) => sum + (parseInt(item.capacity) || 0), 0);
    const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
    const capacityUtilization = fillRate;
    
    // Class type breakdown
    const powerCycleSessions = sessions.filter(item => 
      item.sessionName?.toLowerCase().includes('powercycle') || 
      item.classType?.toLowerCase().includes('powercycle')
    ).length;
    const barreSessions = sessions.filter(item => 
      item.sessionName?.toLowerCase().includes('barre') || 
      item.classType?.toLowerCase().includes('barre')
    ).length;
    const strengthSessions = sessions.filter(item => 
      item.sessionName?.toLowerCase().includes('strength') || 
      item.classType?.toLowerCase().includes('strength')
    ).length;

    const lateCancellationCount = lateCancellations.length;
    const lateCancellationRevenueLoss = lateCancellations.reduce((sum, item) => 
      sum + (parseFloat(item.revenueImpact) || 0), 0
    );

    // Trainer Performance
    const trainerStats = payroll.reduce((acc, item) => {
      const trainerId = item.trainerId || item.trainerName;
      if (!trainerId) return acc;
      
      if (!acc[trainerId]) {
        acc[trainerId] = {
          name: item.trainerName || trainerId,
          sessions: 0,
          revenue: 0,
          customersServed: 0
        };
      }
      
      acc[trainerId].sessions += 1;
      acc[trainerId].revenue += parseFloat(item.revenueGenerated) || 0;
      acc[trainerId].customersServed += parseInt(item.customersServed) || 0;
      
      return acc;
    }, {} as Record<string, any>);

    const trainerArray = Object.values(trainerStats);
    const totalTrainers = trainerArray.length;
    const sessionsPerTrainer = totalTrainers > 0 ? totalSessions / totalTrainers : 0;
    const avgClassSize = totalSessions > 0 ? totalCheckIns / totalSessions : 0;
    const revenuePerTrainer = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;
    
    const topTrainer = trainerArray.reduce((top, trainer) => 
      trainer.revenue > (top?.revenue || 0) ? trainer : top, null
    );

    // Client Acquisition & Retention
    const newClientsAcquired = newClients.length;
    const trialClients = leads.filter(item => item.status?.toLowerCase().includes('trial')).length;
    const convertedClients = leads.filter(item => item.status?.toLowerCase().includes('converted')).length;
    const conversionRate = trialClients > 0 ? (convertedClients / trialClients) * 100 : 0;
    
    const averageLTV = newClients.reduce((sum, item) => 
      sum + (parseFloat(item.estimatedLTV) || 0), 0
    ) / (newClients.length || 1);
    
    const churnedMembers = expirations.length;
    const activeMembers = uniqueMembers - churnedMembers;
    const churnRate = uniqueMembers > 0 ? (churnedMembers / uniqueMembers) * 100 : 0;
    const retentionRate = 100 - churnRate;

    // Lead Funnel
    const totalLeads = leads.length;
    const leadsConverted = convertedClients;
    const leadConversionRate = totalLeads > 0 ? (leadsConverted / totalLeads) * 100 : 0;
    
    // Calculate average conversion days
    const conversionTimes = leads.filter(lead => 
      lead.convertedDate && lead.createdAt
    ).map(lead => {
      const created = parseDate(lead.createdAt);
      const converted = parseDate(lead.convertedDate);
      return created && converted ? Math.abs(converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) : 0;
    });
    const avgConversionDays = conversionTimes.length > 0 ? 
      conversionTimes.reduce((sum, days) => sum + days, 0) / conversionTimes.length : 0;

    // Lead sources breakdown
    const leadsBySource = leads.reduce((acc, lead) => {
      const source = lead.source || lead.leadSource || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      netRevenue,
      vatAmount,
      totalTransactions,
      uniqueMembers,
      avgTransactionValue,
      avgSpendPerMember,
      revenueGrowth: 0, // TODO: Calculate from historical data
      totalDiscounts,
      discountRate,
      totalSessions,
      totalCheckIns,
      fillRate,
      capacityUtilization,
      powerCycleSessions,
      barreSessions,
      strengthSessions,
      lateCancellations: lateCancellationCount,
      lateCancellationRevenueLoss,
      totalTrainers,
      sessionsPerTrainer,
      avgClassSize,
      revenuePerTrainer,
      topTrainerName: topTrainer?.name || 'N/A',
      topTrainerRevenue: topTrainer?.revenue || 0,
      newClientsAcquired,
      conversionRate,
      retentionRate,
      averageLTV,
      churnRate,
      churnedMembers,
      totalLeads,
      leadsConverted,
      leadConversionRate,
      avgConversionDays,
      leadsBySource,
      sessionUtilization: capacityUtilization,
      overallScore: 0 // Will be calculated based on various factors
    };
  }, [filteredData]);

  // Calculate overall performance score
  const calculatedMetrics = useMemo(() => {
    if (!metrics) return null;
    
    // Calculate overall score based on key performance indicators
    let score = 0;
    
    // Revenue performance (25 points)
    if (metrics.revenueGrowth > 10) score += 25;
    else if (metrics.revenueGrowth > 5) score += 20;
    else if (metrics.revenueGrowth > 0) score += 15;
    else if (metrics.revenueGrowth > -5) score += 10;
    
    // Session utilization (25 points)
    if (metrics.fillRate > 80) score += 25;
    else if (metrics.fillRate > 70) score += 20;
    else if (metrics.fillRate > 60) score += 15;
    else if (metrics.fillRate > 50) score += 10;
    
    // Retention (25 points)
    if (metrics.retentionRate > 90) score += 25;
    else if (metrics.retentionRate > 80) score += 20;
    else if (metrics.retentionRate > 70) score += 15;
    else if (metrics.retentionRate > 60) score += 10;
    
    // Conversion (25 points)
    if (metrics.conversionRate > 25) score += 25;
    else if (metrics.conversionRate > 20) score += 20;
    else if (metrics.conversionRate > 15) score += 15;
    else if (metrics.conversionRate > 10) score += 10;
    
    return {
      ...metrics,
      overallScore: score
    };
  }, [metrics]);

  // Create report data structure
  const data = useMemo((): LocationReportData | null => {
    if (!calculatedMetrics) return null;

    const reportPeriod = {
      startDate: previousMonthRange.startDate,
      endDate: previousMonthRange.endDate,
      monthName: new Date(previousMonthRange.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    // Generate basic insights (will be enhanced with AI later)
    const basicInsights = {
      highlights: [
        `Generated ${formatCurrency(calculatedMetrics.totalRevenue)} in total revenue`,
        `Achieved ${formatPercentage(calculatedMetrics.fillRate)}% class fill rate`,
        `Acquired ${calculatedMetrics.newClientsAcquired} new clients`
      ].filter(Boolean),
      concerns: [
        calculatedMetrics.churnRate > 20 ? `High churn rate of ${formatPercentage(calculatedMetrics.churnRate)}%` : null,
        calculatedMetrics.fillRate < 60 ? `Low class utilization at ${formatPercentage(calculatedMetrics.fillRate)}%` : null,
        calculatedMetrics.conversionRate < 15 ? `Low conversion rate of ${formatPercentage(calculatedMetrics.conversionRate)}%` : null
      ].filter(Boolean),
      recommendations: [
        calculatedMetrics.fillRate < 70 ? 'Consider optimizing class schedules and capacity' : null,
        calculatedMetrics.churnRate > 15 ? 'Implement retention strategies and member engagement programs' : null,
        calculatedMetrics.discountRate > 15 ? 'Review discount strategy to optimize profitability' : null
      ].filter(Boolean)
    };

    return {
      reportPeriod,
      location: primaryLocation,
      metrics: calculatedMetrics,
      insights: basicInsights, // This will be enhanced with AI insights in real-time
      comparisons: {
        monthOverMonth: {}, // TODO: Calculate from historical data
        yearOverYear: {}     // TODO: Calculate from historical data
      }
    };
  }, [calculatedMetrics, primaryLocation, previousMonthRange]);

  // Function to enhance insights with AI
  const enhanceWithAI = useCallback(async () => {
    if (!data || !calculatedMetrics) return data;

    const aiInsights = await generateAIInsights(calculatedMetrics);
    if (aiInsights) {
      return {
        ...data,
        insights: {
          highlights: aiInsights.highlights.length > 0 ? aiInsights.highlights : data.insights.highlights,
          concerns: aiInsights.concerns.length > 0 ? aiInsights.concerns : data.insights.concerns,
          recommendations: aiInsights.recommendations.length > 0 ? aiInsights.recommendations : data.insights.recommendations
        }
      };
    }
    return data;
  }, [data, calculatedMetrics, generateAIInsights]);

  return {
    data,
    metrics: calculatedMetrics,
    isLoading,
    primaryLocation,
    enhanceWithAI
  };
};