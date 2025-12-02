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
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{row.customerEmail}</div>
        </div>
      )
    },
    {
      key: 'cleanedProduct',
      header: 'Product',
      className: 'min-w-[120px]',
      render: (value: string, row: SalesData) => (
        <div>
          <div className="font-medium">{value}</div>
          <Badge variant="outline" className="text-xs mt-1">
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
        <span className="font-semibold text-emerald-600">
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'paymentDate',
      header: 'Date',
      align: 'center' as const,
      render: (value: string) => (
        <div className="text-sm">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      align: 'center' as const,
      render: (value: string) => (
        <Badge variant="secondary">
          {value || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'soldBy',
      header: 'Sold By',
      className: 'min-w-[100px]',
      render: (value: string) => (
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {value}
        </div>
      )
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-blue-100 -m-6 p-6 mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              {data.title || data.name} - Sales Analytics
              <Badge variant="outline" className="ml-2 text-blue-600 border-blue-200 bg-blue-50">
                {data.type}
              </Badge>
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-white/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(analytics.totalRevenue)}
                  </div>
                  <div className="text-xs text-emerald-600">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatNumber(analytics.totalTransactions)}
                  </div>
                  <div className="text-xs text-blue-600">Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <div>
                  <div className="text-2xl font-bold text-blue-800">
                    {formatNumber(analytics.uniqueCustomers)}
                  </div>
                  <div className="text-xs text-blue-700">Customers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-700">
                    {formatCurrency(analytics.avgTransactionValue)}
                  </div>
                  <div className="text-xs text-orange-600">Avg Transaction</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-600" />
                <div>
                  <div className="text-2xl font-bold text-rose-700">
                    {formatCurrency(analytics.avgRevenuePerCustomer)}
                  </div>
                  <div className="text-xs text-rose-600">Avg per Customer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {Object.entries(analytics.monthlyData).map(([month, data]: [string, any]) => (
                    <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{month}</div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(data.transactions)} transactions • {formatNumber(data.uniqueCustomers)} customers
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {analytics.topCustomers.map((customer: any, index: number) => (
                    <div key={customer.memberId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-600">{customer.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">
                          {formatCurrency(customer.revenue)}
                        </div>
                        <div className="text-sm text-gray-600">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Transaction Details ({formatNumber(rawData.length)} records)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ModernDataTable
              data={rawData}
              columns={tableColumns}
              headerGradient="from-slate-800 via-slate-900 to-slate-800"
              maxHeight="400px"
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};