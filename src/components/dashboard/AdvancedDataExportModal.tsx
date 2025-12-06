import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Image,
  FileImage,
  Copy,
  ExternalLink,
  Bot,
  Sparkles,
  Settings,
  Palette,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Table,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Package,
  CreditCard,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  Star,
  Award,
  Send,
  Layers,
  Grid,
  Layout,
  Brush,
  Lock,
  Unlock,
  Clock,
  Globe,
  Share2,
  RefreshCw,
  X,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Trash2,
  Edit,
  Monitor
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';

interface TableData {
  id: string;
  name: string;
  displayName: string;
  headers: string[];
  rows: (string | number)[][];
  metadata: {
    source: string;
    totalRows: number;
    visibleRows: number;
    columns: number;
    lastUpdated: string;
    dataTypes: Record<string, 'text' | 'number' | 'currency' | 'percentage' | 'date'>;
    summary: Record<string, any>;
  };
  isVisible: boolean;
  element?: HTMLElement;
  category: 'performance' | 'analysis' | 'behavior' | 'financial' | 'operational';
}

interface ChartData {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  element?: HTMLElement;
  data: any[];
  isVisible: boolean;
}

interface MetricData {
  id: string;
  name: string;
  value: string | number;
  rawValue: number;
  category: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  format: 'currency' | 'number' | 'percentage' | 'text';
  element?: HTMLElement;
}

interface ExportConfig {
  // Data Selection
  includeTables: string[];
  includeCharts: string[];
  includeMetrics: string[];
  includeRawData: boolean;
  includeMetadata: boolean;
  includeVisualElements: boolean;
  
  // Format Options
  format: 'excel' | 'csv' | 'json' | 'pdf' | 'png' | 'svg' | 'html';
  multiFile: boolean;
  compression: 'none' | 'zip' | 'gzip';
  
  // Styling & Appearance
  theme: 'professional' | 'modern' | 'minimal' | 'colorful' | 'dark' | 'neon';
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'gradient';
  fontSize: number;
  includeHeaders: boolean;
  includeBranding: boolean;
  includeTimestamp: boolean;
  includeWatermark: boolean;
  watermarkText: string;
  
  // Advanced Options
  passwordProtect: boolean;
  password: string;
  splitLargeFiles: boolean;
  maxRowsPerSheet: number;
  includeFormulas: boolean;
  preserveFormatting: boolean;
  optimizeForPrint: boolean;
  
  // AI Enhancement
  aiEnhanced: boolean;
  includeAISummary: boolean;
  includeAIInsights: boolean;
  aiPromptContext: string;
  
  // Sharing Options
  copyToClipboard: boolean;
  openInChatGPT: boolean;
  generateShareLink: boolean;
  emailExport: boolean;
  scheduleExport: boolean;
}

interface AdvancedDataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  currentLocation: string;
  locationName: string;
  activeMetric?: string;
  filters?: any;
  data?: any[];
  onExport?: (data: any, config: ExportConfig) => void;
}

