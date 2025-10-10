import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, ChevronDown, ChevronUp, Eye, Filter, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { cn } from '@/lib/utils';

type GroupKey = 'source' | 'stage' | 'center' | 'channel' | 'associate';
type MetricType = 'totalLeads' | 'trialsCompleted' | 'trialsScheduled' | 'convertedLeads' | 'ltv' | 'avgVisits';

interface FunnelMonthOnMonthTableProps {
  data: LeadsData[];
}

const FunnelMonthOnMonthTable: React.FC<FunnelMonthOnMonthTableProps> = ({ data }) => {
  const [groupKey, setGroupKey] = useState<GroupKey>('source');
  const [metric, setMetric] = useState<MetricType>('totalLeads');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [visibleGroups, setVisibleGroups] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'group' | 'total' | 'recent'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: 'group' | 'total' | 'recent') => {
    if (sortBy === column) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const formatPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
  const growthIcon = (n: number) => (n > 0 ? <TrendingUp className="w-3 h-3 text-green-600" /> : n < 0 ? <TrendingDown className="w-3 h-3 text-red-600" /> : <Minus className="w-3 h-3 text-slate-400" />);
  const growthPill = (n: number) => cn('px-2 py-1 rounded-full text-xs font-medium', n > 0 ? 'text-green-700 bg-green-50' : n < 0 ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-50');

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

    const last = months[months.length - 1];
    const prev = months[months.length - 2];

    const rows = Array.from(map.values()).map(r => {
      const totalVal = metricVal(r.totals) as number;
      const recentVal = last && r.months.get(last) ? (metricVal(r.months.get(last)!) as number) : 0;
      const prevVal = prev && r.months.get(prev) ? (metricVal(r.months.get(prev)!) as number) : 0;
      const momGrowth = prevVal > 0 ? ((recentVal - prevVal) / prevVal) * 100 : 0;
      return { group: r.group, months: r.months, totalVal, recentVal, momGrowth };
    });

    return rows.sort((a, b) => {
      if (sortBy === 'group') return sortOrder === 'asc' ? a.group.localeCompare(b.group) : b.group.localeCompare(a.group);
      if (sortBy === 'total') return sortOrder === 'asc' ? (a.totalVal as number) - (b.totalVal as number) : (b.totalVal as number) - (a.totalVal as number);
      return sortOrder === 'asc' ? (a.recentVal as number) - (b.recentVal as number) : (b.recentVal as number) - (a.recentVal as number);
    });
  }, [data, groupKey, metric, months, sortBy, sortOrder]);

  const visibleData = processedData.slice(0, visibleGroups);

  const tableVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const headerVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } } };
  const rowVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } } };

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
              {processedData.length > 0 && (<><Button size="sm" variant="outline" onClick={() => setExpandedGroups(new Set(processedData.map(r => r.group)))}>Expand All</Button><Button size="sm" variant="outline" onClick={() => setExpandedGroups(new Set())}>Collapse All</Button></>)}
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="pt-0">
          <motion.div className="overflow-x-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/70">
                  <th className="text-left py-3 px-4"><Button variant="ghost" size="sm" onClick={() => handleSort('group')} className="hover:bg-slate-50 font-medium text-gray-700">Group {sortBy === 'group' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />)}</Button></th>
                  <th className="text-right py-3 px-4"><Button variant="ghost" size="sm" onClick={() => handleSort('total')} className="hover:bg-slate-50 font-medium text-gray-700">{metric === 'ltv' ? 'Avg LTV (Total)' : metric === 'avgVisits' ? 'Avg Visits (Total)' : 'Total'} {sortBy === 'total' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />)}</Button></th>
                  <th className="text-right py-3 px-4"><Button variant="ghost" size="sm" onClick={() => handleSort('recent')} className="hover:bg-slate-50 font-medium text-gray-700">{viewMode === 'values' ? 'Recent Month' : 'MoM Growth'} {sortBy === 'recent' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />)}</Button></th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {visibleData.map(row => (
                    <React.Fragment key={row.group}>
                      <motion.tr variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } } }} initial="hidden" animate="visible" exit="hidden" className="hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100">
                        <td className="py-3 px-4"><div className="font-medium text-gray-900">{row.group}</div></td>
                        <td className="py-3 px-4 text-right"><span className="font-medium text-gray-900">{metric === 'ltv' || metric === 'avgVisits' ? (row.totalVal as number).toFixed(1) : formatNumber(row.totalVal as number)}</span></td>
                        <td className="py-3 px-4 text-right">{viewMode === 'values' ? (<span className="font-medium text-gray-900">{metric === 'ltv' || metric === 'avgVisits' ? (row.recentVal as number).toFixed(1) : formatNumber(row.recentVal as number)}</span>) : (<div className="flex items-center justify-end gap-2">{growthIcon(row.momGrowth)}<span className={growthPill(row.momGrowth)}>{formatPct(row.momGrowth)}</span></div>)}</td>
                        <td className="py-3 px-4 text-center"><Button variant="ghost" size="sm" onClick={() => setExpandedGroups(prev => { const next = new Set(prev); next.has(row.group) ? next.delete(row.group) : next.add(row.group); return next; })} className="hover:bg-slate-50"><Eye className="w-4 h-4" /></Button></td>
                      </motion.tr>
                      {expandedGroups.has(row.group) && (
                        <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                          <td colSpan={4} className="py-4 px-4 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {months.slice(-6).map(month => {
                                const monthData = row.months.get(month);
                                if (!monthData) return null;
                                const val = metric === 'ltv' ? (monthData.totalLeads > 0 ? monthData.totalLTV / monthData.totalLeads : 0) : metric === 'avgVisits' ? (monthData.totalLeads > 0 ? monthData.totalVisits / monthData.totalLeads : 0) : (monthData as any)[metric] || 0;
                                return (
                                  <motion.div key={month} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="text-sm font-medium text-gray-700 mb-1">{new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                                    <div className="text-lg font-semibold text-gray-900">{metric === 'ltv' || metric === 'avgVisits' ? (val as number).toFixed(1) : formatNumber(val as number)} {metric === 'totalLeads' ? 'leads' : ''}</div>
                                    {metric === 'totalLeads' && <div className="text-xs text-gray-600">{monthData.convertedLeads || 0} converted</div>}
                                  </motion.div>
                                );
                              })}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
          {processedData.length > visibleGroups && (
            <motion.div className="mt-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Button variant="outline" onClick={() => setVisibleGroups(prev => (prev >= processedData.length ? 10 : processedData.length))} className="border-slate-200 text-slate-700 hover:bg-slate-50">{visibleGroups >= processedData.length ? 'Show Less' : `Show All (${processedData.length})`}</Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FunnelMonthOnMonthTable;