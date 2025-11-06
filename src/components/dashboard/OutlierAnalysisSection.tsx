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
    const calculateMetrics = (data: SalesData[], label: string) => {
      const totalRevenue = data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      const transactions = data.length;
      const uniqueCustomers = new Set(data.map(item => item.memberId || item.customerEmail)).size;
      
      // New vs Existing customers - use cleanedProduct and paymentItem
      const newClientKeywords = ['intro', 'new client', 'first', 'trial'];
      const newClientTransactions = data.filter(item => {
        const product = (item.cleanedProduct || item.paymentItem || '').toLowerCase();
        return newClientKeywords.some(keyword => product.includes(keyword));
      });
      const newClientRevenue = newClientTransactions.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      
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

    const april = calculateMetrics(aprilData, 'April 2025');
    const august = calculateMetrics(augustData, 'August 2025');
    
    // Calculate baseline (average of other months)
    const avgOtherMonths = otherMonthsData.length > 0
      ? otherMonthsData.reduce((sum, item) => sum + (item.paymentValue || 0), 0) / 
        (new Set(otherMonthsData.map(item => {
          const d = new Date(item.paymentDate);
          return `${d.getFullYear()}-${d.getMonth()}`;
        })).size || 1)
      : 0;

    return { april, august, avgOtherMonths };
  }, [aprilData, augustData, otherMonthsData]);

  return (
    <div className="space-y-6">
      {/* Summary Cards - Matching Sales Tab Styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-blue-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  April 2025
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {formatCurrency(metrics.april.totalRevenue)}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {formatNumber(metrics.april.transactions)} transactions
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-700 font-medium">
                    {formatPercentage((metrics.april.totalRevenue / metrics.avgOtherMonths - 1) * 100)} vs avg month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-purple-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-purple-600 group-hover:text-purple-700 transition-colors" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  August 2025
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {formatCurrency(metrics.august.totalRevenue)}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {formatNumber(metrics.august.transactions)} transactions
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-700 font-medium">
                    {formatPercentage((metrics.august.totalRevenue / metrics.avgOtherMonths - 1) * 100)} vs avg month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-emerald-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  New Clients
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                April: {formatCurrency(metrics.april.newClientRevenue)}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {formatPercentage((metrics.april.newClientRevenue / metrics.april.totalRevenue) * 100)} of total revenue
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Aug: {formatCurrency(metrics.august.newClientRevenue)}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {formatPercentage((metrics.august.newClientRevenue / metrics.august.totalRevenue) * 100)} of total revenue
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden transition-all duration-700 cursor-pointer group bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm border border-slate-200 hover:border-orange-400 hover:shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-orange-600 group-hover:text-orange-700 transition-colors" />
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                  Stacking
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                April: {formatNumber(metrics.april.stackingCustomers)}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Customers with multiple purchases
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Aug: {formatNumber(metrics.august.stackingCustomers)}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Multiple purchases per customer
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
