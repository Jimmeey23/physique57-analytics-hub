import { useMemo } from 'react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

export interface SalesMetric {
  title: string;
  value: string;
  rawValue: number;
  change: number;
  changeDetails: {
    rate: number;
    isSignificant: boolean;
    trend: 'strong' | 'moderate' | 'weak';
  };
  icon: string;
  color: string;
  description: string;
  previousValue: string;
  previousRawValue: number;
  comparison: {
    current: number;
    previous: number;
    difference: number;
  };
}

export const useSalesMetrics = (data: SalesData[]) => {
  const { filters } = useGlobalFilters();
  
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      console.log('No data available for sales metrics calculation');
      return [];
    }

    console.log('Calculating sales metrics for', data.length, 'records');
    
    // Use the filtered data directly - parent component handles filtering
    const currentPeriodData = data;
    
    // For comparison, split data into recent vs older periods (simple approach)
    const totalDataCount = data.length;
    const halfPoint = Math.floor(totalDataCount / 2);
    const recentData = currentPeriodData.slice(0, halfPoint);
    const olderData = currentPeriodData.slice(halfPoint);
    
    console.log('Current period:', currentPeriodData.length, 'Recent:', recentData.length, 'Older:', olderData.length);

    // Calculate current period metrics
    const currentRevenue = currentPeriodData.reduce((sum, item) => sum + (typeof item.paymentValue === 'number' ? item.paymentValue : 0), 0);
    const currentDiscount = currentPeriodData.reduce((sum, item) => sum + (typeof item.discountAmount === 'number' ? item.discountAmount : 0), 0);
    const currentVAT = currentPeriodData.reduce((sum, item) => sum + (typeof item.paymentVAT === 'number' ? item.paymentVAT : (typeof item.vat === 'number' ? item.vat : 0)), 0);
    const currentTransactions = currentPeriodData.length;
    const currentMembers = new Set(currentPeriodData.map(item => item.memberId || item.customerEmail).filter(Boolean)).size;
    const currentUnits = currentPeriodData.length; // Use transaction count as units since each transaction represents units sold
    const currentATV = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;
    const currentASV = currentMembers > 0 ? currentRevenue / currentMembers : 0;
    const currentDiscountPercentage = currentPeriodData.length > 0 ? 
      currentPeriodData.reduce((sum, item) => sum + (typeof item.discountPercentage === 'number' ? item.discountPercentage : 0), 0) / currentPeriodData.length : 0;

    // Calculate comparison period metrics (using recent data as comparison)
    const prevRevenue = recentData.reduce((sum, item) => sum + (typeof item.paymentValue === 'number' ? item.paymentValue : 0), 0);
    const prevDiscount = recentData.reduce((sum, item) => sum + (typeof item.discountAmount === 'number' ? item.discountAmount : 0), 0);
    const prevVAT = recentData.reduce((sum, item) => sum + (typeof item.paymentVAT === 'number' ? item.paymentVAT : (typeof item.vat === 'number' ? item.vat : 0)), 0);
    const prevTransactions = recentData.length;
    const prevMembers = new Set(recentData.map(item => item.memberId || item.customerEmail).filter(Boolean)).size;
    const prevUnits = recentData.length; // Use transaction count as units
    const prevATV = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;
    const prevASV = prevMembers > 0 ? prevRevenue / prevMembers : 0;
    const prevDiscountPercentage = recentData.length > 0 ? 
      recentData.reduce((sum, item) => sum + (typeof item.discountPercentage === 'number' ? item.discountPercentage : 0), 0) / recentData.length : 0;

    console.log('Current calculations:', {
      revenue: currentRevenue,
      transactions: currentTransactions,
      members: currentMembers,
      units: currentUnits,
      discount: currentDiscount,
      vat: currentVAT
    });

    console.log('Previous calculations:', {
      revenue: prevRevenue,
      transactions: prevTransactions,
      members: prevMembers,
      units: prevUnits,
      discount: prevDiscount,
      vat: prevVAT
    });

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number): { rate: number; isSignificant: boolean; trend: 'strong' | 'moderate' | 'weak' } => {
      if (previous === 0) return { rate: current > 0 ? 100 : 0, isSignificant: current > 0, trend: 'moderate' };
      const rate = ((current - previous) / previous) * 100;
      const isSignificant = Math.abs(rate) >= 5;
      const trend = Math.abs(rate) >= 20 ? 'strong' : Math.abs(rate) >= 10 ? 'moderate' : 'weak';
      return { rate, isSignificant, trend };
    };

    const revenueGrowth = calculateGrowth(currentRevenue, prevRevenue);
    const transactionGrowth = calculateGrowth(currentTransactions, prevTransactions);
    const memberGrowth = calculateGrowth(currentMembers, prevMembers);
    const unitsGrowth = calculateGrowth(currentUnits, prevUnits);
    const atvGrowth = calculateGrowth(currentATV, prevATV);
    const asvGrowth = calculateGrowth(currentASV, prevASV);
    const discountGrowth = calculateGrowth(currentDiscount, prevDiscount);
    const discountPercentageGrowth = calculateGrowth(currentDiscountPercentage, prevDiscountPercentage);
    const vatGrowth = calculateGrowth(currentVAT, prevVAT);

    const calculatedMetrics: SalesMetric[] = [
      {
        title: "Sales Revenue",
        value: formatCurrency(currentRevenue),
        rawValue: currentRevenue,
        change: revenueGrowth.rate,
        changeDetails: revenueGrowth,
        icon: "DollarSign",
        color: "blue",
        description: "Total sales revenue across all transactions",
        previousValue: formatCurrency(prevRevenue),
        previousRawValue: prevRevenue,
        comparison: {
          current: currentRevenue,
          previous: prevRevenue,
          difference: currentRevenue - prevRevenue
        }
      },
      {
        title: "Units Sold",
        value: formatNumber(currentUnits),
        rawValue: currentUnits,
        change: unitsGrowth.rate,
        changeDetails: unitsGrowth,
        icon: "ShoppingCart",
        color: "green",
        description: "Total number of units/items sold",
        previousValue: formatNumber(prevUnits),
        previousRawValue: prevUnits,
        comparison: {
          current: currentUnits,
          previous: prevUnits,
          difference: currentUnits - prevUnits
        }
      },
      {
        title: "Transactions",
        value: formatNumber(currentTransactions),
        rawValue: currentTransactions,
        change: transactionGrowth.rate,
        changeDetails: transactionGrowth,
        icon: "Activity",
        color: "purple",
        description: "Number of completed transactions",
        previousValue: formatNumber(prevTransactions),
        previousRawValue: prevTransactions,
        comparison: {
          current: currentTransactions,
          previous: prevTransactions,
          difference: currentTransactions - prevTransactions
        }
      },
      {
        title: "Unique Members",
        value: formatNumber(currentMembers),
        rawValue: currentMembers,
        change: memberGrowth.rate,
        changeDetails: memberGrowth,
        icon: "Users",
        color: "orange",
        description: "Individual customers who made purchases",
        previousValue: formatNumber(prevMembers),
        previousRawValue: prevMembers,
        comparison: {
          current: currentMembers,
          previous: prevMembers,
          difference: currentMembers - prevMembers
        }
      },
      {
        title: "Avg Transaction Value",
        value: formatCurrency(currentATV),
        rawValue: currentATV,
        change: atvGrowth.rate,
        changeDetails: atvGrowth,
        icon: "Target",
        color: "cyan",
        description: "Average value per transaction",
        previousValue: formatCurrency(prevATV),
        previousRawValue: prevATV,
        comparison: {
          current: currentATV,
          previous: prevATV,
          difference: currentATV - prevATV
        }
      },
      {
        title: "Avg Spend per Member",
        value: formatCurrency(currentASV),
        rawValue: currentASV,
        change: asvGrowth.rate,
        changeDetails: asvGrowth,
        icon: "Calendar",
        color: "pink",
        description: "Average spending per unique customer",
        previousValue: formatCurrency(prevASV),
        previousRawValue: prevASV,
        comparison: {
          current: currentASV,
          previous: prevASV,
          difference: currentASV - prevASV
        }
      },
      {
        title: "Discount Value",
        value: formatCurrency(currentDiscount),
        rawValue: currentDiscount,
        change: discountGrowth.rate,
        changeDetails: discountGrowth,
        icon: "CreditCard",
        color: "red",
        description: "Total discount amount applied",
        previousValue: formatCurrency(prevDiscount),
        previousRawValue: prevDiscount,
        comparison: {
          current: currentDiscount,
          previous: prevDiscount,
          difference: currentDiscount - prevDiscount
        }
      },
      {
        title: "Discount Percentage",
        value: formatPercentage(currentDiscountPercentage / 100),
        rawValue: currentDiscountPercentage,
        change: discountPercentageGrowth.rate,
        changeDetails: discountPercentageGrowth,
        icon: "ArrowDownRight",
        color: "amber",
        description: "Average discount rate applied",
        previousValue: formatPercentage(prevDiscountPercentage / 100),
        previousRawValue: prevDiscountPercentage,
        comparison: {
          current: currentDiscountPercentage,
          previous: prevDiscountPercentage,
          difference: currentDiscountPercentage - prevDiscountPercentage
        }
      },
      {
        title: "VAT Amount",
        value: formatCurrency(currentVAT),
        rawValue: currentVAT,
        change: vatGrowth.rate,
        changeDetails: vatGrowth,
        icon: "Receipt",
        color: "green",
        description: "Total VAT collected from sales",
        previousValue: formatCurrency(prevVAT),
        previousRawValue: prevVAT,
        comparison: {
          current: currentVAT,
          previous: prevVAT,
          difference: currentVAT - prevVAT
        }
      }
    ];

    console.log('Final calculated sales metrics:', calculatedMetrics.map(m => ({ title: m.title, value: m.value, change: m.change })));

    return calculatedMetrics;
  }, [data, filters.dateRange]);

  return { metrics };
};