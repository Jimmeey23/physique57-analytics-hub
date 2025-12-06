import { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  FileText, 
  Table, 
  BarChart3, 
  TrendingUp,
  Trophy,
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  FileX,
  Settings
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Progress } from '../ui/progress';
import { useToast } from '@/hooks/use-toast';

// Import export libraries
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
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

interface EnhancedRobustDataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  currentLocation: string;
  locationName: string;
  data?: any[];
}

export const EnhancedRobustDataExportModal: React.FC<EnhancedRobustDataExportModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  currentLocation,
  locationName,
  data = []
}) => {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'scan' | 'select' | 'configure' | 'export'>('scan');
  const [detectedTables, setDetectedTables] = useState<DetectedTable[]>([]);
  const [detectedMetrics, setDetectedMetrics] = useState<DetectedMetric[]>([]);
  const [detectedCharts, setDetectedCharts] = useState<DetectedChart[]>([]);
  const [detectedRankings, setDetectedRankings] = useState<DetectedRanking[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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

  const isElementVisible = (element: HTMLElement): boolean => {
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
      '[data-table="sales-summary"] table',
      '[data-table="metrics-table"] table',
      
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
      '.summary-table',
      
      // Dashboard specific
      '.dashboard-table',
      '.report-table',
      '.stats-table',
      
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
      '.stats-grid',
      '.data-grid'
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

  // Detect metrics, KPIs, and statistical data
  const detectMetrics = (): DetectedMetric[] => {
    const metrics: DetectedMetric[] = [];
    
    const metricSelectors = [
      // Hero metrics
      '.metric-value',
      '.kpi-value', 
      '.stat-value',
      '.hero-metric',
      '.summary-stat',
      '.hero-number',
      '.dashboard-metric',
      
      // Card-based metrics
      '.metric-card .value',
      '.stat-card .value',
      '.kpi-card .number',
      '.summary-card .amount',
      '.performance-card .metric',
      '.analytics-card .value',
      '.stats-card .number',
      
      // Sales specific
      '.sales-metric',
      '.revenue-value',
      '.total-sales',
      '.conversion-rate',
      
      // Data attributes
      '[data-metric]',
      '[data-kpi]',
      '[data-stat]',
      '[data-value]',
      '[data-number]',
      
      // Generic patterns
      '.value',
      '.amount',
      '.total',
      '.count',
      '.percentage',
      '.currency',
      '.number',
      
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
      '.graph',
      '.visualization',
      '.plot-container'
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
      '.performance-ranking',
      '.top-items'
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
    try {
      const headers: string[] = [];
      const rows: (string | number)[][] = [];

      // Extract headers
      const headerRow = table.querySelector('thead tr, tr:first-child');
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th, td');
        headerCells.forEach(cell => {
          headers.push(cell.textContent?.trim() || '');
        });
      }

      // Extract data rows
      const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      dataRows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const rowData: (string | number)[] = [];
        
        cells.forEach(cell => {
          const text = cell.textContent?.trim() || '';
          const numericValue = parseFloat(text.replace(/[^0-9.-]/g, ''));
          
          // Use numeric value if it's a valid number and the text looks numeric
          if (!isNaN(numericValue) && /^\d/.test(text)) {
            rowData.push(numericValue);
          } else {
            rowData.push(text);
          }
        });
        
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      return headers.length > 0 && rows.length > 0 ? { headers, rows } : null;
    } catch (error) {
      console.warn('Error extracting table data:', error);
      return null;
    }
  };

  const getTableName = (table: HTMLElement, selector: string, selectorIndex: number, elementIndex: number): string => {
    // Try data-table attribute first
    const dataTable = table.closest('[data-table]')?.getAttribute('data-table');
    if (dataTable) {
      return dataTable.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Try to find nearby heading
    const container = table.closest('section, .card, .widget, div[class*="section"]');
    if (container) {
      const heading = container.querySelector('h1, h2, h3, h4, h5, h6, .title, .heading');
      if (heading?.textContent?.trim()) {
        return heading.textContent.trim();
      }
    }

    // Try table caption or aria-label
    const caption = table.querySelector('caption');
    if (caption?.textContent?.trim()) {
      return caption.textContent.trim();
    }

    const ariaLabel = table.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    return `Table ${selectorIndex + 1}`;
  };

  const getTableLocation = (element: HTMLElement): string => {
    const parents: string[] = [];
    
    let current = element.parentElement;
    while (current && parents.length < 3) {
      if (current.className) {
        const classes = current.className.split(' ').filter(c => 
          c.includes('section') || c.includes('tab') || c.includes('panel') || c.includes('card')
        );
        if (classes.length > 0) {
          parents.push(classes[0]);
        }
      }
      current = current.parentElement;
    }
    
    return parents.length > 0 ? parents.join(' > ') : currentTab;
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

  // Export functions would go here (Excel, CSV, PDF, etc.)
  const exportToExcel = async () => {
    // Implementation for Excel export
  };

  // Reset modal when it opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('scan');
      setDetectedTables([]);
      setDetectedMetrics([]);
      setDetectedCharts([]);
      setDetectedRankings([]);
      setExportProgress(0);
    }
  }, [isOpen]);

  const totalDetected = detectedTables.length + detectedMetrics.length + detectedCharts.length + detectedRankings.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Enhanced Data Export - {locationName}
            <Badge variant="outline">{currentTab}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {['scan', 'select', 'configure', 'export'].map((step, index) => {
            const isActive = currentStep === step;
            const isCompleted = ['scan', 'select', 'configure', 'export'].indexOf(currentStep) > index;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? 'bg-blue-500 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Scan Step */}
        {currentStep === 'scan' && (
          <div className="text-center py-8">
            {isScanning ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                <div>
                  <h3 className="text-lg font-medium">Scanning Dashboard</h3>
                  <p className="text-muted-foreground">
                    Detecting tables, metrics, charts, and rankings...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Search className="h-16 w-16 text-blue-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium">Ready to Scan</h3>
                  <p className="text-muted-foreground">
                    Scan the current dashboard view for exportable data
                  </p>
                </div>
                <Button onClick={performScan} size="lg" className="mt-4">
                  <Search className="h-4 w-4 mr-2" />
                  Start Comprehensive Scan
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Selection Step */}
        {currentStep === 'select' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select Data to Export</h3>
              <p className="text-sm text-muted-foreground">
                Found {totalDetected} exportable items. Choose what you want to export.
              </p>
            </div>

            {/* Tables Section */}
            {detectedTables.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">Tables ({detectedTables.length})</h4>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      const allSelected = detectedTables.every(t => config.selectedTables.includes(t.id));
                      setConfig(prev => ({
                        ...prev,
                        selectedTables: allSelected 
                          ? prev.selectedTables.filter(id => !detectedTables.some(t => t.id === id))
                          : [...prev.selectedTables, ...detectedTables.map(t => t.id)]
                      }));
                    }}
                  >
                    {detectedTables.every(t => config.selectedTables.includes(t.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {detectedTables.map((table) => (
                    <div key={table.id} className="flex items-center space-x-2 p-2 border rounded">
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
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{table.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {table.rowCount} rows × {table.columnCount} columns
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">{table.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Section */}
            {detectedMetrics.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">Metrics & KPIs ({detectedMetrics.length})</h4>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      const allSelected = detectedMetrics.every(m => config.selectedMetrics.includes(m.id));
                      setConfig(prev => ({
                        ...prev,
                        selectedMetrics: allSelected 
                          ? prev.selectedMetrics.filter(id => !detectedMetrics.some(m => m.id === id))
                          : [...prev.selectedMetrics, ...detectedMetrics.map(m => m.id)]
                      }));
                    }}
                  >
                    {detectedMetrics.every(m => config.selectedMetrics.includes(m.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {detectedMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={config.selectedMetrics.includes(metric.id)}
                        onCheckedChange={(checked) => {
                          setConfig(prev => ({
                            ...prev,
                            selectedMetrics: checked 
                              ? [...prev.selectedMetrics, metric.id]
                              : prev.selectedMetrics.filter(id => id !== metric.id)
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{metric.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {metric.value} {metric.change && `(${metric.change})`}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{metric.category}</Badge>
                      {metric.trend && (
                        <div className="text-xs">
                          {metric.trend === 'up' && '📈'}
                          {metric.trend === 'down' && '📉'}
                          {metric.trend === 'stable' && '➡️'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts Section */}
            {detectedCharts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium">Charts & Visuals ({detectedCharts.length})</h4>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      const allSelected = detectedCharts.every(c => config.selectedCharts.includes(c.id));
                      setConfig(prev => ({
                        ...prev,
                        selectedCharts: allSelected 
                          ? prev.selectedCharts.filter(id => !detectedCharts.some(c => c.id === id))
                          : [...prev.selectedCharts, ...detectedCharts.map(c => c.id)]
                      }));
                    }}
                  >
                    {detectedCharts.every(c => config.selectedCharts.includes(c.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {detectedCharts.map((chart) => (
                    <div key={chart.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={config.selectedCharts.includes(chart.id)}
                        onCheckedChange={(checked) => {
                          setConfig(prev => ({
                            ...prev,
                            selectedCharts: checked 
                              ? [...prev.selectedCharts, chart.id]
                              : prev.selectedCharts.filter(id => id !== chart.id)
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{chart.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(chart.dimensions.width)}×{Math.round(chart.dimensions.height)}px
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{chart.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rankings Section */}
            {detectedRankings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-orange-500" />
                  <h4 className="font-medium">Rankings & Leaderboards ({detectedRankings.length})</h4>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      const allSelected = detectedRankings.every(r => config.selectedRankings.includes(r.id));
                      setConfig(prev => ({
                        ...prev,
                        selectedRankings: allSelected 
                          ? prev.selectedRankings.filter(id => !detectedRankings.some(r => r.id === id))
                          : [...prev.selectedRankings, ...detectedRankings.map(r => r.id)]
                      }));
                    }}
                  >
                    {detectedRankings.every(r => config.selectedRankings.includes(r.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {detectedRankings.map((ranking) => (
                    <div key={ranking.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={config.selectedRankings.includes(ranking.id)}
                        onCheckedChange={(checked) => {
                          setConfig(prev => ({
                            ...prev,
                            selectedRankings: checked 
                              ? [...prev.selectedRankings, ranking.id]
                              : prev.selectedRankings.filter(id => id !== ranking.id)
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ranking.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {ranking.items.length} items
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">ranking</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalDetected === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Found</h3>
                <p className="text-muted-foreground mb-4">No exportable data detected in the current view.</p>
                <Button onClick={() => setCurrentStep('scan')} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Scan Again
                </Button>
              </div>
            )}

            {totalDetected > 0 && (
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setCurrentStep('scan')} variant="outline" className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Scan
                </Button>
                <Button 
                  onClick={() => setCurrentStep('configure')} 
                  className="flex-1"
                  disabled={totalDetected === 0 || (
                    config.selectedTables.length === 0 && 
                    config.selectedMetrics.length === 0 && 
                    config.selectedCharts.length === 0 && 
                    config.selectedRankings.length === 0
                  )}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Configuration and Export steps would continue here... */}
        
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedRobustDataExportModal;