import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Copy, 
  ExternalLink,
  Settings,
  Palette,
  Lock,
  Zap,
  Bot,
  Eye,
  Database,
  Filter,
  Layers,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Package,
  CreditCard,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TableExportData {
  name: string;
  headers: string[];
  rows: (string | number)[][];
  metadata?: {
    totalRows: number;
    generatedAt: string;
    filters?: any;
    currentMetric?: string;
  };
}

interface ExportOptions {
  includeVisibleOnly: boolean;
  includeRawData: boolean;
  includeMetrics: boolean;
  includeCharts: boolean;
  includeMetadata: boolean;
  format: 'excel' | 'csv' | 'json' | 'pdf';
  styling: {
    theme: 'professional' | 'modern' | 'minimal' | 'colorful';
    includeHeaders: boolean;
    includeBranding: boolean;
    includeTimestamp: boolean;
  };
  security: {
    passwordProtect: boolean;
    password?: string;
    watermark?: string;
  };
  advanced: {
    compressOutput: boolean;
    splitLargeFiles: boolean;
    maxRowsPerSheet: number;
  };
}

interface SmartExportData {
  visibleTables: TableExportData[];
  metrics: Array<{
    name: string;
    value: string | number;
    category: string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  charts: Array<{
    name: string;
    type: string;
    data: any[];
  }>;
  metadata: {
    currentTab: string;
    activeLocation: string;
    dateRange: string;
    totalRecords: number;
    exportTime: string;
    filters: any;
  };
}

interface EnhancedSalesExportSystemProps {
  data: SalesData[];
  currentLocation: string;
  locationName: string;
  currentTab?: string;
  activeMetric?: string;
  filters?: any;
  onExport?: (data: any, options: ExportOptions) => void;
  openRef?: React.RefObject<{ open: () => void }>;
}

export const EnhancedSalesExportSystem: React.FC<EnhancedSalesExportSystemProps> = ({
  data,
  currentLocation,
  locationName,
  currentTab = 'Overview',
  activeMetric,
  filters,
  onExport,
  openRef
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'format' | 'options' | 'preview'>('select');
  const { toast } = useToast();

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeVisibleOnly: true,
    includeRawData: false,
    includeMetrics: true,
    includeCharts: true,
    includeMetadata: true,
    format: 'excel',
    styling: {
      theme: 'professional',
      includeHeaders: true,
      includeBranding: true,
      includeTimestamp: true
    },
    security: {
      passwordProtect: false,
      password: '',
      watermark: ''
    },
    advanced: {
      compressOutput: false,
      splitLargeFiles: false,
      maxRowsPerSheet: 50000
    }
  });

  // Expose open function to parent
  useEffect(() => {
    if (openRef) {
      openRef.current = {
        open: () => {
          setIsDialogOpen(true);
          setCurrentStep('select');
        }
      };
    }
  }, [openRef]);

