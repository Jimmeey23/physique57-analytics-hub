
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  Target, 
  Activity,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  UserCheck,
  Percent,
  Clock,
  Star,
  Zap,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { motion } from 'framer-motion';

interface ExecutiveMetricCardsGridProps {
  data: {
    sales: any[];
    sessions: any[];
    payroll: any[];
    newClients: any[];
    leads: any[];
    discounts?: any[];
  };
  historical?: {
    sales: any[];
    sessions: any[];
    payroll: any[];
    newClients: any[];
    leads: any[];
    discounts?: any[];
  };
}

export const ExecutiveMetricCardsGrid: React.FC<ExecutiveMetricCardsGridProps> = ({ data, historical }) => {
  const metrics = useMemo(() => {
    // Build month windows: current = previous calendar month; previous = month before
    const now = new Date();
    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentEnd = monthEnd(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevEnd = monthEnd(new Date(now.getFullYear(), now.getMonth() - 2, 1));
    const within = (d?: Date | null, start?: Date, end?: Date) => !!(d && start && end && d >= start && d <= end);
    const parse = (s: any): Date | null => {
      if (!s) return null;
      if (s instanceof Date) return isNaN(s.getTime()) ? null : s;
      const str = String(s);
      // Support DD/MM/YYYY
      const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    };
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const periodLabel = `${fmt(currentStart)} vs ${fmt(prevStart)}`;

    // Calculate real metrics from actual data
    const totalRevenue = data.sales.reduce((sum, sale) => sum + (sale.paymentValue || 0), 0);
    const totalVAT = data.sales.reduce((sum, sale) => sum + (sale.paymentVAT || 0), 0);
    const netRevenue = totalRevenue - totalVAT;
    const totalTransactions = data.sales.length;
    const uniqueMembers = new Set(data.sales.map(sale => sale.memberId)).size;
    const totalSessions = data.sessions.length;
    const totalAttendance = data.sessions.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = data.sessions.reduce((sum, session) => sum + (session.capacity || 0), 0);
    
    // Count new clients correctly - those with isNew containing "New"
    const newClientsCount = data.newClients.filter(client => {
      const isNewValue = client.isNew?.toString().toLowerCase() || '';
      return isNewValue.includes('new');
    }).length;
    
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const sessionAttendanceRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const emptySessions = data.sessions.filter(s => (s.checkedInCount || 0) === 0).length;
    const powerCycleSessions = data.sessions.filter(s => 
      s.cleanedClass?.toLowerCase().includes('cycle') || 
      s.classType?.toLowerCase().includes('cycle')
    ).length;
    const leads = data.leads.length;
    const convertedLeads = data.leads.filter(l => l.conversionStatus === 'Converted').length;
    const leadConversionRate = leads > 0 ? (convertedLeads / leads) * 100 : 0;
    const retainedClients = data.newClients.filter(c => c.retentionStatus === 'Retained').length;
    const retentionRate = newClientsCount > 0 ? (retainedClients / newClientsCount) * 100 : 0;
    const avgSessionSize = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    
    // Discount metrics - check both discount data and sales data for discount amounts
    const salesDiscountAmount = data.sales?.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0) || 0;
    const salesDiscountTransactions = data.sales?.filter(sale => (sale.discountAmount || 0) > 0).length || 0;
    
    const totalDiscountAmount = data.discounts?.reduce((sum, d) => sum + (d.discountAmount || 0), 0) || 0;
    const discountTransactions = data.discounts?.length || 0;

    // Use sales data if discount data is empty or zero
    const finalDiscountAmount = totalDiscountAmount > 0 ? totalDiscountAmount : salesDiscountAmount;
    const finalDiscountTransactions = discountTransactions > 0 ? discountTransactions : salesDiscountTransactions;

    // Previous period values from historical (last 3 months, location-filtered)
    const h = historical || { sales: [], sessions: [], newClients: [], leads: [], payroll: [], discounts: [] };
    const salesPrev = h.sales.filter((s: any) => within(parse(s.paymentDate), prevStart, prevEnd));
    const salesPrevRevenue = salesPrev.reduce((sum: number, s: any) => sum + (s.paymentValue || 0), 0);
    const salesPrevVAT = salesPrev.reduce((sum: number, s: any) => sum + (s.paymentVAT || 0), 0);
    const salesPrevNet = salesPrevRevenue - salesPrevVAT;
    const salesPrevTransactions = salesPrev.length;
    const salesPrevUniqueMembers = new Set(salesPrev.map((s: any) => s.memberId)).size;
    const salesPrevAvgTxn = salesPrevTransactions > 0 ? salesPrevRevenue / salesPrevTransactions : 0;

    const sessionsPrev = h.sessions.filter((s: any) => within(parse(s.date), prevStart, prevEnd));
    const sessionsPrevAttendance = sessionsPrev.reduce((sum: number, s: any) => sum + (s.checkedInCount || 0), 0);
    const sessionsPrevCapacity = sessionsPrev.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
    const sessionsPrevAvgSize = sessionsPrev.length > 0 ? sessionsPrevAttendance / sessionsPrev.length : 0;
    const sessionsPrevPowerCycle = sessionsPrev.filter((s: any) => s.cleanedClass?.toLowerCase().includes('cycle') || s.classType?.toLowerCase().includes('cycle')).length;

    const newClientsPrev = h.newClients.filter((c: any) => within(parse(c.firstVisitDate), prevStart, prevEnd));
    const newClientsPrevCount = newClientsPrev.filter((c: any) => String(c.isNew || '').toLowerCase().includes('new')).length;
    const retainedPrev = newClientsPrev.filter((c: any) => c.retentionStatus === 'Retained').length;
    const retentionPrevRate = newClientsPrevCount > 0 ? (retainedPrev / newClientsPrevCount) * 100 : 0;

    const leadsPrev = h.leads.filter((l: any) => within(parse(l.createdAt || ''), prevStart, prevEnd) || (l.period ? l.period.includes(fmt(prevStart).split(' ')[0]) : false));
    const leadsPrevCount = leadsPrev.length;
    const convertedLeadsPrev = leadsPrev.filter((l: any) => l.conversionStatus === 'Converted').length;
    const leadPrevRate = leadsPrevCount > 0 ? (convertedLeadsPrev / leadsPrevCount) * 100 : 0;

    const discountsPrev = (h.discounts && h.discounts.length ? h.discounts : h.sales).filter((d: any) => within(parse(d.paymentDate), prevStart, prevEnd));
    const discountPrevAmount = discountsPrev.reduce((sum: number, d: any) => sum + (d.discountAmount || 0), 0);
    const discountPrevTxns = discountsPrev.filter((d: any) => (d.discountAmount || 0) > 0).length;

    const growth = (cur: number, prev: number) => {
      if (!isFinite(prev) || prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };

    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(totalRevenue),
        change: `${growth(totalRevenue, salesPrevRevenue) >= 0 ? '+' : ''}${growth(totalRevenue, salesPrevRevenue).toFixed(1)}%`,
        changeType: growth(totalRevenue, salesPrevRevenue) >= 0 ? 'positive' : 'negative',
        icon: DollarSign,
        color: 'from-green-500 to-emerald-600',
        description: `Total sales revenue from all transactions\n${periodLabel}: ${formatCurrency(salesPrevRevenue)}`,
        rawValue: totalRevenue
      },
      {
        title: 'Net Revenue',
        value: formatCurrency(netRevenue),
        change: `${growth(netRevenue, salesPrevNet) >= 0 ? '+' : ''}${growth(netRevenue, salesPrevNet).toFixed(1)}%`,
        changeType: growth(netRevenue, salesPrevNet) >= 0 ? 'positive' : 'negative',
        icon: DollarSign,
        color: 'from-emerald-500 to-green-600',
        description: `Revenue after VAT deduction\n${periodLabel}: ${formatCurrency(salesPrevNet)}`,
        rawValue: netRevenue
      },
      {
        title: 'Active Members',
        value: formatNumber(uniqueMembers),
        change: `${growth(uniqueMembers, salesPrevUniqueMembers) >= 0 ? '+' : ''}${growth(uniqueMembers, salesPrevUniqueMembers).toFixed(1)}%`,
        changeType: growth(uniqueMembers, salesPrevUniqueMembers) >= 0 ? 'positive' : 'negative',
        icon: Users,
        color: 'from-blue-500 to-cyan-600',
        description: `Unique paying members\n${periodLabel}: ${formatNumber(salesPrevUniqueMembers)}`,
        rawValue: uniqueMembers
      },
      {
        title: 'Lead Conversion',
        value: `${leadConversionRate.toFixed(1)}%`,
        change: `${growth(leadConversionRate, leadPrevRate) >= 0 ? '+' : ''}${growth(leadConversionRate, leadPrevRate).toFixed(1)}%`,
        changeType: growth(leadConversionRate, leadPrevRate) >= 0 ? 'positive' : 'negative',
        icon: Target,
        color: 'from-purple-500 to-violet-600',
        description: `Lead to member conversion\n${periodLabel}: ${leadPrevRate.toFixed(1)}%`,
        rawValue: leadConversionRate
      },
      {
        title: 'Session Attendance',
        value: formatNumber(totalAttendance),
        change: `${growth(totalAttendance, sessionsPrevAttendance) >= 0 ? '+' : ''}${growth(totalAttendance, sessionsPrevAttendance).toFixed(1)}%`,
        changeType: growth(totalAttendance, sessionsPrevAttendance) >= 0 ? 'positive' : 'negative',
        icon: Activity,
        color: 'from-orange-500 to-red-600',
        description: `Total sessions attended\n${periodLabel}: ${formatNumber(sessionsPrevAttendance)}`,
        rawValue: totalAttendance
      },
      {
        title: 'New Clients',
        value: formatNumber(newClientsCount),
        change: `${growth(newClientsCount, newClientsPrevCount) >= 0 ? '+' : ''}${growth(newClientsCount, newClientsPrevCount).toFixed(1)}%`,
        changeType: growth(newClientsCount, newClientsPrevCount) >= 0 ? 'positive' : 'negative',
        icon: UserCheck,
        color: 'from-teal-500 to-cyan-600',
        description: `New member acquisitions\n${periodLabel}: ${formatNumber(newClientsPrevCount)}`,
        rawValue: newClientsCount
      },
      {
        title: 'Avg. Transaction',
        value: formatCurrency(avgTransactionValue),
        change: `${growth(avgTransactionValue, salesPrevAvgTxn) >= 0 ? '+' : ''}${growth(avgTransactionValue, salesPrevAvgTxn).toFixed(1)}%`,
        changeType: growth(avgTransactionValue, salesPrevAvgTxn) >= 0 ? 'positive' : 'negative',
        icon: ShoppingCart,
        color: 'from-indigo-500 to-blue-600',
        description: `Average transaction value from sales\n${periodLabel}: ${formatCurrency(salesPrevAvgTxn)}`,
        rawValue: avgTransactionValue
      },
      {
        title: 'Retention Rate',
        value: `${retentionRate.toFixed(1)}%`,
        change: `${growth(retentionRate, retentionPrevRate) >= 0 ? '+' : ''}${growth(retentionRate, retentionPrevRate).toFixed(1)}%`,
        changeType: growth(retentionRate, retentionPrevRate) >= 0 ? 'positive' : 'negative',
        icon: Percent,
        color: 'from-emerald-500 to-green-600',
        description: `Client retention rate\n${periodLabel}: ${retentionPrevRate.toFixed(1)}%`,
        rawValue: retentionRate
      },
      {
        title: 'Class Utilization',
        value: `${sessionAttendanceRate.toFixed(1)}%`,
        change: `${growth(sessionAttendanceRate, (sessionsPrevCapacity > 0 ? (sessionsPrevAttendance / sessionsPrevCapacity) * 100 : 0)) >= 0 ? '+' : ''}${growth(sessionAttendanceRate, (sessionsPrevCapacity > 0 ? (sessionsPrevAttendance / sessionsPrevCapacity) * 100 : 0)).toFixed(1)}%`,
        changeType: growth(sessionAttendanceRate, (sessionsPrevCapacity > 0 ? (sessionsPrevAttendance / sessionsPrevCapacity) * 100 : 0)) >= 0 ? 'positive' : 'negative',
        icon: Clock,
        color: 'from-yellow-500 to-orange-600',
        description: `Average class capacity filled\n${periodLabel}: ${(sessionsPrevCapacity > 0 ? (sessionsPrevAttendance / sessionsPrevCapacity) * 100 : 0).toFixed(1)}%`,
        rawValue: sessionAttendanceRate
      },
      {
        title: 'Total VAT',
        value: formatCurrency(totalVAT),
        change: `${growth(totalVAT, salesPrevVAT) >= 0 ? '+' : ''}${growth(totalVAT, salesPrevVAT).toFixed(1)}%`,
        changeType: growth(totalVAT, salesPrevVAT) >= 0 ? 'positive' : 'negative',
        icon: DollarSign,
        color: 'from-red-500 to-pink-600',
        description: `Total VAT collected from sales\n${periodLabel}: ${formatCurrency(salesPrevVAT)}`,
        rawValue: totalVAT
      },
      {
        title: 'PowerCycle Classes',
        value: formatNumber(powerCycleSessions),
        change: `${growth(powerCycleSessions, sessionsPrevPowerCycle) >= 0 ? '+' : ''}${growth(powerCycleSessions, sessionsPrevPowerCycle).toFixed(1)}%`,
        changeType: growth(powerCycleSessions, sessionsPrevPowerCycle) >= 0 ? 'positive' : 'negative',
        icon: Zap,
        color: 'from-violet-500 to-purple-600',
        description: `PowerCycle sessions held\n${periodLabel}: ${formatNumber(sessionsPrevPowerCycle)}`,
        rawValue: powerCycleSessions
      },
      {
        title: 'Avg. Session Size',
        value: avgSessionSize.toFixed(1),
        change: `${growth(avgSessionSize, sessionsPrevAvgSize) >= 0 ? '+' : ''}${growth(avgSessionSize, sessionsPrevAvgSize).toFixed(1)}%`,
        changeType: growth(avgSessionSize, sessionsPrevAvgSize) >= 0 ? 'positive' : 'negative',
        icon: Users,
        color: 'from-lime-500 to-green-600',
        description: `Average attendees per session\n${periodLabel}: ${sessionsPrevAvgSize.toFixed(1)}`,
        rawValue: avgSessionSize
      },
      {
        title: 'Discount Amount',
        value: formatCurrency(finalDiscountAmount),
        change: `${growth(finalDiscountAmount, discountPrevAmount) >= 0 ? '+' : ''}${growth(finalDiscountAmount, discountPrevAmount).toFixed(1)}%`,
        changeType: growth(finalDiscountAmount, discountPrevAmount) >= 0 ? 'positive' : 'negative',
        icon: Percent,
        color: 'from-pink-500 to-rose-600',
        description: `Total discount amount given\n${periodLabel}: ${formatCurrency(discountPrevAmount)}`,
        rawValue: finalDiscountAmount
      },
      {
        title: 'Discount Transactions',
        value: formatNumber(finalDiscountTransactions),
        change: `${growth(finalDiscountTransactions, discountPrevTxns) >= 0 ? '+' : ''}${growth(finalDiscountTransactions, discountPrevTxns).toFixed(1)}%`,
        changeType: growth(finalDiscountTransactions, discountPrevTxns) >= 0 ? 'positive' : 'negative',
        icon: ShoppingCart,
        color: 'from-amber-500 to-orange-600',
        description: `Transactions with discounts\n${periodLabel}: ${formatNumber(discountPrevTxns)}`,
        rawValue: finalDiscountTransactions
      }
    ];
  }, [data, historical]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Key Performance Metrics</h2>
        <p className="text-slate-600">Real-time insights from previous month's data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <metric.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className={`${
                    metric.changeType === 'positive' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  } transition-colors font-semibold`}>
                    {metric.changeType === 'positive' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {metric.change}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">{metric.title}</h3>
                <p className="text-3xl font-bold text-slate-900 mb-1">{metric.value}</p>
                <p className="text-xs text-slate-500 whitespace-pre-line">{metric.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Action Dashboard Button */}
      <div className="flex justify-center mt-8">
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          View Detailed Dashboard
        </Button>
      </div>
    </div>
  );
};
