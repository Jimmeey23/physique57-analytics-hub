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
import { OutlierStudioComparison } from './OutlierStudioComparison';
import { OutlierClientSegmentation } from './OutlierClientSegmentation';
import { OutlierProductMix } from './OutlierProductMix';
import { OutlierRevenueDrivers } from './OutlierRevenueDrivers';
import { OutlierInsightsPanel } from './OutlierInsightsPanel';

interface OutlierAnalysisSectionProps {
  salesData: SalesData[];
  sessionsData: SessionData[];
}

export const OutlierAnalysisSection: React.FC<OutlierAnalysisSectionProps> = ({
  salesData,
  sessionsData
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
      
      // New vs Existing customers
      const newClientKeywords = ['intro', 'new client', 'first', 'trial'];
      const newClientTransactions = data.filter(item => 
        newClientKeywords.some(keyword => 
          item.productName?.toLowerCase().includes(keyword)
        )
      );
      const newClientRevenue = newClientTransactions.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      
      // Membership stacking (same customer, multiple purchases)
      const customerPurchases = new Map<string, number>();
      data.forEach(item => {
        const customerId = item.memberId || item.customerEmail || '';
        customerPurchases.set(customerId, (customerPurchases.get(customerId) || 0) + 1);
      });
      const stackingCustomers = Array.from(customerPurchases.values()).filter(count => count > 1).length;
      
      // Average transaction value
      const atv = transactions > 0 ? totalRevenue / transactions : 0;
      
      // By location
      const locationRevenue = new Map<string, number>();
      data.forEach(item => {
        const loc = item.location || 'Unknown';
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                  April 2025
                </Badge>
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(metrics.april.totalRevenue)}
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {formatNumber(metrics.april.transactions)} transactions
              </p>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-blue-700">
                    {formatPercentage((metrics.april.totalRevenue / metrics.avgOtherMonths - 1) * 100)}% vs avg
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
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                  August 2025
                </Badge>
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {formatCurrency(metrics.august.totalRevenue)}
              </div>
              <p className="text-sm text-purple-600 mt-1">
                {formatNumber(metrics.august.transactions)} transactions
              </p>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-purple-700">
                    {formatPercentage((metrics.august.totalRevenue / metrics.avgOtherMonths - 1) * 100)}% vs avg
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
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
                <Badge variant="secondary" className="bg-emerald-200 text-emerald-800">
                  New Clients
                </Badge>
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                April: {formatCurrency(metrics.april.newClientRevenue)}
              </div>
              <p className="text-sm text-emerald-600 mt-1">
                {formatPercentage((metrics.april.newClientRevenue / metrics.april.totalRevenue) * 100)} of total
              </p>
              <div className="mt-2">
                <div className="text-2xl font-bold text-emerald-900">
                  Aug: {formatCurrency(metrics.august.newClientRevenue)}
                </div>
                <p className="text-sm text-emerald-600 mt-1">
                  {formatPercentage((metrics.august.newClientRevenue / metrics.august.totalRevenue) * 100)} of total
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
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-orange-600" />
                <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                  Stacking
                </Badge>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                April: {formatNumber(metrics.april.stackingCustomers)}
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Customers with multiple purchases
              </p>
              <div className="mt-2">
                <div className="text-2xl font-bold text-orange-900">
                  Aug: {formatNumber(metrics.august.stackingCustomers)}
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  Multiple purchases per customer
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="studios" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Studio Comparison
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Client Segments
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Product Mix
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Revenue Drivers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OutlierInsightsPanel
            aprilData={aprilData}
            augustData={augustData}
            aprilMetrics={metrics.april}
            augustMetrics={metrics.august}
            avgBaseline={metrics.avgOtherMonths}
          />
        </TabsContent>

        <TabsContent value="studios" className="mt-6">
          <OutlierStudioComparison
            aprilData={aprilData}
            augustData={augustData}
            sessionsData={sessionsData}
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <OutlierClientSegmentation
            aprilData={aprilData}
            augustData={augustData}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <OutlierProductMix
            aprilData={aprilData}
            augustData={augustData}
          />
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
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
