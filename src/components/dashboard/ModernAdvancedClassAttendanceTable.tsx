import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ChevronDown, ChevronRight, Search, Filter, Download, Eye, Settings,
  SortAsc, SortDesc, Users, BarChart3, Calendar, MapPin, Clock, 
  TrendingUp, Target, User, Building2, Activity, DollarSign,
  MoreHorizontal, RefreshCw, Grid3x3, List, ChevronLeft
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { PersistentTableFooter } from './PersistentTableFooter';

interface AdvancedClassAttendanceTableProps {
  data: SessionData[];
  location: string;
  onDrillDown?: (data: any) => void;
}

type ViewMode = 'grouped' | 'flat';
type GroupByOption = 'trainer' | 'class' | 'location' | 'day_time' | 'trainer_class' | 'class_day_time_trainer' | 'class_day_time' | 'class_time' | 'class_day' | 'trainer_time' | 'uniqueid1' | 'uniqueid2' | 'none';

interface ProcessedSession extends SessionData {
  period: string;
  emptyClasses: number;
  nonEmptyClasses: number;
  avgAll: number;
  avgNonEmpty: number;
  lateCancels: number;
  payout: number;
  tips: number;
}

interface GroupedData {
  groupKey: string;
  groupLabel: string;
  trainer: string;
  period: string;
  sessions: ProcessedSession[];
  aggregatedMetrics: {
    totalClasses: number;
    emptyClasses: number;
    nonEmptyClasses: number;
    totalCheckedIn: number;
    avgAll: number;
    avgNonEmpty: number;
    totalRevenue: number;
    totalLateCancels: number;
    totalPayout: number;
    totalTips: number;
    totalCapacity: number;
    fillRate: number;
    revenuePerClass: number;
    revenuePerAttendee: number;
    utilization: number;
    consistency: number;
    noShowRate: number;
    showUpRate: number;
  };
  isExpanded: boolean;
}

