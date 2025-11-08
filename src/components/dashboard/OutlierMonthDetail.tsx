import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Target, Calendar,
  Building2, Activity, ShoppingCart, Sparkles, AlertCircle,
  BarChart3, PieChart, Zap, Award, ArrowUpRight, ArrowDownRight,
  UserPlus, UserCheck, RefreshCw, TrendingDown, Layers, Percent
} from 'lucide-react';
import { OutlierMonthAnalytics } from '@/hooks/useOutlierMonthAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface OutlierMonthDetailProps {
  analytics: OutlierMonthAnalytics;
  monthName: string;
  locationName: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

export const OutlierMonthDetail: React.FC<OutlierMonthDetailProps> = ({
  analytics,
  monthName,
  locationName
}) => {
  const [chartView, setChartView] = useState<'daily' | 'membership'>('daily');

  // Calculate percentages
  const newClientPercentage = analytics.totalRevenue > 0 
    ? (analytics.newClientRevenue / analytics.totalRevenue) * 100 
    : 0;
  const existingClientPercentage = 100 - newClientPercentage;
  const activePercentage = analytics.totalRevenue > 0
    ? (analytics.activeMembershipRevenue / analytics.totalRevenue) * 100
    : 0;

  // Prepare chart data
  const dailyChartData = analytics.dailyAnalytics.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Total Revenue': day.revenue,
    'New Client Revenue': day.newClientRevenue,
    'Existing Client Revenue': day.existingClientRevenue,
    'Transactions': day.transactions
  }));

  const membershipChartData = analytics.membershipAnalytics.slice(0, 10).map(m => ({
    name: m.membershipName.length > 30 ? m.membershipName.substring(0, 30) + '...' : m.membershipName,
    revenue: m.revenue,
    count: m.count
  }));

  const revenueDistribution = [
    { name: 'New Clients', value: analytics.newClientRevenue },
    { name: 'Existing Clients', value: analytics.existingClientRevenue }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Total</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.totalRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.dailyAnalytics.length)} days tracked
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Client Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="w-8 h-8 text-emerald-600" />
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {formatPercentage(newClientPercentage)}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.newClientRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">New Client Revenue</p>
              <div className="mt-3 pt-3 border-t border-emerald-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.newClients)} new clients
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Existing Client Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-8 h-8 text-purple-600" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {formatPercentage(existingClientPercentage)}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.existingClientRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Existing Client Revenue</p>
              <div className="mt-3 pt-3 border-t border-purple-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.existingClients)} returning clients
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Membership Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-amber-600" />
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {formatPercentage(activePercentage)}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.activeMembershipRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Active Member Purchases</p>
              <div className="mt-3 pt-3 border-t border-amber-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.clientsWithActiveMembers)} active members
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Membership Behavior Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Membership Behavior Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{formatNumber(analytics.renewals)}</div>
              <div className="text-sm text-gray-600 mt-1">Renewals</div>
              <div className="text-xs text-gray-500 mt-1">Same membership repurchased</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-3xl font-bold text-emerald-600">{formatNumber(analytics.upgrades)}</div>
              <div className="text-sm text-gray-600 mt-1">Upgrades</div>
              <div className="text-xs text-gray-500 mt-1">Higher value purchase</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{formatNumber(analytics.downgrades)}</div>
              <div className="text-sm text-gray-600 mt-1">Downgrades</div>
              <div className="text-xs text-gray-500 mt-1">Lower value purchase</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{formatNumber(analytics.stackingMembers)}</div>
              <div className="text-sm text-gray-600 mt-1">Stacking Members</div>
              <div className="text-xs text-gray-500 mt-1">Multiple memberships</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Key Insight:</strong> {analytics.renewals > analytics.upgrades + analytics.downgrades 
                  ? `High renewal rate (${formatNumber(analytics.renewals)}) indicates strong membership satisfaction and loyalty. Members prefer to maintain their current membership level.`
                  : analytics.upgrades > analytics.renewals 
                  ? `Strong upgrade activity (${formatNumber(analytics.upgrades)}) suggests members are expanding their commitment and engagement with higher-tier offerings.`
                  : `Balanced membership behavior with ${formatNumber(analytics.renewals)} renewals and ${formatNumber(analytics.upgrades + analytics.downgrades)} tier changes indicates a healthy mix of satisfied members and those adjusting their commitments.`
                }
                {analytics.stackingMembers > analytics.totalClients * 0.1 && ` Notable stacking activity (${formatNumber(analytics.stackingMembers)} members) indicates high engagement and willingness to invest in multiple offerings.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Distribution Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Revenue Distribution: New vs Existing Clients
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={revenueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Revenue Composition Analysis:</strong> {newClientPercentage > 50
                  ? `New client revenue dominates at ${formatPercentage(newClientPercentage)}, indicating strong acquisition momentum but potential dependency on new customer acquisition. Focus on retention strategies to balance revenue sources.`
                  : `Existing client revenue is ${formatPercentage(existingClientPercentage)} of total, demonstrating strong client retention and loyalty. This creates a stable revenue foundation while new client acquisition contributes ${formatPercentage(newClientPercentage)}.`
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Daily Revenue Trends
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView('daily')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  chartView === 'daily' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setChartView('membership')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  chartView === 'membership' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                By Membership
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartView === 'daily' ? (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="New Client Revenue" fill="#10b981" />
                    <Bar dataKey="Existing Client Revenue" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Daily Performance Pattern:</strong> Revenue tracked across {analytics.dailyAnalytics.length} days. 
                    Average daily revenue: {formatCurrency(analytics.totalRevenue / analytics.dailyAnalytics.length)}. 
                    Peak performance days and consistent patterns indicate operational efficiency and strong demand during this period.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={membershipChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Top Performing Memberships:</strong> The top membership generated {formatCurrency(analytics.membershipAnalytics[0]?.revenue || 0)} 
                    with {formatNumber(analytics.membershipAnalytics[0]?.count || 0)} purchases. 
                    This concentration indicates clear product-market fit and customer preference for specific offerings.
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Membership Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Membership Performance by Product & Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Membership</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Count</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg Price</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">New</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Existing</th>
                </tr>
              </thead>
              <tbody>
                {analytics.membershipAnalytics.map((membership, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900 font-medium">{membership.membershipName}</td>
                    <td className="p-3 text-sm text-gray-600">
                      <Badge variant="outline">{membership.cleanedCategory}</Badge>
                    </td>
                    <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(membership.revenue)}
                    </td>
                    <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(membership.count)}</td>
                    <td className="p-3 text-sm text-gray-600 text-right">{formatCurrency(membership.avgPrice)}</td>
                    <td className="p-3 text-sm text-emerald-600 text-right font-medium">{formatNumber(membership.newClients)}</td>
                    <td className="p-3 text-sm text-purple-600 text-right font-medium">{formatNumber(membership.existingClients)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Product Performance Insight:</strong> Tracking {analytics.membershipAnalytics.length} unique products. 
                Top category is {analytics.membershipAnalytics[0]?.cleanedCategory || 'N/A'}. 
                The mix of new vs existing client purchases across products reveals which offerings attract new clients versus those that drive retention among current members.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Spenders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Top 20 Spenders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Rank</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Spent</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Transactions</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg/Transaction</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topSpenders.map((spender, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-600">#{index + 1}</td>
                    <td className="p-3 text-sm text-gray-900 font-medium">{spender.customerName}</td>
                    <td className="p-3 text-sm text-gray-600">{spender.customerEmail}</td>
                    <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(spender.totalSpent)}
                    </td>
                    <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(spender.transactions)}</td>
                    <td className="p-3 text-sm text-gray-600 text-right">{formatCurrency(spender.avgTransaction)}</td>
                    <td className="p-3 text-center">
                      {spender.isNew ? (
                        <Badge className="bg-emerald-100 text-emerald-700">New</Badge>
                      ) : (
                        <Badge variant="outline" className="text-purple-700 border-purple-300">Existing</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>High-Value Client Analysis:</strong> Top 20 spenders contributed {formatCurrency(analytics.topSpenders.reduce((sum, s) => sum + s.totalSpent, 0))}, 
                representing {formatPercentage((analytics.topSpenders.reduce((sum, s) => sum + s.totalSpent, 0) / analytics.totalRevenue) * 100)} of total revenue. 
                {analytics.topSpenders.filter(s => s.isNew).length > 0 && ` ${analytics.topSpenders.filter(s => s.isNew).length} new clients in top 20 indicates strong acquisition of high-value customers.`}
                This concentration highlights the importance of VIP customer retention and targeted engagement strategies.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Spenders (Low Value) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-gray-600" />
            Bottom 20 Spenders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Spent</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Transactions</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.bottomSpenders.map((spender, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900 font-medium">{spender.customerName}</td>
                    <td className="p-3 text-sm text-gray-600">{spender.customerEmail}</td>
                    <td className="p-3 text-sm text-gray-900 text-right">{formatCurrency(spender.totalSpent)}</td>
                    <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(spender.transactions)}</td>
                    <td className="p-3 text-center">
                      {spender.isNew ? (
                        <Badge className="bg-emerald-100 text-emerald-700">New</Badge>
                      ) : (
                        <Badge variant="outline" className="text-purple-700 border-purple-300">Existing</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Low-Value Client Insight:</strong> These customers represent growth opportunities through upselling and engagement initiatives. 
                Many may be trial or single-purchase customers who haven't yet discovered the full value proposition. 
                Targeted nurture campaigns could convert these into higher-value relationships.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lapsed Members Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Lapsed Members (Top 50 by Lifetime Value)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Last Membership</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Lapsed Date</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Days Since</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Lifetime Value</th>
                </tr>
              </thead>
              <tbody>
                {analytics.lapsedMembers.slice(0, 50).map((member, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900 font-medium">{member.customerName}</td>
                    <td className="p-3 text-sm text-gray-600">{member.customerEmail}</td>
                    <td className="p-3 text-sm text-gray-600">{member.lastMembershipType}</td>
                    <td className="p-3 text-sm text-gray-600 text-right">{member.lastMembershipEndDate}</td>
                    <td className="p-3 text-sm text-red-600 text-right font-medium">{formatNumber(member.daysSinceLapsed)}</td>
                    <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(member.totalLifetimeValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Critical Churn Risk:</strong> {analytics.lapsedMembers.length} high-value members have lapsed memberships. 
                Combined lifetime value: {formatCurrency(analytics.lapsedMembers.reduce((sum, m) => sum + m.totalLifetimeValue, 0))}. 
                These are proven customers with significant historical spend - immediate win-back campaigns targeting these members could recover substantial revenue. 
                Prioritize those lapsed within 30-60 days for highest conversion probability.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-orange-600" />
            Discount & Promotion Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(analytics.totalDiscountGiven)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Discounts Given</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {formatNumber(analytics.transactionsWithDiscount)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Transactions with Discount</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {formatPercentage(analytics.avgDiscountPercentage)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Average Discount %</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Promotion Impact:</strong> {formatPercentage((analytics.transactionsWithDiscount / analytics.dailyAnalytics.reduce((sum, d) => sum + d.transactions, 0)) * 100)} of transactions 
                used discounts, resulting in {formatCurrency(analytics.totalDiscountGiven)} in revenue reduction. 
                Average discount of {formatPercentage(analytics.avgDiscountPercentage)} suggests {analytics.avgDiscountPercentage > 15 ? 'aggressive' : 'moderate'} promotional activity. 
                Monitor discount dependency to ensure long-term profitability while maintaining customer acquisition momentum.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Visit & Engagement Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {formatNumber(analytics.totalVisits)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Check-ins</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.avgVisitsPerClient.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Visits per Client</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.visitToRevenueRatio.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Visits per ₹1K Revenue</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Engagement Pattern:</strong> {analytics.totalVisits} check-ins demonstrate strong facility utilization. 
                Average of {analytics.avgVisitsPerClient.toFixed(1)} visits per client indicates {analytics.avgVisitsPerClient > 8 ? 'high' : analytics.avgVisitsPerClient > 4 ? 'moderate' : 'low'} engagement levels. 
                The visit-to-revenue ratio of {analytics.visitToRevenueRatio.toFixed(2)} helps benchmark operational efficiency and pricing adequacy relative to usage patterns.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
