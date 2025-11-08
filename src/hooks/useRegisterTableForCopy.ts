import React from 'react';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

/**
 * Registers a table container ref with the MetricsTablesRegistry to enable
 * the "Copy all tabs" option automatically.
 * Call with the container that wraps your <table> (or the table itself).
 */
export function useRegisterTableForCopy(
  ref: React.RefObject<HTMLElement>,
  title?: string,
  disabled?: boolean
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
  }, [registry, ref, title, disabled]);

  const getAllTabsText = React.useCallback(async () => {
    if (!registry) return '';
    return registry.getAllTabsContent();
  }, [registry]);

  return { getAllTabsText };
}
