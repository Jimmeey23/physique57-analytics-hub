import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { P57RankList } from '@/components/ui/P57RankList';
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
import { isNewClient } from '@/utils/clientRetention';
import { conversionRate as calcConversionRate, retentionRate as calcRetentionRate } from '@/utils/retentionRates';

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

  // Calculate comprehensive trainer stats using both client and payroll data
  const trainerStats = React.useMemo(() => {
    const stats = new Map();
    
    // Initialize stats from payroll data (classes taught, empty classes, etc.)
    payrollData.forEach(payroll => {
      const trainer = payroll.teacherName;
      if (!trainer || trainer === 'Unknown') return;
      
      if (!stats.has(trainer)) {
        stats.set(trainer, {
          name: trainer,
          totalSessions: 0,
          totalEmptySessions: 0,
          totalNonEmptySessions: 0,
          totalCustomers: 0,
          totalConverted: 0,
          totalRetained: 0,
          totalNew: 0,
          totalLTV: 0,
          clientCount: 0
        });
      }
      
      const trainerStat = stats.get(trainer);
      trainerStat.totalSessions += payroll.totalSessions || 0;
      trainerStat.totalEmptySessions += payroll.totalEmptySessions || 0;
      trainerStat.totalNonEmptySessions += payroll.totalNonEmptySessions || 0;
      trainerStat.totalCustomers += payroll.totalCustomers || 0;
      trainerStat.totalConverted += payroll.converted || 0;
      trainerStat.totalRetained += payroll.retained || 0;
      trainerStat.totalNew += payroll.new || 0;
    });

    // Add client data for LTV and additional metrics
    data.forEach(client => {
      const trainer = client.trainerName;
      if (!trainer || trainer === 'Unknown' || !stats.has(trainer)) return;
      
      const trainerStat = stats.get(trainer);
      trainerStat.totalLTV += client.ltv || 0;
      trainerStat.clientCount++;
    });
    
    return Array.from(stats.values()).map(stat => {
      const conversionRate = stat.totalNew > 0 ? (stat.totalConverted / stat.totalNew) * 100 : 0;
      const retentionRate = stat.totalNew > 0 ? (stat.totalRetained / stat.totalNew) * 100 : 0;
      const classAverage = stat.totalNonEmptySessions > 0 ? stat.totalCustomers / stat.totalNonEmptySessions : 0;
      const avgLTV = stat.clientCount > 0 ? stat.totalLTV / stat.clientCount : 0;
      const emptyClassRate = stat.totalSessions > 0 ? (stat.totalEmptySessions / stat.totalSessions) * 100 : 0;
      
      return {
        ...stat,
        conversionRate,
        retentionRate,
        classAverage,
        avgLTV,
        emptyClassRate,
        totalClients: stat.clientCount // Add this for consistency
      };
    }).filter(stat => stat.totalSessions > 0); // Only include trainers who actually taught classes
  }, [data, payrollData]);

  // Calculate location stats using both data sources
  const locationStats = React.useMemo(() => {
    const stats = new Map();
    
    // Initialize stats from payroll data
    payrollData.forEach(payroll => {
      const location = payroll.location;
      if (!location || location === 'Unknown') return;
      
      if (!stats.has(location)) {
        stats.set(location, {
          name: location,
          totalSessions: 0,
          totalEmptySessions: 0,
          totalNonEmptySessions: 0,
          totalCustomers: 0,
          totalConverted: 0,
          totalRetained: 0,
          totalNew: 0,
          totalLTV: 0,
          clientCount: 0
        });
      }
      
      const locationStat = stats.get(location);
      locationStat.totalSessions += payroll.totalSessions || 0;
      locationStat.totalEmptySessions += payroll.totalEmptySessions || 0;
      locationStat.totalNonEmptySessions += payroll.totalNonEmptySessions || 0;
      locationStat.totalCustomers += payroll.totalCustomers || 0;
      locationStat.totalConverted += payroll.converted || 0;
      locationStat.totalRetained += payroll.retained || 0;
      locationStat.totalNew += payroll.new || 0;
    });

    // Add client data for LTV
    data.forEach(client => {
      const location = client.firstVisitLocation || client.homeLocation;
      if (!location || location === 'Unknown' || !stats.has(location)) return;
      
      const locationStat = stats.get(location);
      locationStat.totalLTV += client.ltv || 0;
      locationStat.clientCount++;
    });
    
    return Array.from(stats.values()).map(stat => {
      const conversionRate = stat.totalNew > 0 ? (stat.totalConverted / stat.totalNew) * 100 : 0;
      const retentionRate = stat.totalNew > 0 ? (stat.totalRetained / stat.totalNew) * 100 : 0;
      const classAverage = stat.totalNonEmptySessions > 0 ? stat.totalCustomers / stat.totalNonEmptySessions : 0;
      const avgLTV = stat.clientCount > 0 ? stat.totalLTV / stat.clientCount : 0;
      const emptyClassRate = stat.totalSessions > 0 ? (stat.totalEmptySessions / stat.totalSessions) * 100 : 0;
      
      return {
        ...stat,
        conversionRate,
        retentionRate,
        classAverage,
        avgLTV,
        emptyClassRate,
        totalClients: stat.clientCount // Add this for consistency
      };
    }).filter(stat => stat.totalSessions > 0);
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
      if (isNewClient(client)) {
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
      const conversionRate = calcConversionRate(stat.converted, stat.newMembers);
      const retentionRate = calcRetentionRate(stat.retained, stat.newMembers);
      const avgLTV = stat.totalClients > 0 ? stat.totalLTV / stat.totalClients : 0;
      const avgVisitsPerClient = stat.totalClients > 0 ? stat.avgVisits / stat.totalClients : 0;
      
      return {
        ...stat,
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
    if (!option) return { top: [], bottom: [] };

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
    const filtered = sourceData.filter(item => {
      if (option.metric === 'totalSessions' || option.metric === 'classAverage' || option.metric === 'emptyClassRate') {
        return item.totalSessions >= 5; // Require at least 5 sessions for meaningful class metrics
      }
      if (option.metric === 'conversionRate' || option.metric === 'retentionRate') {
        return item.totalNew >= minThreshold; // Require new members for conversion metrics
      }
      return item.totalClients >= 1 || item.clientCount >= 1;
    });
    
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[option.metric] || 0;
      const bValue = b[option.metric] || 0;
      return bValue - aValue;
    });
    
    return {
      top: sorted.slice(0, 5),
      bottom: sorted.slice(-5).reverse(),
      total: sorted.length,
    };
  };

  const { top, bottom, total } = getCurrentData();
  const currentOption = rankingOptions.find(r => r.id === selectedRanking);

  const formatValue = (value: number, metric: string) => {
    if (metric === 'avgLTV') return formatCurrency(value);
    if (metric === 'totalSessions') return formatNumber(value);
    if (metric === 'totalClients' || metric === 'clientCount') return formatNumber(value);
    if (metric === 'classAverage') return value.toFixed(1);
    if (metric === 'avgVisitsPerClient') return value.toFixed(1);
    return `${value.toFixed(1)}%`;
  };

  const fireDrillDown = (item: any) => {
    if (onDrillDown && currentOption) {
      const drillDownType = currentOption.type === 'trainer' ? 'trainer' :
                            currentOption.type === 'location' ? 'location' : 'membership';
      onDrillDown(drillDownType, item, currentOption.metric);
    }
  };

  const subFor = (item: any): string => {
    const parts = [formatNumber(item.totalClients || item.clientCount || 0) + ' clients'];
    if (currentOption?.type === 'membership') {
      parts.push('avg LTV ' + formatCurrency(item.avgLTV || 0));
      parts.push('total ' + formatCurrency(item.totalLTV || 0));
      parts.push('visits ' + (item.avgVisitsPerClient || 0).toFixed(1));
    } else {
      parts.push(formatNumber(item.totalSessions || 0) + ' classes');
      parts.push('avg ' + (item.classAverage || 0).toFixed(1));
      parts.push(formatNumber(item.totalConverted || 0) + ' conv.');
      parts.push(formatNumber(item.totalRetained || 0) + ' ret.');
      parts.push(formatNumber(item.totalNew || 0) + ' new');
    }
    return parts.join(' · ');
  };

  const RankCard = ({ title, data: rankData, ranks, isTop = true }: { title: string; data: any[]; ranks: number[]; isTop?: boolean }) => {
    const metric = currentOption?.metric || 'conversionRate';
    const max = Math.max(1, ...rankData.map((d) => d[metric] || 0));
    return (
      <P57TableShell
        icon={isTop ? Crown : AlertTriangle}
        title={title}
        description={isTop ? 'Top performers. Click a row for detailed analytics.' : 'Areas for improvement. Click a row for detailed analytics.'}
        rowCount={rankData.length}
      >
        <P57RankList
          items={rankData.map((item, index) => ({
            rank: ranks[index] ?? index + 1,
            name: item.name,
            sub: subFor(item),
            value: formatValue(item[metric] || 0, metric),
            barPct: ((item[metric] || 0) / max) * 100,
          }))}
          onSelect={(row) => {
            const idx = ranks.indexOf(row.rank);
            if (idx >= 0) fireDrillDown(rankData[idx]);
          }}
          emptyText="Not enough data to rank."
        />
      </P57TableShell>
    );
  };

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
                    ? 'bg-slate-900 text-white shadow' 
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
          ranks={top.map((_, i) => i + 1)}
          isTop={true}
        />
        
        <RankCard
          title={`Bottom ${currentOption?.label || 'Performance'}`}
          data={bottom}
          ranks={bottom.map((_, i) => total - i)}
          isTop={false}
        />
      </div>
    </div>
  );
};