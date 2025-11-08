
import React, { useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  sortable?: boolean;
}

interface ModernDataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  stickyHeader?: boolean;
  showFooter?: boolean;
  footerData?: any;
  maxHeight?: string;
  className?: string;
  headerGradient?: string;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: any) => void;
  tableId?: string; // optional identifier for copy-all registry
  disableRegistry?: boolean; // opt-out
}

import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

export const ModernDataTable: React.FC<ModernDataTableProps> = ({
  data,
  columns,
  loading = false,
  stickyHeader = false,
  showFooter = false,
  footerData,
  maxHeight,
  className,
  headerGradient = "from-slate-600 to-slate-700",
  onSort,
  sortField,
  sortDirection,
  onRowClick,
  tableId,
  disableRegistry = false
}) => {
  // Remove individual loading state - parent components handle loading via global loader
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center p-8">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //     </div>
  //   );
  // }

  const formatCurrencyValue = (value: any) => {
    if (typeof value === 'string' && (value.includes('₹') || value.includes('$'))) {
      const numericValue = parseFloat(value.replace(/[₹$,]/g, ''));
      if (!isNaN(numericValue) && numericValue < 1000) {
        return `₹${Math.round(numericValue)}`;
      }
    }
    return value;
  };

  const handleSort = (column: Column) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();

  // auto-register for copy-all
  useEffect(() => {
    if (disableRegistry) return;
    if (!registry) return;
    if (!tableId) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table') || el;
      let text = `${tableId}\n`;
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
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, disableRegistry]);

  return (
    <div ref={containerRef} className={cn("relative overflow-auto rounded-xl", className)} style={{ maxHeight }}>
      <Table className="w-full">
        <TableHeader className={cn(
          stickyHeader && "sticky top-0 z-20",
          "border-b border-slate-300"
        )}>
          <TableRow className={cn(
            "border-none h-12 bg-gradient-to-r",
            headerGradient
          )}>
            {columns.map((column) => {
              // Strip background classes from header to preserve gradient
              const sanitizedHeaderClass = (column.className || '')
                .split(' ')
                .filter(c => !c.startsWith('bg-'))
                .join(' ');
              return (
                <TableHead 
                  key={column.key} 
                  className={cn(
                    "font-bold h-12 px-3 text-xs text-white border-r border-white/20 last:border-r-0",
                    "min-w-[80px] bg-transparent",
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:bg-white/10 transition-colors',
                    sanitizedHeaderClass
                  )}
                  onClick={() => handleSort(column)}
                  style={{ minWidth: '80px' }}
                >
                <div className={cn(
                  "flex items-center gap-1 h-full",
                  column.align === 'center' && 'justify-center',
                  column.align === 'right' && 'justify-end'
                )}>
                  <span className="text-xs font-bold uppercase tracking-wide leading-tight">
                    {column.header}
                  </span>
                  {column.sortable && sortField === column.key && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-3 h-3" /> : 
                      <ChevronDown className="w-3 h-3" />
                  )}
                </div>
                </TableHead>
              );
            })}
            {/* Copy button pinned at end of header */}
            {tableId && (
              <TableHead className="font-bold h-12 px-3 text-xs text-white border-r border-white/20 last:border-r-0 min-w-[60px] bg-transparent text-right">
                <CopyTableButton 
                  tableRef={containerRef as any}
                  tableName={tableId}
                  size="sm"
                  onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
                />
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index} 
              className={cn(
                "hover:bg-muted/40 transition-all duration-200 h-12 table-row-stripe",
                onRowClick && "cursor-pointer hover:scale-[1.01] hover:shadow-sm"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell 
                  key={column.key}
                  className={cn(
                    "h-12 px-3 py-2 text-sm font-medium text-slate-900 border-r border-slate-200/50 last:border-r-0",
                    "min-w-[80px]",
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.className
                  )}
                  style={{ minWidth: '80px' }}
                >
                  <div className={cn(
                    "flex items-center h-full",
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}>
                    {column.render 
                      ? column.render(row[column.key], row)
                      : <span className="text-sm truncate">{formatCurrencyValue(row[column.key])}</span>
                    }
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        {showFooter && footerData && (
          <TableFooter className="sticky bottom-0 z-10">
            <TableRow className={cn(
              "h-12 border-t-4 border-slate-800 bg-white"
            )}>
              {columns.map((column) => (
                <TableCell 
                  key={column.key}
                  className={cn(
                    "font-bold text-slate-900 h-12 px-3 py-2 text-xs border-r border-slate-200 last:border-r-0",
                    "min-w-[80px]",
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.className
                  )}
                  style={{ minWidth: '80px' }}
                >
                  <div className={cn(
                    "flex items-center h-full",
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}>
                    {column.render 
                      ? column.render(footerData[column.key], footerData)
                      : <span className="text-xs font-bold uppercase tracking-wide">
                          {footerData[column.key] === 'TOTALS' || footerData[column.key] === 'TOTAL' 
                            ? footerData[column.key] 
                            : formatCurrencyValue(footerData[column.key])}
                        </span>
                    }
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
};
