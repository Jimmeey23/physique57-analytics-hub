// Example usage of enhanced table copying functionality

import React from 'react';
import { TableCard } from '@/components/ui/TableCard';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';

const ExampleEnhancedTable = () => {
  // Get comprehensive context for table copying
  const { contextInfo } = useTableCopyContext({
    selectedMetric: 'Revenue', // Current selected metric
    additionalInfo: {
      totalRows: 25,
      sortBy: 'Date',
      sortOrder: 'DESC'
    }
  });

  return (
    <TableCard
      title="Sample Revenue Report"
      subtitle="Monthly revenue breakdown with filters"
      contextInfo={contextInfo} // This will automatically include date range and active filters
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Growth</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Nov 2025</TableCell>
            <TableCell>₹18.9L</TableCell>
            <TableCell>-28.7%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Oct 2025</TableCell>
            <TableCell>₹26.6L</TableCell>
            <TableCell>+15.2%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableCard>
  );
};

// Alternative usage with CopyTableButton directly
const ExampleWithDirectCopyButton = () => {
  const tableRef = useRef<HTMLDivElement>(null);
  const { contextInfo } = useTableCopyContext({
    selectedMetric: 'Transactions',
    additionalInfo: {
      viewType: 'Detailed',
      exportFormat: 'Excel'
    }
  });

  return (
    <div ref={tableRef} className="border rounded-lg bg-white">
      {/* Header with copy button */}
      <div className="flex justify-between items-center p-4 bg-slate-800 text-white">
        <h3 className="text-lg font-bold">Transaction History</h3>
        <CopyTableButton
          tableRef={tableRef}
          tableName="Transaction History"
          contextInfo={contextInfo}
        />
      </div>
      
      {/* Table content */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Table rows */}
        </TableBody>
      </Table>
    </div>
  );
};

export { ExampleEnhancedTable, ExampleWithDirectCopyButton };