export const AdvancedClassAttendanceTable: React.FC<AdvancedClassAttendanceTableProps> = ({ 
  data, 
  location,
  onDrillDown 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [groupBy, setGroupBy] = useState<GroupByOption>('trainer');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'trainer',
    direction: 'asc'
  });

  // Process raw session data
  const processedData = useMemo((): ProcessedSession[] => {
    return data.map(session => {
      const date = new Date(session.date);
      const monthYear = `${date.toLocaleDateString('en-US', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;
      
      return {
        ...session,
        period: monthYear,
        emptyClasses: (session.checkedInCount || 0) === 0 ? 1 : 0,
        nonEmptyClasses: (session.checkedInCount || 0) > 0 ? 1 : 0,
        avgAll: session.checkedInCount || 0,
        avgNonEmpty: (session.checkedInCount || 0) > 0 ? (session.checkedInCount || 0) : 0,
        lateCancels: session.lateCancelledCount || 0,
        payout: 0, // Would need payroll data integration
        tips: 0    // Would need tips data integration
      };
    });
  }, [data]);

  // Group data based on selected grouping
  const groupedData = useMemo((): GroupedData[] => {
    if (viewMode === 'flat' || groupBy === 'none') {
      return [];
    }

    const groups = new Map<string, ProcessedSession[]>();

    processedData.forEach(session => {
      let groupKey = '';
      let groupLabel = '';

      switch (groupBy) {
        case 'trainer':
          groupKey = session.trainerName || 'Unknown';
          groupLabel = session.trainerName || 'Unknown Trainer';
          break;
        case 'class':
          groupKey = session.cleanedClass || 'Unknown';
          groupLabel = session.cleanedClass || 'Unknown Class';
          break;
        case 'location':
          groupKey = session.location || 'Unknown';
          groupLabel = session.location || 'Unknown Location';
          break;
        case 'day_time':
          groupKey = `${session.dayOfWeek}-${session.time}`;
          groupLabel = `${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_class':
          groupKey = `${session.trainerName}-${session.cleanedClass}`;
          groupLabel = `${session.trainerName} - ${session.cleanedClass}`;
          break;
        case 'class_day_time_trainer':
          groupKey = `${session.cleanedClass}-${session.dayOfWeek}-${session.time}-${session.trainerName}`;
          groupLabel = `${session.cleanedClass} | ${session.dayOfWeek} ${session.time} | ${session.trainerName}`;
          break;
        case 'class_day_time':
          groupKey = `${session.cleanedClass}-${session.dayOfWeek}-${session.time}`;
          groupLabel = `${session.cleanedClass} | ${session.dayOfWeek} ${session.time}`;
          break;
        case 'class_time':
          groupKey = `${session.cleanedClass}-${session.time}`;
          groupLabel = `${session.cleanedClass} | ${session.time}`;
          break;
        case 'class_day':
          groupKey = `${session.cleanedClass}-${session.dayOfWeek}`;
          groupLabel = `${session.cleanedClass} | ${session.dayOfWeek}`;
          break;
        case 'trainer_time':
          groupKey = `${session.trainerName}-${session.time}`;
          groupLabel = `${session.trainerName} | ${session.time}`;
          break;
        case 'uniqueid1':
          groupKey = session.uniqueId1 || 'Unknown';
          groupLabel = session.uniqueId1 || 'Unknown UniqueID1';
          break;
        case 'uniqueid2':
          groupKey = session.uniqueId2 || 'Unknown';
          groupLabel = session.uniqueId2 || 'Unknown UniqueID2';
          break;
        default:
          groupKey = 'all';
          groupLabel = 'All Sessions';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(session);
    });

    return Array.from(groups.entries()).map(([groupKey, sessions]) => {
      const totalClasses = sessions.length;
      const emptyClasses = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
      const nonEmptyClasses = totalClasses - emptyClasses;
      const totalCheckedIn = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalLateCancels = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
      
      // Calculate advanced metrics
      const avgAll = totalClasses > 0 ? totalCheckedIn / totalClasses : 0;
      const avgNonEmpty = nonEmptyClasses > 0 ? totalCheckedIn / nonEmptyClasses : 0;
      const fillRate = totalCapacity > 0 ? (totalCheckedIn / totalCapacity) * 100 : 0;
      const revenuePerClass = totalClasses > 0 ? totalRevenue / totalClasses : 0;
      const revenuePerAttendee = totalCheckedIn > 0 ? totalRevenue / totalCheckedIn : 0;
      const utilization = totalCapacity > 0 ? (totalCheckedIn / totalCapacity) * 100 : 0;
      
      // Calculate consistency (lower variance = higher consistency)
      const attendanceValues = sessions.map(s => s.checkedInCount || 0);
      const attendanceMean = attendanceValues.reduce((sum, val) => sum + val, 0) / attendanceValues.length;
      const attendanceVariance = attendanceValues.reduce((sum, val) => sum + Math.pow(val - attendanceMean, 2), 0) / attendanceValues.length;
      const consistency = attendanceMean > 0 ? Math.max(0, 100 - (Math.sqrt(attendanceVariance) / attendanceMean * 100)) : 0;
      
      // Calculate show-up and no-show rates (based on late cancellations as proxy)
      const totalBooked = sessions.reduce((sum, s) => sum + (s.bookedCount || s.checkedInCount || 0), 0);
      const noShowRate = totalBooked > 0 ? (totalLateCancels / totalBooked) * 100 : 0;
      const showUpRate = 100 - noShowRate;

      // Get primary trainer and period for display
      const primaryTrainer = sessions[0]?.trainerName || 'Unknown';
      const primaryPeriod = sessions[0]?.period || 'Unknown';

      // Use the groupLabel computed in the switch statement above
      let groupLabel = '';
      switch (groupBy) {
        case 'trainer':
          groupLabel = primaryTrainer || 'Unknown Trainer';
          break;
        case 'class':
          groupLabel = sessions[0]?.cleanedClass || 'Unknown Class';
          break;
        case 'location':
          groupLabel = sessions[0]?.location || 'Unknown Location';
          break;
        case 'day_time':
          groupLabel = `${sessions[0]?.dayOfWeek} ${sessions[0]?.time}`;
          break;
        case 'trainer_class':
          groupLabel = `${primaryTrainer} - ${sessions[0]?.cleanedClass}`;
          break;
        case 'class_day_time_trainer':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.dayOfWeek} ${sessions[0]?.time} | ${primaryTrainer}`;
          break;
        case 'class_day_time':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.dayOfWeek} ${sessions[0]?.time}`;
          break;
        case 'class_time':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.time}`;
          break;
        case 'class_day':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.dayOfWeek}`;
          break;
        case 'trainer_time':
          groupLabel = `${primaryTrainer} | ${sessions[0]?.time}`;
          break;
        case 'trainer_class':
          groupLabel = `${primaryTrainer} - ${sessions[0]?.cleanedClass}`;
          break;
        case 'uniqueid1':
          groupLabel = sessions[0]?.uniqueId1 || 'Unknown UniqueID1';
          break;
        case 'uniqueid2':
          groupLabel = sessions[0]?.uniqueId2 || 'Unknown UniqueID2';
          break;
        default:
          groupLabel = 'All Sessions';
      }

      return {
        groupKey,
        groupLabel,
        trainer: primaryTrainer,
        period: primaryPeriod,
        sessions,
        aggregatedMetrics: {
          totalClasses,
          emptyClasses,
          nonEmptyClasses,
          totalCheckedIn,
          avgAll,
          avgNonEmpty,
          totalRevenue,
          totalLateCancels,
          totalPayout: 0,
          totalTips: 0,
          totalCapacity,
          fillRate,
          revenuePerClass,
          revenuePerAttendee,
          utilization,
          consistency,
          noShowRate,
          showUpRate
        },
        isExpanded: expandedGroups.has(groupKey) || expandAll
      };
    }).sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a.trainer.localeCompare(b.trainer);
      } else {
        return b.trainer.localeCompare(a.trainer);
      }
    });
  }, [processedData, groupBy, viewMode, expandedGroups, expandAll, sortConfig]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return viewMode === 'grouped' ? groupedData : processedData;
    }

    const searchLower = searchTerm.toLowerCase();
    
    if (viewMode === 'grouped') {
      return groupedData.filter(group => 
        group.trainer.toLowerCase().includes(searchLower) ||
        group.groupLabel.toLowerCase().includes(searchLower) ||
        group.sessions.some(session => 
          (session.cleanedClass || '').toLowerCase().includes(searchLower) ||
          (session.location || '').toLowerCase().includes(searchLower)
        )
      );
    } else {
      return processedData.filter(session =>
        (session.trainerName || '').toLowerCase().includes(searchLower) ||
        (session.cleanedClass || '').toLowerCase().includes(searchLower) ||
        (session.location || '').toLowerCase().includes(searchLower)
      );
    }
  }, [groupedData, processedData, searchTerm, viewMode]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return (filteredData as any[]).slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((filteredData as any[]).length / itemsPerPage);

  // Event handlers
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const toggleExpandAll = useCallback(() => {
    setExpandAll(prev => !prev);
    if (!expandAll) {
      // Expand all groups
      const allGroupKeys = groupedData.map(g => g.groupKey);
      setExpandedGroups(new Set(allGroupKeys));
    } else {
      // Collapse all groups
      setExpandedGroups(new Set());
    }
  }, [expandAll, groupedData]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <div className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="w-4 h-4 text-blue-200" /> : 
      <SortDesc className="w-4 h-4 text-blue-200" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  const TrainerAvatar: React.FC<{ name: string }> = ({ name }) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];

    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    return (
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
        colors[colorIndex]
      )}>
        {initials}
      </div>
    );
  };

  const ClassTypeBadge: React.FC<{ type: string; count?: number }> = ({ type, count }) => {
    const getBadgeColor = (classType: string) => {
      if (classType.toLowerCase().includes('barre')) return 'bg-pink-100 text-pink-800 border-pink-200';
      if (classType.toLowerCase().includes('cardio')) return 'bg-red-100 text-red-800 border-red-200';
      if (classType.toLowerCase().includes('power')) return 'bg-orange-100 text-orange-800 border-orange-200';
      if (classType.toLowerCase().includes('recovery')) return 'bg-green-100 text-green-800 border-green-200';
      return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    return (
      <div className="flex items-center gap-2">
        <Badge className={cn('text-xs font-medium px-2 py-1', getBadgeColor(type))}>
          {type}
        </Badge>
        {count && count > 1 && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full bg-white shadow-lg border-0 rounded-xl overflow-visible">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
              Class Analytics Dashboard
            </CardTitle>
            <p className="text-slate-600">Comprehensive view of your class performance data</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{data.length}</div>
            <div className="text-sm text-slate-500">Total Records</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search classes, trainers, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>

          {/* Group By */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByOption)}>
              <SelectTrigger className="w-[220px] bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="class">Class Type</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="uniqueid1">Group by Class</SelectItem>
                <SelectItem value="uniqueid2">Group by Class & Trainer</SelectItem>
                <SelectItem value="day_time">Day + Time</SelectItem>
                <SelectItem value="trainer_class">Trainer + Class</SelectItem>
                <SelectItem value="class_day_time_trainer">Class + Day + Time + Trainer</SelectItem>
                <SelectItem value="class_day_time">Class + Day + Time</SelectItem>
                <SelectItem value="class_time">Class + Time</SelectItem>
                <SelectItem value="class_day">Class + Day</SelectItem>
                <SelectItem value="trainer_time">Trainer + Time</SelectItem>
                <SelectItem value="none">No Grouping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className="flex items-center gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Grouped
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('flat')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Flat
            </Button>
          </div>

          {/* Expand All */}
          {viewMode === 'grouped' && (
            <div className="flex items-center gap-2">
              <Switch
                id="expand-all"
                checked={expandAll}
                onCheckedChange={toggleExpandAll}
              />
              <Label htmlFor="expand-all" className="text-sm font-medium text-slate-700">
                Expand All
              </Label>
            </div>
          )}

          {/* Export */}
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 rounded-b-xl">
        <div className="relative overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar border-t border-slate-200 rounded-b-xl">
          <Table className="min-w-[1800px]">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b-2 border-slate-700 shadow-lg">
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-blue-200 transition-colors w-[120px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10"
                  onClick={() => handleSort('trainer')}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    TRAINER
                    {getSortIcon('trainer')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-blue-200 transition-colors w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10"
                  onClick={() => handleSort('period')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    PERIOD
                    {getSortIcon('period')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-blue-200 transition-colors w-[100px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    DATE
                    {getSortIcon('date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-blue-200 transition-colors w-[150px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10"
                  onClick={() => handleSort('classType')}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    CLASS TYPE
                    {getSortIcon('classType')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-blue-200 transition-colors w-[90px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10"
                  onClick={() => handleSort('day')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    DAY
                    {getSortIcon('day')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-blue-200 transition-colors w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10"
                  onClick={() => handleSort('time')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    TIME
                    {getSortIcon('time')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-blue-200 transition-colors w-[150px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    LOCATION
                    {getSortIcon('location')}
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[70px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 py-2 h-10">
                  <div className="flex items-center justify-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    CLASSES
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[70px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 text-red-400" />
                    EMPTY
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 text-green-400" />
                    NON-EMPTY
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4" />
                    CHECKED IN
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Activity className="w-4 h-4" />
                    AVG. (ALL)
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    AVG. (NON-EMPTY)
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[100px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    REVENUE
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-orange-400" />
                    LATE CANCELS
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    PAYOUT
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[70px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    TIPS
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    CAPACITY
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 text-purple-400" />
                    FILL RATE
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    REV/CLASS
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 text-teal-400" />
                    REV/ATTENDEE
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    CONSISTENCY
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    SHOW-UP %
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === 'grouped' ? (
                // Grouped view
                paginatedData.map((group: GroupedData) => (
                  <React.Fragment key={group.groupKey}>
                    {/* Group header row */}
                    <TableRow 
                      className="bg-slate-100 hover:bg-slate-200 transition-colors border-l-4 border-l-blue-500 cursor-pointer"
                      onClick={() => toggleGroup(group.groupKey)}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {group.isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                          <TrainerAvatar name={group.trainer} />
                          <div>
                            <div className="font-semibold text-slate-900">{group.trainer}</div>
                            <div className="text-xs text-slate-500">
                              {group.aggregatedMetrics.totalClasses} total classes
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="font-medium">
                          {group.period}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-slate-500">
                        Multiple dates
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-slate-500">Multiple classes</div>
                      </TableCell>
                      <TableCell className="py-4 text-slate-500">
                        Various
                      </TableCell>
                      <TableCell className="py-4 text-slate-500">
                        Various
                      </TableCell>
                      <TableCell className="py-4 text-slate-500">
                        Multiple locations
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className="bg-blue-100 text-blue-800 font-bold">
                          {group.aggregatedMetrics.totalClasses}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className="bg-red-100 text-red-800 font-bold">
                          {group.aggregatedMetrics.emptyClasses}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className="bg-green-100 text-green-800 font-bold">
                          {group.aggregatedMetrics.nonEmptyClasses}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-bold text-slate-900">
                          {group.aggregatedMetrics.totalCheckedIn}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-medium text-slate-700">
                          {group.aggregatedMetrics.avgAll.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-medium text-slate-700">
                          {group.aggregatedMetrics.avgNonEmpty.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-bold text-green-700">
                          {formatCurrency(group.aggregatedMetrics.totalRevenue)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-medium text-orange-700">
                          {group.aggregatedMetrics.totalLateCancels}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center text-slate-400">
                        -
                      </TableCell>
                      <TableCell className="py-4 text-center text-slate-400">
                        -
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-medium text-blue-700">
                          {formatNumber(group.aggregatedMetrics.totalCapacity)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className={cn(
                          "font-medium px-2 py-1",
                          group.aggregatedMetrics.fillRate >= 80 ? "bg-green-100 text-green-800" :
                          group.aggregatedMetrics.fillRate >= 60 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {group.aggregatedMetrics.fillRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-medium text-emerald-700">
                          {formatCurrency(group.aggregatedMetrics.revenuePerClass)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="font-medium text-teal-700">
                          {formatCurrency(group.aggregatedMetrics.revenuePerAttendee)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className={cn(
                          "font-medium px-2 py-1",
                          group.aggregatedMetrics.consistency >= 80 ? "bg-green-100 text-green-800" :
                          group.aggregatedMetrics.consistency >= 60 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {group.aggregatedMetrics.consistency.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className={cn(
                          "font-medium px-2 py-1",
                          group.aggregatedMetrics.showUpRate >= 90 ? "bg-green-100 text-green-800" :
                          group.aggregatedMetrics.showUpRate >= 75 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {group.aggregatedMetrics.showUpRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Individual session rows */}
                    {group.isExpanded && group.sessions.map((session, index) => (
                      <TableRow 
                        key={`${group.groupKey}-${index}`}
                        className="bg-white hover:bg-blue-50 transition-colors border-l-4 border-l-transparent hover:border-l-blue-300"
                      >
                        <TableCell className="py-3 pl-12">
                          <div className="flex items-center gap-3">
                            <TrainerAvatar name={session.trainerName || 'Unknown'} />
                            <div>
                              <div className="font-medium text-slate-800">{session.trainerName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-xs">
                            {session.period}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm font-medium text-slate-700">
                            {formatDate(session.date)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <ClassTypeBadge type={session.cleanedClass || 'Unknown'} />
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm text-slate-600">
                            {session.dayOfWeek}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm font-medium text-slate-700">
                            {session.time}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm text-slate-600 truncate max-w-[120px]">
                            {session.location}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="secondary" className="text-xs">
                            1
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge className={cn(
                            "text-xs font-medium",
                            session.emptyClasses > 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                          )}>
                            {session.emptyClasses}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge className={cn(
                            "text-xs font-medium",
                            session.nonEmptyClasses > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          )}>
                            {session.nonEmptyClasses}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="font-medium text-slate-800">
                            {session.checkedInCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="text-sm text-slate-600">
                            {session.checkedInCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="text-sm text-slate-600">
                            {(session.checkedInCount || 0) > 0 ? (session.checkedInCount || 0) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="font-medium text-green-700">
                            {formatCurrency(session.totalPaid || 0)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="text-sm text-orange-600">
                            {session.lateCancelledCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center text-slate-400">
                          -
                        </TableCell>
                        <TableCell className="py-3 text-center text-slate-400">
                          -
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                // Flat view
                paginatedData.map((session: ProcessedSession, index) => (
                  <TableRow 
                    key={index}
                    className="bg-white hover:bg-blue-50 transition-colors border-l-4 border-l-transparent hover:border-l-blue-300"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <TrainerAvatar name={session.trainerName || 'Unknown'} />
                        <div>
                          <div className="font-medium text-slate-800">{session.trainerName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="font-medium">
                        {session.period}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-700">
                        {formatDate(session.date)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <ClassTypeBadge type={session.cleanedClass || 'Unknown'} />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-slate-600">
                        {session.dayOfWeek}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-700">
                        {session.time}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-slate-600 truncate max-w-[120px]">
                        {session.location}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Badge variant="secondary">
                        1
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Badge className={cn(
                        "font-medium",
                        session.emptyClasses > 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                      )}>
                        {session.emptyClasses}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Badge className={cn(
                        "font-medium",
                        session.nonEmptyClasses > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      )}>
                        {session.nonEmptyClasses}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="font-bold text-slate-900">
                        {session.checkedInCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="font-medium text-slate-700">
                        {session.checkedInCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="font-medium text-slate-700">
                        {(session.checkedInCount || 0) > 0 ? (session.checkedInCount || 0) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="font-bold text-green-700">
                        {formatCurrency(session.totalPaid || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="font-medium text-orange-700">
                        {session.lateCancelledCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center text-slate-400">
                      -
                    </TableCell>
                    <TableCell className="py-4 text-center text-slate-400">
                      -
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, (filteredData as any[]).length)} of {(filteredData as any[]).length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* AI Notes Section */}
      <PersistentTableFooter
        tableId="comprehensive-class-attendance"
        tableData={viewMode === 'grouped' ? groupedData.map(g => g.aggregatedMetrics) : processedData}
        tableName="Comprehensive Class Attendance"
        tableContext="Class attendance analysis with grouping and detailed metrics"
      />
    </Card>
  );
};