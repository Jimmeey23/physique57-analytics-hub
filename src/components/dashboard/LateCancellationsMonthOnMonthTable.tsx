import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, TrendingDown, Minus, Users, BookOpen, CreditCard, Clock } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface LateCancellationData {
  dateIST?: string;
  teacherName?: string;
  cleanedClass?: string;
  cleanedProduct?: string;
  memberName?: string;
  location?: string;
  time?: string;
  [key: string]: any;
}

interface MonthlyStats {
  month: string;
  year: number;
  cancellations: number;
  prevCancellations?: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'same';
}

interface LateCancellationsMonthOnMonthTableProps {
  data: LateCancellationData[];
  onRowClick?: (rowData: any) => void;
}

export const LateCancellationsMonthOnMonthTable: React.FC<LateCancellationsMonthOnMonthTableProps> = ({
  data,
  onRowClick
}) => {
  const [activeView, setActiveView] = useState<'monthly' | 'membership' | 'class' | 'trainer'>('monthly');
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();

  // Process monthly data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    data.forEach(item => {
      if (!item.dateIST) return;
      
      const date = new Date(item.dateIST);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    // Convert to array and calculate MoM changes
    const months = Array.from(monthMap.entries())
      .map(([key, count]) => {
        const [year, month] = key.split('-');
        return {
          key,
          month: new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          year: Number(year),
          monthNum: Number(month),
          cancellations: count
        };
      })
      .sort((a, b) => a.year - b.year || a.monthNum - b.monthNum);

    // Add MoM calculations
    return months.map((current, index) => {
      const prev = months[index - 1];
      let change = 0;
      let changePercent = 0;
      let trend: 'up' | 'down' | 'same' = 'same';

      if (prev) {
        change = current.cancellations - prev.cancellations;
        changePercent = prev.cancellations > 0 ? (change / prev.cancellations) * 100 : 0;
        trend = change > 0 ? 'up' : change < 0 ? 'down' : 'same';
      }

      return {
        ...current,
        prevCancellations: prev?.cancellations,
        change,
        changePercent,
        trend
      } as MonthlyStats;
    }).reverse(); // Show latest first
  }, [data]);

  // Process by membership type
  const membershipData = useMemo(() => {
    const membershipMap = new Map<string, Map<string, number>>();
    
    data.forEach(item => {
      if (!item.dateIST || !item.cleanedProduct) return;
      
      const date = new Date(item.dateIST);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const membership = item.cleanedProduct;
      
      if (!membershipMap.has(membership)) {
        membershipMap.set(membership, new Map());
      }
      
      const membershipMonths = membershipMap.get(membership)!;
      membershipMonths.set(monthKey, (membershipMonths.get(monthKey) || 0) + 1);
    });

    // Convert to structured data
    return Array.from(membershipMap.entries()).map(([membership, monthsMap]) => {
      const months = Array.from(monthsMap.entries())
        .map(([key, count]) => {
          const [year, month] = key.split('-');
          return {
            key,
            month: new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' }),
            cancellations: count
          };
        })
        .sort((a, b) => a.key.localeCompare(b.key));
      
      const total = months.reduce((sum, m) => sum + m.cancellations, 0);
      const latest = months[months.length - 1];
      const previous = months[months.length - 2];
      const change = previous ? latest.cancellations - previous.cancellations : 0;

      return {
        membership,
        total,
        months,
        latest: latest?.cancellations || 0,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
      };
    }).sort((a, b) => b.total - a.total);
  }, [data]);

  // Process by class
  const classData = useMemo(() => {
    const classMap = new Map<string, Map<string, number>>();
    
    data.forEach(item => {
      if (!item.dateIST || !item.cleanedClass) return;
      
      const date = new Date(item.dateIST);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const className = item.cleanedClass;
      
      if (!classMap.has(className)) {
        classMap.set(className, new Map());
      }
      
      const classMonths = classMap.get(className)!;
      classMonths.set(monthKey, (classMonths.get(monthKey) || 0) + 1);
    });

    return Array.from(classMap.entries()).map(([className, monthsMap]) => {
      const months = Array.from(monthsMap.entries())
        .map(([key, count]) => {
          const [year, month] = key.split('-');
          return {
            key,
            month: new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' }),
            cancellations: count
          };
        })
        .sort((a, b) => a.key.localeCompare(b.key));
      
      const total = months.reduce((sum, m) => sum + m.cancellations, 0);
      const latest = months[months.length - 1];
      const previous = months[months.length - 2];
      const change = previous ? latest.cancellations - previous.cancellations : 0;

      return {
        className,
        total,
        months,
        latest: latest?.cancellations || 0,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
      };
    }).sort((a, b) => b.total - a.total);
  }, [data]);

  // Process by trainer
  const trainerData = useMemo(() => {
    const trainerMap = new Map<string, Map<string, number>>();
    
    data.forEach(item => {
      if (!item.dateIST || !item.teacherName) return;
      
      const date = new Date(item.dateIST);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const trainer = item.teacherName;
      
      if (!trainerMap.has(trainer)) {
        trainerMap.set(trainer, new Map());
      }
      
      const trainerMonths = trainerMap.get(trainer)!;
      trainerMonths.set(monthKey, (trainerMonths.get(monthKey) || 0) + 1);
    });

    return Array.from(trainerMap.entries()).map(([trainer, monthsMap]) => {
      const months = Array.from(monthsMap.entries())
        .map(([key, count]) => {
          const [year, month] = key.split('-');
          return {
            key,
            month: new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' }),
            cancellations: count
          };
        })
        .sort((a, b) => a.key.localeCompare(b.key));
      
      const total = months.reduce((sum, m) => sum + m.cancellations, 0);
      const latest = months[months.length - 1];
      const previous = months[months.length - 2];
      const change = previous ? latest.cancellations - previous.cancellations : 0;

      return {
        trainer,
        total,
        months,
        latest: latest?.cancellations || 0,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
      };
    }).sort((a, b) => b.total - a.total);
  }, [data]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-600 bg-red-50';
      case 'down':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Build text for all tabs (not just active)
  const generateAllTabsContent = useCallback(async () => {
    const parts: string[] = [];
    parts.push(`Late Cancellations - Month on Month Analysis (All Tabs)`);
    parts.push(`Exported on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    parts.push('');

    // Monthly Trends
    parts.push('=== Monthly Trends ===');
    let headers = ['Month','Cancellations','Previous Month','Change','% Change','Trend'];
    parts.push(headers.join('\t'));
    parts.push(headers.map(()=>'---').join('\t'));
    monthlyData.forEach(m => {
      parts.push([
        m.month,
        formatNumber(m.cancellations),
        m.prevCancellations ? formatNumber(m.prevCancellations) : '-',
        m.change !== undefined ? (m.change > 0 ? `+${formatNumber(m.change)}` : formatNumber(m.change)) : '-',
        m.changePercent !== undefined ? (m.changePercent > 0 ? `+${formatPercentage(m.changePercent)}` : formatPercentage(m.changePercent)) : '-',
        m.trend || 'same'
      ].join('\t'));
    });

    // By Membership
    parts.push('\n=== By Membership ===');
    headers = ['Membership Type','Total','Latest Month','Change','Trend'];
    parts.push(headers.join('\t'));
    parts.push(headers.map(()=>'---').join('\t'));
    membershipData.forEach(row => {
      parts.push([
        row.membership,
        formatNumber(row.total),
        formatNumber(row.latest),
        row.change > 0 ? `+${formatNumber(row.change)}` : formatNumber(row.change),
        row.trend
      ].join('\t'));
    });

    // By Class
    parts.push('\n=== By Class ===');
    headers = ['Class','Total','Latest Month','Change','Trend'];
    parts.push(headers.join('\t'));
    parts.push(headers.map(()=>'---').join('\t'));
    classData.forEach(row => {
      parts.push([
        row.className,
        formatNumber(row.total),
        formatNumber(row.latest),
        row.change > 0 ? `+${formatNumber(row.change)}` : formatNumber(row.change),
        row.trend
      ].join('\t'));
    });

    // By Trainer
    parts.push('\n=== By Trainer ===');
    headers = ['Trainer','Total','Latest Month','Change','Trend'];
    parts.push(headers.join('\t'));
    parts.push(headers.map(()=>'---').join('\t'));
    trainerData.forEach(row => {
      parts.push([
        row.trainer,
        formatNumber(row.total),
        formatNumber(row.latest),
        row.change > 0 ? `+${formatNumber(row.change)}` : formatNumber(row.change),
        row.trend
      ].join('\t'));
    });

    return parts.join('\n');
  }, [monthlyData, membershipData, classData, trainerData]);

  // Register with global registry (active view snapshot) to participate in full app copy
  useEffect(() => {
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const tableId = 'Late Cancellations - MoM & Breakdowns';
    const getTextContent = () => {
      const table = el.querySelector('table') || el;
      let text = `${tableId} (${activeView})\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(()=>'---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, activeView]);

  return (
    <Card ref={containerRef} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Late Cancellations - Month on Month Analysis
          </CardTitle>
          <CopyTableButton
            tableRef={containerRef as any}
            tableName="Late Cancellations - Month on Month Analysis"
            size="sm"
            onCopyAllTabs={async () => generateAllTabsContent()}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly Trends
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              By Membership
            </TabsTrigger>
            <TabsTrigger value="class" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              By Class
            </TabsTrigger>
            <TabsTrigger value="trainer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              By Trainer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Monthly late cancellation trends with month-over-month comparison
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-700">Month</th>
                      <th className="text-right p-3 font-medium text-gray-700">Cancellations</th>
                      <th className="text-right p-3 font-medium text-gray-700">Previous Month</th>
                      <th className="text-right p-3 font-medium text-gray-700">Change</th>
                      <th className="text-right p-3 font-medium text-gray-700">% Change</th>
                      <th className="text-center p-3 font-medium text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onRowClick?.(month)}
                      >
                        <td className="p-3 font-medium">{month.month}</td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="font-mono">
                            {formatNumber(month.cancellations)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right text-gray-500">
                          {month.prevCancellations ? formatNumber(month.prevCancellations) : '-'}
                        </td>
                        <td className="p-3 text-right">
                          {month.change !== undefined ? (
                            <span className={month.change >= 0 ? 'text-red-600' : 'text-green-600'}>
                              {month.change > 0 ? '+' : ''}{formatNumber(month.change)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-right">
                          {month.changePercent !== undefined ? (
                            <span className={month.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}>
                              {month.changePercent > 0 ? '+' : ''}{formatPercentage(month.changePercent)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {getTrendIcon(month.trend || 'same')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="membership" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Late cancellations breakdown by membership type
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-700">Membership Type</th>
                      <th className="text-right p-3 font-medium text-gray-700">Total</th>
                      <th className="text-right p-3 font-medium text-gray-700">Latest Month</th>
                      <th className="text-right p-3 font-medium text-gray-700">Change</th>
                      <th className="text-center p-3 font-medium text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membershipData.map((membership, index) => (
                      <tr
                        key={membership.membership}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onRowClick?.(membership)}
                      >
                        <td className="p-3 font-medium">{membership.membership}</td>
                        <td className="p-3 text-right">
                          <Badge variant="secondary" className="font-mono">
                            {formatNumber(membership.total)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="font-mono">
                            {formatNumber(membership.latest)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <span className={membership.change >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {membership.change > 0 ? '+' : ''}{formatNumber(membership.change)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {getTrendIcon(membership.trend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="class" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Late cancellations breakdown by class type
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-700">Class</th>
                      <th className="text-right p-3 font-medium text-gray-700">Total</th>
                      <th className="text-right p-3 font-medium text-gray-700">Latest Month</th>
                      <th className="text-right p-3 font-medium text-gray-700">Change</th>
                      <th className="text-center p-3 font-medium text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classData.map((classItem, index) => (
                      <tr
                        key={classItem.className}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onRowClick?.(classItem)}
                      >
                        <td className="p-3 font-medium">{classItem.className}</td>
                        <td className="p-3 text-right">
                          <Badge variant="secondary" className="font-mono">
                            {formatNumber(classItem.total)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="font-mono">
                            {formatNumber(classItem.latest)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <span className={classItem.change >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {classItem.change > 0 ? '+' : ''}{formatNumber(classItem.change)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {getTrendIcon(classItem.trend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trainer" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Late cancellations breakdown by trainer
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-700">Trainer</th>
                      <th className="text-right p-3 font-medium text-gray-700">Total</th>
                      <th className="text-right p-3 font-medium text-gray-700">Latest Month</th>
                      <th className="text-right p-3 font-medium text-gray-700">Change</th>
                      <th className="text-center p-3 font-medium text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainerData.map((trainer, index) => (
                      <tr
                        key={trainer.trainer}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onRowClick?.(trainer)}
                      >
                        <td className="p-3 font-medium">{trainer.trainer}</td>
                        <td className="p-3 text-right">
                          <Badge variant="secondary" className="font-mono">
                            {formatNumber(trainer.total)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="font-mono">
                            {formatNumber(trainer.latest)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <span className={trainer.change >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {trainer.change > 0 ? '+' : ''}{formatNumber(trainer.change)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {getTrendIcon(trainer.trend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};