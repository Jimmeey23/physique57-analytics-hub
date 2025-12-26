import React, { useMemo, useState } from 'react';
import { logger } from '@/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Eye, X, ChevronLeft, ChevronRight, Download, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface PaginatedDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  relatedData: any[];
  type: 'product' | 'category' | 'member' | 'seller' | 'trainer' | 'location' | 'metric' | 'lead' | 'client';
  title: string;
}

export const PaginatedDrillDownModal: React.FC<PaginatedDrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
  relatedData,
  type,
  title
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter related data based on the selected item
  const filteredData = useMemo(() => {
    // First, check if we already have pre-filtered specific data
    if (data?.filteredTransactionData && data.filteredTransactionData.length > 0) {
      logger.debug(`PaginatedDrillDownModal: Using pre-filtered data with ${data.filteredTransactionData.length} transactions`);
      return data.filteredTransactionData;
    }
    
    if (data?.rawData && data.rawData.length > 0) {
      logger.debug(`PaginatedDrillDownModal: Using raw data with ${data.rawData.length} transactions`);
      return data.rawData;
    }
    
    if (!data || !relatedData) return [];
    
    // Fallback to filtering relatedData based on the selected item
    let filtered = [];
    switch (type) {
      case 'product':
        filtered = relatedData.filter(item => 
          item.paymentItem === data.name || 
          item.cleanedProduct === data.name ||
          item.product === data.name
        );
        break;
      case 'category':
        filtered = relatedData.filter(item => 
          item.paymentCategory === data.name || 
          item.cleanedCategory === data.name ||
          item.category === data.name
        );
        break;
      case 'member':
        filtered = relatedData.filter(item => 
          item.memberId === data.memberId || 
          item.customerName === data.name ||
          item.memberName === data.name
        );
        break;
      case 'seller':
        filtered = relatedData.filter(item => 
          item.soldBy === data.name ||
          item.soldBy === data.soldBy
        );
        break;
      default:
        filtered = relatedData;
    }
    
    logger.debug(`Filtered ${filtered.length} items for ${type}: ${data.name || data.title}`);
    return filtered;
  }, [data, relatedData, type]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  // Generate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!filteredData.length) return null;

    const metrics = {
      totalRecords: filteredData.length,
      totalRevenue: 0,
      totalTransactions: 0,
      uniqueCustomers: new Set(),
      avgValue: 0
    };

    filteredData.forEach(item => {
      if (item.paymentValue) {
        metrics.totalRevenue += item.paymentValue;
        metrics.totalTransactions += 1;
      }
      if (item.memberId) {
        metrics.uniqueCustomers.add(item.memberId);
      }
      if (item.ltv) {
        metrics.totalRevenue += item.ltv;
      }
    });

    metrics.avgValue = metrics.totalTransactions > 0 ? 
      metrics.totalRevenue / metrics.totalTransactions : 0;

    return {
      ...metrics,
      uniqueCustomers: metrics.uniqueCustomers.size
    };
  }, [filteredData]);

  // Dynamic columns based on data type
  const columns = useMemo(() => {
    if (!filteredData.length) return [];

    const firstItem = filteredData[0];
    const baseColumns = [];

    // Common columns for sales data
    if (firstItem.paymentDate) {
      baseColumns.push(
        { key: 'paymentDate', header: 'Date', align: 'center' as const },
        { key: 'customerName', header: 'Customer', align: 'left' as const },
        { key: 'paymentItem', header: 'Product', align: 'left' as const },
        { key: 'paymentValue', header: 'Amount', align: 'right' as const, render: (value: number) => formatCurrency(value) },
        { key: 'paymentMethod', header: 'Payment Method', align: 'center' as const },
        { key: 'calculatedLocation', header: 'Location', align: 'center' as const }
      );
    }

    // Lead/funnel data
    if (firstItem.source) {
      baseColumns.push(
        { key: 'createdAt', header: 'Created', align: 'center' as const },
        { key: 'customerName', header: 'Lead Name', align: 'left' as const },
        { key: 'source', header: 'Source', align: 'left' as const },
        { key: 'stage', header: 'Stage', align: 'center' as const },
        { key: 'ltv', header: 'LTV', align: 'right' as const, render: (value: number) => formatCurrency(value || 0) }
      );
    }

    return baseColumns;
  }, [filteredData]);

  const exportData = () => {
    const csvContent = filteredData.map(item => 
      columns.map(col => item[col.key] || '').join(',')
    ).join('\n');
    
    const headers = columns.map(col => col.header).join(',');
    const fullCsv = headers + '\n' + csvContent;
    
    const blob = new Blob([fullCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_drill_down.csv`;
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0">
        <DialogHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <BarChart3 className="w-6 h-6 animate-pulse" />
            {title}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-auto text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          {/* Summary Metrics */}
          {summaryMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Records</p>
                      <p className="text-2xl font-bold text-blue-900">{formatNumber(summaryMetrics.totalRecords)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(summaryMetrics.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Unique Customers</p>
                      <p className="text-2xl font-bold text-purple-900">{formatNumber(summaryMetrics.uniqueCustomers)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-700">Avg Value</p>
                      <p className="text-2xl font-bold text-orange-900">{formatCurrency(summaryMetrics.avgValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Export and Pagination Controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={exportData}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Badge variant="outline" className="text-sm">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white shadow-sm">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-gradient-to-r from-gray-700 to-gray-900 text-white">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={String(column.key)} 
                      className={`
                        font-bold text-white py-3 px-4 text-sm max-h-[35px] h-[35px]
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                      `}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageData.map((item, index) => (
                  <TableRow 
                    key={index} 
                    className="hover:bg-gray-50/80 transition-colors duration-150 border-b border-gray-200 max-h-[35px] h-[35px]"
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={String(column.key)} 
                        className={`
                          py-2 px-4 align-middle font-medium text-sm max-h-[35px] h-[35px] overflow-hidden text-ellipsis whitespace-nowrap
                          ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                        `}
                      >
                        {column.render ? column.render(item[column.key]) : item[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};