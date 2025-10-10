import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, Loader2, TrendingUp } from 'lucide-react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface TableExportData {
  name: string;
  headers: string[];
  rows: string[][];
}

interface ComprehensiveSalesExportButtonProps {
  data: SalesData[];
  currentLocation: string;
  locationName: string;
  // Refs to table components to extract their processed data
  yearOnYearTableRef?: React.RefObject<any>;
  monthOnMonthTableRef?: React.RefObject<any>;
  productPerformanceTableRef?: React.RefObject<any>;
  categoryPerformanceTableRef?: React.RefObject<any>;
  soldByTableRef?: React.RefObject<any>;
  paymentMethodTableRef?: React.RefObject<any>;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  buttonClassName?: string;
  buttonLabel?: string;
  /** When provided, the component will assign an open() method to this ref so parents can programmatically open the dialog */
  openRef?: React.RefObject<{ open: () => void }>;
  /** If false, hides the default trigger button and only renders the dialog content. */
  renderTrigger?: boolean;
}

interface ExportConfig {
  currentView: boolean;
  monthOnMonth: boolean;
  yearOnYear: boolean;
  productPerformance: boolean;
  categoryPerformance: boolean;
  soldByAnalysis: boolean;
  paymentMethodAnalysis: boolean;
  allTabs: boolean;
}

const LOCATION_MAPPING: Record<string, string> = {
  'all': 'All Locations',
  'kwality': 'Kwality House, Kemps Corner',
  'supreme': 'Supreme HQ, Bandra',
  'kenkere': 'Kenkere House'
};

