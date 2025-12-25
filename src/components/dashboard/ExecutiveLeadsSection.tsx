import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ImprovedLeadMetricCards } from './ImprovedLeadMetricCards';
import { useLeadsData } from '@/hooks/useLeadsData';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface ExecutiveLeadsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveLeadsSection: React.FC<ExecutiveLeadsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: leadsData, loading: leadsLoading } = useLeadsData();

  // Transform leads data into source-based summary
  const leadSummary = useMemo(() => {
    if (!leadsData || leadsData.length === 0) return null;

    const sources = new Map<string, { count: number; converted: number; contacted: number }>();

    leadsData.forEach((lead: any) => {
      const source = lead.source || lead.leadSource || 'Direct';
      if (!sources.has(source)) {
        sources.set(source, { count: 0, converted: 0, contacted: 0 });
      }

      const data = sources.get(source)!;
      data.count += 1;
      if (lead.status === 'converted' || lead.conversionStatus === 'Converted') {
        data.converted += 1;
      }
      if (lead.contacted === true || lead.isContacted === true) {
        data.contacted += 1;
      }
    });

    return Array.from(sources.entries()).map(([source, data]) => ({
      source,
      ...data,
      conversionRate: (data.converted / data.count) * 100,
      contactRate: (data.contacted / data.count) * 100,
    }));
  }, [leadsData]);

  if (leadsLoading) {
    return (
      <ExecutiveSectionCard
        title="Lead Conversion & Funnel"
        icon={TrendingUp}
        borderColor="pink"
        description="Conversion rates, lead sources, and funnel analytics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Lead Conversion & Funnel"
      icon={TrendingUp}
      borderColor="pink"
      description="Conversion rates, lead sources, and funnel analytics"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <ImprovedLeadMetricCards data={leadsData} />
      </div>

      {/* Lead Sources Table */}
      {leadSummary && leadSummary.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Leads by Source</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-pink-700 to-pink-900 text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Total Leads</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Contacted</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Converted</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {leadSummary.map((source) => (
                  <tr
                    key={source.source}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{source.source}</td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {formatNumber(source.count)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {formatNumber(source.contacted)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={source.converted > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                      >
                        {formatNumber(source.converted)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      <span className={source.conversionRate > 30 ? 'text-emerald-600' : 'text-amber-600'}>
                        {formatPercentage(source.conversionRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-center">
                    {formatNumber(leadsData?.length || 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatNumber(leadSummary.reduce((sum, s) => sum + s.contacted, 0))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatNumber(leadSummary.reduce((sum, s) => sum + s.converted, 0))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {leadsData && leadsData.length > 0
                      ? formatPercentage(
                          (leadSummary.reduce((sum, s) => sum + s.converted, 0) /
                            leadsData.length) *
                            100
                        )
                      : '0%'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveLeadsSection;
