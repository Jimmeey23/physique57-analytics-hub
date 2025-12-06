import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Image,
  Copy,
  ExternalLink,
  Bot,
  Settings,
  Eye,
  Table,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Lock,
  Palette,
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface DetectedTable {
  id: string;
  name: string;
  headers: string[];
  rows: (string | number)[][];
  element: HTMLElement;
  rowCount: number;
  columnCount: number;
  location: string;
  type: 'table' | 'list' | 'grid';
}

interface DetectedMetric {
  id: string;
  name: string;
  value: string;
  rawValue: number;
  unit: string;
  category: string;
  element: HTMLElement;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface DetectedChart {
  id: string;
  name: string;
  type: 'canvas' | 'svg' | 'div';
  element: HTMLElement;
  dimensions: { width: number; height: number };
  location: string;
}

interface DetectedRanking {
  id: string;
  name: string;
  items: Array<{ rank: number; name: string; value: string }>;
  element: HTMLElement;
  location: string;
}

interface ExportConfiguration {
  selectedTables: string[];
  selectedMetrics: string[];
  selectedCharts: string[];
  selectedRankings: string[];
  format: 'excel' | 'csv' | 'json' | 'pdf';
  includeHeaders: boolean;
  includeMetadata: boolean;
  includeImages: boolean;
  fileName: string;
  compression: boolean;
  passwordProtect: boolean;
  password: string;
}

interface RobustDataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  currentLocation: string;
  locationName: string;
  data?: any[];
}

