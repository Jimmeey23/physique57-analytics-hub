import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Calendar, MapPin, BarChart3, DollarSign, Activity, CreditCard, Target, Clock, Star, Zap, X, Download, Copy, LayoutGrid, List } from 'lucide-react';
import { NewClientData } from '@/types/dashboard';
interface ClientConversionDrillDownModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  type: 'month' | 'year' | 'class' | 'membership' | 'metric' | 'ranking';
}
export const ClientConversionDrillDownModalV3: React.FC<ClientConversionDrillDownModalV3Props> = ({
  isOpen,
  onClose,
  title,
  data,
  type
}) => {
  if (!data) return null;

  // Local UI state for premium interactions
  const [quickFilter, setQuickFilter] = React.useState<'all' | 'new' | 'converted' | 'retained' | 'highLTV'>('all');
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [search, setSearch] = React.useState('');

  // Extract targeted client data based on type and drill-down context
  const clients: NewClientData[] = React.useMemo(() => {
    if (!data) return [];

    // For ranking drill-downs, use the relatedClients array
    if (type === 'ranking' && data.relatedClients) {
      console.log('Drill-down V3: Using ranking related clients:', data.relatedClients.length);
      return data.relatedClients;
    }

    // For metric card clicks, use the filtered clients array
    if (type === 'metric' && data.clients) {
      console.log('Drill-down V3: Using metric card filtered clients:', data.clients.length, 'MetricType:', data.metricType);
      return data.clients;
    }

    // For month/year table row clicks, use the clients array from the row data
    if ((type === 'month' || type === 'year') && data.clients) {
      console.log('Drill-down V3: Using table row clients:', data.clients.length);
      return data.clients;
    }

    // For other table types, check if data has clients property
    if (data.clients && Array.isArray(data.clients)) {
      console.log('Drill-down V3: Using generic clients array:', data.clients.length);
      return data.clients;
    }

    // For direct array format
    if (Array.isArray(data)) {
      console.log('Drill-down V3: Using direct array data:', data.length);
      return data;
    }

    // Fallback to empty array
    console.log('Drill-down V3: No targeted clients found, showing empty. Data structure:', Object.keys(data || {}));
    return [];
  }, [data, type]);

  // Calculate summary metrics from targeted clients
  const summary = React.useMemo(() => {
    const totalMembers = clients.length;
    
    // New members: match the exact logic from metric cards - where isNew contains "new" (case insensitive)
    const newMembers = clients.filter(c => {
      const isNewValue = String(c.isNew || '').toLowerCase();
      return isNewValue.includes('new');
    }).length;
    
    // Converted members: those with exact conversionStatus "Converted"
    const convertedMembers = clients.filter(c => (c.conversionStatus || '').trim() === 'Converted').length;
    
    // Retained members: those with exact retentionStatus "Retained"
    const retainedMembers = clients.filter(c => (c.retentionStatus || '').trim() === 'Retained').length;
    
    const totalLTV = clients.reduce((sum, c) => sum + (c.ltv || 0), 0);
    const totalConversionSpan = clients.filter(c => c.conversionSpan > 0).reduce((sum, c) => sum + (c.conversionSpan || 0), 0);
    const clientsWithConversionData = clients.filter(c => c.conversionSpan > 0).length;
    
    // Debug logging to understand the data
    console.log('Modal Summary Calculation (Updated Logic):', {
      totalMembers,
      newMembers,
      convertedMembers,
      retainedMembers,
      metricType: data?.metricType,
      sampleIsNewValues: clients.slice(0, 5).map(c => c.isNew),
      sampleConversionStatus: clients.slice(0, 5).map(c => c.conversionStatus),
      sampleRetentionStatus: clients.slice(0, 5).map(c => c.retentionStatus),
      filteredNewMembersCheck: clients.filter(c => {
        const isNewValue = String(c.isNew || '').toLowerCase();
        return isNewValue.includes('new');
      }).length
    });
    
    return {
      totalMembers,
      newMembers,
      convertedMembers,
      retainedMembers,
      conversionRate: totalMembers > 0 ? (convertedMembers / totalMembers) * 100 : 0, // Conversion rate within this subset
      retentionRate: totalMembers > 0 ? (retainedMembers / totalMembers) * 100 : 0, // Retention rate within this subset
      avgLTV: totalMembers > 0 ? totalLTV / totalMembers : 0,
      totalLTV,
      avgConversionTime: clientsWithConversionData > 0 ? totalConversionSpan / clientsWithConversionData : 0
    };
  }, [clients]);

  // Apply local quick filters and search within the modal scope
  const displayedClients = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    let arr = clients;
    if (quickFilter === 'new') {
      arr = arr.filter(c => (String(c.isNew || '').toLowerCase().includes('new')));
    } else if (quickFilter === 'converted') {
      arr = arr.filter(c => (c.conversionStatus || '').trim() === 'Converted');
    } else if (quickFilter === 'retained') {
      arr = arr.filter(c => (c.retentionStatus || '').trim() === 'Retained');
    } else if (quickFilter === 'highLTV') {
      // Heuristic threshold for high LTV
      const values = arr.map(c => c.ltv || 0).sort((a,b)=>a-b);
      const p75 = values.length ? values[Math.floor(0.75 * (values.length - 1))] : 0;
      arr = arr.filter(c => (c.ltv || 0) >= p75);
    }
    if (term) {
      arr = arr.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term));
    }
    return arr;
  }, [clients, quickFilter, search]);

  // Small helpers for actions
  const exportCSV = React.useCallback((rows: NewClientData[]) => {
    if (!rows || rows.length === 0) return;
    const headers = ['First Name','Last Name','Email','Is New','Conversion Status','Retention Status','LTV','First Visit Date','First Visit Location','Home Location','Trainer'];
    const lines = rows.map(r => [
      r.firstName || '', r.lastName || '', r.email || '', r.isNew || '', r.conversionStatus || '', r.retentionStatus || '',
      String(r.ltv ?? ''), r.firstVisitDate || '', r.firstVisitLocation || '', r.homeLocation || '', r.trainerName || ''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g,'-').toLowerCase()}-clients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title]);

  const copyEmails = React.useCallback((rows: NewClientData[]) => {
    const emails = rows.map(r => r.email).filter(Boolean).join(', ');
    if (!emails) return;
    navigator.clipboard.writeText(emails);
  }, []);
  const renderMetricCards = () => {
    // Determine labels based on drill-down context
    const metricType = data?.metricType || '';
    const isConvertedDrillDown = metricType === 'converted_members';
    const isRetainedDrillDown = metricType === 'retained_members';
    const isNewMembersDrillDown = metricType === 'new_members';
    
    // Contextual labels for better understanding
    const newMembersLabel = isConvertedDrillDown ? 'New → Converted' : 
                           isRetainedDrillDown ? 'New → Retained' : 
                           'New Members';
    const newMembersDescription = isConvertedDrillDown ? 'New members who converted' : 
                                 isRetainedDrillDown ? 'New members who were retained' : 
                                 'New Members';
    
    const conversionRateLabel = isConvertedDrillDown ? 'Subset Conv. Rate' :
                               isRetainedDrillDown ? 'Subset Conv. Rate' :
                               'Conversion Rate';
    const conversionRateDescription = isConvertedDrillDown ? 'Converted from this subset' :
                                     isRetainedDrillDown ? 'Converted from this subset' :
                                     'Overall conversion rate';

    return <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white border border-slate-200/70 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-slate-500" />
              <Badge variant="outline" className="text-xs">Total</Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(summary.totalMembers)}</div>
            <div className="text-slate-500 text-sm">Total Members</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/70 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-slate-500" />
              <Badge variant="outline" className="text-xs">New</Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(summary.newMembers)}</div>
            <div className="text-slate-500 text-sm">{newMembersLabel}</div>
            <div className="text-slate-400 text-xs mt-1">{newMembersDescription}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/70 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-slate-500" />
              <Badge variant="outline" className="text-xs">Conv</Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(summary.convertedMembers)}</div>
            <div className="text-slate-500 text-sm">Converted</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/70 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-slate-500" />
              <Badge variant="outline" className="text-xs">Rate</Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.conversionRate.toFixed(1)}%</div>
            <div className="text-slate-500 text-sm">{conversionRateLabel}</div>
            <div className="text-slate-400 text-xs mt-1">{conversionRateDescription}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/70 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-slate-500" />
              <Badge variant="outline" className="text-xs">LTV</Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.avgLTV)}</div>
            <div className="text-slate-500 text-sm">Avg LTV</div>
            <div className="text-slate-400 text-xs mt-1">Total: {formatCurrency(summary.totalLTV)}</div>
          </CardContent>
        </Card>
      </div>;
  };
  const renderClientTable = () => {
    if (clients.length === 0) {
      return <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No client data available for this selection.</p>
          </CardContent>
        </Card>;
    }
    return <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Client Details ({formatNumber(displayedClients.length)} of {formatNumber(clients.length)})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => exportCSV(displayedClients)} className="gap-1">
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button variant="ghost" size="sm" onClick={() => copyEmails(displayedClients)} className="gap-1">
                <Copy className="w-4 h-4" /> Emails
              </Button>
            </div>
          </div>
          {/* Toolbar */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              {(['all','new','converted','retained','highLTV'] as const).map(q => (
                <button key={q} onClick={() => setQuickFilter(q)} className={`px-3 py-1.5 text-xs rounded-full transition-all ${quickFilter===q? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}>
                  {q==='all'?'All': q==='new'?'New': q==='converted'?'Converted': q==='retained'?'Retained':'High LTV'}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email" className="h-9 w-56 rounded-full border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button onClick={()=>setViewMode('table')} className={`px-2 py-1.5 rounded-full ${viewMode==='table'?'bg-white shadow':''}`} title="Table View">
                <List className="w-4 h-4" />
              </button>
              <button onClick={()=>setViewMode('cards')} className={`px-2 py-1.5 rounded-full ${viewMode==='cards'?'bg-white shadow':''}`} title="Card View">
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode==='table' ? (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-900 text-xs px-3">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-xs px-3">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-xs px-3 text-center">Type</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-xs px-3 text-center">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-xs px-3 text-center">Conversion</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-xs px-3 text-right">LTV</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-xs px-3 text-center">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedClients.slice(0, 200).map((client, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/80 transition-colors h-10">
                      <TableCell className="text-xs px-3 font-medium">
                        {client.firstName} {client.lastName}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-gray-600 truncate max-w-[200px]" title={client.email}>
                        {client.email}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-center">
                        <Badge variant={client.isNew?.toLowerCase().includes('new') ? 'default' : 'secondary'} className="text-[10px] rounded-full px-2 py-0.5">
                          {client.isNew || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs px-3 text-center">
                        <Badge variant={client.retentionStatus?.toLowerCase().includes('retained') ? 'default' : 'secondary'} className={`text-[10px] rounded-full px-2 py-0.5 ${client.retentionStatus?.toLowerCase().includes('retained') ? 'bg-purple-100 text-purple-800' : ''}`}>
                          {client.retentionStatus || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs px-3 text-center">
                        <Badge variant={client.conversionStatus?.toLowerCase().includes('converted') ? 'default' : 'secondary'} className={`text-[10px] rounded-full px-2 py-0.5 ${client.conversionStatus?.toLowerCase().includes('converted') ? 'bg-green-100 text-green-800' : ''}`}>
                          {client.conversionStatus || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs px-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(client.ltv || 0)}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-center text-gray-600 truncate max-w-[160px]" title={client.firstVisitLocation}>
                        {client.firstVisitLocation || 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {displayedClients.length > 200 && (
                <div className="p-4 text-center text-sm text-gray-600 bg-gray-50 border-t">
                  Showing 200 of {displayedClients.length} clients.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {displayedClients.map((client, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-800 text-sm truncate max-w-[70%]">{client.firstName} {client.lastName}</div>
                    <div className="text-xs font-semibold text-emerald-600">{formatCurrency(client.ltv || 0)}</div>
                  </div>
                  <div className="text-xs text-slate-600 truncate" title={client.email}>{client.email}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{client.firstVisitLocation || 'Unknown'}</span>
                    {client.isNew && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{client.isNew}</span>}
                    {client.conversionStatus && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">{client.conversionStatus}</span>}
                    {client.retentionStatus && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{client.retentionStatus}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>;
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white via-slate-50/50 to-white border border-white/60 shadow-[0_10px_40px_-10px_rgba(30,41,59,0.25)] backdrop-blur-xl">
        <DialogHeader className="pb-6 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title} - Detailed Analysis
              </DialogTitle>
              <p className="text-slate-600 mt-2 text-lg">
                Targeted client conversion and retention analysis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-0">
                {type === 'month' ? 'Monthly' : type === 'year' ? 'Yearly' : type === 'metric' ? 'Metric Analysis' : 'Analytics'}
              </Badge>
              <Button variant="outline" onClick={() => exportCSV(displayedClients)} className="gap-1">
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button variant="outline" onClick={() => copyEmails(displayedClients)} className="gap-1">
                <Copy className="w-4 h-4" /> Emails
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="pt-6 space-y-8">
          {/* Metric Cards */}
          {renderMetricCards()}

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="overview" className="gap-2">
                <Star className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2">
                <Users className="w-4 h-4" />
                Client Details
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Zap className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-white border border-slate-200/70 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Summary Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatNumber(summary.totalMembers)}
                        </div>
                        <div className="text-sm text-slate-600">Total Members</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatNumber(summary.convertedMembers)}
                        </div>
                        <div className="text-sm text-slate-600">Converted</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {summary.conversionRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-600">Conversion Rate</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {summary.avgConversionTime > 0 ? `${summary.avgConversionTime.toFixed(0)} days` : 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600">Avg Conv. Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-slate-200/70">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Top Segments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Top by Location */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-amber-700 mb-1">Locations</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          clients.reduce((acc, c) => {
                            const loc = c.firstVisitLocation || 'Unknown';
                            acc[loc] = (acc[loc] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([loc,count]) => (
                          <span key={loc} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{loc} • {formatNumber(count)}</span>
                        ))}
                      </div>
                    </div>
                    {/* Top by Trainer */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-amber-700 mb-1">Trainers</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          clients.reduce((acc, c) => {
                            const t = c.trainerName || 'Unknown';
                            acc[t] = (acc[t] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([t,count]) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{t} • {formatNumber(count)}</span>
                        ))}
                      </div>
                    </div>
                    {/* Top by Membership */}
                    <div>
                      <div className="text-xs font-semibold text-amber-700 mb-1">Memberships</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          clients.reduce((acc, c) => {
                            const m = c.membershipUsed || 'Unknown';
                            acc[m] = (acc[m] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([m,count]) => (
                          <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{m} • {formatNumber(count)}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Discrepancy explanation when Total > New */}
              {summary.totalMembers > summary.newMembers && (
                <Card className="bg-white border border-slate-200/70">
                  <CardHeader>
                    <CardTitle className="text-slate-900">New Members Discrepancy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-3">
                      There are {formatNumber(summary.totalMembers - summary.newMembers)} member(s) in this selection who are not marked as "New". Below is a breakdown by their recorded type.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        clients.reduce((acc, c) => {
                          const isNewVal = (String(c.isNew || '').trim() || 'Unspecified');
                          if (!String(c.isNew || '').toLowerCase().includes('new')) {
                            acc[isNewVal] = (acc[isNewVal] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>)
                      ).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,count]) => (
                        <span key={label} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{label}: {formatNumber(count)}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="clients">
              {renderClientTable()}
            </TabsContent>

            <TabsContent value="insights">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-800">AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-lg border-l-4 border-purple-400">
                      <h4 className="font-medium text-purple-800 mb-2">Key Metrics</h4>
                      <ul className="text-sm text-purple-600 space-y-1">
                        <li>• Total Revenue: {formatCurrency(summary.totalLTV)}</li>
                        <li>• Conversion Rate: {summary.conversionRate.toFixed(1)}%</li>
                        <li>• Retention Rate: {summary.retentionRate.toFixed(1)}%</li>
                        <li>• Average Customer Value: {formatCurrency(summary.avgLTV)}</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-white rounded-lg border-l-4 border-orange-400">
                      <h4 className="font-medium text-orange-800 mb-2">Performance Analysis</h4>
                      <ul className="text-sm text-orange-600 space-y-1">
                        <li>• {summary.conversionRate > 30 ? 'Strong' : summary.conversionRate > 15 ? 'Moderate' : 'Needs improvement'} conversion performance</li>
                        <li>• {summary.retentionRate > 70 ? 'Excellent' : summary.retentionRate > 50 ? 'Good' : 'Needs attention'} retention rate</li>
                        <li>• Customer lifetime value is {summary.avgLTV > 10000 ? 'high' : summary.avgLTV > 5000 ? 'moderate' : 'developing'}</li>
                        <li>• This selection shows targeted analytics for clicked data only</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>;
};