import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Target, Calendar,
  Building2, Activity, ShoppingCart, Sparkles, AlertCircle,
  BarChart3, PieChart, Zap, Award, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { OutlierStudioComparison } from '@/components/dashboard/OutlierStudioComparison';
import { OutlierClientSegmentation } from '@/components/dashboard/OutlierClientSegmentation';
import { OutlierProductMix } from '@/components/dashboard/OutlierProductMix';
import { OutlierRevenueDrivers } from '@/components/dashboard/OutlierRevenueDrivers';
import { OutlierInsightsPanel } from '@/components/dashboard/OutlierInsightsPanel';

interface OutlierAnalysisSectionProps {
  salesData: SalesData[];
  sessionsData: SessionData[];
  checkinsData?: any[];
  expirationsData?: any[];
  leadsData?: any[];
}

export const OutlierAnalysisSection: React.FC<OutlierAnalysisSectionProps> = ({
  salesData,
  sessionsData,
  checkinsData = [],
  expirationsData = [],
  leadsData = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Filter data for April and August 2025
  const { aprilData, augustData, otherMonthsData } = useMemo(() => {
    const april = salesData.filter(item => {
      const date = new Date(item.paymentDate);
      return date.getFullYear() === 2025 && date.getMonth() === 3;
    });

    const august = salesData.filter(item => {
      const date = new Date(item.paymentDate);
      return date.getFullYear() === 2025 && date.getMonth() === 7;
    });

    const others = salesData.filter(item => {
      const date = new Date(item.paymentDate);
      const isApril = date.getFullYear() === 2025 && date.getMonth() === 3;
      const isAugust = date.getFullYear() === 2025 && date.getMonth() === 7;
      return !isApril && !isAugust;
    });

    return {
      aprilData: april,
      augustData: august,
      otherMonthsData: others
    };
  }, [salesData]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    // First, build a map of customer's first purchase date across ALL data
    const customerFirstPurchase = new Map<string, Date>();
    salesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId || !item.paymentDate) return;
      
      const purchaseDate = new Date(item.paymentDate);
      const existingFirstDate = customerFirstPurchase.get(customerId);
      
      if (!existingFirstDate || purchaseDate < existingFirstDate) {
        customerFirstPurchase.set(customerId, purchaseDate);
      }
    });

    console.log('🔍 Total unique customers with purchase history:', customerFirstPurchase.size);

    const calculateMetrics = (data: SalesData[], label: string, monthYear: { year: number, month: number }) => {
      const totalRevenue = data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      const transactions = data.length;
      const uniqueCustomers = new Set(data.map(item => item.memberId || item.customerEmail)).size;
      
      // New vs Existing customers - check if this month was their FIRST purchase
      const newClientTransactions = data.filter(item => {
        const customerId = item.memberId || item.customerEmail;
        if (!customerId || !item.paymentDate) return false;
        
        const firstPurchaseDate = customerFirstPurchase.get(customerId);
        if (!firstPurchaseDate) return false;
        
        const itemDate = new Date(item.paymentDate);
        
        // Check if this purchase is in the target month AND it's their first purchase ever
        const isInTargetMonth = itemDate.getFullYear() === monthYear.year && 
                                itemDate.getMonth() === monthYear.month;
        const isFirstPurchase = firstPurchaseDate.getFullYear() === monthYear.year && 
                                firstPurchaseDate.getMonth() === monthYear.month;
        
        return isInTargetMonth && isFirstPurchase;
      });

      const newClientRevenue = newClientTransactions.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      const newClientCount = new Set(newClientTransactions.map(item => item.memberId || item.customerEmail)).size;
      
      console.log(`📊 ${label}:`, {
        totalRevenue,
        transactions,
        newClientTransactions: newClientTransactions.length,
        newClientRevenue,
        newClientCount,
        percentage: totalRevenue > 0 ? ((newClientRevenue / totalRevenue) * 100).toFixed(1) + '%' : '0%'
      });
      
      // Membership stacking (same customer, multiple purchases)
      const customerPurchases = new Map<string, number>();
      data.forEach(item => {
        const customerId = item.memberId || item.customerEmail || '';
        if (customerId) {
          customerPurchases.set(customerId, (customerPurchases.get(customerId) || 0) + 1);
        }
      });
      const stackingCustomers = Array.from(customerPurchases.values()).filter(count => count > 1).length;
      
      // Average transaction value
      const atv = transactions > 0 ? totalRevenue / transactions : 0;
      
      // By location - use calculatedLocation
      const locationRevenue = new Map<string, number>();
      data.forEach(item => {
        const loc = item.calculatedLocation || 'Unknown';
        locationRevenue.set(loc, (locationRevenue.get(loc) || 0) + (item.paymentValue || 0));
      });

      return {
        label,
        totalRevenue,
        transactions,
        uniqueCustomers,
        newClientRevenue,
        newClientTransactions: newClientTransactions.length,
        newClientCount,
        existingClientRevenue: totalRevenue - newClientRevenue,
        existingClientTransactions: transactions - newClientTransactions.length,
        stackingCustomers,
        atv,
        locationBreakdown: Array.from(locationRevenue.entries()).map(([location, revenue]) => ({
          location,
          revenue
        })).sort((a, b) => b.revenue - a.revenue)
      };
    };

    const april = calculateMetrics(aprilData, 'April 2025', { year: 2025, month: 3 });
    const august = calculateMetrics(augustData, 'August 2025', { year: 2025, month: 7 });
    
    // Calculate baseline (average of other months)
    const avgOtherMonths = otherMonthsData.length > 0
      ? otherMonthsData.reduce((sum, item) => sum + (item.paymentValue || 0), 0) / 
        (new Set(otherMonthsData.map(item => {
          const d = new Date(item.paymentDate);
          return `${d.getFullYear()}-${d.getMonth()}`;
        })).size || 1)
      : 0;

    return { april, august, avgOtherMonths };
  }, [aprilData, augustData, otherMonthsData, salesData]);

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards - More Comprehensive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* April Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-blue-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-7 h-7 text-blue-600 group-hover:text-blue-700 transition-colors" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                  April 2025
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {formatCurrency(metrics.april.totalRevenue)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Total Revenue
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                  <span className="text-slate-700 font-medium">
                    {formatPercentage((metrics.april.totalRevenue / metrics.avgOtherMonths - 1) * 100)} vs avg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* August Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-purple-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-purple-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-7 h-7 text-purple-600 group-hover:text-purple-700 transition-colors" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  August 2025
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {formatCurrency(metrics.august.totalRevenue)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Total Revenue
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                  <span className="text-slate-700 font-medium">
                    {formatPercentage((metrics.august.totalRevenue / metrics.avgOtherMonths - 1) * 100)} vs avg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* April Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-cyan-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-cyan-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <ShoppingCart className="w-7 h-7 text-cyan-600 group-hover:text-cyan-700 transition-colors" />
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 border-cyan-200 text-xs">
                  April
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                {formatNumber(metrics.april.transactions)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Transactions
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-700 font-medium">
                  ATV: {formatCurrency(metrics.april.atv)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* August Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-indigo-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-indigo-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <ShoppingCart className="w-7 h-7 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                  August
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {formatNumber(metrics.august.transactions)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Transactions
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-700 font-medium">
                  ATV: {formatCurrency(metrics.august.atv)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* April New Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-emerald-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-emerald-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-7 h-7 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                  April
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {formatNumber(metrics.april.newClientCount)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                New Clients
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-700 font-medium">
                  {formatCurrency(metrics.april.newClientRevenue)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* August New Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-teal-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-teal-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-7 h-7 text-teal-600 group-hover:text-teal-700 transition-colors" />
                <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-teal-200 text-xs">
                  August
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                {formatNumber(metrics.august.newClientCount)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                New Clients
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-700 font-medium">
                  {formatCurrency(metrics.august.newClientRevenue)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Key Insights Row - Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* April Revenue Breakdown */}
        <Card className="bg-gradient-to-br from-white via-blue-50/20 to-white border-slate-200 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              April 2025 Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">New Client Revenue</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatNumber(metrics.april.newClientCount)} clients</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(metrics.april.newClientRevenue)}</p>
                <p className="text-xs text-emerald-600">{formatPercentage((metrics.april.newClientRevenue / metrics.april.totalRevenue) * 100)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Existing Client Revenue</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatNumber(metrics.april.uniqueCustomers - metrics.april.newClientCount)} clients</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">{formatCurrency(metrics.april.existingClientRevenue)}</p>
                <p className="text-xs text-blue-600">{formatPercentage((metrics.april.existingClientRevenue / metrics.april.totalRevenue) * 100)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Stacking Customers</p>
                <p className="text-xs text-slate-600 mt-0.5">Multiple purchases</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-700">{formatNumber(metrics.april.stackingCustomers)}</p>
                <p className="text-xs text-orange-600">{formatPercentage((metrics.april.stackingCustomers / metrics.april.uniqueCustomers) * 100)} of clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* August Revenue Breakdown */}
        <Card className="bg-gradient-to-br from-white via-purple-50/20 to-white border-slate-200 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              August 2025 Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">New Client Revenue</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatNumber(metrics.august.newClientCount)} clients</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(metrics.august.newClientRevenue)}</p>
                <p className="text-xs text-emerald-600">{formatPercentage((metrics.august.newClientRevenue / metrics.august.totalRevenue) * 100)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Existing Client Revenue</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatNumber(metrics.august.uniqueCustomers - metrics.august.newClientCount)} clients</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-700">{formatCurrency(metrics.august.existingClientRevenue)}</p>
                <p className="text-xs text-purple-600">{formatPercentage((metrics.august.existingClientRevenue / metrics.august.totalRevenue) * 100)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Stacking Customers</p>
                <p className="text-xs text-slate-600 mt-0.5">Multiple purchases</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-700">{formatNumber(metrics.august.stackingCustomers)}</p>
                <p className="text-xs text-orange-600">{formatPercentage((metrics.august.stackingCustomers / metrics.august.uniqueCustomers) * 100)} of clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Card - Month vs Month */}
      <Card className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            April vs August Comparative Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Revenue Difference</p>
                {metrics.august.totalRevenue > metrics.april.totalRevenue ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(Math.abs(metrics.august.totalRevenue - metrics.april.totalRevenue))}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {formatPercentage(((metrics.august.totalRevenue - metrics.april.totalRevenue) / metrics.april.totalRevenue) * 100)} change
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Transaction Difference</p>
                {metrics.august.transactions > metrics.april.transactions ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatNumber(Math.abs(metrics.august.transactions - metrics.april.transactions))}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {formatPercentage(((metrics.august.transactions - metrics.april.transactions) / metrics.april.transactions) * 100)} change
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">New Client Difference</p>
                {metrics.august.newClientCount > metrics.april.newClientCount ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatNumber(Math.abs(metrics.august.newClientCount - metrics.april.newClientCount))}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {formatPercentage(((metrics.august.newClientCount - metrics.april.newClientCount) / metrics.april.newClientCount) * 100)} change
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Tabs - Matching Sales Tab Styling */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full max-w-7xl mx-auto">
          <TabsTrigger value="overview" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="studios" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Studio Comparison
          </TabsTrigger>
          <TabsTrigger value="clients" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Client Segments
          </TabsTrigger>
          <TabsTrigger value="products" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Product Mix
          </TabsTrigger>
          <TabsTrigger value="drivers" className="relative rounded-xl px-5 py-3 font-semibold text-sm md:text-base w-full justify-center min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Revenue Drivers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <OutlierInsightsPanel
            aprilData={aprilData}
            augustData={augustData}
            aprilMetrics={metrics.april}
            augustMetrics={metrics.august}
            avgBaseline={metrics.avgOtherMonths}
          />
        </TabsContent>

        <TabsContent value="studios" className="mt-8">
          <OutlierStudioComparison
            aprilData={aprilData}
            augustData={augustData}
            sessionsData={sessionsData}
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-8">
          <OutlierClientSegmentation
            aprilData={aprilData}
            augustData={augustData}
            allSalesData={salesData}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-8">
          <OutlierProductMix
            aprilData={aprilData}
            augustData={augustData}
          />
        </TabsContent>

        <TabsContent value="drivers" className="mt-8">
          <OutlierRevenueDrivers
            aprilData={aprilData}
            augustData={augustData}
            aprilMetrics={metrics.april}
            augustMetrics={metrics.august}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
