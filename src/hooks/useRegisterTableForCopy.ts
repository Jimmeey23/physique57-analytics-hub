import React from 'react';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface RegisterTableOptions {
  selectedMetric?: string;
  dateRange?: { start: string; end: string };
  filters?: Record<string, any>;
  additionalInfo?: Record<string, any>;
}

/**
 * Registers a table container ref with the MetricsTablesRegistry to enable
 * the "Copy all tabs" option automatically.
 * Call with the container that wraps your <table> (or the table itself).
 */
export function useRegisterTableForCopy(
  ref: React.RefObject<HTMLElement>,
  title?: string,
  disabled?: boolean,
  contextOptions?: RegisterTableOptions
) {
  const registry = useMetricsTablesRegistry();

  React.useEffect(() => {
    if (disabled) return;
    if (!registry) return;
    if (!ref.current) return;
    if (!title) return;

    const getText = () => {
      const container = ref.current! as HTMLElement;
      const table = container.querySelector('table') || container;
      let text = `${title}\n`;
      text += `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
      
      // Add context information if provided
      if (contextOptions) {
        text += `\n--- Export Context ---\n`;
        
        if (contextOptions.selectedMetric) {
          text += `Selected Metric: ${contextOptions.selectedMetric}\n`;
        }
        
        if (contextOptions.dateRange) {
          const { start, end } = contextOptions.dateRange;
          if (start && end) {
            text += `Date Range: ${start} to ${end}\n`;
          }
        }
        
        if (contextOptions.filters) {
          const activeFilters: string[] = [];
          Object.entries(contextOptions.filters).forEach(([key, value]) => {
            if (value && Array.isArray(value) && value.length > 0) {
              activeFilters.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.join(', ')}`);
            } else if (value && typeof value === 'string' && value !== 'All' && value !== '') {
              activeFilters.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
            }
          });
          
          if (activeFilters.length > 0) {
            text += `Active Filters: ${activeFilters.join('; ')}\n`;
          }
        }
        
        if (contextOptions.additionalInfo) {
          Object.entries(contextOptions.additionalInfo).forEach(([key, value]) => {
            if (value) {
              text += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
            }
          });
        }
        
        text += `\n--- Table Data ---\n`;
      } else {
        text += `\n`;
      }
      
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };

    registry.register({ id: title, getTextContent: getText });
    return () => registry.unregister(title);
  }, [registry, ref, title, disabled, contextOptions]);

  const getAllTabsText = React.useCallback(async () => {
    if (!registry) return '';
    return registry.getAllTabsContent();
  }, [registry]);

  return { getAllTabsText };
}
