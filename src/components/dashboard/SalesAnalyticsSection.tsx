import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building2, Landmark, Building } from 'lucide-react';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { MetricCard } from './MetricCard';
import { UnifiedTopBottomSellers } from './UnifiedTopBottomSellers';
import { DataTable } from './DataTable';
import { InteractiveChart } from './InteractiveChart';
import { ThemeSelector } from './ThemeSelector';
import { EnhancedSalesDrillDownModal } from './EnhancedSalesDrillDownModal';
import { getActiveTabClasses } from '@/utils/colorThemes';
import { EnhancedYearOnYearTableNew } from './EnhancedYearOnYearTableNew';
import { MonthOnMonthTableNew } from './MonthOnMonthTableNew';
import { ProductPerformanceTableNew } from './ProductPerformanceTableNew';
import { CategoryPerformanceTableNew } from './CategoryPerformanceTableNew';
import { SalesAnimatedMetricCards } from './SalesAnimatedMetricCards';
import { SalesInteractiveCharts } from './SalesInteractiveCharts';
import { SoldByMonthOnMonthTableNew } from './SoldByMonthOnMonthTableNew';
import { PaymentMethodMonthOnMonthTableNew } from './PaymentMethodMonthOnMonthTableNew';
import { SalesHeroSection } from './SalesHeroSection';
import QuickSections from '@/components/ui/QuickSections';
import SectionTimelineNav from '@/components/ui/SectionTimelineNav';
import SectionAnchor from '@/components/ui/SectionAnchor';
import { useSectionNavigation } from '@/contexts/SectionNavigationContext';
import { ModernSalesTable } from './ModernSalesTable';
import { SalesData, FilterOptions, MetricCardData, YearOnYearMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage, formatDiscount } from '@/utils/formatters';
import { getPreviousMonthDateRange } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { ComprehensiveSalesExportButton } from './ComprehensiveSalesExportButton';
import { AiNotes } from '@/components/ui/AiNotes';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { CustomerBehaviorMonthOnMonthTable } from './CustomerBehaviorMonthOnMonthTable';

interface SalesAnalyticsSectionProps {
  data: SalesData[];
  onReady?: () => void;
}

const locations = [{
  id: 'all',
  name: 'All Locations, ',
  fullName: 'All Studio Locations'
}, {
  id: 'kwality',
  name: 'Kwality House, Kemps Corner',
  fullName: 'Kwality House, Kemps Corner'
}, {
  id: 'supreme',
  name: 'Supreme HQ, Bandra',
  fullName: 'Supreme HQ, Bandra'
}, {
  id: 'kenkere',
  name: 'Kenkere House, Bengaluru',
  fullName: 'Kenkere House, Bengaluru'
}];

