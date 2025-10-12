import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Activity, BarChart3, Columns, Filter, GitCompare, Search, Target, Users } from 'lucide-react';

type Grouping = 'classTrainer' | 'class' | 'trainer' | 'timeSlot' | 'location';

interface FormatFocusedAnalyticsProps {
  data: SessionData[];
}

interface GroupRow {
  id: string;
  label: string;
  sessions: number;
  attendance: number;
  capacity: number;
  revenue: number;
  emptyClasses: number;
  nonEmptyClasses: number;
  fillRate: number;
  classAverage: number;
}

const groupSessions = (data: SessionData[], grouping: Grouping): GroupRow[] => {
  const map = new Map<string, SessionData[]>();
  for (const s of data) {
    let key = '';
    let label = '';
    switch (grouping) {
      case 'classTrainer':
        key = `${s.cleanedClass}-${s.trainerName}-${s.dayOfWeek}-${s.time}-${s.location}`;
        label = `${s.cleanedClass || 'Class'} | ${s.dayOfWeek} ${s.time} | ${s.trainerName}`;
        break;
      case 'class':
        key = `${s.cleanedClass}-${s.dayOfWeek}-${s.time}-${s.location}`;
        label = `${s.cleanedClass || 'Class'} | ${s.dayOfWeek} ${s.time}`;
        break;
      case 'trainer':
        key = s.trainerName || 'Unknown Trainer';
        label = key;
        break;
      case 'location':
        key = s.location || 'Unknown Location';
        label = key;
        break;
      case 'timeSlot':
      default:
        key = `${s.time}-${s.dayOfWeek}`;
        label = `${s.dayOfWeek} ${s.time}`;
        break;
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }

  const rows: GroupRow[] = [];
  map.forEach((sessions, id) => {
    const sessionsCount = sessions.length;
    const attendance = sessions.reduce((a, s) => a + (s.checkedInCount || 0), 0);
    const capacity = sessions.reduce((a, s) => a + (s.capacity || 0), 0);
    const revenue = sessions.reduce((a, s) => a + (s.totalPaid || 0), 0);
    const empty = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
    const nonEmpty = sessionsCount - empty;
    const fill = capacity > 0 ? (attendance / capacity) * 100 : 0;
    const avg = sessionsCount > 0 ? attendance / sessionsCount : 0;

    const any = sessions[0];
    let label = '';
    switch (grouping) {
      case 'classTrainer':
        label = `${any.cleanedClass || 'Class'} | ${any.dayOfWeek} ${any.time} | ${any.trainerName}`;
        break;
      case 'class':
        label = `${any.cleanedClass || 'Class'} | ${any.dayOfWeek} ${any.time}`;
        break;
      case 'trainer':
        label = any.trainerName || 'Unknown Trainer';
        break;
      case 'location':
        label = any.location || 'Unknown Location';
        break;
      case 'timeSlot':
      default:
        label = `${any.dayOfWeek} ${any.time}`;
        break;
    }

    rows.push({
      id,
      label,
      sessions: sessionsCount,
      attendance,
      capacity,
      revenue,
      emptyClasses: empty,
      nonEmptyClasses: nonEmpty,
      fillRate: fill,
      classAverage: avg,
    });
  });

  return rows.sort((a, b) => b.attendance - a.attendance);
};

const FormatBlock: React.FC<{
  title: string;
  sessions: SessionData[];
  grouping: Grouping;
  search: string;
}> = ({ title, sessions, grouping, search }) => {
  const rows = useMemo(() => {
    const grouped = groupSessions(sessions, grouping);
    if (!search) return grouped;
    const q = search.toLowerCase();
    return grouped.filter(r => r.label.toLowerCase().includes(q));
  }, [sessions, grouping, search]);

  const totals = useMemo(() => {
    const t = rows.reduce((acc, r) => {
      acc.sessions += r.sessions;
      acc.attendance += r.attendance;
      acc.capacity += r.capacity;
      acc.revenue += r.revenue;
      acc.emptyClasses += r.emptyClasses;
      acc.nonEmptyClasses += r.nonEmptyClasses;
      return acc;
    }, { sessions:0, attendance:0, capacity:0, revenue:0, emptyClasses:0, nonEmptyClasses:0 });
    const fill = t.capacity > 0 ? (t.attendance / t.capacity) * 100 : 0;
    const avg = t.sessions > 0 ? t.attendance / t.sessions : 0;
    return { ...t, fillRate: fill, classAverage: avg } as GroupRow;
  }, [rows]);

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="text-slate-300">Classes</div>
              <div className="font-bold">{formatNumber(totals.sessions)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-300">Attendance</div>
              <div className="font-bold">{formatNumber(totals.attendance)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-300">Fill</div>
              <div className="font-bold">{formatPercentage(totals.fillRate)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-300">Revenue</div>
              <div className="font-bold">{formatCurrency(totals.revenue)}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800">
                <TableHead className="text-white font-bold h-10 min-w-[300px]">Group</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Sessions</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Attendance</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Capacity</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Fill Rate</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Avg/Class</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Revenue</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Empty</TableHead>
                <TableHead className="text-white font-bold text-center h-10">Non-Empty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50 h-10">
                  <TableCell className="h-10">{r.label}</TableCell>
                  <TableCell className="text-center h-10">
                    <Badge variant="outline" className="metric-badge badge-soft-slate">{formatNumber(r.sessions)}</Badge>
                  </TableCell>
                  <TableCell className="text-center h-10 font-semibold text-blue-700">{formatNumber(r.attendance)}</TableCell>
                  <TableCell className="text-center h-10 text-slate-700">{formatNumber(r.capacity)}</TableCell>
                  <TableCell className="text-center h-10">
                    <Badge className={cn('metric-badge', r.fillRate >= 80 ? 'badge-soft-green' : r.fillRate >= 60 ? 'badge-soft-yellow' : 'badge-soft-red')}>
                      {formatPercentage(r.fillRate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center h-10 text-slate-700">{formatNumber(r.classAverage)}</TableCell>
                  <TableCell className="text-center h-10 font-semibold text-emerald-700">{formatCurrency(r.revenue)}</TableCell>
                  <TableCell className="text-center h-10">
                    <Badge className="metric-badge badge-soft-red">{formatNumber(r.emptyClasses)}</Badge>
                  </TableCell>
                  <TableCell className="text-center h-10">
                    <Badge className="metric-badge badge-soft-green">{formatNumber(r.nonEmptyClasses)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-100 font-bold border-t h-10">
                <TableCell className="h-10">TOTALS</TableCell>
                <TableCell className="text-center h-10">{formatNumber(totals.sessions)}</TableCell>
                <TableCell className="text-center h-10 text-blue-800">{formatNumber(totals.attendance)}</TableCell>
                <TableCell className="text-center h-10">{formatNumber(totals.capacity)}</TableCell>
                <TableCell className="text-center h-10">{formatPercentage(totals.fillRate)}</TableCell>
                <TableCell className="text-center h-10">{formatNumber(totals.classAverage)}</TableCell>
                <TableCell className="text-center h-10 text-emerald-800">{formatCurrency(totals.revenue)}</TableCell>
                <TableCell className="text-center h-10">{formatNumber(totals.emptyClasses)}</TableCell>
                <TableCell className="text-center h-10">{formatNumber(totals.nonEmptyClasses)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export const FormatFocusedAnalytics: React.FC<FormatFocusedAnalyticsProps> = ({ data }) => {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [grouping, setGrouping] = useState<Grouping>('classTrainer');
  const [search, setSearch] = useState('');
  const [excludeHosted, setExcludeHosted] = useState(true);
  const [singleFormat, setSingleFormat] = useState<string>('');
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  const availableFormats = useMemo(() => {
    const formats = Array.from(new Set(data.map(d => d.cleanedClass).filter(Boolean))) as string[];
    formats.sort((a, b) => a.localeCompare(b));
    return formats;
  }, [data]);

  // Default the single format to the first popular format
  React.useEffect(() => {
    if (!singleFormat && availableFormats.length > 0) {
      setSingleFormat(availableFormats[0]);
    }
  }, [availableFormats, singleFormat]);

  const baseFiltered = useMemo(() => {
    return excludeHosted
      ? data.filter(s => !s.cleanedClass?.toLowerCase().includes('hosted') && !s.sessionName?.toLowerCase().includes('hosted'))
      : data;
  }, [data, excludeHosted]);

  const singleModeData = useMemo(() => {
    return baseFiltered.filter(s => !comparisonMode && singleFormat ? (s.cleanedClass === singleFormat) : false);
  }, [baseFiltered, comparisonMode, singleFormat]);

  const comparisonData = useMemo(() => {
    if (!comparisonMode) return [] as { format: string; items: SessionData[] }[];
    return selectedFormats.slice(0, 3).map(fmt => ({
      format: fmt,
      items: baseFiltered.filter(s => s.cleanedClass === fmt)
    }));
  }, [comparisonMode, selectedFormats, baseFiltered]);

  const toggleFormat = (fmt: string) => {
    setSelectedFormats(prev => {
      const set = new Set(prev);
      if (set.has(fmt)) set.delete(fmt); else set.add(fmt);
      // limit to 3 for clean layout
      return Array.from(set).slice(0, 3);
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Comparison toggle */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border">
              <GitCompare className="w-4 h-4 text-purple-600" />
              <Switch id="compare" checked={comparisonMode} onCheckedChange={setComparisonMode} />
              <Label htmlFor="compare" className="text-sm font-medium">Comparison Mode</Label>
            </div>

            {/* Format selection */}
            {!comparisonMode ? (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-green-600" />Format</Label>
                <Select value={singleFormat} onValueChange={setSingleFormat}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFormats.map(fmt => (
                      <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm font-semibold flex items-center gap-2"><Columns className="w-4 h-4 text-indigo-600" />Compare Formats</Label>
                <div className="flex flex-wrap gap-2">
                  {availableFormats.map(fmt => {
                    const active = selectedFormats.includes(fmt);
                    return (
                      <Button key={fmt} variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleFormat(fmt)} className={cn('h-7', active ? 'bg-indigo-600' : '')}>
                        {fmt}
                      </Button>
                    );
                  })}
                </div>
                <Badge variant="outline" className="metric-badge badge-soft-purple">{selectedFormats.length} selected</Badge>
              </div>
            )}

            {/* Grouping */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" />Group By</Label>
              <Select value={grouping} onValueChange={(v) => setGrouping(v as Grouping)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classTrainer">Class + Day + Time + Trainer</SelectItem>
                  <SelectItem value="class">Class + Day + Time</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="timeSlot">Day + Time</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..." className="pl-9" />
            </div>

            {/* Exclude hosted */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border">
              <Switch id="hosted" checked={excludeHosted} onCheckedChange={setExcludeHosted} />
              <Label htmlFor="hosted" className="text-sm">Exclude Hosted</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {!comparisonMode ? (
        <FormatBlock title={`${singleFormat || 'Select Format'} — Classes`} sessions={singleModeData} grouping={grouping} search={search} />
      ) : (
        <div className={cn('grid gap-6', selectedFormats.length === 1 ? 'grid-cols-1' : selectedFormats.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3')}>
          {comparisonData.map(({ format, items }) => (
            <FormatBlock key={format} title={`${format} — Classes`} sessions={items} grouping={grouping} search={search} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FormatFocusedAnalytics;