  // Smart table detection - analyzes visible tables and extracts their data
  const extractVisibleTableData = (): TableExportData[] => {
    const tables: TableExportData[] = [];
    
    // Define table selectors for different sections
    const tableSelectors = [
      { selector: '[data-table="year-on-year"]', name: 'Year-on-Year Analysis' },
      { selector: '[data-table="month-on-month"]', name: 'Month-on-Month Comparison' },
      { selector: '[data-table="product-performance"]', name: 'Product Performance' },
      { selector: '[data-table="category-analysis"]', name: 'Category Analysis' },
      { selector: '[data-table="sold-by"]', name: 'Sales Representative Analysis' },
      { selector: '[data-table="payment-methods"]', name: 'Payment Method Analysis' },
      { selector: '[data-table="customer-behavior"]', name: 'Customer Behavior' },
      // Fallback selectors for any visible tables
      { selector: 'table[role="table"]', name: 'Data Table' },
      { selector: '.data-table table', name: 'Analytics Table' },
      { selector: '[role="grid"]', name: 'Grid Data' }
    ];

    tableSelectors.forEach(({ selector, name }, index) => {
      const tableElements = document.querySelectorAll(selector);
      
      tableElements.forEach((tableElement, tableIndex) => {
        const table = tableElement as HTMLElement;
        
        // Check if table is visible
        const isVisible = table.offsetParent !== null && 
                          getComputedStyle(table).display !== 'none' &&
                          getComputedStyle(table).visibility !== 'hidden';
        
        if (!isVisible) return;

        // Extract headers
        const headers: string[] = [];
        const headerRow = table.querySelector('thead tr') || 
                         table.querySelector('tr:has(th)') ||
                         table.querySelector('tr');

        if (headerRow) {
          const headerCells = headerRow.querySelectorAll('th, td');
          headerCells.forEach(cell => {
            let text = cell.textContent?.trim() || '';
            text = text.replace(/[↑↓▲▼⟳]/g, '').trim();
            if (text && !headers.includes(text)) {
              headers.push(text);
            }
          });
        }

        // Extract data rows
        const rows: (string | number)[][] = [];
        const allRows = table.querySelectorAll('tr');
        
        allRows.forEach((row) => {
          if (row === headerRow) return;
          
          const cells = row.querySelectorAll('td, th');
          if (cells.length === 0) return;
          
          const rowData: (string | number)[] = [];
          cells.forEach((cell, cellIndex) => {
            let text = cell.textContent?.trim() || '';
            
            // Try to preserve numbers
            const numericValue = parseFloat(text.replace(/[,$%]/g, ''));
            if (!isNaN(numericValue) && text.includes('$')) {
              rowData.push(numericValue);
            } else if (!isNaN(numericValue) && (text.includes('%') || text.includes('.') || /^\d+$/.test(text))) {
              rowData.push(numericValue);
            } else {
              rowData.push(text);
            }
          });
          
          if (rowData.some(cell => cell !== '')) {
            rows.push(rowData);
          }
        });

        // Only add if we have meaningful data
        if (headers.length > 0 && rows.length > 0) {
          const tableName = tableIndex > 0 ? `${name} ${tableIndex + 1}` : name;
          tables.push({
            name: tableName,
            headers,
            rows,
            metadata: {
              totalRows: rows.length,
              generatedAt: new Date().toISOString(),
              currentMetric: activeMetric,
              filters
            }
          });
        }
      });
    });

    return tables;
  };