export const SalesAnalyticsSection: React.FC<SalesAnalyticsSectionProps> = ({ data, onReady }) => {
  const { filters: globalFilters } = useGlobalFilters();
  const periodId = globalFilters?.dateRange
    ? `${globalFilters.dateRange.start}:${globalFilters.dateRange.end}`
    : 'all-time';
  const [activeLocation, setActiveLocation] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [drillDownType, setDrillDownType] = useState<'metric' | 'product' | 'category' | 'member' | 'soldBy' | 'paymentMethod'>('metric');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeYoyMetric, setActiveYoyMetric] = useState<YearOnYearMetricType>('revenue');

  // Debug CSS variables
  React.useEffect(() => {
    const root = document.documentElement;
    const heroAccent = root.style.getPropertyValue('--hero-accent') || getComputedStyle(root).getPropertyValue('--hero-accent');
    console.log('Sales Section: Current --hero-accent:', heroAccent);
    console.log('Sales Section: Active location:', activeLocation);
  }, [activeLocation]);
  const [isReady, setIsReady] = useState(false);
  const markReady = React.useCallback(() => setIsReady(true), []);
  const { addSection, removeSection } = useSectionNavigation();

  React.useEffect(() => {
    if (isReady) {
      onReady?.();
    }
  }, [isReady, onReady]);

  // Initialize filters with previous month as default
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const previousMonth = getPreviousMonthDateRange();
    
    return {
      dateRange: previousMonth,
      location: [],
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: []
    };
  });

  const applyFilters = (rawData: SalesData[], includeHistoric: boolean = false) => {
    console.log('Applying filters to', rawData.length, 'records. IncludeHistoric:', includeHistoric);
    console.log('Current filters:', filters);
    console.log('Active location:', activeLocation);
    
    let filtered = [...rawData];

    // Apply location filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const locationMatch = activeLocation === 'kwality' 
          ? item.calculatedLocation === 'Kwality House, Kemps Corner' 
          : activeLocation === 'supreme' 
          ? item.calculatedLocation === 'Supreme HQ, Bandra' 
          : item.calculatedLocation?.includes('Kenkere') || item.calculatedLocation === 'Kenkere House';
        return locationMatch;
      });
    }

    console.log('After location filter:', filtered.length, 'records');

    // Apply date range filter
    if (!includeHistoric && (filters.dateRange.start || filters.dateRange.end)) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? (() => {
        const date = new Date(filters.dateRange.end);
        // Set to end of day to include all transactions on the end date
        date.setHours(23, 59, 59, 999);
        return date;
      })() : null;
      
      console.log('Applying date filter:', startDate, 'to', endDate);
      
      filtered = filtered.filter(item => {
        if (!item.paymentDate) return false;

        let itemDate: Date | null = null;

        // Try DD/MM/YYYY format first
        const ddmmyyyy = item.paymentDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy;
          itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Try other formats
          const formats = [
            new Date(item.paymentDate), 
            new Date(item.paymentDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')), 
            new Date(item.paymentDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'))
          ];
          
          for (const date of formats) {
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
              itemDate = date;
              break;
            }
          }
        }

        if (!itemDate || isNaN(itemDate.getTime())) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
      
      console.log('After date filter:', filtered.length, 'records');
    }

    // Apply category filter
    if (filters.category?.length) {
      filtered = filtered.filter(item => 
        filters.category!.some(cat => 
          item.cleanedCategory?.toLowerCase().includes(cat.toLowerCase())
        )
      );
      console.log('After category filter:', filtered.length, 'records');
    }

    // Apply payment method filter
    if (filters.paymentMethod?.length) {
      filtered = filtered.filter(item => 
        filters.paymentMethod!.some(method => 
          item.paymentMethod?.toLowerCase().includes(method.toLowerCase())
        )
      );
      console.log('After payment method filter:', filtered.length, 'records');
    }

    // Apply sold by filter
    if (filters.soldBy?.length) {
      filtered = filtered.filter(item => 
        filters.soldBy!.some(seller => 
          item.soldBy?.toLowerCase().includes(seller.toLowerCase())
        )
      );
      console.log('After sold by filter:', filtered.length, 'records');
    }

    // Apply amount range filters
    if (filters.minAmount) {
      filtered = filtered.filter(item => (item.paymentValue || 0) >= filters.minAmount!);
      console.log('After min amount filter:', filtered.length, 'records');
    }
    
    if (filters.maxAmount) {
      filtered = filtered.filter(item => (item.paymentValue || 0) <= filters.maxAmount!);
      console.log('After max amount filter:', filtered.length, 'records');
    }

    console.log('Final filtered data:', filtered.length, 'records');
    return filtered;
  };

  const filteredData = useMemo(() => applyFilters(data), [data, filters, activeLocation]);
  const allHistoricData = useMemo(() => applyFilters(data, true), [data, activeLocation]);
  // Location-only historical dataset for MoM metrics (ignore non-date filters to reflect total sales at location)
  const metricsHistoricData = useMemo(() => {
    let filtered = [...data];
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const loc = (item.calculatedLocation || '').toString().toLowerCase();
        if (activeLocation === 'kwality') return loc.includes('kwality');
        if (activeLocation === 'supreme') return loc.includes('supreme');
        // kenkere
        return loc.includes('kenkere') || loc.includes('bengaluru');
      });
    }
    return filtered;
  }, [data, activeLocation]);

  const handleRowClick = (rowData: any) => {
    console.log('Row clicked with data:', rowData);
    console.log('Available properties in rowData:', Object.keys(rowData));
    
    // Use RAW DATA for drill-down to be independent of current filters
    // Only apply location filtering to maintain context
    let baseData = data;
    console.log(`🔍 DRILL-DOWN: Starting with ${data.length} total records (RAW DATA)`);
    console.log(`📊 COMPARISON: Current filtered view has ${filteredData.length} records`);
    
    if (activeLocation !== 'all') {
      baseData = data.filter(item => {
        const locationMatch = activeLocation === 'kwality' 
          ? item.calculatedLocation === 'Kwality House, Kemps Corner' 
          : activeLocation === 'supreme' 
          ? item.calculatedLocation === 'Supreme HQ, Bandra' 
          : item.calculatedLocation?.includes('Kenkere') || item.calculatedLocation === 'Kenkere House';
        return locationMatch;
      });
      console.log(`📍 LOCATION FILTER: Reduced to ${baseData.length} records for location: ${activeLocation}`);
    }
    
    let specificFilteredData = baseData;
    let drillDownTypeToSet: 'metric' | 'product' | 'category' | 'member' | 'soldBy' | 'paymentMethod' = 'product';
    
    // Handle the new contextual filtering system - filter from ALL DATA, not current filtered view
    if (rowData.filterCriteria && rowData.drillDownContext) {
      console.log('Using enhanced contextual filtering on raw data:', rowData.drillDownContext);
      const criteria = rowData.filterCriteria;
      
      // Check MORE SPECIFIC conditions first (combinations) before general conditions
      if (criteria.month && criteria.product) {
        // Month-specific product filtering - match YYYY-MM format from ALL DATA
        console.log('🎯 CELL-SPECIFIC FILTERING:', {
          month: criteria.month,
          product: criteria.product,
          baseDataCount: baseData.length
        });
        
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const productMatches = (
            item.cleanedProduct?.toLowerCase() === criteria.product?.toLowerCase() ||
            item.paymentItem?.toLowerCase() === criteria.product?.toLowerCase() ||
            // Removed membershipName which does not exist on SalesData
            item.paymentItem?.toLowerCase().includes(criteria.product?.toLowerCase() || '')
          );
          
          const monthMatches = itemKey === criteria.month;
          
          if (productMatches && monthMatches) {
            console.log('✅ EXACT MATCH FOUND:', {
              product: item.cleanedProduct || item.paymentItem,
              date: item.paymentDate,
              itemKey,
              criteriaMonth: criteria.month,
              paymentValue: item.paymentValue
            });
          }
          
          return productMatches && monthMatches;
        });
        
        console.log(`🎯 FINAL CELL-SPECIFIC RESULT: Found ${specificFilteredData.length} transactions for ${criteria.product} in ${criteria.month}`);
        if (specificFilteredData.length > 0) {
          const totalRevenue = specificFilteredData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
          console.log(`💰 CELL REVENUE: ${totalRevenue} (should NOT be 13.4L if filtering correctly)`);
        }
        drillDownTypeToSet = 'product';
        console.log(`Context-filtered by product + month: ${criteria.product} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month && criteria.category) {
        // Month-specific category filtering from ALL DATA
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const categoryMatches = item.cleanedCategory?.toLowerCase() === criteria.category?.toLowerCase();
          const monthMatches = itemKey === criteria.month;
          
          return categoryMatches && monthMatches;
        });
        drillDownTypeToSet = 'category';
        console.log(`Context-filtered by category + month: ${criteria.category} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month && criteria.soldBy) {
        // Month-specific seller filtering from ALL DATA
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const sellerMatches = item.soldBy?.toLowerCase() === criteria.soldBy?.toLowerCase();
          const monthMatches = itemKey === criteria.month;
          
          return sellerMatches && monthMatches;
        });
        drillDownTypeToSet = 'soldBy';
        console.log(`Context-filtered by seller + month: ${criteria.soldBy} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month && criteria.paymentMethod) {
        // Month-specific payment method filtering from ALL DATA
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const methodMatches = item.paymentMethod?.toLowerCase() === criteria.paymentMethod?.toLowerCase();
          const monthMatches = itemKey === criteria.month;
          
          return methodMatches && monthMatches;
        });
        drillDownTypeToSet = 'paymentMethod';
        console.log(`Context-filtered by payment method + month: ${criteria.paymentMethod} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month) {
        // Month-only filtering (for month total rows)
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          return itemKey === criteria.month;
        });
        console.log(`Context-filtered by month only: ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.product) {
        // Product-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.cleanedProduct?.toLowerCase() === criteria.product?.toLowerCase() ||
          item.paymentItem?.toLowerCase() === criteria.product?.toLowerCase()
        );
        drillDownTypeToSet = 'product';
        console.log(`Context-filtered by product from ALL DATA: ${criteria.product} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.category) {
        // Category-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.cleanedCategory?.toLowerCase() === criteria.category?.toLowerCase()
        );
        drillDownTypeToSet = 'category';
        console.log(`Context-filtered by category from ALL DATA: ${criteria.category} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.soldBy) {
        // Seller-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.soldBy?.toLowerCase() === criteria.soldBy?.toLowerCase()
        );
        drillDownTypeToSet = 'soldBy';
        console.log(`Context-filtered by seller from ALL DATA: ${criteria.soldBy} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.paymentMethod) {
        // Payment method-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.paymentMethod?.toLowerCase() === criteria.paymentMethod?.toLowerCase()
        );
        drillDownTypeToSet = 'paymentMethod';
        console.log(`Context-filtered by payment method from ALL DATA: ${criteria.paymentMethod} - Found ${specificFilteredData.length} matching transactions`);
      }
      
    } else if (rowData.rawData && Array.isArray(rowData.rawData) && rowData.rawData.length > 0) {
      // Legacy: If we have transaction data already attached to the row, use that
      specificFilteredData = rowData.rawData;
      console.log(`Using pre-filtered rawData: ${specificFilteredData.length} transactions`);
    } else if (Array.isArray(rowData) && rowData.length > 0) {
      // Legacy: If rowData itself is an array of transactions, use it directly
      specificFilteredData = rowData;
      console.log(`Using rowData array directly: ${specificFilteredData.length} transactions`);
    } else if (rowData.transactionData && Array.isArray(rowData.transactionData) && rowData.transactionData.length > 0) {
      specificFilteredData = rowData.transactionData;
      console.log(`Using pre-filtered transactionData: ${specificFilteredData.length} transactions`);
    } else if (rowData.currentYearRawData && rowData.lastYearRawData) {
      // For Year-on-Year data, combine current and last year data for this specific product/category
      specificFilteredData = [...rowData.currentYearRawData, ...rowData.lastYearRawData];
      console.log(`Using YoY data: ${rowData.currentYearRawData.length} current year + ${rowData.lastYearRawData.length} last year transactions`);
    } else {
      // Apply specific filters based on row properties as fallback
      specificFilteredData = filteredData.filter(item => {
        let matches = false; // Start with false and require at least one match
        
        // Try multiple possible property names for product matching
        const productIdentifiers = [
          rowData.name,
          rowData.product,
          rowData.productName,
          rowData.paymentItem,
          rowData.cleanedProduct,
          rowData.membership,
          rowData.membershipType,
          rowData.item
        ].filter(Boolean);
        
        const categoryIdentifiers = [
          rowData.category,
          rowData.cleanedCategory,
          rowData.paymentCategory
        ].filter(Boolean);
        
        console.log('Product identifiers to match:', productIdentifiers);
        console.log('Category identifiers to match:', categoryIdentifiers);
        
        // Product-specific filtering - try exact matches
        for (const identifier of productIdentifiers) {
          if (item.cleanedProduct === identifier || 
              item.paymentItem === identifier ||
              item.membershipType === identifier ||
              (item.paymentItem && item.paymentItem.includes(identifier)) ||
              (item.cleanedProduct && item.cleanedProduct.includes(identifier))) {
            matches = true;
            console.log(`Product match found: ${identifier} matches item ${item.paymentItem || item.cleanedProduct}`);
            break;
          }
        }
        
        // Category-specific filtering if no product match
        if (!matches) {
          for (const identifier of categoryIdentifiers) {
            if (item.cleanedCategory === identifier ||
                item.paymentCategory === identifier ||
                (item.cleanedCategory && item.cleanedCategory.includes(identifier))) {
              matches = true;
              drillDownTypeToSet = 'category';
              console.log(`Category match found: ${identifier} matches item ${item.cleanedCategory}`);
              break;
            }
          }
        }
        
        // Sales rep specific filtering
        if (rowData.soldBy && item.soldBy === rowData.soldBy) {
          matches = true;
          drillDownTypeToSet = 'member';
        }
        
        // Payment method specific filtering
        if (rowData.paymentMethod && item.paymentMethod === rowData.paymentMethod) {
          matches = true;
          drillDownTypeToSet = 'product';
        }
        
        return matches;
      });
      console.log(`Using fallback filtering: ${specificFilteredData.length} transactions from ${filteredData.length} total`);
      
    }
    
    console.log(`Filtered ${specificFilteredData.length} transactions for drill-down from ${filteredData.length} total`);
    
    // Log the filtering results
    console.log(`Final drill-down data preparation:`);
    console.log(`- Context type: ${rowData.contextType || 'unknown'}`);
    console.log(`- Filter criteria:`, rowData.filterCriteria);
    console.log(`- Specific filtered transactions: ${specificFilteredData.length}`);
    console.log(`- Sample transactions:`, specificFilteredData.slice(0, 3));
    
    // Ensure we have valid transaction data - if no specific filter worked, use a fallback
    if (specificFilteredData.length === 0) {
      console.warn('No specific transactions found for this drill-down. Trying fallback filtering...');
      
      // More aggressive fallback filtering based on row data properties
      if (rowData.product || rowData.name) {
        const productName = rowData.product || rowData.name;
        specificFilteredData = filteredData.filter(item => 
          item.cleanedProduct?.includes(productName) || 
          item.paymentItem?.includes(productName) ||
          item.cleanedProduct === productName ||
          item.paymentItem === productName
        );
        console.log(`Fallback product filter found ${specificFilteredData.length} transactions for "${productName}"`);
      } else if (rowData.category) {
        specificFilteredData = filteredData.filter(item => 
          item.cleanedCategory?.includes(rowData.category) || 
          item.cleanedCategory === rowData.category
        );
        console.log(`Fallback category filter found ${specificFilteredData.length} transactions for "${rowData.category}"`);
      } else {
        // Last resort - use all filtered data but log warning
        console.warn('Using all filtered data as last resort');
        specificFilteredData = filteredData.slice(0, 100); // Limit to 100 for performance
      }
    }

    // Build enhanced data object with CORRECTLY FILTERED transactions
    // CRITICAL: Do NOT spread rowData first, as it may contain incorrect pre-filtered data
    const calculatedRevenue = specificFilteredData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const calculatedTransactions = specificFilteredData.length;
    const calculatedCustomers = new Set(specificFilteredData.map(item => item.memberId || item.customerEmail)).size;
    
    const enhancedData = {
      // Spread rowData but it will be overridden by our correctly filtered data below
      ...rowData,
      // FORCE override with correctly filtered transaction data
      rawData: specificFilteredData,
      filteredTransactionData: specificFilteredData,
      transactionData: specificFilteredData, // Some modals might read from this property
      // Calculate specific metrics from our CORRECTLY FILTERED data and override any static values
      totalRevenue: calculatedRevenue,
      grossRevenue: calculatedRevenue,
      netRevenue: calculatedRevenue,
      totalValue: calculatedRevenue,
      totalCurrent: calculatedRevenue,
      metricValue: calculatedRevenue,
      revenue: calculatedRevenue, // Some modals might read from this property
      transactions: calculatedTransactions,
      totalTransactions: calculatedTransactions,
      transactionCount: calculatedTransactions, // Some modals might read from this property
      uniqueMembers: calculatedCustomers,
      totalCustomers: calculatedCustomers,
      customerCount: calculatedCustomers, // Some modals might read from this property
      specificRevenue: calculatedRevenue,
      specificTransactions: calculatedTransactions,
      specificCustomers: calculatedCustomers,
      specificProducts: new Set(specificFilteredData.map(item => item.cleanedProduct || item.paymentItem)).size,
      // Add dynamic calculation flags to ensure modal uses fresh data
      isDynamic: true,
      calculatedFromFiltered: true,
      useCalculatedMetrics: true, // Flag for modal to prefer calculated metrics
      // Add context information for the modal
      clickedItemName: rowData.product || rowData.name || rowData.category || 'Selected Item',
      contextDescription: rowData.filterCriteria ? 
        `Showing data for ${Object.entries(rowData.filterCriteria).map(([key, value]) => `${key}: ${value}`).join(', ')}` :
        `Showing transactions for ${rowData.product || rowData.name || rowData.category || 'selected item'}`
    };
    
    // Final validation and logging
    console.log('🎉 === DRILL-DOWN MODAL DATA FINAL SUMMARY ===');
    console.log('📋 Filter Criteria:', rowData.filterCriteria);
    console.log('📊 Drill-down Context:', rowData.drillDownContext);
    console.log('🔢 Specific Filtered Data Count:', specificFilteredData.length);
    console.log('💰 Calculated Revenue:', calculatedRevenue);
    console.log('👥 Calculated Customers:', calculatedCustomers);
    console.log('📦 Enhanced Data Properties:');
    console.log('  - rawData length:', enhancedData.rawData?.length);
    console.log('  - filteredTransactionData length:', enhancedData.filteredTransactionData?.length);
    console.log('  - transactionData length:', enhancedData.transactionData?.length);
    console.log('  - totalRevenue:', enhancedData.totalRevenue);
    console.log('  - revenue:', enhancedData.revenue);
    console.log('  - transactions:', enhancedData.transactions);
    console.log('  - totalTransactions:', enhancedData.totalTransactions);
    console.log('🎯 Drill-down Type:', drillDownTypeToSet);
    console.log('📝 Context Description:', enhancedData.contextDescription);
    console.log('✅ === END DRILL-DOWN SUMMARY ===');
    
    setDrillDownData(enhancedData);
    setDrillDownType(drillDownTypeToSet);
  };

  const handleMetricClick = (metricData: any) => {
    console.log('Metric clicked with data:', metricData);
    
    // Filter data based on the specific metric clicked
    let specificData = filteredData;
    
    // Apply metric-specific filtering based on the metric type
    if (metricData.metricType) {
      switch (metricData.metricType) {
        case 'sales-revenue':
        case 'total-revenue':
          // For revenue metrics, focus on high-value transactions
          specificData = filteredData.filter(item => (item.paymentValue || 0) > 0);
          break;
          
        case 'units-sold':
        case 'total-transactions':
          // For transaction metrics, include all transactions
          specificData = filteredData;
          break;
          
        case 'unique-members':
          // For member metrics, focus on unique customer data
          const uniqueMembers = new Set(filteredData.map(item => item.memberId || item.customerEmail));
          specificData = filteredData.filter(item => 
            item.memberId || item.customerEmail
          );
          break;
          
        case 'avg-transaction-value':
        case 'avg-spend-per-member':
          // For average metrics, focus on meaningful transactions
          specificData = filteredData.filter(item => 
            (item.paymentValue || 0) > 0 && (item.memberId || item.customerEmail)
          );
          break;
          
        default:
          specificData = filteredData;
      }
    }
    
    // Calculate fresh metrics from the metric-specific filtered data
    const dynamicRevenue = specificData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const dynamicTransactions = specificData.length;
    const dynamicCustomers = new Set(specificData.map(item => item.memberId || item.customerEmail)).size;
    
    // Enhance metric data with dynamic calculations and metric-specific context
    const enhancedData = {
      ...metricData,
      rawData: specificData,
      filteredTransactionData: specificData,
      // Override with dynamic values
      totalRevenue: dynamicRevenue,
      grossRevenue: dynamicRevenue,
      netRevenue: dynamicRevenue,
      totalValue: dynamicRevenue,
      totalCurrent: dynamicRevenue,
      metricValue: dynamicRevenue,
      transactions: dynamicTransactions,
      totalTransactions: dynamicTransactions,
      uniqueMembers: dynamicCustomers,
      totalCustomers: dynamicCustomers,
      specificRevenue: dynamicRevenue,
      specificTransactions: dynamicTransactions,
      specificCustomers: dynamicCustomers,
      // Add context about the specific metric
      focusMetric: metricData.title,
      metricContext: metricData.metricType,
      // Add flags to indicate this is dynamically calculated
      isDynamic: true,
      calculatedFromFiltered: true,
      isMetricSpecific: true
    };
    
    console.log(`Metric-specific drill-down for '${metricData.title}' with ${specificData.length} filtered transactions, revenue: ${dynamicRevenue}`);
    setDrillDownData(enhancedData);
    setDrillDownType('metric');
  };

  const handleGroupToggle = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey);
    } else {
      newCollapsed.add(groupKey);
    }
    setCollapsedGroups(newCollapsed);
  };

  const resetFilters = () => {
    const previousMonth = getPreviousMonthDateRange();
    
    setFilters({
      dateRange: previousMonth,
      location: [],
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: []
    });
  };

  // Calculate tab counts for location tabs using filtered data
  const tabCounts = useMemo(() => {
    const counts = { all: 0, kwality: 0, supreme: 0, kenkere: 0 };
    
    // Use filtered data instead of raw data to reflect current filters
    filteredData.forEach(item => {
      counts.all++;
      const loc = (item.calculatedLocation || '').toString().toLowerCase();
      if (loc.includes('kwality')) {
        counts.kwality++;
      } else if (loc.includes('supreme')) {
        counts.supreme++;
      } else if (loc.includes('kenkere') || loc.includes('bengaluru')) {
        counts.kenkere++;
      }
    });
    
    return counts;
  }, [filteredData]);

  return (
    <div className="space-y-8">
      {/* Hero Section with Dynamic Metrics */}
      <SectionAnchor id="sales-overview" label="Overview">
        <SalesHeroSection 
          data={filteredData} 
          historicalData={metricsHistoricData}
          dateRange={filters.dateRange}
          currentLocation={activeLocation}
          locationName={locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations'}
        />
      </SectionAnchor>

      {/* Note Taker removed as requested; AI Notes remain elsewhere */}

      {/* Vertical timeline navigation (scrollspy) */}
      <SectionTimelineNav position="right" title="Sales sections" />

      {/* Enhanced Location Tabs - unified styling (matching Client Retention) */}
      <div className="container mx-auto px-6 space-y-6">
        <div className="flex justify-center mb-8" id="location-tabs">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-4 location-tabs">
              {locations.map(location => {
                const parts = location.name.split(',').map(s => s.trim());
                const mainName = parts[0] || location.name;
                const subName = parts[1] || '';
                // Map location.id to the correct tabCounts key
                const countKey = location.id === 'kenkere' ? 'kenkere' : location.id as keyof typeof tabCounts;
                const count = tabCounts[countKey] || 0;
                
                return (
                  <button
                    key={location.id}
                    onClick={() => setActiveLocation(location.id)}
                    className={`location-tab-trigger group ${activeLocation === location.id ? 'data-[state=active]:[--tab-accent:var(--hero-accent)]' : ''}`}
                    data-state={activeLocation === location.id ? 'active' : 'inactive'}
                    style={activeLocation === location.id ? { '--tab-accent': 'var(--hero-accent, #3b82f6)' } as React.CSSProperties : undefined}
                  >
                    <span className="relative z-10 flex flex-col items-center leading-tight">
                      <span className="flex items-center gap-2 font-extrabold text-base sm:text-lg">{mainName}</span>
                      <span className="text-xs sm:text-sm opacity-90">{subName} ({count})</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          <SectionAnchor id="sales-filters" label="Filters" className="w-full space-y-4">
            <AutoCloseFilterSection
              filters={filters} 
              onFiltersChange={setFilters} 
              onReset={resetFilters} 
            />
          </SectionAnchor>

          <SectionAnchor id="sales-metrics" label="Metrics">
            <SalesAnimatedMetricCards 
              data={filteredData} 
              historicalData={metricsHistoricData}
              dateRange={filters.dateRange}
              onMetricClick={handleMetricClick}
            />
          </SectionAnchor>

              <SectionAnchor id="sales-charts" label="Charts">
                <SalesInteractiveCharts data={allHistoricData} />
              </SectionAnchor>

              <SectionAnchor id="sales-sellers" label="Top & Bottom Sellers">
                <UnifiedTopBottomSellers data={filteredData} />
              </SectionAnchor>

                <Tabs defaultValue="monthOnMonth" className="w-full">
                  <TabsList className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 w-full max-w-7xl mx-auto">
                    {/** Uniform trigger styling for consistent size/width/spacing across tabs */}
                    <TabsTrigger value="monthOnMonth" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
                      Month on Month
                    </TabsTrigger>
                    <TabsTrigger value="yearOnYear" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
                      Year on Year
                    </TabsTrigger>
                  <TabsTrigger value="productPerformance" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
                    Product Performance
                  </TabsTrigger>
                  <TabsTrigger value="categoryPerformance" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
                    Category Performance
                  </TabsTrigger>
                  <TabsTrigger value="soldByAnalysis" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
                    Sold By
                  </TabsTrigger>
                  <TabsTrigger value="paymentMethodAnalysis" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
                    Payment Methods
                  </TabsTrigger>
                  <TabsTrigger value="customerBehavior" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50">
                    Customer Behavior
                  </TabsTrigger>
                </TabsList>

                  <TabsContent value="monthOnMonth" className="mt-8">
                    <SectionAnchor id="sales-mom" label="Month-on-Month" activate={() => {
                      const trigger = document.querySelector("[role='tab'][data-state='active'][data-value='monthOnMonth']") as HTMLElement | null;
                      if (!trigger) {
                        const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                        t.find(el => el.getAttribute('data-value') === 'monthOnMonth')?.click();
                      }
                    }} className="space-y-4">
                      <h2 className="text-2xl font-bold text-gray-900">Month-on-Month Analysis</h2>
                      <MonthOnMonthTableNew 
                        data={allHistoricData} 
                        onRowClick={handleRowClick} 
                        collapsedGroups={collapsedGroups} 
                        // Adapter to match MonthOnMonthTableNew's onGroupToggle signature (Set<string>)
                        onGroupToggle={React.useCallback((groups: Set<string>) => setCollapsedGroups(new Set(groups)), [])} 
                        selectedMetric={activeYoyMetric} 
                        onReady={markReady}
                      />
                      <div className="mt-3">
                        <AiNotes tableKey="sales:monthOnMonth" location={filters.location[0]} period={periodId} sectionId="sales-mom" />
                      </div>
                    </SectionAnchor>
                  </TabsContent>

                  <TabsContent value="yearOnYear" className="mt-8">
                    <SectionAnchor id="sales-yoy" label="Year-on-Year" activate={() => {
                      const trigger = document.querySelector("[role='tab'][data-state='active'][data-value='yearOnYear']") as HTMLElement | null;
                      if (!trigger) {
                        const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                        t.find(el => el.getAttribute('data-value') === 'yearOnYear')?.click();
                      }
                    }} className="space-y-4">
                      <h2 className="text-2xl font-bold text-gray-900">Year-on-Year Analysis</h2>
                      <EnhancedYearOnYearTableNew 
                        data={allHistoricData} 
                        onRowClick={handleRowClick} 
                        selectedMetric={activeYoyMetric} 
                        onReady={markReady}
                      />
                      <div className="mt-3">
                        <AiNotes tableKey="sales:yoy" location={filters.location[0]} period={periodId} sectionId="sales-yoy" />
                      </div>
                    </SectionAnchor>
                  </TabsContent>

                <TabsContent value="productPerformance" className="mt-8">
                  <SectionAnchor id="sales-product" label="Products" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'productPerformance')?.click();
                  }} className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Product Performance Analysis</h2>
                    <ProductPerformanceTableNew 
                      data={allHistoricData} 
                      onRowClick={handleRowClick} 
                      selectedMetric={activeYoyMetric} 
                      onReady={markReady}
                    />
                    <div className="mt-3">
                      <AiNotes tableKey="sales:productPerformance" location={filters.location[0]} period={periodId} sectionId="sales-product" />
                    </div>
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="categoryPerformance" className="mt-8">
                  <SectionAnchor id="sales-category" label="Categories" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'categoryPerformance')?.click();
                  }} className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Category Performance Analysis</h2>
                    <CategoryPerformanceTableNew 
                      data={allHistoricData} 
                      onRowClick={handleRowClick} 
                      selectedMetric={activeYoyMetric} 
                      onReady={markReady}
                    />
                    <div className="mt-3">
                      <AiNotes tableKey="sales:categoryPerformance" location={filters.location[0]} period={periodId} sectionId="sales-category" />
                    </div>
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="soldByAnalysis" className="mt-8">
                  <SectionAnchor id="sales-soldby" label="Sold By" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'soldByAnalysis')?.click();
                  }} className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Sold By Analysis</h2>
                    <SoldByMonthOnMonthTableNew 
                      data={allHistoricData} 
                      onRowClick={handleRowClick} 
                      selectedMetric={activeYoyMetric} 
                      onReady={markReady}
                    />
                    <div className="mt-3">
                      <AiNotes tableKey="sales:soldBy" location={filters.location[0]} period={periodId} sectionId="sales-soldby" />
                    </div>
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="paymentMethodAnalysis" className="mt-8">
                  <SectionAnchor id="sales-payment" label="Payment Methods" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'paymentMethodAnalysis')?.click();
                  }} className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Payment Method Analysis</h2>
                    <PaymentMethodMonthOnMonthTableNew 
                      data={allHistoricData} 
                      onRowClick={handleRowClick} 
                      selectedMetric={activeYoyMetric} 
                      onReady={markReady}
                    />
                    <div className="mt-3">
                      <AiNotes tableKey="sales:paymentMethod" location={filters.location[0]} period={periodId} sectionId="sales-payment" />
                    </div>
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="customerBehavior" className="space-y-6">
                  <SectionAnchor id="sales-customer" label="Customer Behavior" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'customerBehavior')?.click();
                  }}>
                    {/* Use allHistoricData to make this tab independent from the date filters */}
                    <CustomerBehaviorMonthOnMonthTable data={allHistoricData} onReady={markReady} onRowClick={handleRowClick} />
                  </SectionAnchor>
                </TabsContent>
              </Tabs>
        </div>
      </div>

      {/* Modal */}
      {drillDownData && (
        <EnhancedSalesDrillDownModal 
          isOpen={!!drillDownData} 
          onClose={() => setDrillDownData(null)} 
          data={drillDownData} 
          type={drillDownType} 
        />
      )}
    </div>
  );
};


