import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  TrendingDown, 
  MapPin, 
  Users, 
  DollarSign, 
  Target, 
  Crown, 
  AlertTriangle,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData, PayrollData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ClientConversionSimplifiedRanksProps {
  data: NewClientData[];
  payrollData: PayrollData[];
  allPayrollData: PayrollData[];
  allClientData: NewClientData[];
  selectedLocation: string;
  dateRange: { start: string; end: string };
  selectedMetric?: string;
  onDrillDown?: (type: string, item: any, metric: string) => void;
}

export const ClientConversionSimplifiedRanks: React.FC<ClientConversionSimplifiedRanksProps> = ({ 
  data, 
  payrollData, 
  allPayrollData,
  allClientData,
  selectedLocation, 
  dateRange,
  selectedMetric,
  onDrillDown 
}) => {
  const [selectedRanking, setSelectedRanking] = useState('trainer-conversion');

  // Calculate comprehensive trainer stats using both client and payroll data.
  //
  // Session counts (taught / empty / customers) come from payroll. Conversion,
  // retention and new-member counts are derived from client status fields —
  // the payroll sheet's Converted/Retained/New columns are blank for the
  // current in-progress month, which previously emptied every ranking.
  const trainerStats = React.useMemo(() => {
    const stats = new Map();

    const ensure = (name: string) => {
      if (!stats.has(name)) {
        stats.set(name, {
          name,
          totalSessions: 0,
          totalEmptySessions: 0,
          totalNonEmptySessions: 0,
          totalCustomers: 0,
          totalConverted: 0,
          totalRetained: 0,
          totalNew: 0,
          totalLTV: 0,
          clientCount: 0,
          payrollConverted: 0,
          payrollRetained: 0,
          payrollNew: 0,
        });
      }
      return stats.get(name);
    };

    payrollData.forEach(payroll => {
      const trainer = payroll.teacherName;
      if (!trainer || trainer === 'Unknown') return;

      const trainerStat = ensure(trainer);
      trainerStat.totalSessions += payroll.totalSessions || 0;
      trainerStat.totalEmptySessions += payroll.totalEmptySessions || 0;
      trainerStat.totalNonEmptySessions += payroll.totalNonEmptySessions || 0;
      trainerStat.totalCustomers += payroll.totalCustomers || 0;
      trainerStat.payrollConverted += payroll.converted || 0;
      trainerStat.payrollRetained += payroll.retained || 0;
      trainerStat.payrollNew += payroll.new || 0;
    });

    // Client data drives LTV and the status-truth conversion/retention counts.
    data.forEach(client => {
      const trainer = client.trainerName;
      if (!trainer || trainer === 'Unknown') return;

      const trainerStat = ensure(trainer);
      trainerStat.totalLTV += client.ltv || 0;
      trainerStat.clientCount++;

      if ((client.isNew || '').toLowerCase().includes('new')) trainerStat.totalNew++;
      if (client.conversionStatus === 'Converted') trainerStat.totalConverted++;
      if (client.retentionStatus === 'Retained') trainerStat.totalRetained++;
    });

    return Array.from(stats.values()).map(stat => {
      // Prefer client-derived counts; fall back to payroll columns when the
      // client feed has no rows for this trainer in the current filter.
      const totalNew = stat.totalNew || stat.payrollNew;
      const totalConverted = stat.totalConverted || stat.payrollConverted;
      const totalRetained = stat.totalRetained || stat.payrollRetained;

      const conversionRate = totalNew > 0 ? (totalConverted / totalNew) * 100 : 0;
      const retentionRate = totalNew > 0 ? (totalRetained / totalNew) * 100 : 0;
      const classAverage = stat.totalNonEmptySessions > 0 ? stat.totalCustomers / stat.totalNonEmptySessions : 0;
      const avgLTV = stat.clientCount > 0 ? stat.totalLTV / stat.clientCount : 0;
      const emptyClassRate = stat.totalSessions > 0 ? (stat.totalEmptySessions / stat.totalSessions) * 100 : 0;

      return {
        ...stat,
        totalNew,
        totalConverted,
        totalRetained,
        conversionRate,
        retentionRate,
        classAverage,
        avgLTV,
        emptyClassRate,
        totalClients: stat.clientCount,
      };
    }).filter(stat => stat.totalSessions > 0 || stat.clientCount > 0);
  }, [data, payrollData]);

  // Calculate location stats using both data sources (same status-truth rule
  // as trainerStats above).
  const locationStats = React.useMemo(() => {
    const stats = new Map();

    const ensure = (name: string) => {
      if (!stats.has(name)) {
        stats.set(name, {
          name,
          totalSessions: 0,
          totalEmptySessions: 0,
          totalNonEmptySessions: 0,
          totalCustomers: 0,
          totalConverted: 0,
          totalRetained: 0,
          totalNew: 0,
          totalLTV: 0,
          clientCount: 0,
          payrollConverted: 0,
          payrollRetained: 0,
          payrollNew: 0,
        });
      }
      return stats.get(name);
    };

    payrollData.forEach(payroll => {
      const location = payroll.location;
      if (!location || location === 'Unknown') return;

      const locationStat = ensure(location);
      locationStat.totalSessions += payroll.totalSessions || 0;
      locationStat.totalEmptySessions += payroll.totalEmptySessions || 0;
      locationStat.totalNonEmptySessions += payroll.totalNonEmptySessions || 0;
      locationStat.totalCustomers += payroll.totalCustomers || 0;
      locationStat.payrollConverted += payroll.converted || 0;
      locationStat.payrollRetained += payroll.retained || 0;
      locationStat.payrollNew += payroll.new || 0;
    });

    data.forEach(client => {
      const location = client.firstVisitLocation || client.homeLocation;
      if (!location || location === 'Unknown') return;

      const locationStat = ensure(location);
      locationStat.totalLTV += client.ltv || 0;
      locationStat.clientCount++;

      if ((client.isNew || '').toLowerCase().includes('new')) locationStat.totalNew++;
      if (client.conversionStatus === 'Converted') locationStat.totalConverted++;
      if (client.retentionStatus === 'Retained') locationStat.totalRetained++;
    });

    return Array.from(stats.values()).map(stat => {
      const totalNew = stat.totalNew || stat.payrollNew;
      const totalConverted = stat.totalConverted || stat.payrollConverted;
      const totalRetained = stat.totalRetained || stat.payrollRetained;

      const conversionRate = totalNew > 0 ? (totalConverted / totalNew) * 100 : 0;
      const retentionRate = totalNew > 0 ? (totalRetained / totalNew) * 100 : 0;
      const classAverage = stat.totalNonEmptySessions > 0 ? stat.totalCustomers / stat.totalNonEmptySessions : 0;
      const avgLTV = stat.clientCount > 0 ? stat.totalLTV / stat.clientCount : 0;
      const emptyClassRate = stat.totalSessions > 0 ? (stat.totalEmptySessions / stat.totalSessions) * 100 : 0;

      return {
        ...stat,
        totalNew,
        totalConverted,
        totalRetained,
        conversionRate,
        retentionRate,
        classAverage,
        avgLTV,
        emptyClassRate,
        totalClients: stat.clientCount,
      };
    }).filter(stat => stat.totalSessions > 0 || stat.clientCount > 0);
  }, [data, payrollData]);

  // Calculate membership stats (client-data only since payroll doesn't track memberships)
  const membershipStats = React.useMemo(() => {
    const stats = new Map();
    
    data.forEach(client => {
      const membership = client.membershipUsed || 'Unknown Membership';
      if (!stats.has(membership)) {
        stats.set(membership, {
          name: membership,
          totalClients: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          avgVisits: 0
        });
      }
      
      const membershipStat = stats.get(membership);
      membershipStat.totalClients++;
      membershipStat.totalLTV += client.ltv || 0;
      membershipStat.avgVisits += client.visitsPostTrial || 0;
      
      // Standardized status detection
      const isNewValue = (client.isNew || '').toLowerCase();
      if (isNewValue.includes('new')) {
        membershipStat.newMembers++;
      }
      
      // Exact equality per business rule
      if (client.conversionStatus === 'Converted') {
        membershipStat.converted++;
      }
      
      if (client.retentionStatus === 'Retained') {
        membershipStat.retained++;
      }
    });
    
    return Array.from(stats.values()).map(stat => {
      const conversionBase = stat.newMembers > 0 ? stat.newMembers : stat.totalClients;
      const conversionRate = conversionBase > 0 ? (stat.converted / conversionBase) * 100 : 0;
      const retentionRate = conversionBase > 0 ? (stat.retained / conversionBase) * 100 : 0;
      const avgLTV = stat.totalClients > 0 ? stat.totalLTV / stat.totalClients : 0;
      const avgVisitsPerClient = stat.totalClients > 0 ? stat.avgVisits / stat.totalClients : 0;
      
      return {
        ...stat,
        // Alias so the shared eligibility filter reads the same field name it
        // uses for trainers and locations.
        totalNew: stat.newMembers,
        totalConverted: stat.converted,
        totalRetained: stat.retained,
        conversionRate,
        retentionRate,
        avgLTV,
        avgVisitsPerClient
      };
    }).filter(stat => stat.totalClients >= 5); // Only include memberships with meaningful sample size
  }, [data]);

  const rankingOptions = [
    // Trainers - focus on key metrics
    { id: 'trainer-conversion', label: 'Trainer Conversion Rate', icon: Trophy, type: 'trainer', metric: 'conversionRate' },
    { id: 'trainer-classes', label: 'Classes Taught', icon: Calendar, type: 'trainer', metric: 'totalSessions' },
    { id: 'trainer-average', label: 'Class Average', icon: Users, type: 'trainer', metric: 'classAverage' },
    { id: 'trainer-empty', label: 'Empty Classes %', icon: AlertTriangle, type: 'trainer', metric: 'emptyClassRate' },
    
    // Locations
    { id: 'location-conversion', label: 'Location Conversion', icon: MapPin, type: 'location', metric: 'conversionRate' },
    { id: 'location-classes', label: 'Location Classes', icon: Calendar, type: 'location', metric: 'totalSessions' },
    { id: 'location-average', label: 'Location Class Average', icon: Users, type: 'location', metric: 'classAverage' },
    
    // Memberships
    { id: 'membership-conversion', label: 'Membership Conversion', icon: Crown, type: 'membership', metric: 'conversionRate' },
    { id: 'membership-ltv', label: 'Membership LTV', icon: DollarSign, type: 'membership', metric: 'avgLTV' },
  ];

  const getCurrentData = () => {
    const option = rankingOptions.find(r => r.id === selectedRanking);
    if (!option) return { top: [], bottom: [], total: 0, eligible: 0, requirement: '' };

    let sourceData;
    switch (option.type) {
      case 'trainer':
        sourceData = trainerStats;
        break;
      case 'location':
        sourceData = locationStats;
        break;
      case 'membership':
        sourceData = membershipStats;
        break;
      default:
        sourceData = trainerStats;
    }

    // Filter out items with insufficient data
    const minThreshold = option.type === 'trainer' ? 3 : 1;
    let requirement = '';
    const filtered = sourceData.filter(item => {
      if (option.metric === 'totalSessions' || option.metric === 'classAverage' || option.metric === 'emptyClassRate') {
        requirement = 'at least 5 classes taught';
        return item.totalSessions >= 5; // Require at least 5 sessions for meaningful class metrics
      }
      if (option.metric === 'conversionRate' || option.metric === 'retentionRate') {
        requirement = `at least ${minThreshold} new member${minThreshold === 1 ? '' : 's'}`;
        return item.totalNew >= minThreshold; // Require new members for conversion metrics
      }
      requirement = 'at least 1 client';
      return item.totalClients >= 1 || item.clientCount >= 1;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[option.metric] || 0;
      const bValue = b[option.metric] || 0;
      return bValue - aValue;
    });

    // With fewer than 10 eligible rows, top-5 and bottom-5 would overlap and
    // show the same names twice. Split the list instead.
    const half = Math.min(5, Math.floor(sorted.length / 2));
    const top = sorted.length >= 10 ? sorted.slice(0, 5) : sorted.slice(0, Math.max(half, sorted.length <= 5 ? sorted.length : half));
    const bottom = sorted.length >= 10
      ? sorted.slice(-5).reverse()
      : sorted.slice(sorted.length - half).reverse();

    return {
      top,
      bottom,
      total: sourceData.length,
      eligible: sorted.length,
      requirement,
    };
  };

  const { top, bottom, total, eligible, requirement } = getCurrentData();
  const currentOption = rankingOptions.find(r => r.id === selectedRanking);

  const formatValue = (value: number, metric: string) => {
    if (metric === 'avgLTV') return formatCurrency(value);
    if (metric === 'totalSessions') return formatNumber(value);
    if (metric === 'totalClients' || metric === 'clientCount') return formatNumber(value);
    if (metric === 'classAverage') return value.toFixed(1);
    if (metric === 'avgVisitsPerClient') return value.toFixed(1);
    return `${value.toFixed(1)}%`;
  };

  const RankCard = ({ title, data: rankData, isTop = true }) => (
    <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          {isTop ? (
            <>
              <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {title}
                </span>
                <p className="text-sm text-slate-600 font-normal">Top performers</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-gradient-to-r from-red-400 to-rose-500">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  {title}
                </span>
                <p className="text-sm text-slate-600 font-normal">Areas for improvement</p>
              </div>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rankData.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">No ranking data</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {total === 0
                ? 'No trainer, location, or membership records match the current filters.'
                : eligible === 0
                  ? `None of the ${formatNumber(total)} ${total === 1 ? 'record' : 'records'} has ${requirement} — the minimum for this metric. Widen the date range or pick a different ranking.`
                  : `Only ${formatNumber(eligible)} ${eligible === 1 ? 'record qualifies' : 'records qualify'} for this metric, so ${eligible === 1 ? 'it appears' : 'they all appear'} in the Top list.`}
            </p>
          </div>
        )}
        {rankData.map((item, index) => (
          <div 
            key={item.name} 
            className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => {
              if (onDrillDown && currentOption) {
                const drillDownType = currentOption.type === 'trainer' ? 'trainer' : 
                                    currentOption.type === 'location' ? 'location' : 'membership';
                onDrillDown(drillDownType, item, currentOption.metric);
              }
            }}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
                isTop 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-red-400 to-rose-600 text-white'
              )}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 whitespace-normal break-words group-hover:text-blue-600 transition-colors">
                  {item.name}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {formatNumber(item.totalClients || item.clientCount || 0)} clients
                  </Badge>
                  {currentOption?.type === 'trainer' && (
                    <>
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                        {formatNumber(item.totalSessions || 0)} classes
                      </Badge>
                      <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">
                        Empty: {formatNumber(item.totalEmptySessions || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        Avg: {(item.classAverage || 0).toFixed(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                        Empty: {(item.emptyClassRate || 0).toFixed(1)}%
                      </Badge>
                      <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                        Converted: {formatNumber(item.totalConverted || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-violet-200 text-violet-700">
                        Retained: {formatNumber(item.totalRetained || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                        New: {formatNumber(item.totalNew || 0)}
                      </Badge>
                    </>
                  )}
                  {currentOption?.type === 'location' && (
                    <>
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                        {formatNumber(item.totalSessions || 0)} classes
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        Avg: {(item.classAverage || 0).toFixed(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">
                        Empty: {formatNumber(item.totalEmptySessions || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                        Converted: {formatNumber(item.totalConverted || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-violet-200 text-violet-700">
                        Retained: {formatNumber(item.totalRetained || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                        New: {formatNumber(item.totalNew || 0)}
                      </Badge>
                    </>
                  )}
                  {currentOption?.type === 'membership' && (
                    <>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        Avg LTV: {formatCurrency(item.avgLTV || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                        Total: {formatCurrency(item.totalLTV || 0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                        Visits: {(item.avgVisitsPerClient || 0).toFixed(1)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                {formatValue(item[currentOption?.metric || 'conversionRate'], currentOption?.metric || 'conversionRate')}
              </p>
              <p className="text-sm text-slate-500">
                {currentOption?.metric === 'totalSessions' ? 'Total Classes' :
                 currentOption?.metric === 'classAverage' ? 'Class Average' :
                 currentOption?.metric === 'emptyClassRate' ? 'Empty Rate' :
                 currentOption?.metric === 'avgLTV' ? 'Avg LTV' :
                 'Conversion Rate'}
              </p>
              <p className="text-xs text-slate-400">
                {currentOption?.type === 'trainer' ? 'Trainer Performance' :
                 currentOption?.type === 'location' ? 'Location Performance' :
                 'Membership Performance'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"
                onClick={e => {
                  e.stopPropagation();
                  if (onDrillDown && currentOption) {
                    const drillDownType = currentOption.type === 'trainer' ? 'trainer' : 
                                        currentOption.type === 'location' ? 'location' : 'membership';
                    onDrillDown(drillDownType, item, currentOption.metric);
                  }
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View Analytics
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Ranking Selection Buttons */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {rankingOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedRanking === option.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedRanking(option.id)}
                className={`flex flex-col items-center gap-2 h-auto py-3 px-2 transition-all duration-300 hover:scale-105 ${
                  selectedRanking === option.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'hover:bg-slate-100'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="text-xs font-medium text-center leading-tight">
                  {option.label}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top and Bottom Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankCard
          title={`Top ${currentOption?.label || 'Performance'}`}
          data={top}
          isTop={true}
        />
        
        <RankCard
          title={`Bottom ${currentOption?.label || 'Performance'}`}
          data={bottom}
          isTop={false}
        />
      </div>
    </div>
  );
};