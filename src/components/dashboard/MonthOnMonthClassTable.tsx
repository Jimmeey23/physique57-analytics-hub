import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, TrendingUp, BarChart3, Users, DollarSign, 
  Target, Activity, Building2, Percent, RefreshCw, 
  ArrowUp, ArrowDown, Clock, MapPin, Sparkles, ShrinkIcon, ExpandIcon 
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { getTableHeaderClasses } from '@/utils/colorThemes';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface MonthOnMonthClassTableProps {
  data: SessionData[]; // This should be ALL data, ignoring current date filters
  location: string;
}

type MetricType = 'attendance' | 'sessions' | 'revenue' | 'fillRate' | 'classAverage' | 'capacity' | 'bookingRate';
type GroupByType = 'trainer' | 'class' | 'location' | 'day_time' | 'trainer_class' | 'uniqueid1' | 'uniqueid2' | 'overall' | 'am_pm' | 'timeslot' | 'class_time' | 'day_time' | 'trainer_time' | 'class_day' | 'trainer_day' | 'time_location' | 'class_location';

interface MonthlyData {
  month: string;
  monthLabel: string;
  sessions: number;
  attendance: number;
  capacity: number;
  revenue: number;
  fillRate: number;
  classAverage: number;
  bookingRate: number;
  lateCancellations: number;
  uniqueClasses: number;
  uniqueTrainers: number;
  booked?: number;
}