export const ComprehensiveSalesExportButton: React.FC<ComprehensiveSalesExportButtonProps> = ({
  data,
  currentLocation,
  locationName,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonClassName,
  buttonLabel,
  openRef,
  renderTrigger = true,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Expose programmatic open
  useEffect(() => {
    if (openRef) {
      openRef.current = {
        open: () => setIsDialogOpen(true),
      };
    }
  }, [openRef]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    currentView: true,
    monthOnMonth: true,
    yearOnYear: true,
    productPerformance: true,
    categoryPerformance: true,
    soldByAnalysis: true,
    paymentMethodAnalysis: true,
    allTabs: true
  });

  // Get current tab information
  const getCurrentTabInfo = () => {
    const activeTab = document.querySelector('[role="tab"][data-state="active"]');
    const tabValue = activeTab?.getAttribute('data-value') || 'current-view';
    const tabText = activeTab?.textContent?.trim() || 'Current View';
    return { tabValue, tabText };
  };

  // Extract table data from DOM elements
  const extractTableData = (tableSelector: string, tableName: string): TableExportData | null => {
    const tableElements = document.querySelectorAll(tableSelector);
    if (tableElements.length === 0) {
      console.warn(`No tables found: ${tableSelector}`);
      return null;
    }

    // Use the first visible table or the largest table if multiple found
    let tableElement = tableElements[0] as HTMLTableElement;
    if (tableElements.length > 1) {
      // Find the table with most rows (likely the main data table)
      let maxRows = 0;
      tableElements.forEach(table => {
        const el = table as HTMLTableElement;
        const isVisible = (el as any).offsetParent !== null;
        const rowCount = el.querySelectorAll('tr').length;
        if ((isVisible && maxRows === 0) || rowCount > maxRows) {
          maxRows = rowCount;
          tableElement = el;
        }
      });
    }

    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers - look for thead first, then first tr, then th elements anywhere
    let headerRow = tableElement.querySelector('thead tr');
    if (!headerRow) {
      headerRow = tableElement.querySelector('tr:has(th)');
    }
    if (!headerRow) {
      headerRow = tableElement.querySelector('tr');
    }

    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th, td');
      headerCells.forEach(cell => {
        // Get text content and clean it up
        let text = cell.textContent?.trim() || '';
        // Remove any arrow indicators or sorting symbols
        text = text.replace(/[↑↓▲▼]/g, '').trim();
        headers.push(text);
      });
    }

    // Extract data rows - skip header row if it exists
    const allRows = tableElement.querySelectorAll('tr');
    allRows.forEach((row, index) => {
      // Skip header row
      if (headerRow && row === headerRow) return;
      
      const cells = row.querySelectorAll('td, th');
      if (cells.length === 0) return;
      
      const rowData: string[] = [];
      cells.forEach(cell => {
        // Get text content and clean it up
        let text = cell.textContent?.trim() || '';
        // Handle special cases like buttons, badges, etc.
        if (cell.querySelector('button')) {
          const buttonText = cell.querySelector('button')?.textContent?.trim();
          text = buttonText || text;
        }
        // Clean up currency and number formatting
        text = text.replace(/[↑↓▲▼]/g, '').trim();
        rowData.push(text);
      });
      
      // Only add rows that have actual data
      if (rowData.some(cell => cell.length > 0 && cell !== '—' && cell !== '-')) {
        rows.push(rowData);
      }
    });

    return {
      name: tableName,
      headers,
      rows
    };
  };

  // Lower-level: extract a single table element to data
  const extractTableFromElement = (tableElement: HTMLTableElement, tableName: string): TableExportData => {
    const headers: string[] = [];
    const rows: string[][] = [];

    let headerRow = tableElement.querySelector('thead tr');
    if (!headerRow) headerRow = tableElement.querySelector('tr:has(th)');
    if (!headerRow) headerRow = tableElement.querySelector('tr');

    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th, td');
      headerCells.forEach(cell => {
        let text = cell.textContent?.trim() || '';
        text = text.replace(/[↑↓▲▼]/g, '').trim();
        headers.push(text);
      });
    }

    const allRows = tableElement.querySelectorAll('tr');
    allRows.forEach(row => {
      if (headerRow && row === headerRow) return;
      const cells = row.querySelectorAll('td, th');
      if (cells.length === 0) return;
      const rowData: string[] = [];
      cells.forEach(cell => {
        let text = cell.textContent?.trim() || '';
        if (cell.querySelector('button')) {
          const buttonText = cell.querySelector('button')?.textContent?.trim();
          text = buttonText || text;
        }
        text = text.replace(/[↑↓▲▼]/g, '').trim();
        rowData.push(text);
      });
      if (rowData.some(cell => cell.length > 0 && cell !== '—' && cell !== '-')) {
        rows.push(rowData);
      }
    });

    return { name: tableName, headers, rows };
  };

  // Extract data from visible tables within all active tabpanels
  const extractAllTableData = (): TableExportData[] => {
    const tables: TableExportData[] = [];
    const activePanels = document.querySelectorAll('[role="tabpanel"][data-state="active"]');
    const visibleTables: HTMLTableElement[] = [];

    activePanels.forEach(panel => {
      const tablesInPanel = panel.querySelectorAll('table');
      tablesInPanel.forEach(t => {
        const el = t as HTMLTableElement;
        const style = window.getComputedStyle(el);
        const isVisible = (el as any).offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        if (isVisible) visibleTables.push(el);
      });
    });

    // Fallback: any visible table in document
    if (visibleTables.length === 0) {
      document.querySelectorAll('table').forEach(t => {
        const el = t as HTMLTableElement;
        const style = window.getComputedStyle(el);
        const isVisible = (el as any).offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        if (isVisible) visibleTables.push(el);
      });
    }

    visibleTables.forEach((el, idx) => {
      const name = `Data Table ${idx + 1}`;
      const data = extractTableFromElement(el, name);
      if (data.rows.length > 0) tables.push(data);
    });

    return tables;
  };

  // Metric labels used by ModernMetricTabs across tables. We will iterate these to export per-metric variants.
  const METRIC_LABELS = [
    'Revenue',
    'Units Sold',
    'Transactions',
    'Members',
    'AUV',
    'ATV',
    'ASV',
    'UPT',
    'VAT',
    'Discount ₹',
    'Discount %',
    'Purchase Freq.'
  ];

  // Click helper
  const clickElement = async (el: Element | null, waitMs = 300) => {
    if (el instanceof HTMLElement) {
      try {
        el.scrollIntoView({ block: 'center' });
        el.click();
        await new Promise(r => setTimeout(r, waitMs));
      } catch (e) {
        console.warn('Failed to click element', e);
      }
    }
  };

  // Export tables for each metric in the currently active analysis section
  const exportMetricVariantsForActiveSection = async (locationSuffix: string, timestamp: string, sectionTag: string) => {
    // Find metric buttons inside the active panel by matching known labels
    const activePanel = document.querySelector('[role="tabpanel"][data-state="active"], [data-state="active"][role="tabpanel"], [data-state="active"]') as HTMLElement | null;
    if (!activePanel) return;

    // Collect unique buttons by their text content
    const metricButtons: HTMLElement[] = [];
    METRIC_LABELS.forEach(label => {
      const btn = Array.from(activePanel.querySelectorAll('button'))
        .find(b => (b.textContent || '').trim() === label) as HTMLElement | undefined;
      if (btn && !metricButtons.includes(btn)) metricButtons.push(btn);
    });

    if (metricButtons.length === 0) return; // No metric toggles in this section

    for (const btn of metricButtons) {
      const metricLabel = (btn.textContent || '').trim();
      await clickElement(btn, 350);

      // After toggling metric, extract current visible tables
      const perMetricTables = extractAllTableData();
      for (const table of perMetricTables) {
        let csvContent = '';
        // Optional metadata header
        csvContent += `# Sales Analytics Export\n`;
        csvContent += `# Section: ${sectionTag}\n`;
        csvContent += `# Metric: ${metricLabel}\n`;
        csvContent += `# Location: ${locationSuffix}\n`;
        csvContent += `# Export Time: ${new Date().toLocaleString()}\n`;
        csvContent += `# Table: ${table.name}\n\n`;

        if (table.headers.length > 0) {
          csvContent += table.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
        }
        table.rows.forEach(row => {
          csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
        });

        const cleanSection = sectionTag.replace(/[^a-zA-Z0-9\-]/g, '-');
        const cleanMetric = metricLabel.replace(/[^a-zA-Z0-9\-]/g, '-');
        const cleanTableName = table.name.replace(/[^a-zA-Z0-9\-\s]/g, '').replace(/\s+/g, '-');
        const fileName = `${cleanSection}-${cleanMetric}-${cleanTableName}-${locationSuffix}-${timestamp}.csv`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const locationSuffix = currentLocation === 'all' ? 'All-Locations' : LOCATION_MAPPING[currentLocation] || currentLocation;
      
      // Extract data from currently visible tables
      const tableData = extractAllTableData();
      
      if (tableData.length === 0) {
        alert('No table data found to export. Please ensure tables are loaded and visible.');
        return;
      }

      // Export each table as a separate CSV file (current view)
      for (const table of tableData) {
        let csvContent = '';
        
        // Add headers
        if (table.headers.length > 0) {
          csvContent += table.headers.join(',') + '\n';
        }
        
        // Add rows
        table.rows.forEach(row => {
          csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
        });

        // Create and download file
        const fileName = `${table.name.replace(/\s+/g, '-')}-${locationSuffix}-${timestamp}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Also export per-metric variants for the current active section
      const currentTab = document.querySelector('[role="tab"][data-state="active"]');
      const currentTabText = (currentTab?.textContent || '').trim() || 'current-view';
      await exportMetricVariantsForActiveSection(locationSuffix, timestamp, currentTabText);

      // Also export all tabs if the user wants comprehensive data
      if (exportConfig.yearOnYear || exportConfig.monthOnMonth || exportConfig.productPerformance || 
          exportConfig.categoryPerformance || exportConfig.soldByAnalysis || exportConfig.paymentMethodAnalysis || exportConfig.allTabs) {
        await exportAllTabsData(locationSuffix, timestamp);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Build a consolidated printable HTML string from table data
  const buildPrintableHtml = (title: string, sections: Array<{ heading: string; subtitle?: string; tables: TableExportData[] }>) => {
    const styles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1 { font-size: 20px; margin: 0 0 16px; }
        h2 { font-size: 16px; margin: 24px 0 8px; color: #334155; }
        h3 { font-size: 14px; margin: 12px 0 8px; color: #475569; }
        .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; margin: 8px 0 24px; font-size: 12px; }
        th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
        thead th { background: #0f172a; color: white; position: sticky; top: 0; }
        .page-break { page-break-after: always; height: 0; }
      </style>
    `;
    let html = `<!doctype html><html><head><meta charset="utf-8" />${styles}<title>${title}</title></head><body>`;
    html += `<h1>${title}</h1>`;
    html += `<div class="meta">Generated: ${new Date().toLocaleString()} | Location: ${locationName}</div>`;
    sections.forEach((sec, sIdx) => {
      html += `<h2>${sec.heading}</h2>`;
      if (sec.subtitle) html += `<div class="meta">${sec.subtitle}</div>`;
      sec.tables.forEach((t, tIdx) => {
        html += `<h3>${t.name}</h3>`;
        if (t.headers.length || t.rows.length) {
          html += '<table><thead><tr>' + (t.headers.map(h => `<th>${h}</th>`).join('')) + '</tr></thead><tbody>';
          t.rows.forEach(r => {
            html += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>';
          });
          html += '</tbody></table>';
        }
      });
      if (sIdx < sections.length - 1) html += '<div class="page-break"></div>';
    });
    html += '</body></html>';
    return html;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const sections: Array<{ heading: string; subtitle?: string; tables: TableExportData[] }> = [];

      // Current view
      if (exportConfig.currentView) {
        const currentTables = extractAllTableData();
        if (currentTables.length > 0) {
          const { tabText } = getCurrentTabInfo();
          sections.push({ heading: `Current View – ${tabText}`, subtitle: 'Filtered tables as displayed', tables: currentTables });
        }
      }

      // All configured tabs
      if (exportConfig.allTabs || exportConfig.monthOnMonth || exportConfig.yearOnYear || exportConfig.productPerformance || exportConfig.categoryPerformance || exportConfig.soldByAnalysis || exportConfig.paymentMethodAnalysis) {
        const tabTriggers = document.querySelectorAll('[role="tab"]');
        const originalActiveTab = document.querySelector('[role="tab"][data-state="active"]');
        const tabMapping: Record<keyof ExportConfig, string[]> = {
          currentView: [],
          monthOnMonth: ['monthOnMonth', 'month-on-month'],
          yearOnYear: ['yearOnYear', 'year-on-year'],
          productPerformance: ['productPerformance', 'product-performance'],
          categoryPerformance: ['categoryPerformance', 'category-performance'],
          soldByAnalysis: ['soldByAnalysis', 'sold-by', 'soldBy'],
          paymentMethodAnalysis: ['paymentMethodAnalysis', 'payment-method', 'paymentMethod'],
          allTabs: []
        };

        for (const trigger of tabTriggers) {
          if (!(trigger instanceof HTMLElement)) continue;
          const tabLabel = trigger.textContent?.trim() || '';
          const normalizedLabel = tabLabel.replace(/\s+/g, '-').toLowerCase();
          const dataValue = trigger.getAttribute('data-value') || '';
          const tabValue = (dataValue || normalizedLabel || 'unknown');

          let shouldExport = exportConfig.allTabs;
          if (!shouldExport) {
            for (const [configKey, configValue] of Object.entries(exportConfig)) {
              if (configValue && configKey !== 'currentView' && configKey !== 'allTabs') {
                const mappedValues = tabMapping[configKey as keyof ExportConfig] || [];
                if (mappedValues.some(mapped => tabValue.includes(mapped) || mapped.includes(tabValue) || normalizedLabel.includes(mapped))) {
                  shouldExport = true; break;
                }
              }
            }
          }
          if (!shouldExport) continue;

          trigger.click();
          await new Promise(r => setTimeout(r, 800));

          const baseTables = extractAllTableData();
          if (baseTables.length > 0) {
            sections.push({ heading: `Tab – ${tabLabel || tabValue}`, subtitle: 'Base metric', tables: baseTables });
          }

          // Per-metric variants in PDF too
          const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]') as HTMLElement | null;
          if (activePanel) {
            const metricButtons: HTMLElement[] = [];
            METRIC_LABELS.forEach(label => {
              const btn = Array.from(activePanel.querySelectorAll('button')).find(b => (b.textContent || '').trim() === label) as HTMLElement | undefined;
              if (btn && !metricButtons.includes(btn)) metricButtons.push(btn);
            });
            for (const btn of metricButtons) {
              const metricLabel = (btn.textContent || '').trim();
              btn.click();
              await new Promise(r => setTimeout(r, 400));
              const metricTables = extractAllTableData();
              if (metricTables.length > 0) {
                sections.push({ heading: `Tab – ${tabLabel || tabValue} (${metricLabel})`, tables: metricTables });
              }
            }
          }
        }

        // Restore original active tab
        if (originalActiveTab instanceof HTMLElement) {
          originalActiveTab.click();
          await new Promise(r => setTimeout(r, 300));
        }
      }

      if (sections.length === 0) {
        alert('No table data found to export for PDF. Please ensure tables are loaded and visible.');
        return;
      }

      const title = `Sales Analytics – ${locationName}`;
      const html = buildPrintableHtml(title, sections);
      const w = window.open('', '_blank');
      if (!w) {
        alert('Popup blocked. Please allow popups to view the PDF.');
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      // Give the browser a moment to render before printing
      setTimeout(() => {
        w.focus();
        w.print();
      }, 300);
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllTabsData = async (locationSuffix: string, timestamp: string) => {
    const tabTriggers = document.querySelectorAll('[role="tab"]');
    const originalActiveTab = document.querySelector('[role="tab"][data-state="active"]');
    
    // Create a mapping of export config to tab values
    const tabMapping: Record<keyof ExportConfig, string[]> = {
      currentView: [],
      monthOnMonth: ['monthOnMonth', 'month-on-month'],
      yearOnYear: ['yearOnYear', 'year-on-year'],
      productPerformance: ['productPerformance', 'product-performance'],
      categoryPerformance: ['categoryPerformance', 'category-performance'],
      soldByAnalysis: ['soldByAnalysis', 'sold-by', 'soldBy'],
      paymentMethodAnalysis: ['paymentMethodAnalysis', 'payment-method', 'paymentMethod'],
      allTabs: []
    };
    
    for (const trigger of tabTriggers) {
      if (trigger instanceof HTMLElement) {
        const tabLabel = trigger.textContent?.trim() || '';
        const normalizedLabel = tabLabel.replace(/\s+/g, '-').toLowerCase();
        const dataValue = trigger.getAttribute('data-value') || '';
        const tabValue = (dataValue || normalizedLabel || 'unknown');

        // Determine if this tab should be exported
        let shouldExport = exportConfig.allTabs;
        
        if (!shouldExport) {
          for (const [configKey, configValue] of Object.entries(exportConfig)) {
            if (configValue && configKey !== 'currentView' && configKey !== 'allTabs') {
              const mappedValues = tabMapping[configKey as keyof ExportConfig] || [];
              if (mappedValues.some(mapped => 
                tabValue.includes(mapped) || 
                mapped.includes(tabValue) ||
                tabValue.toLowerCase().includes(mapped.toLowerCase()) ||
                normalizedLabel.includes(mapped)
              )) {
                shouldExport = true;
                break;
              }
            }
          }
        }

        if (!shouldExport) continue;

        console.log(`Exporting tab: ${tabValue}`);
        
        // Click the tab to make it active
        trigger.click();
        
        // Wait for the tab content to load and any animations to complete
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Extract table data from this tab
        const tabTableData = extractAllTableData();
        
        if (tabTableData.length === 0) {
          console.warn(`No table data found in tab: ${tabValue}`);
          // Try metric variants anyway in case content is metric-driven
          await exportMetricVariantsForActiveSection(locationSuffix, timestamp, tabLabel || tabValue);
          continue;
        }
        
        // Export data from this tab
        for (const table of tabTableData) {
          let csvContent = '';
          
          // Add metadata header
          csvContent += `# Sales Analytics Export\n`;
          csvContent += `# Tab: ${tabLabel || tabValue}\n`;
          csvContent += `# Location: ${locationSuffix}\n`;
          csvContent += `# Export Time: ${new Date().toLocaleString()}\n`;
          csvContent += `# Table: ${table.name}\n\n`;
          
          // Add headers
          if (table.headers.length > 0) {
            csvContent += table.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
          }
          
          // Add rows
          table.rows.forEach(row => {
            csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
          });

          // Create and download file
          const cleanTabValue = (tabLabel || tabValue).replace(/[^a-zA-Z0-9\-]/g, '-');
          const cleanTableName = table.name.replace(/[^a-zA-Z0-9\-\s]/g, '').replace(/\s+/g, '-');
          const fileName = `${cleanTabValue}-${cleanTableName}-${locationSuffix}-${timestamp}.csv`;
          
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Add delay between downloads
          await new Promise(resolve => setTimeout(resolve, 400));
        }

        // After exporting base tables for this tab, export per-metric variants as well
        await exportMetricVariantsForActiveSection(locationSuffix, timestamp, tabLabel || tabValue);
      }
    }
    
    // Return to the original active tab
    if (originalActiveTab instanceof HTMLElement) {
      originalActiveTab.click();
      // Wait for tab to become active again
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const toggleExportSection = (section: keyof ExportConfig) => {
    setExportConfig(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {renderTrigger !== false && (
        <DialogTrigger asChild>
          <Button 
            variant={buttonVariant} 
            size={buttonSize} 
            className={cn('gap-2', buttonClassName)}
            style={{ borderColor: 'var(--hero-accent, rgba(255,255,255,0.3))' }}
          >
            <Download className="h-4 w-4" />
            {buttonLabel ?? 'Export All Sales Data'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comprehensive Sales Export
          </DialogTitle>
          <DialogDescription>
            Export all sales analytics tables and metrics for {locationName}. 
            Each metric will be exported as separate CSV files for detailed analysis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Sections */}
          <div>
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {Object.entries(exportConfig).map(([key, value]) => {
                const labelMap: Record<keyof ExportConfig, string> = {
                  currentView: 'Current View Only',
                  monthOnMonth: 'Month-on-Month Tab',
                  yearOnYear: 'Year-on-Year Tab',
                  productPerformance: 'Product Performance Tab',
                  categoryPerformance: 'Category Performance Tab',
                  soldByAnalysis: 'Sold By Analysis Tab',
                  paymentMethodAnalysis: 'Payment Methods Tab',
                  allTabs: 'All Tabs (Comprehensive)'
                };
                
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={() => toggleExportSection(key as keyof ExportConfig)}
                    />
                    <Label htmlFor={key} className="text-sm">
                      {labelMap[key as keyof ExportConfig] || key}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current View Info */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Current View</h4>
            <p className="text-sm text-green-700">
              Active Tab: <span className="font-medium">{(() => {
                const { tabText } = getCurrentTabInfo();
                return tabText;
              })()}</span><br/>
              Location: <span className="font-medium">{locationName}</span><br/>
              Data Source: <span className="font-medium">Live table data as displayed in UI</span>
            </p>
          </div>

          {/* Export Summary */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
            <p className="text-sm text-blue-700">
              {exportConfig.currentView && (
                <>Current view will be exported as displayed.<br/></>
              )}
              {(exportConfig.allTabs || Object.entries(exportConfig).filter(([key, value]) => 
                key !== 'currentView' && key !== 'allTabs' && value
              ).length > 0) && (
                <>Additional tabs will be exported by switching between them.<br/></>
              )}
              Export format: <span className="font-medium">CSV files</span>
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExportPDF}
              disabled={isExporting}
              variant="secondary"
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building PDF...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV Files
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};