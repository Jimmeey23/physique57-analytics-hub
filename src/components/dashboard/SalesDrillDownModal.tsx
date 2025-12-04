import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  MapPin
} from 'lucide-react';
import { ModernDataTable } from '@/components/ui/ModernDataTable';

interface SalesDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const SalesDrillDownModal: React.FC<SalesDrillDownModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!data) return null;

  const rawData = data.rawData || data.filteredTransactionData || [];
  
  // Calculate analytics metrics
  const analytics = React.useMemo(() => {
    const totalRevenue = rawData.reduce((sum: number, item: SalesData) => sum + item.paymentValue, 0);
    const totalTransactions = rawData.length;
    const uniqueCustomers = new Set(rawData.map((item: SalesData) => item.memberId)).size;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const avgRevenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
    
    // Monthly breakdown
    const monthlyData = rawData.reduce((acc: any, item: SalesData) => {
      const month = new Date(item.paymentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { revenue: 0, transactions: 0, customers: new Set() };
      }
      acc[month].revenue += item.paymentValue;
      acc[month].transactions += 1;
      acc[month].customers.add(item.memberId);
      return acc;
    }, {});

    // Convert sets to counts
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].uniqueCustomers = monthlyData[month].customers.size;
      delete monthlyData[month].customers;
    });

    // Top customers
    const customerData = rawData.reduce((acc: any, item: SalesData) => {
      const key = `${item.customerName}`;
      if (!acc[key]) {
        acc[key] = { 
          name: item.customerName, 
          revenue: 0, 
          transactions: 0,
          email: item.customerEmail || 'N/A',
          memberId: item.memberId
        };
      }
      acc[key].revenue += item.paymentValue;
      acc[key].transactions += 1;
      return acc;
    }, {});

    const topCustomers = Object.values(customerData)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment methods
    const paymentMethods = rawData.reduce((acc: any, item: SalesData) => {
      const method = item.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + item.paymentValue;
      return acc;
    }, {});

    return {
      totalRevenue,
      totalTransactions,
      uniqueCustomers,
      avgTransactionValue,
      avgRevenuePerCustomer,
      monthlyData,
      topCustomers,
      paymentMethods
    };
  }, [rawData]);

  const tableColumns = [
    {
      key: 'customerName',
      header: 'Customer',
      className: 'min-w-[150px]',
      render: (value: string, row: SalesData) => (
        <div>
          <div className="font-semibold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{row.customerEmail}</div>
        </div>
      )
    },
    {
      key: 'cleanedProduct',
      header: 'Product',
      className: 'min-w-[120px]',
      render: (value: string, row: SalesData) => (
        <div>
          <div className="font-medium text-slate-800">{value}</div>
          <Badge variant="outline" className="text-xs mt-1 bg-slate-100 text-slate-700 border-slate-300">
            {row.cleanedCategory}
          </Badge>
        </div>
      )
    },
    {
      key: 'paymentValue',
      header: 'Amount',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-bold bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'paymentDate',
      header: 'Date',
      align: 'center' as const,
      render: (value: string) => (
        <div className="text-sm text-slate-700 font-medium">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      align: 'center' as const,
      render: (value: string) => (
        <Badge className="bg-slate-100 text-slate-700 border-slate-300">
          {value || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'soldBy',
      header: 'Sold By',
      className: 'min-w-[100px]',
      render: (value: string) => (
        <div className="text-sm text-slate-600 flex items-center gap-1 font-medium">
          <Users className="w-3 h-3" />
          {value}
        </div>
      )
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 -m-6 p-6 mb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span>{data.title || data.name}</span>
              <Badge className="ml-2 bg-white/20 text-white border-white/30 backdrop-blur-sm font-normal">
                {data.type}
              </Badge>
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-900 to-blue-950 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-300 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium">Total Revenue</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(analytics.totalRevenue)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-xs font-medium">Transactions</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">
                  {formatNumber(analytics.totalTransactions)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Customers</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">
                  {formatNumber(analytics.uniqueCustomers)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-medium">Avg Transaction</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">
                  {formatCurrency(analytics.avgTransactionValue)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">Avg per Customer</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(analytics.avgRevenuePerCustomer)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Performance */}
          <Card className="bg-white border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Calendar className="w-5 h-5 text-slate-700" />
                Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {Object.entries(analytics.monthlyData).map(([month, data]: [string, any]) => (
                    <div key={month} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md">
                      <div>
                        <div className="font-semibold text-slate-900">{month}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          {formatNumber(data.transactions)} transactions • {formatNumber(data.uniqueCustomers)} customers
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">
                          {formatCurrency(data.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="bg-white border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Users className="w-5 h-5 text-slate-700" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {analytics.topCustomers.map((customer: any, index: number) => (
                    <div key={customer.memberId} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-lg">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{customer.name}</div>
                          <div className="text-xs text-slate-500">{customer.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent">
                          {formatCurrency(customer.revenue)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {formatNumber(customer.transactions)} orders
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Details */}
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-700">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Package className="w-5 h-5" />
              Transaction Details
              <Badge className="ml-2 bg-white/20 text-white border-white/30 backdrop-blur-sm font-normal">
                {formatNumber(rawData.length)} records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ModernDataTable
              data={rawData}
              columns={tableColumns}
              headerGradient="from-slate-900 via-blue-950 to-slate-900"
              maxHeight="400px"
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};