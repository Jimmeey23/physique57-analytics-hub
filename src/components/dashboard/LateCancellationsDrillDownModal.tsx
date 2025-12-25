import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LateCancellationsData } from '@/types/dashboard';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { X, BarChart3, TrendingDown, Users, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LateCancellationsDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const LateCancellationsDrillDownModal: React.FC<LateCancellationsDrillDownModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!data) return null;

  // Handle different data structures that might be passed
  let rawData: any[] = [];
  
  if (Array.isArray(data)) {
    rawData = data;
  } else if (data.rawData && Array.isArray(data.rawData)) {
    rawData = data.rawData;
  } else if (data.data && Array.isArray(data.data)) {
    rawData = data.data;
  } else if (Array.isArray(data.records)) {
    rawData = data.records;
  }

  const safeRawData = rawData;
  const title = data?.title || data?.name || 'Late Cancellations Detail';
  
  // Calculate metrics from raw data
  const metrics = useMemo(() => {
    
    if (safeRawData.length === 0) {
      return {
        total: 0,
        uniqueMembers: 0,
        uniqueLocations: 0,
        uniqueTrainers: 0,
        uniqueClasses: 0,
        totalRevenue: 0,
        avgPerMember: '0',
        avgRevenue: '0',
        timeDistribution: {},
        dayDistribution: {},
        locationBreakdown: {},
        trainerBreakdown: {},
        classBreakdown: {}
      };
    }

    const total = safeRawData.length;
    const uniqueMembers = new Set(safeRawData.map((r: any) => r.memberId || r.memberName || r.member)).size;
    const uniqueLocations = new Set(safeRawData.map((r: any) => r.location)).size;
    const uniqueTrainers = new Set(safeRawData.map((r: any) => r.teacherName || r.trainer)).size;
    const uniqueClasses = new Set(safeRawData.map((r: any) => r.cleanedClass || r.class)).size;
    const totalRevenue = safeRawData.reduce((sum: number, r: any) => sum + (parseFloat(r.paidAmount) || parseFloat(r.amount) || 0), 0);

    // Time distribution
    const timeDistribution = safeRawData.reduce((acc: Record<string, number>, r: any) => {
      const hour = r.time ? parseInt(r.time.split(':')[0]) : 0;
      const slot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      acc[slot] = (acc[slot] || 0) + 1;
      return acc;
    }, {});

    // Day distribution
    const dayDistribution = safeRawData.reduce((acc: Record<string, number>, r: any) => {
      const day = r.dayOfWeek || 'Unknown';
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    // Location breakdown
    const locationBreakdown = safeRawData.reduce((acc: Record<string, number>, r: any) => {
      const loc = r.location || 'Unknown';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});

    // Trainer breakdown
    const trainerBreakdown = safeRawData.reduce((acc: Record<string, number>, r: any) => {
      const trainer = r.teacherName || 'Unknown';
      acc[trainer] = (acc[trainer] || 0) + 1;
      return acc;
    }, {});

    // Class breakdown
    const classBreakdown = safeRawData.reduce((acc: Record<string, number>, r: any) => {
      const cls = r.cleanedClass || 'Unknown';
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      uniqueMembers,
      uniqueLocations,
      uniqueTrainers,
      uniqueClasses,
      totalRevenue,
      avgPerMember: uniqueMembers > 0 ? (total / uniqueMembers).toFixed(1) : '0',
      avgRevenue: total > 0 ? (totalRevenue / total).toFixed(0) : '0',
      timeDistribution,
      dayDistribution,
      locationBreakdown,
      trainerBreakdown,
      classBreakdown
    };
  }, [safeRawData]);

  // Show a message if no data is available
  if (safeRawData.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              No Data Available
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">No late cancellation records found for the selected criteria.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="bg-gradient-to-r from-red-600 via-red-700 to-orange-600 text-white px-8 py-6 -mx-6 -mt-6 mb-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-xl">{title}</p>
                <p className="text-red-100 text-base font-normal mt-1">
                  Detailed analysis of {formatNumber(metrics.total)} late cancellation records
                </p>
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-full transition-colors duration-200 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 mx-6 mb-6 p-1 rounded-xl border border-slate-200">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white font-semibold rounded-lg"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="distribution" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white font-semibold rounded-lg"
            >
              Distribution
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white font-semibold rounded-lg"
            >
              Records
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 px-6 pb-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-red-600 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-600 mb-2 font-semibold uppercase">Total Records</p>
                        <p className="text-3xl font-bold text-red-600">{formatNumber(metrics.total)}</p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-600 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-600 mb-2 font-semibold uppercase">Unique Members</p>
                        <p className="text-3xl font-bold text-orange-600">{formatNumber(metrics.uniqueMembers)}</p>
                      </div>
                      <Users className="w-8 h-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-600 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-600 mb-2 font-semibold uppercase">Locations</p>
                        <p className="text-3xl font-bold text-blue-600">{formatNumber(metrics.uniqueLocations)}</p>
                      </div>
                      <MapPin className="w-8 h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-600 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-600 mb-2 font-semibold uppercase">Revenue Lost</p>
                        <p className="text-2xl font-bold text-green-600">₹{formatNumber(Math.round(metrics.totalRevenue))}</p>
                      </div>
                      <Clock className="w-8 h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Avg per Member</p>
                    <p className="text-2xl font-bold text-slate-700">{metrics.avgPerMember}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Avg Revenue</p>
                    <p className="text-2xl font-bold text-slate-700">₹{metrics.avgRevenue}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Trainers</p>
                    <p className="text-2xl font-bold text-slate-700">{formatNumber(metrics.uniqueTrainers)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Classes</p>
                    <p className="text-2xl font-bold text-slate-700">{formatNumber(metrics.uniqueClasses)}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time Distribution */}
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                      <Clock className="w-4 h-4" />
                      Time Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {Object.entries(metrics.timeDistribution).map(([time, count]) => (
                      <div key={time} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700">{time}</span>
                          <Badge className="bg-red-100 text-red-700">{count}</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-red-600 to-orange-600 h-2 rounded-full"
                            style={{
                              width: `${(count as number / metrics.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Day Distribution */}
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                      <Calendar className="w-4 h-4" />
                      Day Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {Object.entries(metrics.dayDistribution)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([day, count]) => (
                      <div key={day} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700">{day}</span>
                          <Badge className="bg-orange-100 text-orange-700">{count}</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full"
                            style={{
                              width: `${(count as number / metrics.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Location Breakdown */}
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                      <MapPin className="w-4 h-4" />
                      By Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {Object.entries(metrics.locationBreakdown)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([location, count]) => (
                      <div key={location} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700 truncate">{location}</span>
                          <Badge className="bg-blue-100 text-blue-700">{count}</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full"
                            style={{
                              width: `${(count as number / metrics.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Class Breakdown */}
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                    <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                      <Calendar className="w-4 h-4" />
                      By Class
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {Object.entries(metrics.classBreakdown)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([cls, count]) => (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700 truncate">{cls || 'Unknown'}</span>
                          <Badge className="bg-purple-100 text-purple-700">{count}</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                            style={{
                              width: `${(count as number / metrics.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Records Tab */}
            <TabsContent value="records" className="space-y-4 px-6 pb-6">
              <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-b">
                  <CardTitle className="text-base">All Records ({formatNumber(safeRawData.length)})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 border-b border-gray-200">
                        <TableRow>
                          <TableHead className="font-bold text-gray-700">Member</TableHead>
                          <TableHead className="font-bold text-gray-700">Date</TableHead>
                          <TableHead className="font-bold text-gray-700">Class</TableHead>
                          <TableHead className="font-bold text-gray-700">Location</TableHead>
                          <TableHead className="font-bold text-gray-700">Trainer</TableHead>
                          <TableHead className="font-bold text-gray-700 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {safeRawData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No records available
                            </TableCell>
                          </TableRow>
                        ) : (
                          safeRawData.map((item: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-red-50/30 transition-colors border-b border-gray-100">
                              <TableCell className="font-medium">{`${item?.firstName || ''} ${item?.lastName || ''}`.trim()}</TableCell>
                              <TableCell className="text-sm">{item?.dateIST ? new Date(item.dateIST).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell className="text-sm">{item?.cleanedClass || 'N/A'}</TableCell>
                              <TableCell className="text-sm">{item?.location || 'N/A'}</TableCell>
                              <TableCell className="text-sm">{item?.teacherName || 'N/A'}</TableCell>
                              <TableCell className="text-right font-semibold text-red-700">₹{formatNumber(item?.paidAmount || 0)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
