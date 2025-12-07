import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  Clock, 
  DollarSign, 
  Activity, 
  MapPin, 
  AlertTriangle,
  BarChart3,
  Star,
  Users
} from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import CopyTableButton from '@/components/ui/CopyTableButton';

interface FunnelAnalyticsTablesProps {
  data: LeadsData[];
  onDrillDown?: (title: string, data: LeadsData[], type: string) => void;
}

export const FunnelAnalyticsTables: React.FC<FunnelAnalyticsTablesProps> = ({
  data,
  onDrillDown
}) => {
  const sourceTableRef = useRef<HTMLTableElement>(null);
  const stageTableRef = useRef<HTMLTableElement>(null);
  const spanTableRef = useRef<HTMLTableElement>(null);
  const ltvTableRef = useRef<HTMLTableElement>(null);
  const topStagesTableRef = useRef<HTMLTableElement>(null);
  const proximityTableRef = useRef<HTMLTableElement>(null);
  const registry = useMetricsTablesRegistry();

  // Handle row click for drill down
  const handleRowClick = (type: string, row: any) => {
    if (onDrillDown) {
      let filteredData: LeadsData[] = [];
      let title = '';

      switch (type) {
        case 'source':
          filteredData = data.filter(lead => (lead.source || 'Unknown') === row.source);
          title = `${row.source} - Source Analysis`;
          break;
        case 'stage':
          filteredData = data.filter(lead => (lead.stage || 'Unknown') === row.stage);
          title = `${row.stage} - Stage Analysis`;
          break;
        case 'ltv':
          title = `${row.ltvRange} - LTV Analysis`;
          break;
        case 'proximity':
          filteredData = data.filter(lead => lead.stage?.includes('Proximity'));
          title = `Proximity Issues - ${row.location}`;
          break;
        default:
          return;
      }

      onDrillDown(title, filteredData, type);
    }
  };

  // Register tables for metrics
  React.useEffect(() => {
    if (sourceTableRef.current) {
      registry.registerTable('funnel-source-analytics', sourceTableRef.current);
    }
    if (stageTableRef.current) {
      registry.registerTable('funnel-stage-analytics', stageTableRef.current);
    }
    return () => {
      registry.unregisterTable('funnel-source-analytics');
      registry.unregisterTable('funnel-stage-analytics');
    };
  }, [registry]);

  // Conversion by Source Analytics
  const conversionBySource = useMemo(() => {
    const sourceStats = data.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      if (!acc[source]) {
        acc[source] = {
          totalLeads: 0,
          trialsScheduled: 0,
          trialsCompleted: 0,
          converted: 0,
          totalLTV: 0,
          totalVisits: 0,
          proximityIssues: 0
        };
      }
      
      acc[source].totalLeads += 1;
  const ts = (lead.trialStatus || '').toLowerCase();
  const st = (lead.stage || '').toLowerCase();
  if ((ts.includes('trial') && !ts.includes('completed')) || (st.includes('trial') && !st.includes('completed'))) acc[source].trialsScheduled += 1;
  if (lead.trialStatus === 'Trial Completed' || lead.stage === 'Trial Completed') acc[source].trialsCompleted += 1;
      if (lead.conversionStatus === 'Converted') acc[source].converted += 1;
      if (lead.stage?.includes('Proximity')) acc[source].proximityIssues += 1;
      acc[source].totalLTV += lead.ltv || 0;
      acc[source].totalVisits += lead.visits || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      totalLeads: stats.totalLeads,
      trialsScheduled: stats.trialsScheduled,
      trialsCompleted: stats.trialsCompleted,
      converted: stats.converted,
      conversionRate: stats.totalLeads > 0 ? (stats.converted / stats.totalLeads) * 100 : 0,
      trialToMemberRate: stats.trialsCompleted > 0 ? (stats.converted / stats.trialsCompleted) * 100 : 0,
      avgLTV: stats.totalLeads > 0 ? stats.totalLTV / stats.totalLeads : 0,
      avgVisits: stats.totalLeads > 0 ? stats.totalVisits / stats.totalLeads : 0,
      proximityIssues: stats.proximityIssues,
      leadQuality: ((stats.converted * 0.4) + (stats.trialsCompleted * 0.3) + ((stats.totalLeads - stats.proximityIssues) * 0.3)) / stats.totalLeads * 100
    })).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [data]);

  // Conversion by Stage Analytics
  const conversionByStage = useMemo(() => {
    const stageStats = data.reduce((acc, lead) => {
  const stage = lead.stage || 'Unknown';
      if (!acc[stage]) {
        acc[stage] = {
          totalLeads: 0,
          converted: 0,
          totalLTV: 0,
          avgDaysInStage: 0,
          retained: 0
        };
      }
      
      acc[stage].totalLeads += 1;
      if (lead.conversionStatus === 'Converted') acc[stage].converted += 1;
      if (lead.retentionStatus === 'Retained') acc[stage].retained += 1;
      acc[stage].totalLTV += lead.ltv || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(stageStats).map(([stage, stats]) => ({
      stage,
      totalLeads: stats.totalLeads,
      converted: stats.converted,
      conversionRate: stats.totalLeads > 0 ? (stats.converted / stats.totalLeads) * 100 : 0,
      retentionRate: stats.totalLeads > 0 ? (stats.retained / stats.totalLeads) * 100 : 0,
      avgLTV: stats.totalLeads > 0 ? stats.totalLTV / stats.totalLeads : 0,
      stageEfficiency: ((stats.converted * 0.5) + (stats.retained * 0.3) + (stats.totalLeads * 0.2)) / stats.totalLeads * 100
    })).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [data]);

  // Conversion Span Analytics
  const conversionSpanAnalytics = useMemo(() => {
    const spanRanges = [
      { label: '0-7 days', min: 0, max: 7 },
      { label: '8-14 days', min: 8, max: 14 },
      { label: '15-30 days', min: 15, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '60+ days', min: 61, max: Infinity }
    ];

    return spanRanges.map(range => {
      const leadsInRange = data.filter(lead => {
        if (!lead.createdAt || !lead.convertedToCustomerAt) return false;
        const created = new Date(lead.createdAt);
        const converted = new Date(lead.convertedToCustomerAt);
        const daysDiff = Math.ceil((converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= range.min && daysDiff <= range.max;
      });

      const convertedInRange = leadsInRange.filter(lead => lead.conversionStatus === 'Converted');
      
      return {
        timeRange: range.label,
        totalLeads: leadsInRange.length,
        converted: convertedInRange.length,
        conversionRate: leadsInRange.length > 0 ? (convertedInRange.length / leadsInRange.length) * 100 : 0,
        avgLTV: convertedInRange.length > 0 ? convertedInRange.reduce((sum, lead) => sum + (lead.ltv || 0), 0) / convertedInRange.length : 0,
        efficiency: leadsInRange.length > 0 ? ((convertedInRange.length * 0.6) + (leadsInRange.length * 0.4)) / leadsInRange.length * 100 : 0
      };
    });
  }, [data]);

  // LTV Analytics
  const ltvAnalytics = useMemo(() => {
    const ltvRanges = [
      { label: '₹0', min: 0, max: 0 },
      { label: '₹1-5k', min: 1, max: 5000 },
      { label: '₹5k-15k', min: 5001, max: 15000 },
      { label: '₹15k-30k', min: 15001, max: 30000 },
      { label: '₹30k+', min: 30001, max: Infinity }
    ];

    return ltvRanges.map(range => {
      const leadsInRange = data.filter(lead => {
        const ltv = lead.ltv || 0;
        return ltv >= range.min && ltv <= range.max;
      });

      const convertedInRange = leadsInRange.filter(lead => lead.conversionStatus === 'Converted');
      
      return {
        ltvRange: range.label,
        totalLeads: leadsInRange.length,
        converted: convertedInRange.length,
        conversionRate: leadsInRange.length > 0 ? (convertedInRange.length / leadsInRange.length) * 100 : 0,
        avgVisits: leadsInRange.length > 0 ? leadsInRange.reduce((sum, lead) => sum + (lead.visits || 0), 0) / leadsInRange.length : 0,
        totalRevenue: leadsInRange.reduce((sum, lead) => sum + (lead.ltv || 0), 0),
        valueScore: convertedInRange.length > 0 ? (convertedInRange.reduce((sum, lead) => sum + (lead.ltv || 0), 0) / convertedInRange.length) * (convertedInRange.length / leadsInRange.length) : 0
      };
    });
  }, [data]);

  // Most Common Stage Analytics
  const mostCommonStages = useMemo(() => {
    const total = data.length || 1;
    const stageCounts = data.reduce((acc, lead) => {
      const key = lead.stage || 'Unknown';
      if (!acc[key]) {
        acc[key] = { count: 0, converted: 0, totalLTV: 0 };
      }
      acc[key].count += 1;
      if (lead.conversionStatus === 'Converted') acc[key].converted += 1;
      acc[key].totalLTV += lead.ltv || 0;
      return acc;
    }, {} as Record<string, { count: number; converted: number; totalLTV: number }>);

    return Object.entries(stageCounts)
      .map(([stage, s]) => ({
        stage,
        leadCount: s.count,
        percentage: (s.count / total) * 100,
        converted: s.converted,
        conversionRate: s.count > 0 ? (s.converted / s.count) * 100 : 0,
        avgLTV: s.count > 0 ? s.totalLTV / s.count : 0,
        stagePopularity: (s.count / total) * 100
      }))
      .sort((a, b) => b.leadCount - a.leadCount)
      .slice(0, 10);
  }, [data]);

  // Proximity Issues Analytics
  const proximityIssues = useMemo(() => {
    const proximityLeads = data.filter(lead => 
      lead.stage?.includes('Proximity') || 
      lead.remarks?.toLowerCase().includes('proximity') ||
      lead.remarks?.toLowerCase().includes('location') ||
      lead.remarks?.toLowerCase().includes('distance')
    );

    const locationStats = proximityLeads.reduce((acc, lead) => {
      const center = lead.center || 'Unknown';
      if (!acc[center]) {
        acc[center] = { count: 0, totalLeads: 0 };
      }
      acc[center].count += 1;
      return acc;
    }, {} as Record<string, any>);

    // Also count total leads per location
    data.forEach(lead => {
      const center = lead.center || 'Unknown';
      if (locationStats[center]) {
        locationStats[center].totalLeads += 1;
      } else {
        locationStats[center] = { count: 0, totalLeads: 1 };
      }
    });

    return Object.entries(locationStats).map(([location, stats]) => ({
      location,
      proximityIssues: stats.count,
      totalLeads: stats.totalLeads,
      proximityRate: stats.totalLeads > 0 ? (stats.count / stats.totalLeads) * 100 : 0,
      impactScore: stats.count * (stats.count / stats.totalLeads) * 100
    })).sort((a, b) => b.proximityIssues - a.proximityIssues);
  }, [data]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="source" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-slate-800 to-slate-700 p-1.5 rounded-xl shadow-lg border border-slate-600">
          <TabsTrigger value="source" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <Target className="w-4 h-4 mr-2" />
            By Source
          </TabsTrigger>
          <TabsTrigger value="stage" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <Activity className="w-4 h-4 mr-2" />
            By Stage
          </TabsTrigger>
          <TabsTrigger value="span" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <Clock className="w-4 h-4 mr-2" />
            Conv. Span
          </TabsTrigger>
          <TabsTrigger value="ltv" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <DollarSign className="w-4 h-4 mr-2" />
            LTV Analysis
          </TabsTrigger>
          <TabsTrigger value="stages" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <BarChart3 className="w-4 h-4 mr-2" />
            Top Stages
          </TabsTrigger>
          <TabsTrigger value="proximity" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <MapPin className="w-4 h-4 mr-2" />
            Proximity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="source" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl relative">
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <Target className="w-5 h-5" />
                  Conversion by Source
                </CardTitle>
                <CopyTableButton 
                  tableRef={sourceTableRef}
                  tableName="Conversion by Source"
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0" ref={sourceTableRef}>
              <div className="p-4 text-center text-slate-600">
                Source Analytics - Table temporarily unavailable
              </div>
            </CardContent>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stage" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl" ref={stageTableRef}>
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <Activity className="w-5 h-5" />
                  Conversion by Stage
                </CardTitle>
                <CopyTableButton 
                  tableRef={stageTableRef}
                  tableName="Conversion by Stage"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 text-center text-slate-600">
                Stage Analytics - Table temporarily unavailable
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timespan" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl" ref={spanTableRef}>
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <Clock className="w-5 h-5" />
                  Conversion Span Analysis
                </CardTitle>
                <CopyTableButton 
                  tableRef={spanTableRef}
                  tableName="Conversion Span Analysis"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 text-center text-slate-600">
                Time Analytics - Table temporarily unavailable
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ltv" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl" ref={ltvTableRef}>
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <DollarSign className="w-5 h-5" />
                  LTV Analysis
                </CardTitle>
                <CopyTableButton 
                  tableRef={ltvTableRef}
                  tableName="LTV Analysis"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 text-center text-slate-600">
                LTV Analytics - Table temporarily unavailable
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topstages" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl" ref={topStagesTableRef}>
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <BarChart3 className="w-5 h-5" />
                  Most Common Stages
                </CardTitle>
                <CopyTableButton 
                  tableRef={topStagesTableRef}
                  tableName="Most Common Stages"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 text-center text-slate-600">
                Top Stages Analytics - Table temporarily unavailable
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximity" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl" ref={proximityTableRef}>
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  Proximity Issues Analysis
                </CardTitle>
                <CopyTableButton 
                  tableRef={proximityTableRef}
                  tableName="Proximity Issues Analysis"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 text-center text-slate-600">
                Proximity Analytics - Table temporarily unavailable
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};