export const RobustDataExportModal: React.FC<RobustDataExportModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  currentLocation,
  locationName,
  data = []
}) => {
  const [currentStep, setCurrentStep] = useState<'scan' | 'select' | 'configure' | 'export'>('scan');
  const [detectedTables, setDetectedTables] = useState<DetectedTable[]>([]);
  const [detectedMetrics, setDetectedMetrics] = useState<DetectedMetric[]>([]);
  const [detectedCharts, setDetectedCharts] = useState<DetectedChart[]>([]);
  const [detectedRankings, setDetectedRankings] = useState<DetectedRanking[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  const [config, setConfig] = useState<ExportConfiguration>({
    selectedTables: [],
    selectedMetrics: [],
    selectedCharts: [],
    selectedRankings: [],
    format: 'excel',
    includeHeaders: true,
    includeMetadata: true,
    includeImages: false,
    fileName: `${currentLocation}-${currentTab}-export`,
    compression: false,
    passwordProtect: false,
    password: ''
  });

  // Enhanced detection with comprehensive selectors
  const detectTablesDirectly = (): DetectedTable[] => {
    const tables: DetectedTable[] = [];
    
    // Comprehensive table selectors
    const tableSelectors = [
      // Data attribute selectors (our marked tables)
      '[data-table="month-on-month"] table',
      '[data-table="year-on-year"] table', 
      '[data-table="product-performance"] table',
      '[data-table="category-analysis"] table',
      '[data-table="sold-by"] table',
      '[data-table="payment-methods"] table',
      '[data-table="customer-behavior"] table',
      
      // Generic data table selectors
      '[data-table] table',
      'table[role="table"]',
      '.data-table table',
      'table.table',
      'table',
      
      // Modern table components
      '[role="grid"]',
      '[role="table"]',
      '.ag-theme-alpine',
      '.react-table',
      
      // Card-based data displays
      '.performance-card table',
      '.metric-table',
      '.analytics-table',
      
      // List-based data (convert to table format)
      '[data-testid*="table"]',
      '[aria-label*="table"]',
      '[aria-label*="data"]'
    ];

    // Grid and list selectors (convert to table format)
    const listSelectors = [
      '.ranking-list',
      '.leaderboard',
      '[class*="rank"]',
      '.top-performers',
      '.performance-list',
      '.metric-grid',
      '.stats-grid'
    ];

    // Process regular tables
    tableSelectors.forEach((selector, index) => {
      try {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, elementIndex) => {
          const table = element as HTMLElement;
          
          // Enhanced visibility check
          if (!isElementVisible(table)) return;
          
          // Skip duplicates by checking if we already processed this element
          const existingTable = tables.find(t => t.element === table);
          if (existingTable) return;

          const tableData = extractTableData(table as HTMLTableElement);
          if (tableData && tableData.headers.length > 0 && tableData.rows.length > 0) {
            const tableName = getTableName(table, selector, index, elementIndex);
            
            tables.push({
              id: `table-${index}-${elementIndex}-${Date.now()}`,
              name: tableName,
              headers: tableData.headers,
              rows: tableData.rows,
              element: table,
              rowCount: tableData.rows.length,
              columnCount: tableData.headers.length,
              location: getTableLocation(table),
              type: 'table'
            });
          }
        });
      } catch (error) {
        console.warn(`Error processing table selector ${selector}:`, error);
      }
    });

    // Process list-based data structures
    listSelectors.forEach((selector, index) => {
      try {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, elementIndex) => {
          const listElement = element as HTMLElement;
          
          if (!isElementVisible(listElement)) return;
          
          const listData = extractListData(listElement);
          if (listData && listData.headers.length > 0 && listData.rows.length > 0) {
            const listName = getListName(listElement, selector, index, elementIndex);
            
            tables.push({
              id: `list-${index}-${elementIndex}-${Date.now()}`,
              name: listName,
              headers: listData.headers,
              rows: listData.rows,
              element: listElement,
              rowCount: listData.rows.length,
              columnCount: listData.headers.length,
              location: getTableLocation(listElement),
              type: 'list'
            });
          }
        });
      } catch (error) {
        console.warn(`Error processing list selector ${selector}:`, error);
      }
    });

    return tables;
  };

  // Detect charts and visual elements
  const detectCharts = (): DetectedChart[] => {
    const charts: DetectedChart[] = [];
    
    const chartSelectors = [
      'canvas',
      'svg[class*="chart"]',
      'svg[class*="graph"]', 
      '.chart-container',
      '.graph-container',
      '[data-chart]',
      '[data-graph]',
      '.recharts-wrapper',
      '.chart',
      '.graph'
    ];

    chartSelectors.forEach((selector, selectorIndex) => {
      try {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, elementIndex) => {
          const chartElement = element as HTMLElement;
          
          if (!isElementVisible(chartElement)) return;
          
          const rect = chartElement.getBoundingClientRect();
          const chartName = getChartName(chartElement, selector, selectorIndex, elementIndex);
          
          charts.push({
            id: `chart-${selectorIndex}-${elementIndex}-${Date.now()}`,
            name: chartName,
            type: chartElement.tagName.toLowerCase() as 'canvas' | 'svg' | 'div',
            element: chartElement,
            dimensions: { width: rect.width, height: rect.height },
            location: getTableLocation(chartElement)
          });
        });
      } catch (error) {
        console.warn(`Error processing chart selector ${selector}:`, error);
      }
    });

    return charts;
  };

  const getChartName = (element: HTMLElement, selector: string, selectorIndex: number, elementIndex: number): string => {
    const container = element.closest('section, .card, .widget, [class*="section"]');
    const heading = container?.querySelector('h1, h2, h3, h4, h5, h6, .title, .heading');
    
    if (heading?.textContent?.trim()) {
      return heading.textContent.trim();
    }
    
    const ariaLabel = element.getAttribute('aria-label') || element.getAttribute('data-label');
    if (ariaLabel) return ariaLabel;
    
    return `Chart ${selectorIndex + 1}`;
  };

  // Detect rankings and leaderboards
  const detectRankings = (): DetectedRanking[] => {
    const rankings: DetectedRanking[] = [];
    
    const rankingSelectors = [
      '.ranking',
      '.leaderboard',
      '.top-list',
      '.top-performers',
      '[class*="rank"]',
      '[data-ranking]',
      '.performance-ranking'
    ];

    rankingSelectors.forEach((selector, selectorIndex) => {
      try {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, elementIndex) => {
          const rankingElement = element as HTMLElement;
          
          if (!isElementVisible(rankingElement)) return;
          
          const rankingData = extractRankingData(rankingElement);
          if (rankingData && rankingData.items.length > 0) {
            const rankingName = getRankingName(rankingElement, selector, selectorIndex, elementIndex);
            
            rankings.push({
              id: `ranking-${selectorIndex}-${elementIndex}-${Date.now()}`,
              name: rankingName,
              items: rankingData.items,
              element: rankingElement,
              location: getTableLocation(rankingElement)
            });
          }
        });
      } catch (error) {
        console.warn(`Error processing ranking selector ${selector}:`, error);
      }
    });

    return rankings;
  };

  const extractRankingData = (element: HTMLElement): { items: Array<{ rank: number; name: string; value: string }> } | null => {
    try {
      const items = element.querySelectorAll('li, .item, .row, tr');
      if (items.length === 0) return null;

      const rankingItems: Array<{ rank: number; name: string; value: string }> = [];
      
      items.forEach((item, index) => {
        const text = item.textContent?.trim() || '';
        if (!text) return;
        
        // Try to find rank, name, and value
        const rankElement = item.querySelector('.rank, .position, [data-rank]');
        const nameElement = item.querySelector('.name, .title, .label');
        const valueElement = item.querySelector('.value, .score, .amount, .count');
        
        const rank = rankElement ? parseInt(rankElement.textContent || '') || (index + 1) : (index + 1);
        const name = nameElement?.textContent?.trim() || text.split(/\s+/)[0] || `Item ${index + 1}`;
        const value = valueElement?.textContent?.trim() || '';
        
        rankingItems.push({ rank, name, value });
      });
      
      return { items: rankingItems };
    } catch (error) {
      console.warn('Error extracting ranking data:', error);
      return null;
    }
  };

  const getRankingName = (element: HTMLElement, selector: string, selectorIndex: number, elementIndex: number): string => {
    const container = element.closest('section, .card, .widget');
    const heading = container?.querySelector('h1, h2, h3, h4, h5, h6, .title');
    
    if (heading?.textContent?.trim()) {
      return heading.textContent.trim();
    }
    
    return `Ranking ${selectorIndex + 1}`;
  };

  const extractTableData = (table: HTMLTableElement): { headers: string[], rows: (string | number)[][] } | null => {
  const detectMetrics = (): DetectedMetric[] => {
    const metrics: DetectedMetric[] = [];
    
    const metricSelectors = [
      // Hero metrics
      '.metric-value',
      '.kpi-value', 
      '.stat-value',
      '.hero-metric',
      '.summary-stat',
      
      // Card-based metrics
      '.metric-card .value',
      '.stat-card .value',
      '.kpi-card .number',
      '.summary-card .amount',
      '.performance-card .metric',
      
      // Data attributes
      '[data-metric]',
      '[data-kpi]',
      '[data-stat]',
      '[data-value]',
      
      // Generic patterns
      '.value',
      '.amount',
      '.total',
      '.count',
      '.percentage',
      '.currency',
      
      // Chart-related metrics
      '.chart-value',
      '.graph-total',
      '.dashboard-metric'
    ];

    metricSelectors.forEach((selector, selectorIndex) => {
      try {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, elementIndex) => {
          const metricElement = element as HTMLElement;
          
          if (!isElementVisible(metricElement)) return;
          
          const metricData = extractMetricData(metricElement);
          if (metricData) {
            metrics.push({
              id: `metric-${selectorIndex}-${elementIndex}-${Date.now()}`,
              ...metricData,
              element: metricElement
            });
          }
        });
      } catch (error) {
        console.warn(`Error processing metric selector ${selector}:`, error);
      }
    });

    return metrics;
  };

  const extractMetricData = (element: HTMLElement): Omit<DetectedMetric, 'id' | 'element'> | null => {
    try {
      const value = element.textContent?.trim() || '';
      if (!value) return null;
      
      // Get metric name from label, title, or nearby text
      const container = element.closest('.metric, .kpi, .stat, .card, .widget');
      const labelElement = container?.querySelector('.label, .title, .name, .key') || 
                          element.previousElementSibling ||
                          element.parentElement?.querySelector('.label, .title');
      
      const name = labelElement?.textContent?.trim() || 
                  element.getAttribute('aria-label') ||
                  element.getAttribute('data-label') ||
                  element.getAttribute('title') ||
                  'Metric';
      
      // Parse numeric value
      const numericMatch = value.match(/[\d,.$%()-]+/);
      const rawValue = numericMatch ? parseFloat(numericMatch[0].replace(/[,$%()]/g, '')) || 0 : 0;
      
      // Detect unit/format
      let unit = '';
      if (value.includes('$')) unit = 'currency';
      else if (value.includes('%')) unit = 'percentage';
      else if (value.match(/\d/)) unit = 'number';
      else unit = 'text';
      
      // Try to find trend/change indicator
      const changeElement = container?.querySelector('.change, .trend, .delta, .growth');
      const change = changeElement?.textContent?.trim();
      
      let trend: 'up' | 'down' | 'stable' | undefined;
      if (change) {
        if (change.includes('↑') || change.includes('+') || change.includes('up')) trend = 'up';
        else if (change.includes('↓') || change.includes('-') || change.includes('down')) trend = 'down';
        else trend = 'stable';
      }
      
      // Categorize metric
      const category = categorizeMetric(name, value);
      
      return {
        name,
        value,
        rawValue,
        unit,
        category,
        change: change || undefined,
        trend
      };
    } catch (error) {
      return null;
    }
  };

  const categorizeMetric = (name: string, value: string): string => {
    const lowerName = name.toLowerCase();
    const lowerValue = value.toLowerCase();
    
    if (lowerName.includes('revenue') || lowerName.includes('sales') || lowerValue.includes('$')) return 'financial';
    if (lowerName.includes('customer') || lowerName.includes('member') || lowerName.includes('user')) return 'customer';
    if (lowerName.includes('performance') || lowerName.includes('conversion') || lowerName.includes('rate')) return 'performance';
    if (lowerName.includes('count') || lowerName.includes('total') || lowerName.includes('number')) return 'volume';
    
    return 'general';
  };
    // Multiple visibility checks
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    return (
      rect.width > 0 && 
      rect.height > 0 &&
      style.display !== 'none' && 
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  };

  const extractListData = (listElement: HTMLElement): { headers: string[], rows: (string | number)[][] } | null => {
    try {
      const items = listElement.querySelectorAll('li, .item, .row, [class*="item"], [class*="row"]');
      if (items.length === 0) return null;

      const headers = ['Item', 'Value', 'Details'];
      const rows: (string | number)[][] = [];

      items.forEach((item, index) => {
        const text = item.textContent?.trim() || '';
        if (!text) return;

        // Try to parse structured data from the item
        const valueElements = item.querySelectorAll('.value, .number, .amount, .count, [data-value]');
        const nameElement = item.querySelector('.name, .title, .label, .key, [data-name]');
        
        const name = nameElement?.textContent?.trim() || `Item ${index + 1}`;
        const value = valueElements.length > 0 ? valueElements[0]?.textContent?.trim() || '' : '';
        const details = text.replace(name, '').replace(value, '').trim();

        rows.push([name, value || text, details || '']);
      });

      return { headers, rows };
    } catch (error) {
      console.warn('Error extracting list data:', error);
      return null;
    }
  };

  const getListName = (listElement: HTMLElement, selector: string, selectorIndex: number, elementIndex: number): string => {
    // Try to get name from nearby heading or label
    const container = listElement.closest('section, .card, .widget, [class*="section"]');
    if (container) {
      const heading = container.querySelector('h1, h2, h3, h4, h5, h6, .title, .heading');
      if (heading?.textContent?.trim()) {
        return heading.textContent.trim();
      }
    }

    // Try aria-label or data attributes
    const ariaLabel = listElement.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const dataLabel = listElement.getAttribute('data-label') || listElement.getAttribute('data-name');
    if (dataLabel) return dataLabel;

    return `Data List ${selectorIndex + 1}`;
  };
    try {
      const headers: string[] = [];
      const rows: (string | number)[][] = [];

      // Get headers
      const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th, td');
        headerCells.forEach(cell => {
          const text = cell.textContent?.trim() || '';
          // Clean up header text
          const cleanText = text.replace(/[↑↓▲▼]/g, '').trim();
          if (cleanText) {
            headers.push(cleanText);
          }
        });
      }

      // Get data rows
      const allRows = table.querySelectorAll('tr');
      const headerRowElement = table.querySelector('thead tr') || 
                              (headerRow === table.querySelector('tr') ? headerRow : null);

      allRows.forEach(row => {
        // Skip header row
        if (row === headerRowElement) return;
        
        const cells = row.querySelectorAll('td, th');
        if (cells.length === 0) return;

        const rowData: (string | number)[] = [];
        cells.forEach(cell => {
          let text = cell.textContent?.trim() || '';
          
          // Try to parse as number if it looks numeric
          const numMatch = text.match(/^[\d,.$%()-]+$/);
          if (numMatch) {
            const cleanNum = text.replace(/[$,%()]/g, '').replace(/,/g, '');
            const num = parseFloat(cleanNum);
            if (!isNaN(num)) {
              rowData.push(num);
              return;
            }
          }
          
          rowData.push(text);
        });

        if (rowData.some(cell => cell !== '')) {
          rows.push(rowData);
        }
      });

      return { headers, rows };
    } catch (error) {
      console.warn('Error extracting table data:', error);
      return null;
    }
  };

  const getTableName = (table: HTMLElement, selector: string, selectorIndex: number, elementIndex: number): string => {
    // Try to get name from data attribute
    const container = table.closest('[data-table]');
    if (container) {
      const dataTable = container.getAttribute('data-table');
      if (dataTable) {
        return formatTableName(dataTable);
      }
    }

    // Try to get name from nearby heading
    const section = table.closest('section, [class*="section"], [id*="section"]');
    if (section) {
      const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        return heading.textContent?.trim() || `Table ${selectorIndex + 1}`;
      }
    }

    // Try to get name from aria-label
    const ariaLabel = table.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    // Default name
    return `Table ${selectorIndex + 1}`;
  };

  const formatTableName = (name: string): string => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTableLocation = (table: HTMLElement): string => {
    const tabContent = table.closest('[role="tabpanel"], [data-state="active"]');
    if (tabContent) {
      const tabTrigger = document.querySelector(`[aria-controls="${tabContent.id}"]`);
      if (tabTrigger) {
        return tabTrigger.textContent?.trim() || currentTab;
      }
    }
    return currentTab;
  };

  // Enhanced scan for all data types
  const performScan = async () => {
    setIsScanning(true);
    
    try {
      // Give a moment for UI to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Detect all data types
      const tables = detectTablesDirectly();
      const metrics = detectMetrics();
      const charts = detectCharts();
      const rankings = detectRankings();
      
      setDetectedTables(tables);
      setDetectedMetrics(metrics);
      setDetectedCharts(charts);
      setDetectedRankings(rankings);
      
      // Auto-select all detected items
      setConfig(prev => ({
        ...prev,
        selectedTables: tables.map(t => t.id),
        selectedMetrics: metrics.map(m => m.id),
        selectedCharts: charts.map(c => c.id),
        selectedRankings: rankings.map(r => r.id)
      }));

      const totalDetected = tables.length + metrics.length + charts.length + rankings.length;
      
      if (totalDetected > 0) {
        setCurrentStep('select');
        toast({
          title: "Data Detected",
          description: `Found ${tables.length} tables, ${metrics.length} metrics, ${charts.length} charts, and ${rankings.length} rankings.`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: "No exportable data detected in current view.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not scan for data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Export functions
  const exportToExcel = async (tables: DetectedTable[]) => {
    const workbook = XLSX.utils.book_new();
    
    // Add summary sheet
    if (config.includeMetadata) {
      const summaryData = [
        ['Export Summary'],
        ['Generated:', new Date().toLocaleString()],
        ['Location:', locationName],
        ['Tab:', currentTab],
        ['Tables:', tables.length.toString()],
        [''],
        ['Table List:'],
        ...tables.map(t => [t.name, `${t.rowCount} rows x ${t.columnCount} columns`])
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }
    
    // Add each table as a sheet
    tables.forEach((table, index) => {
      const sheetData = config.includeHeaders ? 
        [table.headers, ...table.rows] : 
        table.rows;
      
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths
      const colWidths = table.headers.map(() => ({ wch: 15 }));
      worksheet['!cols'] = colWidths;
      
      const sheetName = table.name.substring(0, 31); // Excel limit
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${config.fileName}-${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  const exportToCSV = async (tables: DetectedTable[]) => {
    if (tables.length === 1) {
      // Single file for one table
      const table = tables[0];
      const csvData = [];
      
      if (config.includeHeaders) {
        csvData.push(table.headers.join(','));
      }
      
      table.rows.forEach(row => {
        csvData.push(row.map(cell => `"${cell}"`).join(','));
      });
      
      const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${config.fileName}-${timestamp}.csv`;
      saveAs(blob, filename);
    } else {
      // Multiple files in a zip
      const zip = new JSZip();
      
      tables.forEach(table => {
        const csvData = [];
        
        if (config.includeHeaders) {
          csvData.push(table.headers.join(','));
        }
        
        table.rows.forEach(row => {
          csvData.push(row.map(cell => `"${cell}"`).join(','));
        });
        
        const filename = `${table.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
        zip.file(filename, csvData.join('\n'));
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${config.fileName}-${timestamp}.zip`;
      saveAs(blob, filename);
    }
  };

  const exportToJSON = async (tables: DetectedTable[]) => {
    const exportData = {
      metadata: config.includeMetadata ? {
        exported: new Date().toISOString(),
        location: locationName,
        tab: currentTab,
        tableCount: tables.length
      } : undefined,
      tables: tables.map(table => ({
        name: table.name,
        location: table.location,
        headers: config.includeHeaders ? table.headers : undefined,
        data: table.rows,
        rowCount: table.rowCount,
        columnCount: table.columnCount
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${config.fileName}-${timestamp}.json`;
    saveAs(blob, filename);
  };

  const exportToPDF = async (tables: DetectedTable[]) => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.text('Data Export Report', 20, yPosition);
    yPosition += 15;
    
    // Metadata
    if (config.includeMetadata) {
      doc.setFontSize(12);
      doc.text(`Location: ${locationName}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Tab: ${currentTab}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 15;
    }
    
    // Tables
    tables.forEach((table, tableIndex) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(table.name, 20, yPosition);
      yPosition += 10;
      
      const tableData = config.includeHeaders ? 
        [table.headers, ...table.rows.slice(0, 50)] : // Limit rows for PDF
        table.rows.slice(0, 50);
      
      (doc as any).autoTable({
        head: config.includeHeaders ? [table.headers] : undefined,
        body: config.includeHeaders ? table.rows.slice(0, 50) : tableData,
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: [63, 131, 248] },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    });
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${config.fileName}-${timestamp}.pdf`;
    doc.save(filename);
  };

  const handleExport = async () => {
    const selectedTables = detectedTables.filter(t => config.selectedTables.includes(t.id));
    
    if (selectedTables.length === 0) {
      toast({
        title: "No Tables Selected",
        description: "Please select at least one table to export.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      setExportProgress(25);
      
      switch (config.format) {
        case 'excel':
          await exportToExcel(selectedTables);
          break;
        case 'csv':
          await exportToCSV(selectedTables);
          break;
        case 'json':
          await exportToJSON(selectedTables);
          break;
        case 'pdf':
          await exportToPDF(selectedTables);
          break;
      }
      
      setExportProgress(100);
      
      toast({
        title: "Export Successful",
        description: `${selectedTables.length} table(s) exported in ${config.format.toUpperCase()} format.`,
      });
      
      // Close modal after successful export
      setTimeout(() => {
        onClose();
        setCurrentStep('scan');
        setExportProgress(0);
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Auto-scan when modal opens
  useEffect(() => {
    if (isOpen && currentStep === 'scan') {
      performScan();
    }
  }, [isOpen, currentStep]);

  const copyToClipboard = async () => {
    const selectedTables = detectedTables.filter(t => config.selectedTables.includes(t.id));
    
    let text = `# ${locationName} - ${currentTab} Data Export\n\n`;
    
    selectedTables.forEach(table => {
      text += `## ${table.name}\n`;
      if (config.includeHeaders) {
        text += `| ${table.headers.join(' | ')} |\n`;
        text += `|${table.headers.map(() => '---').join('|')}|\n`;
      }
      
      table.rows.slice(0, 20).forEach(row => {
        text += `| ${row.join(' | ')} |\n`;
      });
      
      if (table.rows.length > 20) {
        text += `*... and ${table.rows.length - 20} more rows*\n`;
      }
      text += '\n';
    });

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Table data copied in markdown format.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Robust Data Export
          </DialogTitle>
        </DialogHeader>

        {/* Scanning Step */}
        {currentStep === 'scan' && (
          <div className="text-center py-12">
            {isScanning ? (
              <div className="space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-lg font-medium">Scanning for tables...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-lg font-medium">Ready to scan</p>
                <Button onClick={performScan}>Start Scan</Button>
              </div>
            )}
          </div>
        )}

        {/* Table Selection Step */}
        {currentStep === 'select' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Tables to Export</h3>
              <Badge>{detectedTables.length} tables detected</Badge>
            </div>
            
            <div className="space-y-3">
              {detectedTables.map(table => (
                <Card key={table.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={config.selectedTables.includes(table.id)}
                            onCheckedChange={(checked) => {
                              setConfig(prev => ({
                                ...prev,
                                selectedTables: checked
                                  ? [...prev.selectedTables, table.id]
                                  : prev.selectedTables.filter(id => id !== table.id)
                              }));
                            }}
                          />
                          <h4 className="font-semibold">{table.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {table.rowCount} rows × {table.columnCount} columns
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Location: {table.location}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {table.headers.slice(0, 5).map((header, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {header}
                            </Badge>
                          ))}
                          {table.headers.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{table.headers.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Table className="w-8 h-8 text-muted-foreground ml-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Step */}
        {currentStep === 'configure' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Export Configuration</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <Select 
                    value={config.format} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>File Name</Label>
                  <Input
                    value={config.fileName}
                    onChange={(e) => setConfig(prev => ({ ...prev, fileName: e.target.value }))}
                    placeholder="export-filename"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Include Headers</Label>
                  <Switch
                    checked={config.includeHeaders}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeHeaders: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Include Metadata</Label>
                  <Switch
                    checked={config.includeMetadata}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeMetadata: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Compression</Label>
                  <Switch
                    checked={config.compression}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, compression: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Step */}
        {currentStep === 'export' && (
          <div className="text-center py-12">
            {isExporting ? (
              <div className="space-y-4">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-lg font-medium">Exporting data...</p>
                <Progress value={exportProgress} className="w-64 mx-auto" />
                <p className="text-sm text-muted-foreground">{exportProgress}% complete</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Download className="w-16 h-16 text-blue-500 mx-auto" />
                <p className="text-lg font-medium">Ready to Export</p>
                <p className="text-muted-foreground">
                  {config.selectedTables.length} table(s) selected for {config.format.toUpperCase()} export
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 'select' && detectedTables.length > 0 && (
              <Button onClick={() => setCurrentStep('configure')}>
                Configure Export
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 'configure' && (
              <>
                <Button variant="outline" onClick={() => setCurrentStep('select')}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep('export')}>
                  Preview Export
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
            
            {currentStep === 'export' && !isExporting && (
              <Button variant="outline" onClick={() => setCurrentStep('configure')}>
                Back to Config
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};