export const AdvancedDataExportModal: React.FC<AdvancedDataExportModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  currentLocation,
  locationName,
  activeMetric,
  filters,
  data = [],
  onExport
}) => {
  const [currentStep, setCurrentStep] = useState<'discover' | 'select' | 'format' | 'style' | 'advanced' | 'preview' | 'export'>('discover');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState<'table' | 'chart' | 'code'>('table');
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<string>('');
  
  const { toast } = useToast();
  
  // Detected data
  const [detectedTables, setDetectedTables] = useState<TableData[]>([]);
  const [detectedCharts, setDetectedCharts] = useState<ChartData[]>([]);
  const [detectedMetrics, setDetectedMetrics] = useState<MetricData[]>([]);
  
  // Configuration
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeTables: [],
    includeCharts: [],
    includeMetrics: [],
    includeRawData: false,
    includeMetadata: true,
    includeVisualElements: true,
    format: 'excel',
    multiFile: false,
    compression: 'none',
    theme: 'professional',
    colorScheme: 'blue',
    fontSize: 12,
    includeHeaders: true,
    includeBranding: true,
    includeTimestamp: true,
    includeWatermark: false,
    watermarkText: '',
    passwordProtect: false,
    password: '',
    splitLargeFiles: false,
    maxRowsPerSheet: 100000,
    includeFormulas: false,
    preserveFormatting: true,
    optimizeForPrint: false,
    aiEnhanced: false,
    includeAISummary: false,
    includeAIInsights: false,
    aiPromptContext: '',
    copyToClipboard: false,
    openInChatGPT: false,
    generateShareLink: false,
    emailExport: false,
    scheduleExport: false
  });

  // Advanced table detection with multiple strategies
  const detectTablesAdvanced = (): TableData[] => {
    const tables: TableData[] = [];
    
    // Enhanced selectors for better detection
    const selectors = [
      // Direct table elements
      'table[role="table"]',
      'table.table',
      'table',
      
      // Data grid components
      '[role="grid"]',
      '[data-table]',
      '.data-table',
      '.table-container table',
      
      // Modern component patterns
      '[class*="table"]',
      '[class*="grid"]',
      '[class*="data"]',
      
      // Framework specific
      '.ag-theme-alpine',
      '.react-table',
      '.tanstack-table',
      
      // Custom patterns
      '[aria-label*="table"]',
      '[aria-label*="grid"]',
      '[aria-describedby*="table"]'
    ];

    selectors.forEach((selector, selectorIndex) => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element, elementIndex) => {
        const table = element as HTMLElement;
        
        // Enhanced visibility check
        const isVisible = isElementVisible(table);
        if (!isVisible) return;
        
        // Skip nested tables to avoid duplicates
        const parentTable = table.closest('table');
        if (parentTable && parentTable !== table) return;
        
        // Extract table data with enhanced logic
        const tableData = extractTableDataAdvanced(table, selectorIndex, elementIndex);
        if (tableData) {
          tables.push(tableData);
        }
      });
    });

    // Remove duplicates based on content similarity
    return deduplicateTables(tables);
  };

  const isElementVisible = (element: HTMLElement): boolean => {
    // Multiple visibility checks
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    return (
      element.offsetParent !== null &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top < window.innerHeight &&
      rect.bottom > 0
    );
  };

  const extractTableDataAdvanced = (table: HTMLElement, selectorIndex: number, elementIndex: number): TableData | null => {
    try {
      const headers: string[] = [];
      const rows: (string | number)[][] = [];
      const dataTypes: Record<string, 'text' | 'number' | 'currency' | 'percentage' | 'date'> = {};
      
      // Find headers with multiple strategies
      let headerRow: Element | null = null;
      
      // Strategy 1: thead > tr
      headerRow = table.querySelector('thead tr');
      
      // Strategy 2: first row with th elements
      if (!headerRow) {
        headerRow = table.querySelector('tr:has(th)');
      }
      
      // Strategy 3: first row if no th elements found
      if (!headerRow) {
        headerRow = table.querySelector('tr');
      }
      
      // Strategy 4: Look for aria-labels or data attributes
      if (!headerRow) {
        const rows = table.querySelectorAll('tr');
        if (rows.length > 0) {
          headerRow = rows[0];
        }
      }
      
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th, td, [role="columnheader"], [data-header]');
        headerCells.forEach((cell, index) => {
          let text = extractTextContent(cell);
          if (text && !headers.includes(text)) {
            headers.push(text);
            // Detect data type from header
            dataTypes[text] = inferDataType(text);
          }
        });
      }
      
      // Extract data rows with enhanced logic
      const allRows = table.querySelectorAll('tr, [role="row"]');
      let processedRows = 0;
      
      allRows.forEach((row, rowIndex) => {
        if (row === headerRow || processedRows >= 10000) return; // Skip header and limit for performance
        
        const cells = row.querySelectorAll('td, th, [role="cell"], [role="gridcell"]');
        if (cells.length === 0) return;
        
        const rowData: (string | number)[] = [];
        let hasContent = false;
        
        cells.forEach((cell, cellIndex) => {
          const text = extractTextContent(cell);
          const processedValue = processValue(text, headers[cellIndex] || '', dataTypes);
          rowData.push(processedValue);
          if (processedValue !== '') hasContent = true;
        });
        
        if (hasContent && rowData.length > 0) {
          rows.push(rowData);
          processedRows++;
        }
      });
      
      // Only include tables with meaningful data
      if (headers.length === 0 || rows.length === 0) return null;
      
      // Generate metadata
      const summary = generateTableSummary(headers, rows, dataTypes);
      const category = categorizeTable(headers, summary);
      const tableName = generateTableName(table, headers, category, selectorIndex, elementIndex);
      
      return {
        id: `table-${selectorIndex}-${elementIndex}-${Date.now()}`,
        name: tableName.id,
        displayName: tableName.display,
        headers,
        rows,
        metadata: {
          source: table.tagName.toLowerCase() + (table.className ? `.${table.className.split(' ')[0]}` : ''),
          totalRows: rows.length,
          visibleRows: Math.min(rows.length, 1000),
          columns: headers.length,
          lastUpdated: new Date().toISOString(),
          dataTypes,
          summary
        },
        isVisible: true,
        element: table,
        category
      };
    } catch (error) {
      console.warn('Failed to extract table data:', error);
      return null;
    }
  };

  const extractTextContent = (element: Element): string => {
    // Enhanced text extraction
    let text = '';
    
    // Try textContent first
    text = element.textContent?.trim() || '';
    
    // Clean up the text
    text = text
      .replace(/[↑↓▲▼⟳⟴]/g, '') // Remove sort indicators
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return text;
  };

  const processValue = (text: string, header: string, dataTypes: Record<string, string>): string | number => {
    if (!text) return '';
    
    // Detect and convert numbers
    const cleanText = text.replace(/[,$%]/g, '');
    const numericValue = parseFloat(cleanText);
    
    if (!isNaN(numericValue)) {
      // Currency
      if (text.includes('$') || text.includes('₹') || header.toLowerCase().includes('price') || header.toLowerCase().includes('revenue')) {
        return numericValue;
      }
      // Percentage
      if (text.includes('%')) {
        return numericValue;
      }
      // Regular number
      if (/^\d+\.?\d*$/.test(cleanText)) {
        return numericValue;
      }
    }
    
    return text;
  };

  const inferDataType = (header: string): 'text' | 'number' | 'currency' | 'percentage' | 'date' => {
    const lower = header.toLowerCase();
    if (lower.includes('price') || lower.includes('revenue') || lower.includes('cost') || lower.includes('amount')) return 'currency';
    if (lower.includes('percent') || lower.includes('rate') || lower.includes('%')) return 'percentage';
    if (lower.includes('date') || lower.includes('time') || lower.includes('created') || lower.includes('updated')) return 'date';
    if (lower.includes('count') || lower.includes('total') || lower.includes('number') || lower.includes('qty')) return 'number';
    return 'text';
  };

  const generateTableSummary = (headers: string[], rows: (string | number)[][], dataTypes: Record<string, string>) => {
    const summary: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      const columnData = rows.map(row => row[index]).filter(val => val !== '');
      const dataType = dataTypes[header] || 'text';
      
      if (dataType === 'number' || dataType === 'currency') {
        const numbers = columnData.filter(val => typeof val === 'number') as number[];
        if (numbers.length > 0) {
          summary[header] = {
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
            count: numbers.length
          };
        }
      } else {
        summary[header] = {
          uniqueValues: new Set(columnData).size,
          totalValues: columnData.length,
          mostCommon: getMostCommonValue(columnData)
        };
      }
    });
    
    return summary;
  };

  const getMostCommonValue = (values: (string | number)[]): string | number => {
    const counts: Record<string, number> = {};
    values.forEach(val => {
      const key = String(val);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
  };

  const categorizeTable = (headers: string[], summary: Record<string, any>): TableData['category'] => {
    const headerText = headers.join(' ').toLowerCase();
    
    if (headerText.includes('revenue') || headerText.includes('sales') || headerText.includes('payment')) return 'financial';
    if (headerText.includes('performance') || headerText.includes('metric') || headerText.includes('kpi')) return 'performance';
    if (headerText.includes('behavior') || headerText.includes('customer') || headerText.includes('user')) return 'behavior';
    if (headerText.includes('analysis') || headerText.includes('comparison') || headerText.includes('trend')) return 'analysis';
    return 'operational';
  };

  const generateTableName = (table: HTMLElement, headers: string[], category: string, selectorIndex: number, elementIndex: number) => {
    // Try to find a meaningful name from context
    let contextName = '';
    
    // Look for nearby headings
    const nearbyHeading = table.closest('[data-table]')?.getAttribute('data-table') ||
                         table.closest('section, div')?.querySelector('h1, h2, h3, h4')?.textContent ||
                         table.getAttribute('aria-label') ||
                         table.getAttribute('data-testid') ||
                         '';
    
    if (nearbyHeading) {
      contextName = nearbyHeading.trim();
    } else {
      // Generate name from headers
      const keyHeaders = headers.slice(0, 3).join(', ');
      contextName = `${category.charAt(0).toUpperCase() + category.slice(1)} Data`;
      if (keyHeaders) contextName += ` (${keyHeaders})`;
    }
    
    return {
      id: contextName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      display: contextName
    };
  };

  const deduplicateTables = (tables: TableData[]): TableData[] => {
    const unique: TableData[] = [];
    const signatures = new Set<string>();
    
    tables.forEach(table => {
      // Create signature from headers and first few rows
      const signature = table.headers.join('|') + table.rows.slice(0, 3).map(row => row.join('|')).join('||');
      
      if (!signatures.has(signature)) {
        signatures.add(signature);
        unique.push(table);
      }
    });
    
    return unique;
  };

  // Enhanced metric detection
  const detectMetrics = (): MetricData[] => {
    const metrics: MetricData[] = [];
    
    // Look for metric cards, KPI displays, summary stats
    const metricSelectors = [
      '[class*="metric"]',
      '[class*="kpi"]',
      '[class*="stat"]',
      '[class*="summary"]',
      '[data-metric]',
      '[role="img"][aria-label*="metric"]',
      '.card .number, .card .value',
      '.summary-card',
      '.hero-metric'
    ];

    metricSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const metric = extractMetric(element as HTMLElement);
        if (metric) metrics.push(metric);
      });
    });

    return metrics;
  };

  const extractMetric = (element: HTMLElement): MetricData | null => {
    try {
      // Extract value and label
      const valueElement = element.querySelector('.value, .number, [data-value]') || element;
      const labelElement = element.querySelector('.label, .title, [data-label]') || element;
      
      const valueText = valueElement.textContent?.trim() || '';
      const labelText = labelElement.textContent?.trim() || '';
      
      if (!valueText || !labelText) return null;
      
      const format = inferMetricFormat(valueText);
      const rawValue = parseFloat(valueText.replace(/[^\d.-]/g, '')) || 0;
      
      return {
        id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: labelText,
        value: valueText,
        rawValue,
        category: 'general',
        format,
        element
      };
    } catch {
      return null;
    }
  };

  const inferMetricFormat = (value: string): MetricData['format'] => {
    if (value.includes('$') || value.includes('₹')) return 'currency';
    if (value.includes('%')) return 'percentage';
    if (/^\d+\.?\d*$/.test(value.replace(/,/g, ''))) return 'number';
    return 'text';
  };

  // Enhanced chart detection
  const detectCharts = (): ChartData[] => {
    const charts: ChartData[] = [];
    
    const chartSelectors = [
      'canvas',
      'svg[class*="chart"]',
      '[class*="recharts"]',
      '[class*="chart"]',
      '[data-chart]',
      '.chart-container'
    ];

    chartSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        if (isElementVisible(element as HTMLElement)) {
          charts.push({
            id: `chart-${index}`,
            name: `Chart ${index + 1}`,
            type: 'bar', // Default, could be enhanced
            element: element as HTMLElement,
            data: [],
            isVisible: true
          });
        }
      });
    });

    return charts;
  };

  // Smart scanning with progress
  const performSmartScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      // Step 1: Scan for tables
      setScanProgress(25);
      await new Promise(resolve => setTimeout(resolve, 300));
      const tables = detectTablesAdvanced();
      
      // Step 2: Scan for metrics
      setScanProgress(50);
      await new Promise(resolve => setTimeout(resolve, 200));
      const metrics = detectMetrics();
      
      // Step 3: Scan for charts
      setScanProgress(75);
      await new Promise(resolve => setTimeout(resolve, 200));
      const charts = detectCharts();
      
      // Step 4: Process and organize
      setScanProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setDetectedTables(tables);
      setDetectedMetrics(metrics);
      setDetectedCharts(charts);
      
      // Auto-select all detected items
      setExportConfig(prev => ({
        ...prev,
        includeTables: tables.map(t => t.id),
        includeMetrics: metrics.map(m => m.id),
        includeCharts: charts.map(c => c.id)
      }));
      
      if (tables.length > 0 || metrics.length > 0 || charts.length > 0) {
        setCurrentStep('select');
        toast({
          title: "🎉 Smart Scan Complete!",
          description: `Found ${tables.length} tables, ${metrics.length} metrics, and ${charts.length} charts.`,
        });
      } else {
        toast({
          title: "⚠️ No Data Found",
          description: "Try switching to a tab with visible data tables or charts.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Scan Failed",
        description: "Could not detect data elements. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  // Auto-scan when modal opens
  useEffect(() => {
    if (isOpen && currentStep === 'discover') {
      const timer = setTimeout(() => {
        performSmartScan();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep]);

  // Modern step navigation
  const steps = [
    { id: 'discover', label: 'Discover', icon: Search, description: 'Smart data detection' },
    { id: 'select', label: 'Select', icon: CheckCircle2, description: 'Choose what to export' },
    { id: 'format', label: 'Format', icon: FileSpreadsheet, description: 'Pick output format' },
    { id: 'style', label: 'Style', icon: Palette, description: 'Customize appearance' },
    { id: 'advanced', label: 'Advanced', icon: Settings, description: 'Power user options' },
    { id: 'preview', label: 'Preview', icon: Eye, description: 'Review before export' },
    { id: 'export', label: 'Export', icon: Download, description: 'Generate files' }
  ] as const;

  const StepNavigation = () => (
    <div className="flex items-center justify-between mb-8 p-1 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
        const Icon = step.icon;
        
        return (
          <div
            key={step.id}
            className={cn(
              "flex-1 flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all duration-300",
              isActive && "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105",
              !isActive && isCompleted && "bg-green-100 text-green-700 hover:bg-green-200",
              !isActive && !isCompleted && "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
            onClick={() => {
              if (isCompleted || isActive) {
                setCurrentStep(step.id);
              }
            }}
          >
            <Icon className={cn(
              "w-5 h-5 mb-1",
              isActive && "animate-pulse"
            )} />
            <span className="text-xs font-medium">{step.label}</span>
          </div>
        );
      })}
    </div>
  );

  // Format selection cards with enhanced visuals
  const FormatCard = ({ format, icon: Icon, name, description, features, recommended }: {
    format: string;
    icon: React.ComponentType<any>;
    name: string;
    description: string;
    features: string[];
    recommended?: boolean;
  }) => (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-xl border-2 relative overflow-hidden",
        exportConfig.format === format 
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg scale-105" 
          : "border-slate-200 hover:border-blue-300"
      )}
      onClick={() => setExportConfig(prev => ({ ...prev, format: format as any }))}
    >
      {recommended && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
            <Award className="w-3 h-3 mr-1" />
            Recommended
          </Badge>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            exportConfig.format === format 
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
              : "bg-slate-100 text-slate-600"
          )}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{name}</h3>
            <p className="text-slate-600 text-sm mb-3">{description}</p>
            <div className="flex flex-wrap gap-1">
              {features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Advanced Data Export Studio
              </DialogTitle>
              <p className="text-slate-600 mt-1">
                Smart detection • Multiple formats • Professional styling • AI enhancement
              </p>
            </div>
          </div>
        </DialogHeader>

        <StepNavigation />

        {/* Step Content */}
        <div className="space-y-6">
          {/* Discover Step */}
          {currentStep === 'discover' && (
            <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-12 text-center">
                {isScanning ? (
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Search className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        🔍 Scanning Your Data
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Our AI is analyzing the page to find tables, charts, and metrics...
                      </p>
                      <Progress value={scanProgress} className="w-64 mx-auto h-3" />
                      <p className="text-sm text-slate-500 mt-2">{scanProgress}% Complete</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <Send className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        🚀 Ready to Discover
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Click below to start our intelligent data detection system
                      </p>
                      <Button 
                        onClick={performSmartScan}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Smart Scan
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Select Step */}
          {currentStep === 'select' && (
            <Tabs defaultValue="tables" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tables" className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Tables ({detectedTables.length})
                </TabsTrigger>
                <TabsTrigger value="metrics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Metrics ({detectedMetrics.length})
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Charts ({detectedCharts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tables" className="space-y-4">
                {detectedTables.length > 0 ? (
                  <div className="grid gap-4">
                    {detectedTables.map((table) => (
                      <Card key={table.id} className={cn(
                        "border-2 cursor-pointer transition-all duration-300",
                        exportConfig.includeTables.includes(table.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      )}
                      onClick={() => {
                        const isSelected = exportConfig.includeTables.includes(table.id);
                        setExportConfig(prev => ({
                          ...prev,
                          includeTables: isSelected 
                            ? prev.includeTables.filter(id => id !== table.id)
                            : [...prev.includeTables, table.id]
                        }));
                      }}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={`bg-${getCategoryColor(table.category)}-100 text-${getCategoryColor(table.category)}-700`}>
                                  {table.category}
                                </Badge>
                                <h3 className="font-bold">{table.displayName}</h3>
                              </div>
                              <p className="text-slate-600 text-sm mb-3">
                                {table.metadata.columns} columns • {table.metadata.totalRows} rows • Last updated: {new Date(table.metadata.lastUpdated).toLocaleTimeString()}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {table.headers.slice(0, 6).map((header, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {header}
                                  </Badge>
                                ))}
                                {table.headers.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{table.headers.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              {exportConfig.includeTables.includes(table.id) ? (
                                <CheckCircle2 className="w-6 h-6 text-blue-500" />
                              ) : (
                                <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
                    <CardContent className="p-12 text-center">
                      <Table className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No Tables Detected</h3>
                      <p className="text-slate-500">Make sure you're on a page with visible data tables.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="metrics">
                {detectedMetrics.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {detectedMetrics.map((metric) => (
                      <Card key={metric.id} className={cn(
                        "border-2 cursor-pointer transition-all duration-300",
                        exportConfig.includeMetrics.includes(metric.id)
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-green-300"
                      )}
                      onClick={() => {
                        const isSelected = exportConfig.includeMetrics.includes(metric.id);
                        setExportConfig(prev => ({
                          ...prev,
                          includeMetrics: isSelected 
                            ? prev.includeMetrics.filter(id => id !== metric.id)
                            : [...prev.includeMetrics, metric.id]
                        }));
                      }}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{metric.name}</h4>
                              <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
                              <Badge variant="secondary">{metric.format}</Badge>
                            </div>
                            {exportConfig.includeMetrics.includes(metric.id) ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
                    <CardContent className="p-12 text-center">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No Metrics Detected</h3>
                      <p className="text-slate-500">Metrics and KPIs will appear here when detected.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="charts">
                {detectedCharts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {detectedCharts.map((chart) => (
                      <Card key={chart.id} className={cn(
                        "border-2 cursor-pointer transition-all duration-300",
                        exportConfig.includeCharts.includes(chart.id)
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-purple-300"
                      )}
                      onClick={() => {
                        const isSelected = exportConfig.includeCharts.includes(chart.id);
                        setExportConfig(prev => ({
                          ...prev,
                          includeCharts: isSelected 
                            ? prev.includeCharts.filter(id => id !== chart.id)
                            : [...prev.includeCharts, chart.id]
                        }));
                      }}>
                        <CardContent className="p-4">
                          <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                            <PieChart className="w-8 h-8 text-slate-400" />
                          </div>
                          <h4 className="font-semibold">{chart.name}</h4>
                          <Badge variant="outline">{chart.type}</Badge>
                          {exportConfig.includeCharts.includes(chart.id) && (
                            <CheckCircle2 className="w-4 h-4 text-purple-500 mt-2" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
                    <CardContent className="p-12 text-center">
                      <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No Charts Detected</h3>
                      <p className="text-slate-500">Charts and visualizations will appear here when found.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Format Step */}
          {currentStep === 'format' && (
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormatCard 
                  format="excel"
                  icon={FileSpreadsheet}
                  name="Excel Workbook"
                  description="Professional spreadsheet with multiple sheets, formulas, and formatting"
                  features={["Multi-sheet", "Formulas", "Charts", "Styling"]}
                  recommended={true}
                />
                <FormatCard 
                  format="csv"
                  icon={FileText}
                  name="CSV Files"
                  description="Comma-separated values for universal compatibility"
                  features={["Lightweight", "Compatible", "Fast"]}
                />
                <FormatCard 
                  format="json"
                  icon={Database}
                  name="JSON Data"
                  description="Structured data format perfect for APIs and web applications"
                  features={["Structured", "API-ready", "Metadata"]}
                />
                <FormatCard 
                  format="pdf"
                  icon={FileText}
                  name="PDF Report"
                  description="Professional document with tables, charts, and formatting"
                  features={["Print-ready", "Professional", "Secure"]}
                />
                <FormatCard 
                  format="png"
                  icon={Image}
                  name="PNG Images"
                  description="High-quality images of tables and charts"
                  features={["Visual", "Shareable", "High-res"]}
                />
                <FormatCard 
                  format="html"
                  icon={Globe}
                  name="HTML Report"
                  description="Interactive web page with styling and responsive design"
                  features={["Interactive", "Responsive", "Styled"]}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <div className="flex gap-3">
              {currentStep !== 'discover' && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    const currentIndex = steps.findIndex(s => s.id === currentStep);
                    if (currentIndex > 0) {
                      setCurrentStep(steps[currentIndex - 1].id);
                    }
                  }}
                >
                  Back
                </Button>
              )}
              <Button 
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  if (currentIndex < steps.length - 1) {
                    setCurrentStep(steps[currentIndex + 1].id);
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8"
                disabled={
                  (currentStep === 'select' && exportConfig.includeTables.length === 0 && exportConfig.includeMetrics.length === 0 && exportConfig.includeCharts.length === 0) ||
                  (currentStep === 'discover' && isScanning)
                }
              >
                {currentStep === 'export' ? 'Generate Export' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    financial: 'green',
    performance: 'blue',
    behavior: 'purple',
    analysis: 'orange',
    operational: 'gray'
  };
  return colors[category] || 'gray';
};