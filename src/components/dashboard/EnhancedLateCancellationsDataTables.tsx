import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LateCancellationsData } from '@/types/dashboard';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { AlertTriangle, Users, Calendar, Package, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { PersistentTableFooter } from './PersistentTableFooter';
import CopyTableButton from '@/components/ui/CopyTableButton';

interface EnhancedLateCancellationsDataTablesProps {
  data: LateCancellationsData[];
  // New: all checkins (unfiltered) to compute true check-ins and bookings per day
  allCheckins?: any[];
  onDrillDown?: (data: any) => void;
}

const ITEMS_PER_PAGE = 100;

export const EnhancedLateCancellationsDataTables: React.FC<EnhancedLateCancellationsDataTablesProps> = ({ data, allCheckins = [], onDrillDown }) => {
  // Refs for each table tab
  const multipleDayTableRef = useRef<HTMLDivElement>(null);
  const membersTableRef = useRef<HTMLDivElement>(null);
  const checkinsTableRef = useRef<HTMLDivElement>(null);
  const bookingsTableRef = useRef<HTMLDivElement>(null);
  const classTableRef = useRef<HTMLDivElement>(null);
  const membershipTableRef = useRef<HTMLDivElement>(null);
  const trainerTableRef = useRef<HTMLDivElement>(null);
  const locationTableRef = useRef<HTMLDivElement>(null);
  const topCancellersTableRef = useRef<HTMLDivElement>(null);

  // Shared table card wrapper to match Sales tab styling
  const TableContainer: React.FC<{ children: React.ReactNode; tableRef?: React.RefObject<HTMLDivElement> }> = ({ children, tableRef }) => (
    <div ref={tableRef} className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {children}
    </div>
  );
  const [activeTab, setActiveTab] = useState('multiple-day');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDescending, setIsDescending] = useState(true);

  // Members cancelling more than 1 class per day
  const multipleCancellationsPerDay = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const memberDayGroups = data.reduce((acc, item) => {
      if (!item.dateIST || !item.memberId) return acc;
      
      const key = `${item.memberId}-${item.dateIST}`;
      
      if (!acc[key]) {
        acc[key] = {
          memberId: item.memberId,
          memberName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          email: item.email,
          date: item.dateIST,
          cancellations: [],
          count: 0,
          locations: new Set(),
          classes: new Set(), // formats bucket
          specificClasses: new Set(), // class + day + time
          trainers: new Set()
        };
      }
      
      acc[key].cancellations.push({
        sessionName: item.sessionName,
        time: item.time,
        location: item.location,
        teacherName: item.teacherName,
        cleanedClass: item.cleanedClass,
        cleanedProduct: item.cleanedProduct
      });
      acc[key].count += 1;
      acc[key].locations.add(item.location);
      acc[key].classes.add(item.cleanedClass);
      acc[key].specificClasses.add(`${item.cleanedClass || 'Unknown'}|${item.dayOfWeek || 'Unknown'}|${item.time || 'Unknown'}`);
      acc[key].trainers.add(item.teacherName);
      
      return acc;
    }, {} as Record<string, any>);
    
    const arr = Object.values(memberDayGroups)
      .filter((group: any) => group.count > 1)
      .map((group: any) => ({
        ...group,
        uniqueLocations: group.locations.size,
        uniqueClasses: group.classes.size,
        uniqueTrainers: group.trainers.size,
        uniqueSpecificClasses: group.specificClasses.size
      }));
    return arr.sort((a: any, b: any) => isDescending ? b.count - a.count : a.count - b.count);
  }, [data, isDescending]);

  // Enhanced checkins per day calculation
  const multipleCheckinsPerDay = useMemo(() => {
    if (!allCheckins || allCheckins.length === 0) return [];
    
    // Group by member and date and only count rows with Checked in = TRUE
    const memberDayStats = allCheckins.reduce((acc, item) => {
      if (!item.dateIST || !item.memberId) return acc;
      const isCheckedIn = (item.checkedIn || '').toString().toUpperCase() === 'TRUE';
      if (!isCheckedIn) return acc;
      
      const key = `${item.memberId}-${item.dateIST}`;
      
      if (!acc[key]) {
        acc[key] = {
          memberId: item.memberId,
          memberName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          email: item.email,
          date: item.dateIST,
          totalSessions: 0,
          cancellations: 0, // tracked separately if needed
          sessionDetails: []
        };
      }
      
      acc[key].totalSessions += 1; // true check-ins
      acc[key].sessionDetails.push({
        sessionName: item.sessionName,
        time: item.time,
        location: item.location,
        teacherName: item.teacherName,
        status: 'checked-in'
      });
      
      return acc;
    }, {} as Record<string, any>);
    
    const arr = Object.values(memberDayStats)
      .filter((member: any) => member.totalSessions > 1);
    return arr.sort((a: any, b: any) => isDescending ? b.totalSessions - a.totalSessions : a.totalSessions - b.totalSessions);
  }, [allCheckins, isDescending]);

  // New: Bookings per day irrespective of checked-in (TRUE or FALSE)
  const multipleBookingsPerDay = useMemo(() => {
    if (!allCheckins || allCheckins.length === 0) return [];
    const memberDayStats = allCheckins.reduce((acc, item) => {
      if (!item.dateIST || !item.memberId) return acc;
      const key = `${item.memberId}-${item.dateIST}`;
      if (!acc[key]) {
        acc[key] = {
          memberId: item.memberId,
          memberName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          email: item.email,
          date: item.dateIST,
          totalBookings: 0,
          sessionDetails: []
        };
      }
      acc[key].totalBookings += 1;
      acc[key].sessionDetails.push({
        sessionName: item.sessionName,
        time: item.time,
        location: item.location,
        teacherName: item.teacherName,
        status: (item.checkedIn || '').toString().toUpperCase() === 'TRUE' ? 'checked-in' : 'booked'
      });
      return acc;
    }, {} as Record<string, any>);
    const arr = Object.values(memberDayStats).filter((member: any) => member.totalBookings > 1);
    return arr.sort((a: any, b: any) => isDescending ? b.totalBookings - a.totalBookings : a.totalBookings - b.totalBookings);
  }, [allCheckins, isDescending]);

  // Daily aggregates: Check-ins per day (all members), grouped by date
  const checkinsPerDay = useMemo(() => {
    if (!allCheckins || allCheckins.length === 0) return [] as any[];
    const map = allCheckins.reduce((acc, item) => {
      const isCheckedIn = (item.checkedIn || '').toString().toUpperCase() === 'TRUE';
      if (!isCheckedIn) return acc;
      const day = item.dateIST ? new Date(item.dateIST).toISOString().slice(0, 10) : 'Unknown';
      if (!acc[day]) {
        acc[day] = {
          date: day,
          count: 0,
          members: new Set<string>(),
          locations: new Set<string>(),
          formats: new Set<string>(),
          revenue: 0
        };
      }
      acc[day].count += 1;
      item.memberId && acc[day].members.add(item.memberId);
      item.location && acc[day].locations.add(item.location);
      item.cleanedClass && acc[day].formats.add(item.cleanedClass);
      acc[day].revenue += item.paidAmount || 0;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(map)
      .map((g: any) => ({
        ...g,
        uniqueMembers: g.members.size,
        uniqueLocations: g.locations.size,
        uniqueFormats: g.formats.size
      }))
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  }, [allCheckins]);

  // Daily aggregates: Bookings per day (regardless of checked-in), grouped by date
  const bookingsPerDay = useMemo(() => {
    if (!allCheckins || allCheckins.length === 0) return [] as any[];
    const map = allCheckins.reduce((acc, item) => {
      const day = item.dateIST ? new Date(item.dateIST).toISOString().slice(0, 10) : 'Unknown';
      if (!acc[day]) {
        acc[day] = {
          date: day,
          count: 0,
          members: new Set<string>(),
          locations: new Set<string>(),
          formats: new Set<string>(),
          revenue: 0
        };
      }
      acc[day].count += 1;
      item.memberId && acc[day].members.add(item.memberId);
      item.location && acc[day].locations.add(item.location);
      item.cleanedClass && acc[day].formats.add(item.cleanedClass);
      acc[day].revenue += item.paidAmount || 0;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(map)
      .map((g: any) => ({
        ...g,
        uniqueMembers: g.members.size,
        uniqueLocations: g.locations.size,
        uniqueFormats: g.formats.size
      }))
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  }, [allCheckins]);

  const renderDailyAggregationTable = (rows: any[], title: string, tableId: string) => {
    const pageRows = getPaginatedData(rows);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 justify-between px-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 min-w-[120px] justify-center">{formatNumber(rows.length)} days</Badge>
          </div>
        </div>
        {pageRows.length > 0 ? (
          <>
            <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="h-[35px]">
                  <TableHead>Date</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Formats</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r: any, idx: number) => (
                  <TableRow key={idx} className="h-[35px] hover:bg-gray-50">
                    <TableCell className="font-medium">{(() => { const d = new Date(r.date); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); })()}</TableCell>
                    <TableCell><Badge variant="outline" className="min-w-[70px] justify-center">{formatNumber(r.count)}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="min-w-[70px] justify-center">{formatNumber(r.uniqueMembers)}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="min-w-[70px] justify-center">{formatNumber(r.uniqueLocations)}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="min-w-[70px] justify-center">{formatNumber(r.uniqueFormats)}</Badge></TableCell>
                    <TableCell className="text-slate-700">{formatCurrency(r.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <PaginationControls />
            <PersistentTableFooter
              tableId={tableId}
              tableName={title}
              tableContext={`${title} within selected filters`}
              tableData={pageRows}
              tableColumns={[
                { header: 'Date', key: 'date', type: 'date' },
                { header: 'Sessions', key: 'count', type: 'number' },
                { header: 'Members', key: 'uniqueMembers', type: 'number' },
                { header: 'Locations', key: 'uniqueLocations', type: 'number' },
                { header: 'Formats', key: 'uniqueFormats', type: 'number' },
                { header: 'Revenue', key: 'revenue', type: 'currency' }
              ] as any}
            />
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>
    );
  };

  // Enhanced Visit Frequency by membership and format
  const visitFrequencyBreakdowns = useMemo(() => {
    if (!data || data.length === 0) return { byFormat: [], byMembership: [] } as any;
    // per member total visits
    const memberTotals = data.reduce((acc, item) => {
      const id = item.memberId || item.email || 'unknown';
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Buckets
    const buckets = [
      { label: '1', min: 1, max: 1 },
      { label: '2–3', min: 2, max: 3 },
      { label: '4–7', min: 4, max: 7 },
      { label: '8–15', min: 8, max: 15 },
      { label: '16+', min: 16, max: Infinity }
    ];

    const byFormatMap: Record<string, any> = {};
    const byMembershipMap: Record<string, any> = {};

    Object.entries(memberTotals).forEach(([memberId, total]) => {
      const memberRows = data.filter(r => (r.memberId || r.email || 'unknown') === memberId);
      const formats = new Set(memberRows.map(r => r.cleanedClass || 'Unknown'));
      const products = new Set(memberRows.map(r => r.cleanedProduct || 'Unknown'));
      const revenue = memberRows.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const bucket = buckets.find(b => total >= b.min && total <= b.max)?.label || '1';

      formats.forEach(fmt => {
        byFormatMap[fmt] = byFormatMap[fmt] || { format: fmt, buckets: {}, members: 0, revenue: 0 };
        byFormatMap[fmt].buckets[bucket] = (byFormatMap[fmt].buckets[bucket] || 0) + 1;
        byFormatMap[fmt].members += 1;
        byFormatMap[fmt].revenue += revenue;
      });

      products.forEach(prod => {
        byMembershipMap[prod] = byMembershipMap[prod] || { membership: prod, buckets: {}, members: 0, revenue: 0 };
        byMembershipMap[prod].buckets[bucket] = (byMembershipMap[prod].buckets[bucket] || 0) + 1;
        byMembershipMap[prod].members += 1;
        byMembershipMap[prod].revenue += revenue;
      });
    });

    const toRows = (obj: Record<string, any>, key: 'format' | 'membership') => Object.values(obj).map((v: any) => ({
      [key]: v[key],
      members: v.members,
      revenue: v.revenue,
      ...buckets.reduce((acc, b) => ({ ...acc, [b.label]: v.buckets[b.label] || 0 }), {})
    }));

    return {
      byFormat: toRows(byFormatMap, 'format'),
      byMembership: toRows(byMembershipMap, 'membership'),
      buckets
    };
  }, [data]);

  // Cancellations by class type with enhanced analytics
  const cancellationsByClass = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const classGroups = data.reduce((acc, item) => {
      const classType = item.cleanedClass || 'Unknown Class';
      
      if (!acc[classType]) {
        acc[classType] = {
          className: classType,
          category: item.cleanedCategory || 'Unknown',
          count: 0,
          members: new Set(),
          locations: new Set(),
          trainers: new Set(),
          totalDuration: 0,
          totalRevenue: 0,
          peakTimes: {},
          daysOfWeek: {}
        };
      }
      
      acc[classType].count += 1;
      acc[classType].members.add(item.memberId);
      acc[classType].locations.add(item.location);
      acc[classType].trainers.add(item.teacherName);
      acc[classType].totalDuration += item.duration || 0;
      acc[classType].totalRevenue += item.paidAmount || 0;
      
      // Track peak times
      if (item.time) {
        const hour = parseInt(item.time.split(':')[0]);
        const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        acc[classType].peakTimes[timeSlot] = (acc[classType].peakTimes[timeSlot] || 0) + 1;
      }
      
      // Track days of week
      if (item.dayOfWeek) {
        acc[classType].daysOfWeek[item.dayOfWeek] = (acc[classType].daysOfWeek[item.dayOfWeek] || 0) + 1;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    const arr = Object.values(classGroups)
      .map((group: any) => {
        const peakTime = Object.entries(group.peakTimes).reduce((a, b) => 
          group.peakTimes[a[0]] > group.peakTimes[b[0]] ? a : b, ['N/A', 0]
        )[0];
        
        const peakDay = Object.entries(group.daysOfWeek).reduce((a, b) => 
          group.daysOfWeek[a[0]] > group.daysOfWeek[b[0]] ? a : b, ['N/A', 0]
        )[0];
        
        return {
          ...group,
          uniqueMembers: group.members.size,
          uniqueLocations: group.locations.size,
          uniqueTrainers: group.trainers.size,
          avgDuration: group.count > 0 ? Math.round(group.totalDuration / group.count) : 0,
          avgRevenue: group.count > 0 ? group.totalRevenue / group.count : 0,
          peakTime,
          peakDay
        };
      });
    return arr.sort((a: any, b: any) => isDescending ? b.count - a.count : a.count - b.count);
  }, [data, isDescending]);

  // Enhanced cancellations by membership type
  const cancellationsByMembership = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const membershipGroups = data.reduce((acc, item) => {
      const membershipType = item.cleanedProduct || 'Unknown Membership';
      
      if (!acc[membershipType]) {
        acc[membershipType] = {
          membershipType,
          category: item.cleanedCategory || 'Unknown',
          count: 0,
          members: new Set(),
          revenue: 0,
          locations: new Set(),
          classes: new Set(),
          avgCancellationsPerMember: 0
        };
      }
      
      acc[membershipType].count += 1;
      acc[membershipType].members.add(item.memberId);
      acc[membershipType].revenue += item.paidAmount || 0;
      acc[membershipType].locations.add(item.location);
      acc[membershipType].classes.add(item.cleanedClass);
      
      return acc;
    }, {} as Record<string, any>);
    
    const arr = Object.values(membershipGroups)
      .map((group: any) => ({
        ...group,
        uniqueMembers: group.members.size,
        uniqueLocations: group.locations.size,
        uniqueClasses: group.classes.size,
        avgRevenuePerCancellation: group.count > 0 ? group.revenue / group.count : 0,
        avgCancellationsPerMember: group.uniqueMembers > 0 ? group.count / group.uniqueMembers : 0
      }));
    return arr.sort((a: any, b: any) => isDescending ? b.count - a.count : a.count - b.count);
  }, [data, isDescending]);

  // New: Top cancellers across the selected timeframe (not per-day)
  const topCancellersByMember = useMemo(() => {
    if (!data || data.length === 0) return [] as any[];
    const map = data.reduce((acc, item) => {
      const id = item.memberId || item.email || 'unknown';
      if (!acc[id]) {
        acc[id] = {
          memberId: item.memberId,
          memberName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          email: item.email,
          date: 'Multiple',
          count: 0,
          cancellations: [],
          locations: new Set<string>(),
          classes: new Set<string>(),
          trainers: new Set<string>()
        };
      }
      acc[id].count += 1;
      acc[id].cancellations.length < 10 && acc[id].cancellations.push({
        sessionName: item.sessionName,
        time: item.time,
        location: item.location,
        teacherName: item.teacherName,
        cleanedClass: item.cleanedClass,
        cleanedProduct: item.cleanedProduct
      });
      acc[id].locations.add(item.location || '');
      acc[id].classes.add(item.cleanedClass || '');
      acc[id].trainers.add(item.teacherName || '');
      return acc;
    }, {} as Record<string, any>);
    const arr = Object.values(map).map((g: any) => ({
      ...g,
      uniqueLocations: g.locations.size,
      uniqueClasses: g.classes.size,
      uniqueTrainers: g.trainers.size
    }));
    return arr.sort((a: any, b: any) => isDescending ? b.count - a.count : a.count - b.count);
  }, [data, isDescending]);

  // Pagination logic
  const getPaginatedData = (tableData: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return tableData.slice(startIndex, endIndex);
  };

  const getTotalPages = (tableData: any[]) => {
    return Math.ceil(tableData.length / ITEMS_PER_PAGE);
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'multiple-day':
        return multipleCancellationsPerDay;
      case 'multiple-checkins':
        return multipleCheckinsPerDay;
      case 'multiple-bookings':
        return multipleBookingsPerDay;
      case 'by-class':
        return cancellationsByClass;
      case 'by-membership':
        return cancellationsByMembership;
      case 'top-cancellers':
        return topCancellersByMember;
      default:
        return [];
    }
  };

  const currentData = getCurrentData();
  const paginatedData = getPaginatedData(currentData);
  const totalPages = getTotalPages(currentData);

  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, currentData.length)} of {currentData.length} results
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            if (pageNum > totalPages) return null;
            
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'outline'}
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
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderMultipleCancellationsTable = (tableData: any[], title: string, tabType: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between px-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 min-w-[90px] justify-center">
            {currentData.length} total members
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Sort by count</span>
          <Button size="sm" variant="outline" onClick={() => setIsDescending(prev => !prev)}>
            {isDescending ? 'Desc' : 'Asc'}
          </Button>
        </div>
      </div>
      
      {Array.isArray(tableData) && tableData.length > 0 ? (
        <>
          <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((member, index) => (
                <TableRow 
                  key={index} 
                  className="h-[35px] max-h-[35px] hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    try {
                      if (onDrillDown && member) {
                        onDrillDown({
                          type: 'member',
                          title: `Member: ${member.memberName || 'Unknown'}`,
                          data: member,
                          rawData: member.cancellations || member.sessionDetails || []
                        });
                      }
                    } catch (error) {
                      console.error('Error in drill down:', error);
                    }
                  }}
                >
                  <TableCell className="font-medium h-[35px] py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {member.memberName ? member.memberName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm truncate max-w-[150px]">{member.memberName}</p>
                        <p className="text-xs text-gray-500">ID: {member.memberId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <span className="text-sm truncate max-w-[200px] block">{member.email}</span>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="outline" className="text-xs min-w-[90px] justify-center">
                      {(() => {
                        const d = new Date(member.date);
                        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
                      })()}
                    </Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="destructive" className="text-xs min-w-[70px] justify-center">
                      {(tabType === 'multiple-day' ? member.count : tabType === 'multiple-checkins' ? member.totalSessions : member.totalBookings)} {tabType === 'multiple-day' ? 'cancellations' : 'sessions'}
                    </Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <div className="flex gap-1">
                      {member.uniqueLocations && (
                        <Badge variant="outline" className="text-xs min-w-[60px] justify-center">
                          {member.uniqueLocations} loc
                        </Badge>
                      )}
                      {member.uniqueClasses && (
                        <Badge variant="outline" className="text-xs min-w-[80px] justify-center">
                          {member.uniqueClasses} formats
                        </Badge>
                      )}
                      {member.uniqueSpecificClasses && (
                        <Badge variant="outline" className="text-xs min-w-[100px] justify-center">
                          {member.uniqueSpecificClasses} classes
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <div className="text-xs text-gray-600 max-w-[200px]">
                      {Array.isArray(tabType === 'multiple-day' ? member.cancellations : member.sessionDetails) ? 
                        `${(tabType === 'multiple-day' ? member.cancellations : member.sessionDetails).length} sessions` :
                        'No data'
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
          <PaginationControls />
          <PersistentTableFooter
            tableId={`late-cancel-${tabType}`}
            tableName={title}
            tableContext={tabType === 'multiple-day' ? 'Members with multiple same-day late cancellations' : tabType === 'multiple-checkins' ? 'Members with multiple same-day check-ins' : 'Members with multiple same-day bookings'}
            tableData={tableData}
            tableColumns={[
              { header: 'Member', key: 'memberName', type: 'text' },
              { header: 'Email', key: 'email', type: 'text' },
              { header: 'Date', key: 'date', type: 'date' },
              { header: 'Count', key: (tabType === 'multiple-day' ? 'count' : tabType === 'multiple-checkins' ? 'totalSessions' : 'totalBookings') as any, type: 'number' }
            ] as any}
          />
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">No data available</p>
      )}
    </div>
  );

  const renderClassTypeTable = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between px-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Cancellations by Format</h3>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 min-w-[90px] justify-center">
            {currentData.length} class types
          </Badge>
        </div>
      </div>
      
      {paginatedData.length > 0 ? (
        <>
          <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="h-[35px]">
                <TableHead>Format</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cancellations</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Peak Time</TableHead>
                <TableHead>Peak Day</TableHead>
                <TableHead>Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {paginatedData.map((classType, index) => (
              <TableRow 
                key={index} 
                className="h-[35px] max-h-[35px] hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  try {
                    if (onDrillDown && classType) {
                      onDrillDown({
                        type: 'class',
                        title: `Format: ${classType.className || 'Unknown'}`,
                        data: classType,
                        rawData: data.filter(item => item.cleanedClass === classType.className) || []
                      });
                    }
                  } catch (error) {
                    console.error('Error in class drill down:', error);
                  }
                }}
              >
                <TableCell className="font-medium h-[35px] py-2">
                  <span className="truncate max-w-[150px] block">{classType.className}</span>
                </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="secondary">{classType.category}</Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="destructive" className="min-w-[70px] justify-center">
                      {formatNumber(classType.count)}
                    </Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">{formatNumber(classType.uniqueMembers)}</TableCell>
                  <TableCell className="h-[35px] py-2">{formatNumber(classType.uniqueLocations)}</TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="outline" className="min-w-[70px] justify-center">{classType.peakTime}</Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="outline" className="min-w-[70px] justify-center">{classType.peakDay}</Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">{classType.avgDuration} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
          <PaginationControls />
          <PersistentTableFooter
            tableId="late-cancel-by-class"
            tableName="Cancellations by Class Type"
            tableContext="Late cancellations grouped by class type and category"
            tableData={paginatedData}
            tableColumns={[
              { header: 'Class Type', key: 'className', type: 'text' },
              { header: 'Category', key: 'category', type: 'text' },
              { header: 'Cancellations', key: 'count', type: 'number' },
              { header: 'Members', key: 'uniqueMembers', type: 'number' },
              { header: 'Locations', key: 'uniqueLocations', type: 'number' },
              { header: 'Peak Time', key: 'peakTime', type: 'text' },
              { header: 'Peak Day', key: 'peakDay', type: 'text' },
              { header: 'Avg Duration', key: 'avgDuration', type: 'number' }
            ] as any}
          />
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">No class type data available</p>
      )}
    </div>
  );

  // New: Separate By Class table (combined class/day/time)
  const renderBySpecificClassTable = () => {
    const rows = useMemo(() => {
      if (!data || data.length === 0) return [] as any[];
      const map = data.reduce((acc, item) => {
        const key = `${item.cleanedClass || 'Unknown'}|${item.dayOfWeek || 'Unknown'}|${item.time || 'Unknown'}`;
        if (!acc[key]) {
          acc[key] = {
            classKey: key,
            className: item.cleanedClass || 'Unknown',
            dayOfWeek: item.dayOfWeek || 'Unknown',
            time: item.time || 'Unknown',
            count: 0,
            locations: new Set<string>(),
            trainers: new Set<string>()
          };
        }
        acc[key].count += 1;
        item.location && acc[key].locations.add(item.location);
        item.teacherName && acc[key].trainers.add(item.teacherName);
        return acc;
      }, {} as Record<string, any>);
      return Object.values(map)
        .map((g: any) => ({
          ...g,
          uniqueLocations: g.locations.size,
          uniqueTrainers: g.trainers.size
        }))
        .sort((a: any, b: any) => isDescending ? b.count - a.count : a.count - b.count);
    }, [data, isDescending]);

    const pageRows = getPaginatedData(rows);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold">Cancellations by Class (Specific)</h3>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 min-w-[90px] justify-center">{rows.length} classes</Badge>
          </div>
        </div>
        {pageRows.length > 0 ? (
          <>
            <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="h-[35px]">
                  <TableHead>Class</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Cancellations</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Trainers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r: any, idx: number) => (
                  <TableRow key={idx} className="h-[35px] hover:bg-gray-50">
                    <TableCell className="font-medium">{r.className}</TableCell>
                    <TableCell>{r.dayOfWeek}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="min-w-[70px] justify-center">{formatNumber(r.count)}</Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="min-w-[60px] justify-center">{r.uniqueLocations}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="min-w-[60px] justify-center">{r.uniqueTrainers}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <PaginationControls />
            <PersistentTableFooter
              tableId="late-cancel-by-specific-class"
              tableName="Cancellations by Specific Class"
              tableContext="Late cancellations grouped by specific class (class + day + time)"
              tableData={pageRows}
              tableColumns={[
                { header: 'Class', key: 'className', type: 'text' },
                { header: 'Day', key: 'dayOfWeek', type: 'text' },
                { header: 'Time', key: 'time', type: 'text' },
                { header: 'Cancellations', key: 'count', type: 'number' },
                { header: 'Locations', key: 'uniqueLocations', type: 'number' },
                { header: 'Trainers', key: 'uniqueTrainers', type: 'number' }
              ] as any}
            />
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No specific class data</p>
        )}
      </div>
    );
  };

  const renderMembershipTypeTable = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between px-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Cancellations by Membership Type</h3>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {currentData.length} membership types
          </Badge>
        </div>
      </div>
      
      {paginatedData.length > 0 ? (
        <>
          <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="h-[35px]">
                <TableHead>Membership Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cancellations</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Avg per Member</TableHead>
                <TableHead>Revenue Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((membership, index) => (
                <TableRow 
                  key={index} 
                  className="h-[35px] max-h-[35px] hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    try {
                      if (onDrillDown && membership) {
                        onDrillDown({
                          type: 'membership',
                          title: `Membership: ${membership.membershipType || 'Unknown'}`,
                          data: membership,
                          rawData: data.filter(item => item.cleanedProduct === membership.membershipType) || []
                        });
                      }
                    } catch (e) {
                      console.error('Error in membership drilldown', e);
                    }
                  }}
                >
                  <TableCell className="font-medium h-[35px] py-2">
                    <span className="truncate max-w-[200px] block">{membership.membershipType}</span>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="secondary">{membership.category}</Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="destructive">
                      {formatNumber(membership.count)}
                    </Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">{formatNumber(membership.uniqueMembers)}</TableCell>
                  <TableCell className="h-[35px] py-2">{formatNumber(membership.uniqueLocations)}</TableCell>
                  <TableCell className="h-[35px] py-2">
                    <Badge variant="outline">
                      {(membership.avgCancellationsPerMember || 0).toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="h-[35px] py-2">{formatCurrency(membership.revenue || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
            <PaginationControls />
            <PersistentTableFooter
              tableId="late-cancel-by-membership"
              tableName="Cancellations by Membership Type"
              tableContext="Late cancellations grouped by membership type"
              tableData={paginatedData}
              tableColumns={[
                { header: 'Membership Type', key: 'membershipType', type: 'text' },
                { header: 'Category', key: 'category', type: 'text' },
                { header: 'Cancellations', key: 'count', type: 'number' },
                { header: 'Members', key: 'uniqueMembers', type: 'number' },
                { header: 'Locations', key: 'uniqueLocations', type: 'number' },
                { header: 'Avg per Member', key: 'avgCancellationsPerMember', type: 'number' },
                { header: 'Revenue Impact', key: 'revenue', type: 'currency' }
              ] as any}
            />
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">No membership type data available</p>
      )}
    </div>
  );

  // Additional tables for comprehensive analysis
  const renderTrainerAnalysisTable = () => {
    const trainerData = useMemo(() => {
      if (!data || data.length === 0) return [];
      
      const trainerGroups = data.reduce((acc, item) => {
        const trainer = item.teacherName || 'Unknown Trainer';
        
        if (!acc[trainer]) {
          acc[trainer] = {
            trainerName: trainer,
            count: 0,
            members: new Set(),
            locations: new Set(),
            classes: new Set(),
            revenue: 0,
            avgCancellationsPerSession: 0,
            totalSessions: 0
          };
        }
        
        acc[trainer].count += 1;
        acc[trainer].members.add(item.memberId);
        acc[trainer].locations.add(item.location);
        acc[trainer].classes.add(item.cleanedClass);
        acc[trainer].revenue += item.paidAmount || 0;
        acc[trainer].totalSessions += 1; // Approximate
        
        return acc;
      }, {} as Record<string, any>);
      
      return Object.values(trainerGroups)
        .map((group: any) => ({
          ...group,
          uniqueMembers: group.members.size,
          uniqueLocations: group.locations.size,
          uniqueClasses: group.classes.size,
          avgCancellationsPerSession: group.totalSessions > 0 ? group.count / group.totalSessions : 0
        }))
        .sort((a: any, b: any) => b.count - a.count);
    }, [data]);

    const paginatedTrainerData = getPaginatedData(trainerData);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 justify-between px-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Cancellations by Trainer</h3>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {trainerData.length} trainers
            </Badge>
          </div>
        </div>
        
        {paginatedTrainerData.length > 0 ? (
          <>
            <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="h-[35px]">
                  <TableHead>Trainer Name</TableHead>
                  <TableHead>Cancellations</TableHead>
                  <TableHead>Affected Members</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Revenue Impact</TableHead>
                  <TableHead>Avg per Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrainerData.map((trainer, index) => (
                  <TableRow 
                    key={index} 
                    className="h-[35px] max-h-[35px] hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      try {
                        if (onDrillDown && trainer) {
                          onDrillDown({
                            type: 'trainer',
                            title: `Trainer: ${trainer.trainerName}`,
                            data: trainer,
                            rawData: data.filter(item => item.teacherName === trainer.trainerName) || []
                          });
                        }
                      } catch (e) {
                        console.error('Error in trainer drilldown', e);
                      }
                    }}
                  >
                    <TableCell className="font-medium h-[35px] py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {trainer.trainerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="truncate max-w-[120px]">{trainer.trainerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="h-[35px] py-2">
                      <Badge variant="destructive">
                        {formatNumber(trainer.count)}
                      </Badge>
                    </TableCell>
                    <TableCell className="h-[35px] py-2">{formatNumber(trainer.uniqueMembers)}</TableCell>
                    <TableCell className="h-[35px] py-2">{formatNumber(trainer.uniqueClasses)}</TableCell>
                    <TableCell className="h-[35px] py-2">{formatNumber(trainer.uniqueLocations)}</TableCell>
                    <TableCell className="h-[35px] py-2">{formatCurrency(trainer.revenue || 0)}</TableCell>
                    <TableCell className="h-[35px] py-2">
                      <Badge variant="outline">
                        {trainer.avgCancellationsPerSession.toFixed(2)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <PaginationControls />
            <PersistentTableFooter
              tableId="late-cancel-by-trainer"
              tableName="Cancellations by Trainer"
              tableContext="Late cancellations grouped by trainer with member and class counts"
              tableData={paginatedTrainerData}
              tableColumns={[
                { header: 'Trainer', key: 'trainerName', type: 'text' },
                { header: 'Cancellations', key: 'count', type: 'number' },
                { header: 'Members', key: 'uniqueMembers', type: 'number' },
                { header: 'Classes', key: 'uniqueClasses', type: 'number' },
                { header: 'Locations', key: 'uniqueLocations', type: 'number' },
                { header: 'Revenue Impact', key: 'revenue', type: 'currency' },
                { header: 'Avg per Session', key: 'avgCancellationsPerSession', type: 'number' }
              ] as any}
            />
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No trainer data available</p>
        )}
      </div>
    );
  };

  const renderLocationAnalysisTable = () => {
    const locationData = useMemo(() => {
      if (!data || data.length === 0) return [];
      
      const locationGroups = data.reduce((acc, item) => {
        const location = item.location || 'Unknown Location';
        
        if (!acc[location]) {
          acc[location] = {
            locationName: location,
            count: 0,
            members: new Set(),
            trainers: new Set(),
            classes: new Set(),
            revenue: 0,
            peakDays: {},
            peakTimes: {}
          };
        }
        
        acc[location].count += 1;
        acc[location].members.add(item.memberId);
        acc[location].trainers.add(item.teacherName);
        acc[location].classes.add(item.cleanedClass);
        acc[location].revenue += item.paidAmount || 0;
        
        // Track peak days and times
        if (item.dayOfWeek) {
          acc[location].peakDays[item.dayOfWeek] = (acc[location].peakDays[item.dayOfWeek] || 0) + 1;
        }
        if (item.time) {
          const hour = parseInt(item.time.split(':')[0]);
          const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
          acc[location].peakTimes[timeSlot] = (acc[location].peakTimes[timeSlot] || 0) + 1;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      return Object.values(locationGroups)
        .map((group: any) => {
          const peakDay = Object.entries(group.peakDays).reduce((a, b) => 
            group.peakDays[a[0]] > group.peakDays[b[0]] ? a : b, ['N/A', 0]
          )[0];
          
          const peakTime = Object.entries(group.peakTimes).reduce((a, b) => 
            group.peakTimes[a[0]] > group.peakTimes[b[0]] ? a : b, ['N/A', 0]
          )[0];
          
          return {
            ...group,
            uniqueMembers: group.members.size,
            uniqueTrainers: group.trainers.size,
            uniqueClasses: group.classes.size,
            peakDay,
            peakTime,
            avgRevenuePerCancellation: group.count > 0 ? group.revenue / group.count : 0
          };
        })
        .sort((a: any, b: any) => b.count - a.count);
    }, [data]);

    const paginatedLocationData = getPaginatedData(locationData);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 justify-between px-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold">Cancellations by Location</h3>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
              {locationData.length} locations
            </Badge>
          </div>
        </div>
        
        {paginatedLocationData.length > 0 ? (
          <>
            <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="h-[35px]">
                  <TableHead>Location</TableHead>
                  <TableHead>Cancellations</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Trainers</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Peak Day</TableHead>
                  <TableHead>Peak Time</TableHead>
                  <TableHead>Revenue Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLocationData.map((location, index) => (
                  <TableRow 
                    key={index} 
                    className="h-[35px] max-h-[35px] hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      try {
                        if (onDrillDown && location) {
                          onDrillDown({
                            type: 'location',
                            title: `Location: ${location.locationName}`,
                            data: location,
                            rawData: data.filter(item => item.location === location.locationName) || []
                          });
                        }
                      } catch (e) {
                        console.error('Error in location drilldown', e);
                      }
                    }}
                  >
                    <TableCell className="font-medium h-[35px] py-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="truncate max-w-[150px]">{location.locationName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="h-[35px] py-2">
                      <Badge variant="destructive">
                        {formatNumber(location.count)}
                      </Badge>
                    </TableCell>
                    <TableCell className="h-[35px] py-2">{formatNumber(location.uniqueMembers)}</TableCell>
                    <TableCell className="h-[35px] py-2">{formatNumber(location.uniqueTrainers)}</TableCell>
                    <TableCell className="h-[35px] py-2">{formatNumber(location.uniqueClasses)}</TableCell>
                    <TableCell className="h-[35px] py-2">
                      <Badge variant="outline">{location.peakDay}</Badge>
                    </TableCell>
                    <TableCell className="h-[35px] py-2">
                      <Badge variant="outline">{location.peakTime}</Badge>
                    </TableCell>
                    <TableCell className="h-[35px] py-2">{formatCurrency(location.revenue || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <PaginationControls />
            <PersistentTableFooter
              tableId="late-cancel-by-location"
              tableName="Cancellations by Location"
              tableContext="Late cancellations grouped by studio location"
              tableData={paginatedLocationData}
              tableColumns={[
                { header: 'Location', key: 'locationName', type: 'text' },
                { header: 'Cancellations', key: 'count', type: 'number' },
                { header: 'Members', key: 'uniqueMembers', type: 'number' },
                { header: 'Trainers', key: 'uniqueTrainers', type: 'number' },
                { header: 'Classes', key: 'uniqueClasses', type: 'number' },
                { header: 'Peak Day', key: 'peakDay', type: 'text' },
                { header: 'Peak Time', key: 'peakTime', type: 'text' },
                { header: 'Revenue Impact', key: 'revenue', type: 'currency' }
              ] as any}
            />
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No location data available</p>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-red-600" />
          Enhanced Late Cancellations Analysis
          <Badge variant="outline" className="bg-blue-50 text-blue-700 min-w-[180px] justify-center">
            Multiple analysis views with 35px row height
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            {/* Match Sales tabs style */}
            <TabsList className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-0 grid grid-cols-9 w-full max-w-7xl min-h-16 overflow-hidden mb-6">
              <TabsTrigger value="multiple-day" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Multiple/Day
              </TabsTrigger>
              <TabsTrigger value="multiple-checkins" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Check-ins/Day
              </TabsTrigger>
              <TabsTrigger value="multiple-bookings" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bookings/Day
              </TabsTrigger>
              <TabsTrigger value="by-class" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                By Format
              </TabsTrigger>
              <TabsTrigger value="by-membership" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                By Membership
              </TabsTrigger>
              <TabsTrigger value="by-trainer" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                By Trainer
              </TabsTrigger>
              <TabsTrigger value="by-location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                By Location
              </TabsTrigger>
              <TabsTrigger value="top-cancellers" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Top Cancellers
              </TabsTrigger>
              <TabsTrigger value="visit-frequency" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Visit Frequency
              </TabsTrigger>
              <TabsTrigger value="by-specific-class" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                By Class (Specific)
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="multiple-day" className="mt-0">
            {renderMultipleCancellationsTable(paginatedData, "Members with Multiple Late Cancellations per Day", "multiple-day")}
          </TabsContent>

          <TabsContent value="multiple-checkins" className="mt-0">
            {renderDailyAggregationTable(checkinsPerDay, 'Check-ins per Day', 'late-cancel-checkins-per-day')}
          </TabsContent>

          <TabsContent value="multiple-bookings" className="mt-0">
            {renderDailyAggregationTable(bookingsPerDay, 'Bookings per Day', 'late-cancel-bookings-per-day')}
          </TabsContent>

          <TabsContent value="by-class" className="mt-0">
            {renderClassTypeTable()}
          </TabsContent>

          <TabsContent value="by-membership" className="mt-0">
            {renderMembershipTypeTable()}
          </TabsContent>

          <TabsContent value="by-trainer" className="mt-0">
            {renderTrainerAnalysisTable()}
          </TabsContent>

          <TabsContent value="by-location" className="mt-0">
            {renderLocationAnalysisTable()}
          </TabsContent>

          {/* New: Top/Bottom cancellers and visit frequency buckets */}
          <TabsContent value="top-cancellers" className="mt-0">
            {renderMultipleCancellationsTable(paginatedData, 'Top Repeat Cancellers (Members)', 'top-cancellers')}
          </TabsContent>

          <TabsContent value="visit-frequency" className="mt-0">
            {(() => {
              const { buckets = [], byFormat = [], byMembership = [] } = visitFrequencyBreakdowns || {};
              const totalMembers = (list: any[]) => list.reduce((s, r) => s + r.members, 0);
              return (
                <div className="space-y-10">
                  {/* Overall Buckets */}
                  {(() => {
                    const memberTotals = data.reduce((acc, item) => {
                      const id = item.memberId || item.email || 'unknown';
                      acc[id] = (acc[id] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const rows = buckets.map(b => ({
                      bucket: b.label,
                      members: Object.values(memberTotals).filter(v => v >= b.min && v <= b.max).length
                    }));
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 justify-between px-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-600" />
                            <h3 className="text-lg font-semibold">Visit Frequency Buckets</h3>
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 min-w-[140px] justify-center">
                              {rows.reduce((s, r) => s + r.members, 0)} members
                            </Badge>
                          </div>
                        </div>
                        <TableContainer>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Visits (per period)</TableHead>
                              <TableHead>Members</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((r, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{r.bucket}</TableCell>
                                <TableCell>{formatNumber(r.members)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        </TableContainer>
                        <PersistentTableFooter
                          tableId="late-cancel-visit-frequency"
                          tableName="Visit Frequency Buckets"
                          tableContext="Distribution of member late cancellations by visit count within the selected timeframe"
                          tableData={rows}
                          tableColumns={[
                            { header: 'Bucket', key: 'bucket', type: 'text' },
                            { header: 'Members', key: 'members', type: 'number' }
                          ] as any}
                        />
                      </div>
                    );
                  })()}

                  {/* Breakdown by Format */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-between px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">Visit Frequency by Format</h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 min-w-[140px] justify-center">{totalMembers(byFormat)} members</Badge>
                      </div>
                    </div>
                    <TableContainer>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Format</TableHead>
                          {buckets.map(b => (<TableHead key={b.label}>{b.label}</TableHead>))}
                          <TableHead>Total Members</TableHead>
                          <TableHead>Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byFormat.map((r: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{r.format}</TableCell>
                            {buckets.map(b => (<TableCell key={b.label}>{formatNumber(r[b.label] || 0)}</TableCell>))}
                            <TableCell>{formatNumber(r.members)}</TableCell>
                            <TableCell>{formatCurrency(r.revenue || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </TableContainer>
                    <PersistentTableFooter
                      tableId="late-cancel-visit-frequency-format"
                      tableName="Visit Frequency by Format"
                      tableContext="Members bucketed by visit frequency grouped by class format"
                      tableData={byFormat}
                      tableColumns={[{ header: 'Format', key: 'format', type: 'text' }, ...buckets.map(b => ({ header: b.label, key: b.label, type: 'number' })), { header: 'Members', key: 'members', type: 'number' }, { header: 'Revenue', key: 'revenue', type: 'currency' }] as any}
                    />
                  </div>

                  {/* Breakdown by Membership */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-between px-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-semibold">Visit Frequency by Membership</h3>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 min-w-[140px] justify-center">{totalMembers(byMembership)} members</Badge>
                      </div>
                    </div>
                    <TableContainer>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Membership</TableHead>
                          {buckets.map(b => (<TableHead key={b.label}>{b.label}</TableHead>))}
                          <TableHead>Total Members</TableHead>
                          <TableHead>Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byMembership.map((r: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{r.membership}</TableCell>
                            {buckets.map(b => (<TableCell key={b.label}>{formatNumber(r[b.label] || 0)}</TableCell>))}
                            <TableCell>{formatNumber(r.members)}</TableCell>
                            <TableCell>{formatCurrency(r.revenue || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </TableContainer>
                    <PersistentTableFooter
                      tableId="late-cancel-visit-frequency-membership"
                      tableName="Visit Frequency by Membership"
                      tableContext="Members bucketed by visit frequency grouped by membership type"
                      tableData={byMembership}
                      tableColumns={[{ header: 'Membership', key: 'membership', type: 'text' }, ...buckets.map(b => ({ header: b.label, key: b.label, type: 'number' })), { header: 'Members', key: 'members', type: 'number' }, { header: 'Revenue', key: 'revenue', type: 'currency' }] as any}
                    />
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="by-specific-class" className="mt-0">
            {renderBySpecificClassTable()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};