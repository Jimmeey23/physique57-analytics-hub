import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, ChevronDown, ChevronUp, Eye, Filter, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { cn } from '@/lib/utils';
import { ModernDataTable } from '@/components/ui/ModernDataTable';

type GroupKey = 'source' | 'stage' | 'center' | 'channel' | 'associate';
type MetricType = 'totalLeads' | 'trialsCompleted' | 'trialsScheduled' | 'convertedLeads' | 'ltv' | 'avgVisits';

interface FunnelMonthOnMonthTableProps {
  data: LeadsData[];
}

const FunnelMonthOnMonthTable: React.FC<FunnelMonthOnMonthTableProps> = ({ data }) => {
  const [groupKey, setGroupKey] = useState<GroupKey>('source');
  const [metric, setMetric] = useState<MetricType>('totalLeads');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const [sortBy, setSortBy] = useState<'group' | 'total'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: 'group' | 'total') => {
    if (sortBy === column) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const formatPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
  const growthIcon = (n: number) => (n > 0 ? <TrendingUp className="w-3 h-3 text-green-600" /> : n < 0 ? <TrendingDown className="w-3 h-3 text-red-600" /> : <Minus className="w-3 h-3 text-slate-400" />);

  const months = useMemo(() => {
    const set = new Set<string>();
    data.forEach(l => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort();
  }, [data]);

  // Limit to last 12 months for readability
  const displayMonths = useMemo(() => months.slice(-12), [months]);

  const processedData = useMemo(() => {
    type Bucket = { totalLeads: number; trialsCompleted: number; trialsScheduled: number; convertedLeads: number; totalLTV: number; totalVisits: number };
    const emptyBucket = (): Bucket => ({ totalLeads: 0, trialsCompleted: 0, trialsScheduled: 0, convertedLeads: 0, totalLTV: 0, totalVisits: 0 });
    const map = new Map<string, { group: string; months: Map<string, Bucket>; totals: Bucket }>();

    const inc = (b: Bucket, l: LeadsData) => {
      b.totalLeads += 1;
      if (l.trialStatus === 'Trial Completed' || l.stage === 'Trial Completed') b.trialsCompleted += 1;
      const ts = (l.trialStatus || '').toLowerCase();
      const st = (l.stage || '').toLowerCase();
      if ((ts.includes('trial') && !ts.includes('completed')) || (st.includes('trial') && !st.includes('completed'))) b.trialsScheduled += 1;
      if (l.conversionStatus === 'Converted') b.convertedLeads += 1;
      b.totalLTV += l.ltv || 0;
      b.totalVisits += l.visits || 0;
    };

    data.forEach(l => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const gVal = ((l as any)[groupKey] as string) || 'Unknown';
      if (!map.has(gVal)) map.set(gVal, { group: gVal, months: new Map(), totals: emptyBucket() });
      const entry = map.get(gVal)!;
      if (!entry.months.has(mKey)) entry.months.set(mKey, emptyBucket());
      inc(entry.months.get(mKey)!, l);
      inc(entry.totals, l);
    });

    const metricVal = (b: Bucket) => {
      switch (metric) {
        case 'totalLeads': return b.totalLeads;
        case 'trialsCompleted': return b.trialsCompleted;
        case 'trialsScheduled': return b.trialsScheduled;
        case 'convertedLeads': return b.convertedLeads;
        case 'ltv': return b.totalLeads > 0 ? b.totalLTV / b.totalLeads : 0;
        case 'avgVisits': return b.totalLeads > 0 ? b.totalVisits / b.totalLeads : 0;
      }
    };

    const rows = Array.from(map.values()).map(r => {
      const totalVal = metricVal(r.totals) as number;
      return { group: r.group, months: r.months, totalVal };
    });

    return rows.sort((a, b) => {
      if (sortBy === 'group') return sortOrder === 'asc' ? a.group.localeCompare(b.group) : b.group.localeCompare(a.group);
      if (sortBy === 'total') return sortOrder === 'asc' ? (a.totalVal as number) - (b.totalVal as number) : (b.totalVal as number) - (a.totalVal as number);
    });
  }, [data, groupKey, metric, months, sortBy, sortOrder]);

  const tableVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const headerVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } } };

  return (
    <motion.div variants={tableVariants} initial="hidden" animate="visible" className="w-full">
      <Card className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <motion.div variants={headerVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-lg shadow-lg"><BarChart3 className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Month-on-Month Performance</h3>
                <p className="text-sm text-gray-600">Historical trends by group and metric</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-700 border-indigo-300/50 backdrop-blur-sm"><Calendar className="w-3 h-3 mr-1" />Historical</Badge>
          </motion.div>
          <motion.div variants={headerVariants} className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2">
            <Filter className="w-3 h-3" />
            <span>Showing {processedData.length} groups across {months.length} months</span>
            <div className="flex items-center gap-2 ml-auto">
              <select className="border rounded-md px-2 py-1 text-xs" value={groupKey} onChange={e => setGroupKey(e.target.value as GroupKey)}>
                <option value="source">Group: Source</option>
                <option value="stage">Group: Stage</option>
                <option value="center">Group: Center</option>
                <option value="channel">Group: Channel</option>
                <option value="associate">Group: Associate</option>
              </select>
              <select className="border rounded-md px-2 py-1 text-xs" value={metric} onChange={e => setMetric(e.target.value as MetricType)}>
                <option value="totalLeads">Metric: Total Leads</option>
                <option value="trialsCompleted">Metric: Trials Completed</option>
                <option value="trialsScheduled">Metric: Trials Scheduled</option>
                <option value="convertedLeads">Metric: Converted Leads</option>
                <option value="ltv">Metric: Avg LTV</option>
                <option value="avgVisits">Metric: Avg Visits</option>
              </select>
              <div className="flex items-center gap-1 text-xs">
                <span className="font-medium">View:</span>
                <Button size="sm" variant={viewMode === 'values' ? 'default' : 'outline'} onClick={() => setViewMode('values')}>Values</Button>
                <Button size="sm" variant={viewMode === 'growth' ? 'default' : 'outline'} onClick={() => setViewMode('growth')}>Growth%</Button>
              </div>
              {/* Expand/Collapse removed in column view */}
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="pt-0">
          <motion.div className="overflow-x-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {
              // Build ModernDataTable columns dynamically per month
            }
            {(() => {
              type Bucket = { totalLeads: number; trialsCompleted: number; trialsScheduled: number; convertedLeads: number; totalLTV: number; totalVisits: number };
              const metricVal = (b: Bucket | undefined): number => {
                if (!b) return 0;
                switch (metric) {
                  case 'totalLeads': return b.totalLeads;
                  case 'trialsCompleted': return b.trialsCompleted;
                  case 'trialsScheduled': return b.trialsScheduled;
                  case 'convertedLeads': return b.convertedLeads;
                  case 'ltv': return b.totalLeads > 0 ? b.totalLTV / b.totalLeads : 0;
                  case 'avgVisits': return b.totalLeads > 0 ? b.totalVisits / b.totalLeads : 0;
                }
              };

              const columns: any[] = [
                {
                  key: 'group',
                  header: 'Group',
                  align: 'left' as const,
                  className: 'min-w-[160px] sticky left-0 bg-white',
                  render: (value: string) => (
                    <div className="font-semibold text-slate-800 truncate">{value}</div>
                  )
                },
                ...displayMonths.map((mKey, idx) => ({
                  key: mKey,
                  header: new Date(mKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                  align: 'center' as const,
                  className: 'min-w-[90px]',
                  render: (_: any, row: any) => {
                    if (viewMode === 'values') {
                      const v = metricVal(row.months.get(mKey));
                      return <div className="text-xs font-medium text-slate-800">{metric === 'ltv' || metric === 'avgVisits' ? v.toFixed(1) : formatNumber(v)}</div>;
                    }
                    // growth mode vs previous displayed month
                    const prevKey = displayMonths[idx - 1];
                    if (!prevKey) return <span className="text-slate-400 text-xs">-</span>;
                    const curr = metricVal(row.months.get(mKey));
                    const prev = metricVal(row.months.get(prevKey));
                    const growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
                    return (
                      <div className={cn('text-xs font-semibold', growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-slate-500')}>
                        {growth === 0 ? '0.0%' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
                      </div>
                    );
                  }
                }))
              ];

              // Build totals row per month
              const totalsMap = new Map<string, Bucket>();
              processedData.forEach((row: any) => {
                displayMonths.forEach(mKey => {
                  const b = row.months.get(mKey) as Bucket | undefined;
                  if (!totalsMap.has(mKey)) totalsMap.set(mKey, { totalLeads: 0, trialsCompleted: 0, trialsScheduled: 0, convertedLeads: 0, totalLTV: 0, totalVisits: 0 });
                  const acc = totalsMap.get(mKey)!;
                  if (b) {
                    acc.totalLeads += b.totalLeads;
                    acc.trialsCompleted += b.trialsCompleted;
                    acc.trialsScheduled += b.trialsScheduled;
                    acc.convertedLeads += b.convertedLeads;
                    acc.totalLTV += b.totalLTV;
                    acc.totalVisits += b.totalVisits;
                  }
                });
              });
              const footerData = { group: 'TOTALS', months: totalsMap } as any;

              return (
                <ModernDataTable
                  data={processedData}
                  columns={columns}
                  loading={false}
                  stickyHeader={true}
                  showFooter={true}
                  footerData={footerData}
                  maxHeight="480px"
                  className="rounded-lg"
                  headerGradient="from-slate-800 to-indigo-900"
                />
              );
            })()}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FunnelMonthOnMonthTable;