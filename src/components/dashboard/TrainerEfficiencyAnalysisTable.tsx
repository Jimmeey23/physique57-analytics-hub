import React, { useState, useMemo } from 'react';
import { ModernTableWrapper } from './ModernTableWrapper';
import { ProcessedTrainerData } from './TrainerDataProcessor';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Zap, Clock, Target, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';

interface TrainerEfficiencyAnalysisTableProps {
  data: ProcessedTrainerData[];
  onRowClick?: (trainer: string, data: any) => void;
}

export const TrainerEfficiencyAnalysisTable: React.FC<TrainerEfficiencyAnalysisTableProps> = ({ 
  data, 
  onRowClick 
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'efficiencyScore',
    direction: 'desc'
  });

  const efficiencyData = useMemo(() => {
    // Aggregate and calculate efficiency metrics by trainer
    const trainerEfficiency = data.reduce((acc, record) => {
      const key = record.trainerName;
      
      if (!acc[key]) {
        acc[key] = {
          trainerName: record.trainerName,
          location: record.location,
          totalSessions: 0,
          nonEmptySessions: 0,
          emptySessions: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          cycleSessions: 0,
          barreSessions: 0,
          strengthSessions: 0,
          monthsActive: 0,
          capacityUtilization: 0,
          revenuePerHour: 0,
          customerRetention: 0,
          avgClassFill: 0,
          efficiencyScore: 0,
          productivityRank: 'A',
          timeOptimization: 0,
          resourceUtilization: 0,
          impactScore: 0,
          qualityIndex: 0,
          growthMomentum: 0,
          consistencyFactor: 0
        };
      }

      acc[key].totalSessions += record.totalSessions;
      acc[key].nonEmptySessions += record.nonEmptySessions;
      acc[key].emptySessions += record.emptySessions;
      acc[key].totalCustomers += record.totalCustomers;
      acc[key].totalRevenue += record.totalPaid;
      acc[key].cycleSessions += record.cycleSessions;
      acc[key].barreSessions += record.barreSessions;
      acc[key].strengthSessions += record.strengthSessions;
      acc[key].monthsActive += 1;

      return acc;
    }, {} as Record<string, any>);

    // Calculate efficiency metrics
    return Object.values(trainerEfficiency).map((trainer: any) => {
      // Basic efficiency calculations
      trainer.capacityUtilization = trainer.totalSessions > 0 
        ? (trainer.nonEmptySessions / trainer.totalSessions) * 100 
        : 0;
      
      trainer.avgClassFill = trainer.nonEmptySessions > 0 
        ? trainer.totalCustomers / trainer.nonEmptySessions 
        : 0;

      // Data-based metrics
      trainer.revenuePerHour = trainer.totalSessions > 0 
        ? trainer.totalRevenue / trainer.totalSessions // assume 1 hour per session
        : 0;

      // Derive customer retention from aggregated weighted rate across months for this trainer
      const records = data.filter(r => r.trainerName === trainer.trainerName);
      const totalNew = records.reduce((s, r) => s + (r.newMembers || 0), 0);
      const totalRetained = records.reduce((s, r) => s + (r.retainedMembers || 0), 0);
      trainer.customerRetention = totalNew > 0 ? (totalRetained / totalNew) * 100 : 0;

      // Time optimization proxy: ratio of non-empty to total (same as utilization)
      trainer.timeOptimization = trainer.capacityUtilization;
      trainer.resourceUtilization = trainer.capacityUtilization;

      // Impact/quality/consistency: compute simple scaled indices from existing metrics
      // Impact: revenue per session relative to cohort
      const cohort = Object.values(trainerEfficiency) as any[];
      const rpsValues = cohort.map(t => (t.totalSessions > 0 ? t.totalRevenue / t.totalSessions : 0));
      const rpsMax = Math.max(...rpsValues, 1);
      trainer.impactScore = Math.min(100, (trainer.revenuePerHour / rpsMax) * 100);

      // Quality: average class fill normalized to a 0–100 band assuming 20 as a practical ceiling
      trainer.qualityIndex = Math.min(100, (trainer.avgClassFill / 20) * 100);

      // Consistency: based on variability in monthly sessions
      if (records.length > 1) {
        const monthly = records.map(r => r.totalSessions || 0);
        const avg = monthly.reduce((s, v) => s + v, 0) / monthly.length;
        const variance = monthly.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / monthly.length;
        const stddev = Math.sqrt(variance);
        trainer.consistencyFactor = avg > 0 ? Math.max(0, 100 - (stddev / avg) * 100) : 100;
      } else {
        trainer.consistencyFactor = 100;
      }

      // Growth momentum: last vs previous month sessions
      const sortedRecs = [...records].sort((a, b) => (a.monthKey || '').localeCompare(b.monthKey || ''));
      const last = sortedRecs[sortedRecs.length - 1]?.totalSessions || 0;
      const prev = sortedRecs[sortedRecs.length - 2]?.totalSessions || 0;
      trainer.growthMomentum = prev > 0 ? ((last - prev) / prev) * 100 : (last > 0 ? 100 : 0);

      // Overall efficiency score: weighted composite of real metrics
      trainer.efficiencyScore = (
        trainer.capacityUtilization * 0.35 +
        trainer.revenuePerHour * 0.02 + // scale-down factor
        trainer.customerRetention * 0.15 +
        trainer.impactScore * 0.15 +
        trainer.qualityIndex * 0.1 +
        trainer.consistencyFactor * 0.13
      );

  // Determine productivity rank
      if (trainer.efficiencyScore >= 90) trainer.productivityRank = 'S+';
      else if (trainer.efficiencyScore >= 85) trainer.productivityRank = 'A+';
      else if (trainer.efficiencyScore >= 80) trainer.productivityRank = 'A';
      else if (trainer.efficiencyScore >= 75) trainer.productivityRank = 'B+';
      else if (trainer.efficiencyScore >= 70) trainer.productivityRank = 'B';
      else trainer.productivityRank = 'C';

      return trainer;
    }).sort((a, b) => {
      if (sortConfig.key === 'trainerName') {
        return sortConfig.direction === 'asc' 
          ? a.trainerName.localeCompare(b.trainerName)
          : b.trainerName.localeCompare(a.trainerName);
      }
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data, sortConfig]);

  const handleRowClick = (rowData: any) => {
    if (onRowClick) {
      onRowClick(rowData.trainerName, {
        ...rowData,
        type: 'trainer-efficiency'
      });
    }
  };

  const columns = [
    {
      key: 'trainerName' as const,
      header: 'Trainer',
      sortable: true,
      className: 'min-w-[160px]',
      render: (value: string, row: any) => (
        <div className="flex flex-col gap-1">
          <TrainerNameCell name={value} className="text-nowrap" />
          <div className="text-xs text-slate-500 ml-10">{row.location}</div>
          <Badge className={`mt-1 text-xs ml-10 w-fit ${
            row.productivityRank === 'S+' ? 'bg-purple-100 text-purple-800' :
            row.productivityRank === 'A+' ? 'bg-green-100 text-green-800' :
            row.productivityRank === 'A' ? 'bg-blue-100 text-blue-800' :
            row.productivityRank === 'B+' ? 'bg-yellow-100 text-yellow-800' :
            row.productivityRank === 'B' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            Rank {row.productivityRank}
          </Badge>
        </div>
      )
    },
    {
      key: 'efficiencyScore' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Efficiency Score</TooltipTrigger>
            <TooltipContent>Composite score from utilization, retention, impact, quality, and consistency</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex flex-col items-center">
          <div className={`text-2xl font-bold ${
            value >= 85 ? 'text-green-600' :
            value >= 75 ? 'text-blue-600' :
            value >= 65 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(0)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-slate-500">Score</span>
          </div>
        </div>
      )
    },
    {
      key: 'capacityUtilization' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Capacity Usage</TooltipTrigger>
            <TooltipContent>Non-empty sessions divided by total sessions</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number, row: any) => (
        <div className="flex flex-col items-center">
          <div className={`font-semibold ${
            value >= 90 ? 'text-green-600' :
            value >= 80 ? 'text-blue-600' :
            value >= 70 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {row.nonEmptySessions}/{row.totalSessions}
          </div>
          <div className="w-12 h-1 bg-slate-200 rounded-full mt-1">
            <div 
              className={`h-full rounded-full ${
                value >= 90 ? 'bg-green-500' :
                value >= 80 ? 'bg-blue-500' :
                value >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'revenuePerHour' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Revenue/Hour</TooltipTrigger>
            <TooltipContent>Revenue per session (assumes 1 hour per session)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex flex-col items-center">
          <span className="font-semibold text-green-600">{formatCurrency(value)}</span>
          <Clock className="w-3 h-3 text-green-400 mt-1" />
        </div>
      )
    },
    {
      key: 'avgClassFill' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Avg Fill</TooltipTrigger>
            <TooltipContent>Average customers per non-empty session</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex flex-col items-center">
          <span className="font-semibold text-purple-600">{value.toFixed(1)}</span>
          <div className="text-xs text-purple-500 mt-1">customers</div>
        </div>
      )
    },
    {
      key: 'customerRetention' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Retention</TooltipTrigger>
            <TooltipContent>Weighted retained/new members (%) across months</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex flex-col items-center">
          <span className={`font-semibold ${
            value >= 90 ? 'text-green-600' :
            value >= 80 ? 'text-blue-600' :
            value >= 70 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(1)}%
          </span>
          <Target className="w-3 h-3 text-slate-400 mt-1" />
        </div>
      )
    },
    {
      key: 'timeOptimization' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Time Opt.</TooltipTrigger>
            <TooltipContent>Proxy equals capacity usage (%)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className={`font-semibold ${
          value >= 90 ? 'text-green-600' :
          value >= 85 ? 'text-blue-600' :
          value >= 80 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {value.toFixed(0)}%
        </span>
      )
    },
    {
      key: 'qualityIndex' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Quality Index</TooltipTrigger>
            <TooltipContent>Avg fill normalized to 0-100 (20 assumed ceiling)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex flex-col items-center">
          <span className={`font-semibold ${
            value >= 90 ? 'text-green-600' :
            value >= 85 ? 'text-blue-600' :
            value >= 80 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(0)}
          </span>
          <Award className="w-3 h-3 text-slate-400 mt-1" />
        </div>
      )
    },
    {
      key: 'growthMomentum' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Growth</TooltipTrigger>
            <TooltipContent>Last vs previous month sessions (%)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex items-center justify-center gap-1">
          {value >= 0 ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={`font-semibold ${
            value >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {value >= 0 ? '+' : ''}{value.toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'impactScore' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Impact</TooltipTrigger>
            <TooltipContent>Revenue per session relative to cohort (0-100)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex flex-col items-center">
          <div className={`font-bold ${
            value >= 90 ? 'text-purple-600' :
            value >= 80 ? 'text-blue-600' :
            value >= 70 ? 'text-green-600' :
            'text-yellow-600'
          }`}>
            {value.toFixed(0)}
          </div>
          <div className="text-xs text-slate-500">score</div>
        </div>
      )
    }
  ];

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const avgEfficiency = efficiencyData.reduce((sum, trainer) => sum + trainer.efficiencyScore, 0) / efficiencyData.length;
    const topPerformers = efficiencyData.filter(trainer => trainer.efficiencyScore >= 85).length;
    const avgCapacityUtilization = efficiencyData.reduce((sum, trainer) => sum + trainer.capacityUtilization, 0) / efficiencyData.length;
    
    return { avgEfficiency, topPerformers, avgCapacityUtilization };
  }, [efficiencyData]);

  return (
    <ModernTableWrapper
      title="Trainer Efficiency & Productivity Analysis"
      description={`Efficiency analysis for ${efficiencyData.length} trainers with productivity ranking system`}
      icon={<Zap className="w-5 h-5" />}
      totalItems={efficiencyData.length}
    >
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Summary Stats Header */}
        <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-slate-900 text-white p-4 rounded-t-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/80">Avg Efficiency</div>
              <div className="text-xl font-bold">{summaryStats.avgEfficiency.toFixed(0)}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/80">Top Performers</div>
              <div className="text-xl font-bold">{summaryStats.topPerformers}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/80">Avg Utilization</div>
              <div className="text-xl font-bold">{summaryStats.avgCapacityUtilization.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-800 via-blue-900 to-slate-900 text-white">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors ${
                      column.className || ''
                    } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                    style={{ height: '40px' }}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {sortConfig.key === column.key && (
                        sortConfig.direction === 'asc' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {efficiencyData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(row)}
                  style={{ height: '40px' }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-2 text-sm whitespace-nowrap ${
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModernTableWrapper>
  );
};