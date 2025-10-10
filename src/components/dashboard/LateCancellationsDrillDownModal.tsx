import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LateCancellationsData } from '@/types/dashboard';
import { formatNumber } from '@/utils/formatters';
import { X, Users, Calendar, MapPin, Clock, Package } from 'lucide-react';

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

  // Add safety checks for data structure
  const safeData = data?.data || {};
  const safeRawData = data?.rawData || [];
  const dataType = data?.type || 'unknown';

  const renderMemberDetails = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Member Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Member Name</p>
            <p className="font-semibold">{safeData.memberName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold">{safeData.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Member ID</p>
            <p className="font-semibold">{safeData.memberId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Cancellations</p>
            <Badge variant="destructive">{safeData.count || 0}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Trainer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRawData.map((session: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{session?.sessionName || 'N/A'}</TableCell>
                    <TableCell>{session?.time || 'N/A'}</TableCell>
                    <TableCell>{session?.location || 'N/A'}</TableCell>
                    <TableCell>{session?.teacherName || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderClassDetails = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Class Type</p>
            <p className="font-semibold">{safeData.className || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <Badge variant="secondary">{safeData.category || 'Unknown'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Cancellations</p>
            <Badge variant="destructive">{formatNumber(safeData.count || 0)}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unique Members</p>
            <p className="font-semibold">{formatNumber(safeData.uniqueMembers || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Peak Time</p>
            <Badge variant="outline">{safeData.peakTime || 'N/A'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Duration</p>
            <p className="font-semibold">{safeData.avgDuration || 0} min</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Cancellations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRawData.slice(0, 10).map((cancellation: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{(cancellation?.firstName || '') + ' ' + (cancellation?.lastName || '')}</TableCell>
                    <TableCell>{cancellation?.dateIST ? new Date(cancellation.dateIST).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{cancellation?.time || 'N/A'}</TableCell>
                    <TableCell>{cancellation?.location || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderMembershipDetails = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            Membership Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Membership Type</p>
            <p className="font-semibold">{safeData.membershipType || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <Badge variant="secondary">{safeData.category || 'Unknown'}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Cancellations</p>
            <Badge variant="destructive">{formatNumber(safeData.count || 0)}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unique Members</p>
            <p className="font-semibold">{formatNumber(safeData.uniqueMembers || 0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Cancellations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRawData.slice(0, 15).map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{(item?.firstName || '') + ' ' + (item?.lastName || '')}</TableCell>
                    <TableCell>{item?.dateIST ? new Date(item.dateIST).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{item?.cleanedClass || 'N/A'}</TableCell>
                    <TableCell>{item?.location || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderTrainerDetails = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Trainer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Trainer</p>
            <p className="font-semibold">{safeData.trainerName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Cancellations</p>
            <Badge variant="destructive">{formatNumber(safeData.count || 0)}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Affected Members</p>
            <p className="font-semibold">{formatNumber(safeData.uniqueMembers || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Locations</p>
            <p className="font-semibold">{formatNumber(safeData.uniqueLocations || 0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Cancellations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRawData.slice(0, 15).map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{(item?.firstName || '') + ' ' + (item?.lastName || '')}</TableCell>
                    <TableCell>{item?.dateIST ? new Date(item.dateIST).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{item?.cleanedClass || 'N/A'}</TableCell>
                    <TableCell>{item?.location || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderLocationDetails = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Location Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-semibold">{safeData.locationName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Cancellations</p>
            <Badge variant="destructive">{formatNumber(safeData.count || 0)}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Members</p>
            <p className="font-semibold">{formatNumber(safeData.uniqueMembers || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trainers</p>
            <p className="font-semibold">{formatNumber(safeData.uniqueTrainers || 0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Cancellations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Trainer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRawData.slice(0, 15).map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{(item?.firstName || '') + ' ' + (item?.lastName || '')}</TableCell>
                    <TableCell>{item?.dateIST ? new Date(item.dateIST).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{item?.cleanedClass || 'N/A'}</TableCell>
                    <TableCell>{item?.teacherName || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderMetricDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{formatNumber(data?.totalCancellations || 0)}</div>
            <div className="text-sm text-gray-600">Total Cancellations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(data?.uniqueMembers || 0)}</div>
            <div className="text-sm text-gray-600">Unique Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formatNumber(data?.uniqueLocations || 0)}</div>
            <div className="text-sm text-gray-600">Locations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(data?.uniqueMembers || 0) > 0 ? ((data?.totalCancellations || 0) / (data?.uniqueMembers || 1)).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-600">Avg per Member</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Trainer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRawData.slice(0, 15).map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{(item?.firstName || '') + ' ' + (item?.lastName || '')}</TableCell>
                    <TableCell>{item?.dateIST ? new Date(item.dateIST).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{item?.cleanedClass || 'N/A'}</TableCell>
                    <TableCell>{item?.location || 'N/A'}</TableCell>
                    <TableCell>{item?.teacherName || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{data.title}</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {dataType === 'member' && renderMemberDetails()}
          {dataType === 'class' && renderClassDetails()}
          {dataType === 'metric' && renderMetricDetails()}
          {dataType === 'membership' && renderMembershipDetails()}
          {dataType === 'trainer' && renderTrainerDetails()}
          {dataType === 'location' && renderLocationDetails()}
          {/* Gracefully handle unknown types without crash */}
          {['member','class','metric','membership','trainer','location'].includes(dataType) ? null : (
            <div className="text-center py-8">
              <p className="text-gray-500">No specific view for this selection</p>
              <p className="text-sm text-gray-400">Data type: {dataType}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};