  // Generate smart export data
  const generateExportData = (): SmartExportData => {
    const visibleTables = extractVisibleTableData();
    
    // Calculate metrics from current data
    const totalRevenue = data.reduce((sum, item) => sum + item.paymentValue, 0);
    const totalTransactions = data.length;
    const uniqueMembers = new Set(data.map(item => item.memberId)).size;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    const metrics = [
      { name: 'Total Revenue', value: formatCurrency(totalRevenue), category: 'financial', change: 0, trend: 'stable' as const },
      { name: 'Total Transactions', value: formatNumber(totalTransactions), category: 'volume', change: 0, trend: 'stable' as const },
      { name: 'Unique Members', value: formatNumber(uniqueMembers), category: 'customer', change: 0, trend: 'stable' as const },
      { name: 'Average Transaction', value: formatCurrency(avgTransactionValue), category: 'performance', change: 0, trend: 'stable' as const }
    ];

    const metadata = {
      currentTab,
      activeLocation: currentLocation,
      dateRange: filters?.dateRange ? `${filters.dateRange.start} to ${filters.dateRange.end}` : 'All time',
      totalRecords: data.length,
      exportTime: new Date().toISOString(),
      filters: filters || {}
    };

    return {
      visibleTables,
      metrics,
      charts: [], // TODO: Extract chart data if needed
      metadata
    };
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (data: SmartExportData) => {
    try {
      let text = `# Sales Analytics Export\n\n`;
      text += `**Location**: ${locationName}\n`;
      text += `**Date Range**: ${data.metadata.dateRange}\n`;
      text += `**Current Tab**: ${data.metadata.currentTab}\n\n`;
      
      // Add metrics
      text += `## Key Metrics\n`;
      data.metrics.forEach(metric => {
        text += `- **${metric.name}**: ${metric.value}\n`;
      });
      text += '\n';

      // Add table data
      data.visibleTables.forEach(table => {
        text += `## ${table.name}\n`;
        text += `| ${table.headers.join(' | ')} |\n`;
        text += `|${table.headers.map(() => '---').join('|')}|\n`;
        
        table.rows.slice(0, 20).forEach(row => { // Limit to first 20 rows for clipboard
          text += `| ${row.join(' | ')} |\n`;
        });
        
        if (table.rows.length > 20) {
          text += `*... and ${table.rows.length - 20} more rows*\n`;
        }
        text += '\n';
      });

      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "Sales data has been copied in markdown format.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Generate ChatGPT prompt
  const generateChatGPTPrompt = (data: SmartExportData) => {
    let prompt = `Please analyze this sales analytics data from ${locationName}:\n\n`;
    prompt += `Context: ${data.metadata.currentTab} tab data for ${data.metadata.dateRange}\n`;
    prompt += `Total Records: ${data.metadata.totalRecords}\n\n`;
    
    // Key metrics
    prompt += `Key Metrics:\n`;
    data.metrics.forEach(metric => {
      prompt += `- ${metric.name}: ${metric.value}\n`;
    });
    prompt += '\n';

    // Table summaries
    data.visibleTables.forEach(table => {
      prompt += `${table.name} (${table.rows.length} records):\n`;
      prompt += `Headers: ${table.headers.join(', ')}\n`;
      
      // Include sample data
      if (table.rows.length > 0) {
        prompt += `Sample data:\n`;
        table.rows.slice(0, 5).forEach(row => {
          prompt += `${table.headers.map((header, i) => `${header}: ${row[i]}`).join(', ')}\n`;
        });
      }
      prompt += '\n';
    });

    prompt += `Please provide insights on trends, patterns, and recommendations for improving sales performance.`;
    return prompt;
  };

  // Open ChatGPT with data
  const openInChatGPT = (data: SmartExportData) => {
    const prompt = generateChatGPTPrompt(data);
    const encodedPrompt = encodeURIComponent(prompt);
    const chatGPTUrl = `https://chat.openai.com/?q=${encodedPrompt}`;
    window.open(chatGPTUrl, '_blank');
  };

  // Export functions
  const exportToExcel = async (data: SmartExportData) => {
    const workbook = XLSX.utils.book_new();
    
    // Add summary sheet
    const summaryData = [
      ['Sales Analytics Export'],
      ['Generated:', new Date().toLocaleString()],
      ['Location:', locationName],
      ['Tab:', data.metadata.currentTab],
      ['Date Range:', data.metadata.dateRange],
      [''],
      ['Key Metrics:'],
      ...data.metrics.map(m => [m.name, m.value])
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Add each table as a separate sheet
    data.visibleTables.forEach((table, index) => {
      const sheetData = [table.headers, ...table.rows];
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Apply styling if requested
      if (exportOptions.styling.theme === 'professional') {
        // Add some basic styling
        worksheet['!cols'] = table.headers.map(() => ({ wch: 15 }));
      }
      
      const sheetName = table.name.slice(0, 31); // Excel sheet name limit
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `sales-analytics-${currentLocation}-${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(workbook, filename);
  };

  const exportToPDF = async (data: SmartExportData) => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.text('Sales Analytics Report', 20, yPosition);
    yPosition += 15;
    
    // Metadata
    doc.setFontSize(12);
    doc.text(`Location: ${locationName}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date Range: ${data.metadata.dateRange}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;
    
    // Key Metrics
    doc.setFontSize(14);
    doc.text('Key Metrics', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    data.metrics.forEach(metric => {
      doc.text(`${metric.name}: ${metric.value}`, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
    
    // Tables
    data.visibleTables.forEach((table, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.text(table.name, 20, yPosition);
      yPosition += 10;
      
      // Add table using autoTable plugin
      (doc as any).autoTable({
        head: [table.headers],
        body: table.rows.slice(0, 50), // Limit for PDF
        startY: yPosition,
        theme: exportOptions.styling.theme === 'professional' ? 'striped' : 'plain',
        headStyles: { fillColor: [63, 131, 248] },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    });
    
    // Save
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `sales-analytics-${currentLocation}-${timestamp}.pdf`;
    doc.save(filename);
  };

  // Main export handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = generateExportData();
      
      switch (exportOptions.format) {
        case 'excel':
          await exportToExcel(exportData);
          break;
        case 'pdf':
          await exportToPDF(exportData);
          break;
        case 'json':
          const jsonData = JSON.stringify(exportData, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sales-analytics-${currentLocation}-${Date.now()}.json`;
          a.click();
          break;
        case 'csv':
          // Export each table as a separate CSV
          exportData.visibleTables.forEach(table => {
            const csvContent = [
              table.headers.join(','),
              ...table.rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${table.name.replace(/[^a-z0-9]/gi, '-')}.csv`;
            a.click();
          });
          break;
      }
      
      toast({
        title: "Export successful!",
        description: `Data exported in ${exportOptions.format.toUpperCase()} format.`,
      });
      
      onExport?.(exportData, exportOptions);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportData = generateExportData();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Smart Sales Data Export
          </DialogTitle>
          <DialogDescription>
            Export visible data, tables, and analytics from your current view with advanced formatting and sharing options.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} onValueChange={(step) => setCurrentStep(step as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="select" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Select Data
            </TabsTrigger>
            <TabsTrigger value="format" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Format
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Options
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4" />
                    Current View: {currentTab}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Visible Tables Only
                      </Label>
                      <Switch 
                        checked={exportOptions.includeVisibleOnly}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeVisibleOnly: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Include Raw Data
                      </Label>
                      <Switch 
                        checked={exportOptions.includeRawData}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeRawData: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Include Metrics
                      </Label>
                      <Switch 
                        checked={exportOptions.includeMetrics}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeMetrics: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detected Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exportData.visibleTables.map((table, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{table.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {table.headers.length} columns, {table.rows.length} rows
                          </p>
                        </div>
                        <Badge variant="secondary">{table.headers.length}×{table.rows.length}</Badge>
                      </div>
                    ))}
                    {exportData.visibleTables.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <p>No tables detected in current view</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="format" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'excel', label: 'Excel Workbook', icon: FileSpreadsheet, desc: 'Multi-sheet with formatting' },
                { value: 'csv', label: 'CSV Files', icon: FileText, desc: 'Separate file per table' },
                { value: 'pdf', label: 'PDF Report', icon: FileText, desc: 'Formatted document' },
                { value: 'json', label: 'JSON Data', icon: Database, desc: 'Structured data format' }
              ].map(({ value, label, icon: Icon, desc }) => (
                <Card 
                  key={value}
                  className={`cursor-pointer transition-colors ${exportOptions.format === value ? 'border-emerald-500 bg-emerald-50' : 'hover:border-gray-300'}`}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: value as any }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-emerald-600" />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Palette className="w-4 h-4" />
                    Styling & Formatting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Theme</Label>
                    <Select 
                      value={exportOptions.styling.theme} 
                      onValueChange={(value) => setExportOptions(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, theme: value as any }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="colorful">Colorful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="headers"
                        checked={exportOptions.styling.includeHeaders}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, includeHeaders: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="headers" className="text-sm">Include Headers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="branding"
                        checked={exportOptions.styling.includeBranding}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, includeBranding: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="branding" className="text-sm">Include Branding</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4" />
                    Security Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Password Protection</Label>
                    <Switch 
                      checked={exportOptions.security.passwordProtect}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ 
                        ...prev, 
                        security: { ...prev.security, passwordProtect: checked }
                      }))}
                    />
                  </div>
                  {exportOptions.security.passwordProtect && (
                    <Input 
                      type="password" 
                      placeholder="Enter password"
                      value={exportOptions.security.password || ''}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        security: { ...prev.security, password: e.target.value }
                      }))}
                    />
                  )}
                  <div>
                    <Label>Watermark Text</Label>
                    <Input 
                      placeholder="Optional watermark"
                      value={exportOptions.security.watermark || ''}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        security: { ...prev.security, watermark: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Export Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Format:</strong> {exportOptions.format.toUpperCase()}</p>
                    <p><strong>Tables:</strong> {exportData.visibleTables.length}</p>
                    <p><strong>Total Rows:</strong> {exportData.visibleTables.reduce((sum, t) => sum + t.rows.length, 0)}</p>
                    <p><strong>Include Metrics:</strong> {exportOptions.includeMetrics ? 'Yes' : 'No'}</p>
                    <p><strong>Theme:</strong> {exportOptions.styling.theme}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => copyToClipboard(exportData)}
                >
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => openInChatGPT(exportData)}
                >
                  <Bot className="w-4 h-4" />
                  Open in ChatGPT
                </Button>
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export Data
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};