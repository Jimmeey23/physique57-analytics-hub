/**
 * Data Extraction Service
 * Crawls through all pages and extracts tables, metrics, and data
 */

import { SalesData } from '@/types/dashboard';

export interface ExtractedTable {
  title: string;
  subtitle?: string;
  location?: string;
  tab?: string;
  subTab?: string;
  headers: string[];
  rows: any[][];
  metadata?: {
    page: string;
    section?: string;
    timestamp: string;
    recordCount: number;
  };
}

export interface ExtractedMetric {
  title: string;
  value: string | number;
  change?: string | number;
  location?: string;
  tab?: string;
  category: string;
  metadata?: {
    page: string;
    section?: string;
    timestamp: string;
  };
}

export interface ExtractedData {
  tables: ExtractedTable[];
  metrics: ExtractedMetric[];
  summary: {
    totalTables: number;
    totalMetrics: number;
    pages: string[];
    locations: string[];
    timestamp: string;
  };
}

/**
 * Page Data Registry - Maps pages to their data extraction functions
 */
export const PAGE_REGISTRY = {
  'Executive Summary': {
    path: '/',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useSalesData', 'useCheckinsData', 'useNewClientData'],
  },
  'Sales Analytics': {
    path: '/sales-analytics',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useSalesData', 'useDiscountsData'],
    tabs: ['Overview', 'Products', 'Trends', 'Discounts'],
  },
  'Client Retention': {
    path: '/client-retention',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useNewClientData', 'useCheckinsData'],
    tabs: ['New Clients', 'Retention Metrics', 'Conversion Funnel'],
  },
  'Trainer Performance': {
    path: '/trainer-performance',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['usePayrollData', 'useCheckinsData'],
  },
  'Class Attendance': {
    path: '/class-attendance',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useCheckinsData', 'useSessionsData'],
    tabs: ['Attendance Overview', 'Class Formats', 'Time Analysis'],
  },
  'Class Formats Comparison': {
    path: '/class-formats-comparison',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useCheckinsData', 'useSessionsData'],
  },
  'Discounts & Promotions': {
    path: '/discounts-promotions',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useDiscountsData', 'useSalesData'],
    tabs: ['Discount Analysis', 'Product Performance', 'Customer Segments'],
  },
  'Sessions': {
    path: '/sessions',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useFilteredSessionsData'],
    tabs: ['All Sessions', 'By Trainer', 'By Class Type'],
  },
  'Expiration Analytics': {
    path: '/expiration-analytics',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useExpirationsData'],
  },
  'Late Cancellations': {
    path: '/late-cancellations',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useLateCancellationsData'],
  },
  'Funnel & Leads': {
    path: '/funnel-leads',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'],
    dataHooks: ['useLeadsData'],
  },
};

/**
 * Extract table data from a dataset
 */
export function extractTableFromData(
  title: string,
  data: any[],
  options: {
    location?: string;
    tab?: string;
    subTab?: string;
    page: string;
    section?: string;
    headers?: string[];
  }
): ExtractedTable {
  if (!data || data.length === 0) {
    return {
      title,
      location: options.location,
      tab: options.tab,
      subTab: options.subTab,
      headers: options.headers || [],
      rows: [],
      metadata: {
        page: options.page,
        section: options.section,
        timestamp: new Date().toISOString(),
        recordCount: 0,
      },
    };
  }

  // Auto-detect headers from first object if not provided
  const headers = options.headers || Object.keys(data[0]);

  // Convert data objects to rows
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      return value !== undefined && value !== null ? String(value) : '';
    })
  );

  return {
    title,
    location: options.location,
    tab: options.tab,
    subTab: options.subTab,
    headers,
    rows,
    metadata: {
      page: options.page,
      section: options.section,
      timestamp: new Date().toISOString(),
      recordCount: data.length,
    },
  };
}

/**
 * Extract metrics from an object
 */
export function extractMetrics(
  metrics: Record<string, any>,
  options: {
    category: string;
    location?: string;
    tab?: string;
    page: string;
    section?: string;
  }
): ExtractedMetric[] {
  return Object.entries(metrics).map(([key, value]) => ({
    title: formatMetricTitle(key),
    value: typeof value === 'object' ? value.value : value,
    change: typeof value === 'object' ? value.change : undefined,
    location: options.location,
    tab: options.tab,
    category: options.category,
    metadata: {
      page: options.page,
      section: options.section,
      timestamp: new Date().toISOString(),
    },
  }));
}

/**
 * Format camelCase to Title Case
 */
function formatMetricTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Filter data by location
 */
/**
 * Filter data by location
 */
export function filterByLocation(data: any[], location: string): any[] {
  if (!location || location === 'All Locations') {
    return data;
  }
  
  return data.filter(item => {
    const itemLocation = item.calculatedLocation || item.location || '';
    
    // Handle Kenkere House special case (with or without Bengaluru)
    if (location.includes('Kenkere')) {
      return itemLocation.includes('Kenkere');
    }
    
    // Exact match for other locations
    return itemLocation === location;
  });
}

/**
 * Calculate summary metrics from sales data
 */
export function calculateSalesMetrics(data: SalesData[], location?: string) {
  const filteredData = location ? filterByLocation(data, location) : data;

  const totalRevenue = filteredData.reduce((sum, item) => sum + (item.grossRevenue || 0), 0);
  const totalTransactions = filteredData.length;
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalDiscount = filteredData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);

  return {
    totalRevenue,
    totalTransactions,
    averageTransactionValue,
    totalDiscount,
    netRevenue: totalRevenue - totalDiscount,
  };
}

/**
 * Group data by a field
 */
export function groupBy<T>(data: T[], field: keyof T): Record<string, T[]> {
  return data.reduce((groups, item) => {
    const key = String(item[field] || 'Unknown');
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Extract top N items by a numeric field
 */
export function getTopN<T>(data: T[], field: keyof T, n: number = 10): T[] {
  return [...data]
    .sort((a, b) => {
      const aVal = Number(a[field]) || 0;
      const bVal = Number(b[field]) || 0;
      return bVal - aVal;
    })
    .slice(0, n);
}

/**
 * Convert table to different formats
 */
export function formatTableData(table: ExtractedTable, format: 'array' | 'object') {
  if (format === 'array') {
    return [table.headers, ...table.rows];
  }
  
  // Convert to array of objects
  return table.rows.map(row => {
    const obj: Record<string, any> = {};
    table.headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