interface GroupedRow {
  groupKey: string;
  groupLabel: string;
  monthlyData: Record<string, MonthlyData>;
  totals: MonthlyData;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MonthOnMonthClassTable: React.FC<MonthOnMonthClassTableProps> = ({ 
  data, 
  location 
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('attendance');
  const [groupBy, setGroupBy] = useState<GroupByType>('overall');
  const [showGrowthRate, setShowGrowthRate] = useState(false);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  
  // Table ref for copy functionality
  const tableRef = useRef<HTMLTableElement>(null);
  const tableId = 'month-on-month-class-table';
  
  // Register with metrics tables registry
  const { registerTable, unregisterTable } = useMetricsTablesRegistry();
  
  useEffect(() => {
    if (tableRef.current) {
      const getTextContent = () => {
        if (tableRef.current) {
          return tableRef.current.innerText || '';
        }
        return '';
      };
      
      registerTable({
        id: tableId,
        getTextContent
      });
      
      return () => unregisterTable(tableId);
    }
  }, [registerTable, unregisterTable]);

  // Apply location + non-date filters (independent of date range)
  const { filters } = useSessionsFilters();

  const workingData = useMemo(() => {
    let d = data;
    // Filter by selected location tab
    if (location && location !== 'All Locations') {
      d = d.filter(s => (s.location || '') === location);
    }
    // Apply other filters but ignore dateRange
    if (filters) {
      if (filters.trainers.length > 0) {
        d = d.filter(s => filters.trainers.includes(s.trainerName));
      }
      if (filters.classTypes.length > 0) {
        d = d.filter(s => filters.classTypes.includes(s.cleanedClass));
      }
      if (filters.dayOfWeek.length > 0) {
        d = d.filter(s => filters.dayOfWeek.includes(s.dayOfWeek));
      }
      if (filters.timeSlots.length > 0) {
        d = d.filter(s => filters.timeSlots.includes(s.time));
      }
    }
    return d;
  }, [data, location, filters]);

  // Get all unique months from the data (ignoring current filters)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    workingData.forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    return Array.from(months).sort().map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        key: monthKey,
        label: `${MONTH_NAMES[monthIndex]} ${year}`,
        shortLabel: `${MONTH_NAMES[monthIndex]}'${year.slice(2)}`
      };
    });
  }, [workingData]);

  // Process data by month and grouping
  const processedData = useMemo(() => {
    const groupedSessions = new Map<string, SessionData[]>();
    
    // Group sessions by the selected grouping criteria
    workingData.forEach(session => {
      let groupKey = 'Overall';
      switch (groupBy) {
        case 'trainer':
          groupKey = session.trainerName || 'Unknown Trainer';
          break;
        case 'class':
          groupKey = session.cleanedClass || 'Unknown Class';
          break;
        case 'location':
          groupKey = session.location || 'Unknown Location';
          break;
        case 'day_time':
          groupKey = `${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_class':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.cleanedClass || 'Unknown'}`;
          break;
        case 'uniqueid1':
          groupKey = session.uniqueId1 || 'Unknown UniqueID1';
          break;
        case 'uniqueid2':
          groupKey = session.uniqueId2 || 'Unknown UniqueID2';
          break;
        case 'am_pm':
          const hour = parseInt(session.time?.split(':')[0] || '0');
          groupKey = hour < 12 ? 'AM' : 'PM';
          break;
        case 'timeslot':
          const sessionHour = parseInt(session.time?.split(':')[0] || '0');
          if (sessionHour >= 5 && sessionHour < 9) groupKey = 'Early Morning (5-9)';
          else if (sessionHour >= 9 && sessionHour < 12) groupKey = 'Morning (9-12)';
          else if (sessionHour >= 12 && sessionHour < 17) groupKey = 'Afternoon (12-17)';
          else if (sessionHour >= 17 && sessionHour < 21) groupKey = 'Evening (17-21)';
          else groupKey = 'Late Night (21-5)';
          break;
        case 'class_time':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.time}`;
          break;
        case 'trainer_time':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.time}`;
          break;
        case 'class_day':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'trainer_day':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'time_location':
          groupKey = `${session.time} - ${session.location || 'Unknown'}`;
          break;
        case 'class_location':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'overall':
        default:
          groupKey = 'Overall';
          break;
      }
      
      if (!groupedSessions.has(groupKey)) {
        groupedSessions.set(groupKey, []);
      }
      groupedSessions.get(groupKey)!.push(session);
    });

    // Process each group's monthly data
    const result: GroupedRow[] = Array.from(groupedSessions.entries()).map(([groupKey, sessions]) => {
      const monthlyData: Record<string, MonthlyData> = {};
      
      // Initialize monthly data for all available months
      availableMonths.forEach(month => {
        monthlyData[month.key] = {
          month: month.key,
          monthLabel: month.label,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          revenue: 0,
          fillRate: 0,
          classAverage: 0,
          bookingRate: 0,
          lateCancellations: 0,
          uniqueClasses: 0,
          uniqueTrainers: 0,
          booked: 0
        };
      });

      // Aggregate data by month
      sessions.forEach(session => {
        const date = new Date(session.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
          const monthData = monthlyData[monthKey];
          monthData.sessions += 1;
          monthData.attendance += session.checkedInCount || 0;
          monthData.capacity += session.capacity || 0;
          monthData.revenue += session.totalPaid || 0;
          monthData.lateCancellations += session.lateCancelledCount || 0;
          monthData.booked = (monthData.booked || 0) + (session.bookedCount || 0);
        }
      });

      // Calculate derived metrics for each month
      Object.values(monthlyData).forEach(monthData => {
        monthData.fillRate = monthData.capacity > 0 ? (monthData.attendance / monthData.capacity) * 100 : 0;
        monthData.classAverage = monthData.sessions > 0 ? monthData.attendance / monthData.sessions : 0;
        // Booking rate = booked seats / capacity
        monthData.bookingRate = monthData.capacity > 0 ? (((monthData.booked || 0) as number) / monthData.capacity) * 100 : 0;
      });

      // Calculate totals
      const totals: MonthlyData = {
        month: 'total',
        monthLabel: 'Total',
        sessions: Object.values(monthlyData).reduce((sum, m) => sum + m.sessions, 0),
        attendance: Object.values(monthlyData).reduce((sum, m) => sum + m.attendance, 0),
        capacity: Object.values(monthlyData).reduce((sum, m) => sum + m.capacity, 0),
        revenue: Object.values(monthlyData).reduce((sum, m) => sum + m.revenue, 0),
        lateCancellations: Object.values(monthlyData).reduce((sum, m) => sum + m.lateCancellations, 0),
        fillRate: 0,
        classAverage: 0,
        bookingRate: 0,
        uniqueClasses: 0,
        uniqueTrainers: 0,
        booked: Object.values(monthlyData).reduce((sum, m) => sum + (m.booked || 0), 0)
      };

      totals.fillRate = totals.capacity > 0 ? (totals.attendance / totals.capacity) * 100 : 0;
      totals.classAverage = totals.sessions > 0 ? totals.attendance / totals.sessions : 0;
      totals.bookingRate = totals.capacity > 0 ? (totals.attendance / totals.capacity) * 100 : 0;

      return {
        groupKey,
        groupLabel: groupKey,
        monthlyData,
        totals
      };
    });

    // Sort by total attendance (descending)
    return result.sort((a, b) => b.totals.attendance - a.totals.attendance);
  }, [workingData, groupBy, availableMonths]);

  const getMetricValue = (monthData: MonthlyData, metric: MetricType): string => {
    switch (metric) {
      case 'attendance':
        return formatNumber(monthData.attendance);
      case 'sessions':
        return formatNumber(monthData.sessions);
      case 'revenue':
        return formatCurrency(monthData.revenue);
      case 'fillRate':
        return formatPercentage(monthData.fillRate);
      case 'classAverage':
        return formatNumber(monthData.classAverage);
      case 'capacity':
        return formatNumber(monthData.capacity);
      case 'bookingRate':
        return formatPercentage(monthData.bookingRate);
      default:
        return formatNumber(monthData.attendance);
    }
  };

  const getGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const metricOptions = [
    { value: 'attendance', label: 'Attendance', icon: Users },
    { value: 'sessions', label: 'Sessions', icon: Calendar },
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'fillRate', label: 'Fill Rate', icon: Target },
    { value: 'classAverage', label: 'Class Average', icon: BarChart3 },
    { value: 'capacity', label: 'Capacity', icon: Building2 },
    { value: 'bookingRate', label: 'Booking Rate', icon: Percent }
  ];

  const groupOptions = [
    { value: 'overall', label: 'Overall', icon: BarChart3 },
    { value: 'trainer', label: 'By Trainer', icon: Users },
    { value: 'class', label: 'By Class', icon: Activity },
    { value: 'location', label: 'By Location', icon: MapPin },
    { value: 'am_pm', label: 'By AM/PM', icon: Clock },
    { value: 'timeslot', label: 'By Timeslot', icon: Clock },
    { value: 'day_time', label: 'By Day & Time', icon: Clock },
    { value: 'class_time', label: 'By Class & Time', icon: Activity },
    { value: 'trainer_time', label: 'By Trainer & Time', icon: Users },
    { value: 'class_day', label: 'By Class & Day', icon: Activity },
    { value: 'trainer_day', label: 'By Trainer & Day', icon: Users },
    { value: 'time_location', label: 'By Time & Location', icon: MapPin },
    { value: 'class_location', label: 'By Class & Location', icon: Building2 },
    { value: 'trainer_class', label: 'By Trainer & Class', icon: Target },
    { value: 'uniqueid1', label: 'Group by Class', icon: Target },
    { value: 'uniqueid2', label: 'Group by Class & Trainer', icon: Users }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="w-full shadow-2xl bg-gradient-to-br from-white via-slate-50 to-purple-50/30 border-0 rounded-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white relative overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  Month-on-Month Analytics
                </CardTitle>
                <div className="flex items-center gap-2">
                  <CopyTableButton tableRef={tableRef} />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                    className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {isTableCollapsed ? <ExpandIcon className="w-4 h-4" /> : <ShrinkIcon className="w-4 h-4" />}
                    {isTableCollapsed ? 'Expand' : 'Collapse'}
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      {data.length} Total Sessions
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </div>
          </CardHeader>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CardContent className="p-6 bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-sm">
            {/* Controls */}
            <motion.div 
              className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-4">
                {/* Metric Selection */}
                <motion.div 
                  className="space-y-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Metric
                  </label>
                  <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
                    <SelectTrigger className="w-[180px] border-purple-200 focus:border-purple-400 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metricOptions.map(option => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Group By Selection */}
                <motion.div 
                  className="space-y-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Group By
                  </label>
                  <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByType)}>
                    <SelectTrigger className="w-[200px] border-purple-200 focus:border-purple-400 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map(option => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={showGrowthRate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowGrowthRate(!showGrowthRate)}
                    className={cn(
                      "transition-all duration-200",
                      showGrowthRate 
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                        : "border-purple-200 text-purple-700 hover:bg-purple-50"
                    )}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Growth %
                  </Button>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <Badge variant="outline" className="text-sm border-purple-200 text-purple-700 bg-purple-50">
                    Date Filters Ignored
                  </Badge>
                </motion.div>
              </div>
            </motion.div>

            {/* Month-on-Month Table */}
            {!isTableCollapsed && (
            <motion.div 
              className="border border-purple-100 rounded-xl bg-white shadow-xl overflow-visible"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar rounded-xl" style={{ display: 'block' }}>
                <Table ref={tableRef} id={tableId} className="min-w-[1400px] w-max">
                  <TableHeader className="sticky top-0 z-20 shadow-sm border-b-2">
                    <TableRow className={`${getTableHeaderClasses('attendance')}`}>
                      <TableHead className={`min-w-[200px] sticky left-0 z-30 bg-slate-800/95 backdrop-blur-sm border-r font-bold`}>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-white" />
                          {groupBy === 'trainer' ? 'Trainer' : 
                           groupBy === 'class' ? 'Class' :
                           groupBy === 'location' ? 'Location' :
                           groupBy === 'day_time' ? 'Day & Time' :
                           groupBy === 'uniqueid1' ? 'UniqueID1' :
                           groupBy === 'uniqueid2' ? 'UniqueID2' :
                           groupBy === 'trainer_class' ? 'Trainer & Class' : 'Category'}
                        </div>
                  </TableHead>
                  
                  {availableMonths.map(month => (
                    <TableHead key={month.key} className={`text-center min-w-[120px] font-bold`}>
                      <div className="space-y-1">
                        <div className="font-semibold">{month.shortLabel}</div>
                        {showGrowthRate && (
                          <div className="text-xs text-gray-500">Growth %</div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  
                  <TableHead className="text-center min-w-[120px] bg-slate-800 font-bold text-white">
                    <div className="space-y-1">
                      <div className="font-semibold">Total</div>
                      {showGrowthRate && (
                        <div className="text-xs text-slate-300">Avg Growth</div>
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              
                <TableBody>
                  <AnimatePresence>
                    {processedData.map((row, rowIndex) => (
                      <motion.tr
                        key={row.groupKey}
                        className={cn(
                          "border-b transition-all duration-300 hover:shadow-md h-10 max-h-10",
                          rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                        whileHover={{ 
                          backgroundColor: "rgba(59, 130, 246, 0.05)",
                          scale: 1.005,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <TableCell className="sticky left-0 z-20 bg-white border-r font-medium whitespace-nowrap py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {row.groupLabel.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{row.groupLabel}</span>
                            <span className="text-xs text-gray-500">({row.totals.sessions})</span>
                          </div>
                        </TableCell>
                    
                    {availableMonths.map((month, index) => {
                      const monthData = row.monthlyData[month.key];
                      const prevMonthData = index > 0 ? row.monthlyData[availableMonths[index - 1].key] : null;

                      const getMetricNumeric = (md: MonthlyData, metric: MetricType): number => {
                        switch (metric) {
                          case 'attendance': return md.attendance;
                          case 'sessions': return md.sessions;
                          case 'revenue': return md.revenue;
                          case 'fillRate': return md.fillRate;
                          case 'classAverage': return md.classAverage;
                          case 'capacity': return md.capacity;
                          case 'bookingRate': return md.bookingRate;
                          default: return md.attendance;
                        }
                      };

                      const currentValue = getMetricNumeric(monthData, selectedMetric);
                      const previousValue = prevMonthData ? getMetricNumeric(prevMonthData, selectedMetric) : 0;
                      const growthRate = prevMonthData ? getGrowthRate(currentValue, previousValue) : 0;

                      return (
                        <TableCell key={month.key} className="text-center py-1.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            {getMetricValue(monthData, selectedMetric)}
                          </span>
                          {showGrowthRate && prevMonthData && (
                            <span className={cn(
                              "text-xs font-medium ml-1",
                              growthRate > 0 ? "text-green-600" : growthRate < 0 ? "text-red-600" : "text-gray-500"
                            )}>
                              {growthRate > 0 ? "↑" : growthRate < 0 ? "↓" : ""}
                              {formatPercentage(Math.abs(growthRate))}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    
                    <TableCell className="text-center py-1.5 whitespace-nowrap">
                      <span className="font-bold text-slate-800">
                        {getMetricValue(row.totals, selectedMetric)}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))}
                </AnimatePresence>
                {/* Totals row across all groups */}
                <TableRow className="bg-slate-800 text-white font-bold border-t-2 h-10 max-h-10">
                  <TableCell className="sticky left-0 z-10 bg-slate-800 border-r text-white py-1.5">Totals</TableCell>
                  {availableMonths.map((month) => {
                    const totalsForMonth = processedData.reduce((acc, row) => {
                      const md = row.monthlyData[month.key];
                      acc.sessions += md.sessions;
                      acc.attendance += md.attendance;
                      acc.capacity += md.capacity;
                      acc.revenue += md.revenue;
                      acc.lateCancellations += md.lateCancellations;
                      acc.booked += (md.booked || 0);
                      return acc;
                    }, { sessions:0, attendance:0, capacity:0, revenue:0, lateCancellations:0, booked:0 });
                    const display = getMetricValue({
                      month: month.key,
                      monthLabel: month.label,
                      sessions: totalsForMonth.sessions,
                      attendance: totalsForMonth.attendance,
                      capacity: totalsForMonth.capacity,
                      revenue: totalsForMonth.revenue,
                      fillRate: totalsForMonth.capacity>0 ? (totalsForMonth.attendance/totalsForMonth.capacity)*100 : 0,
                      classAverage: totalsForMonth.sessions>0 ? (totalsForMonth.attendance/totalsForMonth.sessions) : 0,
                      bookingRate: totalsForMonth.capacity>0 ? ((totalsForMonth.booked)/totalsForMonth.capacity)*100 : 0,
                      lateCancellations: totalsForMonth.lateCancellations,
                      uniqueClasses: 0,
                      uniqueTrainers: 0,
                      booked: totalsForMonth.booked
                    }, selectedMetric);
                    return (
                      <TableCell key={`total-${month.key}`} className="text-center py-1.5">
                        <span className="font-bold text-white">{display}</span>
                      </TableCell>
                    );
                  })}
                  {/* Overall total (rightmost) */}
                  <TableCell className="text-center py-1.5">
                    <span className="font-bold text-white">
                      {getMetricValue({
                        month: 'total',
                        monthLabel: 'Total',
                        sessions: processedData.reduce((s, r) => s + r.totals.sessions, 0),
                        attendance: processedData.reduce((s, r) => s + r.totals.attendance, 0),
                        capacity: processedData.reduce((s, r) => s + r.totals.capacity, 0),
                        revenue: processedData.reduce((s, r) => s + r.totals.revenue, 0),
                        fillRate: 0,
                        classAverage: 0,
                        bookingRate: 0,
                        lateCancellations: processedData.reduce((s, r) => s + r.totals.lateCancellations, 0),
                        uniqueClasses: 0,
                        uniqueTrainers: 0
                      }, selectedMetric)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
              </Table>
            </div>
          </motion.div>
          )}

          {/* Summary Stats */}
          <motion.div 
            className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  </motion.div>
                  <div className="text-2xl font-bold text-blue-800">{availableMonths.length}</div>
                  <div className="text-sm text-blue-600">Months Tracked</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, rotate: -1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  </motion.div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatNumber(data.reduce((sum, s) => sum + (s.checkedInCount || 0), 0))}
                  </div>
                  <div className="text-sm text-green-600">Total Attendance</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  </motion.div>
                  <div className="text-2xl font-bold text-purple-800">
                    {formatCurrency(data.reduce((sum, s) => sum + (s.totalPaid || 0), 0))}
                  </div>
                  <div className="text-sm text-purple-600">Total Revenue</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, rotate: -1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                  >
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  </motion.div>
                  <div className="text-2xl font-bold text-orange-800">
                    {processedData.length}
                  </div>
                  <div className="text-sm text-orange-600">
                    {groupBy === 'trainer' ? 'Trainers' : 
                     groupBy === 'class' ? 'Classes' :
                     groupBy === 'uniqueid1' ? 'UniqueID1' :
                     groupBy === 'uniqueid2' ? 'UniqueID2' :
                     groupBy === 'location' ? 'Locations' : 'Groups'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          </CardContent>
        </motion.div>
        
        <PersistentTableFooter
          tableId="month-on-month-class-attendance"
          tableData={processedData}
          tableName="Month-on-Month Class Attendance"
          tableContext="Monthly class attendance trends and comparisons"
        />
      </Card>
    </motion.div>
  );
};