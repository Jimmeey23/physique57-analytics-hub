import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, TrendingDown, Crown, Trophy } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { isLeadConverted } from '@/utils/leadConversions';
import { LeadsData } from '@/types/leads';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { P57RankList, type P57RankItem } from '@/components/ui/P57RankList';
import { CellDrillDownModal } from '@/components/ui/CellDrillDownModal';

interface EnhancedFunnelRankingsProps {
  data: LeadsData[];
}

interface RankEntry {
  name: string;
  count: number;
  converted: number;
  revenue: number;
  conversionRate: number;
  avgRevenue: number;
  percentage?: number;
}

export const EnhancedFunnelRankings: React.FC<EnhancedFunnelRankingsProps> = ({ data }) => {
  const [activeType, setActiveType] = useState<'source' | 'stage'>('source');
  const [showMore, setShowMore] = useState(false);
  const [drill, setDrill] = useState<{ kind: 'source' | 'stage'; name: string } | null>(null);

  const rankings = useMemo(() => {
    if (!data || data.length === 0) return { sources: [] as RankEntry[], stages: [] as RankEntry[] };

    // Source rankings
    const sourceMap = new Map<string, RankEntry>();
    data.forEach(lead => {
      const source = lead.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          name: source,
          count: 0,
          converted: 0,
          revenue: 0,
          conversionRate: 0,
          avgRevenue: 0,
        });
      }

      const sourceData = sourceMap.get(source)!;
      sourceData.count += 1;

      if (isLeadConverted(lead)) {
        sourceData.converted += 1;
      }

      sourceData.revenue += (lead.ltv || 0);
    });

    const sources = Array.from(sourceMap.values()).map(source => ({
      ...source,
      conversionRate: source.count > 0 ? (source.converted / source.count) * 100 : 0,
      avgRevenue: source.count > 0 ? source.revenue / source.count : 0
    })).sort((a, b) => b.count - a.count);

    // Stage rankings
    const stageMap = new Map<string, RankEntry>();
    data.forEach(lead => {
      const stage = lead.stage || 'Unknown';
      if (!stageMap.has(stage)) {
        stageMap.set(stage, {
          name: stage,
          count: 0,
          converted: 0,
          revenue: 0,
          conversionRate: 0,
          avgRevenue: 0,
        });
      }

      const stageData = stageMap.get(stage)!;
      stageData.count += 1;

      if (isLeadConverted(lead)) {
        stageData.converted += 1;
      }

      stageData.revenue += (lead.ltv || 0);
    });

    const stages = Array.from(stageMap.values()).map(stage => ({
      ...stage,
      conversionRate: stage.count > 0 ? (stage.converted / stage.count) * 100 : 0,
      avgRevenue: stage.count > 0 ? stage.revenue / stage.count : 0,
      percentage: stage.count > 0 ? (stage.count / data.length) * 100 : 0
    })).sort((a, b) => b.count - a.count);

    return { sources, stages };
  }, [data]);

  const displayCount = showMore ? 10 : 5;
  const currentRankings = activeType === 'source' ? rankings.sources : rankings.stages;
  const topItems = currentRankings.slice(0, displayCount);
  const bottomItems = currentRankings.slice(-displayCount).reverse();
  const maxCount = Math.max(1, ...currentRankings.map((r) => r.count));

  const typeLabel = activeType === 'source' ? 'Sources' : 'Stages';

  const toRankItems = (items: RankEntry[], ranks: number[]): P57RankItem[] =>
    items.map((item, i) => ({
      rank: ranks[i] ?? i + 1,
      name: item.name,
      sub: [
        `${formatNumber(item.count)} leads`,
        `${item.conversionRate.toFixed(1)}% conv.`,
        `avg ${formatCurrency(item.avgRevenue)}`,
        ...(activeType === 'stage' && item.percentage !== undefined
          ? [`${item.percentage.toFixed(1)}% of funnel`]
          : []),
      ].join(' · '),
      value: formatNumber(item.count),
      barPct: (item.count / maxCount) * 100,
    }));

  const drillLeads = useMemo(() => {
    if (!drill) return [];
    return (data || []).filter(
      (lead) => (drill.kind === 'source' ? lead.source || 'Unknown' : lead.stage || 'Unknown') === drill.name
    );
  }, [data, drill]);

  const renderPanel = (items: RankEntry[], isTop: boolean, ranks: number[]) => {
    const totalConverted = items.reduce((sum, s) => sum + s.converted, 0);
    const totalRevenue = items.reduce((sum, s) => sum + s.revenue, 0);
    return (
      <P57TableShell
        icon={isTop ? Award : TrendingDown}
        title={isTop ? `Top ${displayCount} ${typeLabel}` : `Bottom ${displayCount} ${typeLabel}`}
        description={
          isTop
            ? `${activeType === 'source' ? 'Lead source' : 'Funnel stage'} performance, ranked by lead volume. Click a row for lead-level detail.`
            : 'Lowest-volume entries — areas for improvement. Click a row for lead-level detail.'
        }
        rowCount={items.length}
        meta={
          <span>
            {formatNumber(totalConverted)} converted · {formatCurrency(totalRevenue)} revenue
          </span>
        }
      >
        <div className={items.length > 6 ? 'max-h-[480px] overflow-y-auto' : ''}>
          <P57RankList
            items={toRankItems(items, ranks)}
            onSelect={(item) => setDrill({ kind: activeType, name: item.name })}
            emptyText={`No ${typeLabel.toLowerCase()} to rank.`}
          />
        </div>
      </P57TableShell>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeType} onValueChange={(val) => setActiveType(val as 'source' | 'stage')} className="w-full">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Lead Performance Rankings</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  Sources and funnel stages ranked by lead volume, with conversion and revenue context.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="p57-ctl-btn"
              >
                Show {showMore ? 'Less' : 'More'}
              </button>
            </div>
            <TabsList>
              <TabsTrigger value="source">
                <Crown className="h-4 w-4 shrink-0" />
                <span className="text-sm leading-tight">Lead Sources</span>
              </TabsTrigger>
              <TabsTrigger value="stage">
                <Trophy className="h-4 w-4 shrink-0" />
                <span className="text-sm leading-tight">Funnel Stages</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeType} className="mt-6">
              <div className="p57-stagger grid grid-cols-1 gap-6 lg:grid-cols-2">
                {renderPanel(topItems, true, topItems.map((_, i) => i + 1))}
                {renderPanel(bottomItems, false, bottomItems.map((_, i) => currentRankings.length - i))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CellDrillDownModal
        open={drill !== null}
        onClose={() => setDrill(null)}
        title={drill ? drill.name : ''}
        subtitle={`${drill?.kind === 'source' ? 'Lead source' : 'Funnel stage'} · ${formatNumber(drillLeads.length)} leads`}
        context={
          drill
            ? [
                { label: drill.kind === 'source' ? 'Source' : 'Stage', value: drill.name },
                { label: 'Leads', value: formatNumber(drillLeads.length) },
                {
                  label: 'Converted',
                  value: formatNumber(drillLeads.filter((l) => isLeadConverted(l)).length),
                },
                {
                  label: 'Revenue',
                  value: formatCurrency(drillLeads.reduce((s, l) => s + (l.ltv || 0), 0)),
                },
              ]
            : []
        }
        columns={[
          { key: 'name', header: 'Lead' },
          { key: 'createdAt', header: 'Created', mono: true },
          { key: drill?.kind === 'source' ? 'stage' : 'source', header: drill?.kind === 'source' ? 'Stage' : 'Source' },
          { key: 'associate', header: 'Associate' },
          { key: 'status', header: 'Status' },
          { key: 'ltv', header: 'LTV', align: 'right', mono: true },
        ]}
        rows={drillLeads.map((l) => ({
          name: l.fullName || '—',
          createdAt: l.createdAt || '—',
          ...(drill?.kind === 'source' ? { stage: l.stage || '—' } : { source: l.source || '—' }),
          associate: l.associate || '—',
          status: isLeadConverted(l) ? 'Converted' : 'Open',
          ltv: formatCurrency(l.ltv || 0),
        }))}
      />
    </div>
  );
};

export default EnhancedFunnelRankings;
