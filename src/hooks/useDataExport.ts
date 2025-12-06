import { useState, useCallback, useMemo } from 'react';
import { ExportConfig, ExportData } from '@/components/dashboard/DataExportModal';
import { exportDashboardData, createExportData } from '@/utils/exportService';
import { SalesData } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export const useDataExport = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const openExportModal = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const closeExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleExport = useCallback(async (config: ExportConfig, data: ExportData[]) => {
    setIsExporting(true);
    
    try {
      await exportDashboardData(config, data);
      
      toast({
        title: "Export Successful",
        description: `Your data has been exported as ${config.format.toUpperCase()} format.`,
        variant: "default",
      });

      // Close modal after successful export
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  return {
    isExportModalOpen,
    isExporting,
    openExportModal,
    closeExportModal,
    handleExport
  };
};

// Helper hook to prepare data from different dashboard components
export const useExportDataPreparation = () => {
  const prepareMetricsData = useCallback((metrics: any[], source: string = 'Metrics Dashboard'): ExportData => {
    const processedMetrics = metrics.map(metric => ({
      name: metric.name || metric.label,
      value: metric.value,
      change: metric.change,
      changeType: metric.changeType,
      type: typeof metric.value === 'number' && metric.name?.includes('Revenue') ? 'currency' : 'number',
      category: metric.category || 'general'
    }));

    return createExportData('metrics', 'Dashboard Metrics', processedMetrics, source);
  }, []);

  const prepareSalesData = useCallback((salesData: SalesData[], source: string = 'Sales Dashboard'): ExportData => {
    return createExportData('table', 'Sales Transactions', salesData, source);
  }, []);

  const prepareTableData = useCallback((
    data: any[], 
    name: string, 
    source: string = 'Table Data',
    filters?: any
  ): ExportData => {
    return createExportData('table', name, data, source, filters);
  }, []);

  const prepareChartData = useCallback((
    chartData: any[],
    chartName: string,
    chartType: string = 'chart',
    source: string = 'Chart Data'
  ): ExportData => {
    return createExportData('chart', `${chartName} (${chartType})`, chartData, source);
  }, []);

  const prepareCustomData = useCallback((
    data: any[],
    name: string,
    metadata?: any,
    source: string = 'Custom Data'
  ): ExportData => {
    return {
      type: 'custom',
      name,
      data,
      metadata: {
        source,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }, []);

  const prepareRawData = useCallback((
    rawDataSources: Record<string, any[]>,
    source: string = 'Raw Data Sources'
  ): ExportData[] => {
    return Object.entries(rawDataSources).map(([name, data]) => 
      createExportData('raw', `Raw: ${name}`, data, source)
    );
  }, []);

  return {
    prepareMetricsData,
    prepareSalesData,
    prepareTableData,
    prepareChartData,
    prepareCustomData,
    prepareRawData
  };
};

// Hook for generating comprehensive export data for entire dashboard tabs
export const useDashboardExportData = (currentTab: string) => {
  const { 
    prepareMetricsData, 
    prepareSalesData, 
    prepareTableData, 
    prepareChartData,
    prepareRawData 
  } = useExportDataPreparation();

  const generateExportData = useCallback((
    tabData: {
      metrics?: any[];
      salesData?: SalesData[];
      tableData?: { name: string; data: any[]; filters?: any }[];
      chartData?: { name: string; data: any[]; type?: string }[];
      rawData?: Record<string, any[]>;
      customData?: { name: string; data: any[]; metadata?: any }[];
    }
  ): ExportData[] => {
    const exportData: ExportData[] = [];

    // Add metrics if available
    if (tabData.metrics?.length) {
      exportData.push(prepareMetricsData(tabData.metrics, `${currentTab} Metrics`));
    }

    // Add sales data if available
    if (tabData.salesData?.length) {
      exportData.push(prepareSalesData(tabData.salesData, `${currentTab} Sales`));
    }

    // Add table data
    if (tabData.tableData?.length) {
      tabData.tableData.forEach(table => {
        exportData.push(prepareTableData(
          table.data, 
          table.name, 
          `${currentTab} Tables`,
          table.filters
        ));
      });
    }

    // Add chart data
    if (tabData.chartData?.length) {
      tabData.chartData.forEach(chart => {
        exportData.push(prepareChartData(
          chart.data,
          chart.name,
          chart.type,
          `${currentTab} Charts`
        ));
      });
    }

    // Add raw data
    if (tabData.rawData) {
      exportData.push(...prepareRawData(tabData.rawData, `${currentTab} Raw Data`));
    }

    // Add custom data
    if (tabData.customData?.length) {
      tabData.customData.forEach(custom => {
        exportData.push({
          type: 'custom',
          name: custom.name,
          data: custom.data,
          metadata: {
            source: `${currentTab} Custom`,
            timestamp: new Date().toISOString(),
            ...custom.metadata
          }
        });
      });
    }

    return exportData;
  }, [currentTab, prepareMetricsData, prepareSalesData, prepareTableData, prepareChartData, prepareRawData]);

  return {
    generateExportData
  };
};

// Enhanced hook with intelligent data detection
export const useSmartExport = (currentTab: string) => {
  const { isExportModalOpen, isExporting, openExportModal, closeExportModal, handleExport } = useDataExport();
  const { generateExportData } = useDashboardExportData(currentTab);

  // Function to automatically detect and gather data from DOM
  const detectDashboardData = useCallback((): ExportData[] => {
    const exportData: ExportData[] = [];

    try {
      // Detect metric cards
      const metricCards = document.querySelectorAll('[data-metric]');
      if (metricCards.length > 0) {
        const metrics = Array.from(metricCards).map(card => {
          const nameEl = card.querySelector('[data-metric-name]');
          const valueEl = card.querySelector('[data-metric-value]');
          const changeEl = card.querySelector('[data-metric-change]');
          
          return {
            name: nameEl?.textContent || 'Unknown Metric',
            value: valueEl?.textContent || '0',
            change: changeEl?.textContent || '0%',
            category: card.getAttribute('data-metric-category') || 'general'
          };
        });

        exportData.push(createExportData('metrics', 'Detected Metrics', metrics, currentTab));
      }

      // Detect tables
      const tables = document.querySelectorAll('table[data-export]');
      tables.forEach((table, index) => {
        const tableName = table.getAttribute('data-export-name') || `Table ${index + 1}`;
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
        
        const tableData = rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const rowData: any = {};
          
          cells.forEach((cell, cellIndex) => {
            const header = headers[cellIndex] || `Column ${cellIndex + 1}`;
            rowData[header] = cell.textContent?.trim() || '';
          });
          
          return rowData;
        });

        if (tableData.length > 0) {
          exportData.push(createExportData('table', tableName, tableData, currentTab));
        }
      });

      // Detect charts (if they have specific data attributes)
      const charts = document.querySelectorAll('[data-chart-data]');
      charts.forEach((chart, index) => {
        try {
          const chartName = chart.getAttribute('data-chart-name') || `Chart ${index + 1}`;
          const chartDataStr = chart.getAttribute('data-chart-data');
          
          if (chartDataStr) {
            const chartData = JSON.parse(chartDataStr);
            exportData.push(createExportData('chart', chartName, chartData, currentTab));
          }
        } catch (e) {
          console.warn('Failed to parse chart data:', e);
        }
      });

    } catch (error) {
      console.warn('Error detecting dashboard data:', error);
    }

    return exportData;
  }, [currentTab]);

  const openSmartExport = useCallback(() => {
    openExportModal();
  }, [openExportModal]);

  const availableData = useMemo(() => {
    return detectDashboardData();
  }, [detectDashboardData]);

  return {
    isExportModalOpen,
    isExporting,
    availableData,
    openSmartExport,
    closeExportModal,
    handleExport,
    generateExportData,
    detectDashboardData
  };
};