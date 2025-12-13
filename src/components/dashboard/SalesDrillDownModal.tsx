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
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200/50 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 -m-6 p-8 mb-0 relative overflow-hidden">
          {/* Premium background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-blue-600/5 to-slate-900/20" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)' }} />
          
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  {data.title || data.name}
                </span>
                <Badge className="self-start bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 backdrop-blur-md font-medium px-3 py-1 rounded-full text-xs">
                  {data.type}
                </Badge>
              </div>
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/10 backdrop-blur-sm rounded-xl p-2 transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 lg:space-y-8">
          {/* Metric Cards Grid - Improved Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
            {/* Revenue Card */}
            <Card className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 relative overflow-hidden group min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-5 lg:p-6 relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center gap-3 text-slate-300 mb-3">
                  <div className="p-2 bg-gradient-to-br from-white/10 to-white/5 rounded-lg shrink-0">
                    <DollarSign className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium tracking-wide">Total Revenue</span>
                </div>
                <div className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-tight">
                  {formatCurrency(analytics.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            {/* Transactions Card */}
            <Card className="bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 relative overflow-hidden group backdrop-blur-sm min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-5 lg:p-6 relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center gap-3 text-slate-600 mb-3">
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg shrink-0">
                    <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium tracking-wide">Transactions</span>
                </div>
                <div className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent leading-tight">
                  {formatNumber(analytics.totalTransactions)}
                </div>
              </CardContent>
            </Card>

            {/* Customers Card */}
            <Card className="bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 relative overflow-hidden group backdrop-blur-sm min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-5 lg:p-6 relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center gap-3 text-slate-600 mb-3">
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg shrink-0">
                    <Users className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium tracking-wide">Customers</span>
                </div>
                <div className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent leading-tight">
                  {formatNumber(analytics.uniqueCustomers)}
                </div>
              </CardContent>
            </Card>

            {/* Avg Transaction Card */}
            <Card className="bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 relative overflow-hidden group backdrop-blur-sm min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-5 lg:p-6 relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center gap-3 text-slate-600 mb-3">
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg shrink-0">
                    <Target className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium tracking-wide">Avg Transaction</span>
                </div>
                <div className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent leading-tight">
                  {formatCurrency(analytics.avgTransactionValue)}
                </div>
              </CardContent>
            </Card>

            {/* Avg per Customer Card */}
            <Card className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 border border-emerald-200/70 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 relative overflow-hidden group md:col-span-2 lg:col-span-1 min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-5 lg:p-6 relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center gap-3 text-emerald-700 mb-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-lg shrink-0">
                    <Award className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium tracking-wide">Avg per Customer</span>
                </div>
                <div className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 bg-clip-text text-transparent leading-tight">
                  {formatCurrency(analytics.avgRevenuePerCustomer)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Sections - Improved Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Monthly Performance */}
            <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-xl backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700/30 relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent" />
                <CardTitle className="text-lg lg:text-xl flex items-center gap-3 text-white relative z-10">
                  <div className="p-2 bg-gradient-to-br from-white/20 to-white/10 rounded-xl backdrop-blur-md border border-white/20 shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent font-bold tracking-wide">
                    Monthly Performance
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  {Object.entries(analytics.monthlyData).map(([month, data]: [string, any]) => (
                    <div key={month} className="flex items-center justify-between p-4 lg:p-5 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 rounded-xl border border-slate-200/50 hover:border-slate-300/70 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] backdrop-blur-sm group">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-base lg:text-lg group-hover:text-indigo-900 transition-colors truncate">{month}</div>
                        <div className="text-xs lg:text-sm text-slate-600 mt-1 lg:mt-2 font-medium">
                          {formatNumber(data.transactions)} transactions • {formatNumber(data.uniqueCustomers)} customers
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <div className="font-bold text-lg lg:text-xl xl:text-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                          {formatCurrency(data.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-xl backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700/30 relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent" />
                <CardTitle className="text-lg lg:text-xl flex items-center gap-3 text-white relative z-10">
                  <div className="p-2 bg-gradient-to-br from-white/20 to-white/10 rounded-xl backdrop-blur-md border border-white/20 shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent font-bold tracking-wide">
                    Top Customers
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  {analytics.topCustomers.map((customer: any, index: number) => (
                    <div key={customer.memberId} className="flex items-center gap-4 p-4 lg:p-5 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 rounded-xl border border-slate-200/50 hover:border-slate-300/70 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] backdrop-blur-sm group">
                      <div className="shrink-0">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl flex items-center justify-center text-sm lg:text-lg font-bold shadow-lg group-hover:scale-105 transition-transform duration-300">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-base lg:text-lg group-hover:text-indigo-900 transition-colors truncate">{customer.name}</div>
                        <div className="text-xs lg:text-sm text-slate-600 font-medium truncate">{customer.email}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-lg lg:text-xl xl:text-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                          {formatCurrency(customer.revenue)}
                        </div>
                        <div className="text-xs lg:text-sm text-slate-600 mt-1 font-medium">
                          {formatNumber(customer.transactions)} orders
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details - Enhanced Layout */}
          <div className="w-full">
            <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border border-slate-200/50 shadow-xl backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700/30 relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent" />
                <CardTitle className="text-lg lg:text-xl flex items-center gap-3 text-white relative z-10">
                  <div className="p-2 bg-gradient-to-br from-white/20 to-white/10 rounded-xl backdrop-blur-md border border-white/20 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent font-bold tracking-wide">
                      Transaction Details
                    </span>
                    <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 backdrop-blur-md font-medium px-3 py-1 rounded-full text-xs">
                      {formatNumber(rawData.length)} records
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t border-slate-200/30 bg-white/50 backdrop-blur-sm">
                  <div className="max-h-96 overflow-auto">
                    <ModernDataTable
                      data={rawData}
                      columns={tableColumns}
                      headerGradient="from-slate-900 via-indigo-950 to-slate-900"
                      maxHeight="none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};