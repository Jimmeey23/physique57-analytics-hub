import React, { useMemo } from 'react';
import { Percent } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ExecutiveDiscountsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveDiscountsSection: React.FC<ExecutiveDiscountsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: discountData, loading: discountLoading } = useDiscountAnalysis();

  // Calculate discount metrics
  const discountMetrics = useMemo(() => {
    if (!discountData || discountData.length === 0) {
      return {
        totalDiscounts: 0,
        avgDiscount: 0,
        maxDiscount: 0,
        minDiscount: 0,
        discountCount: 0,
      };
    }

    const discounts = discountData.map((d: any) => d.discountAmount || 0);
    const totalDiscounts = discounts.reduce((sum, d) => sum + d, 0);
    const discountCount = discountData.length;

    return {
      totalDiscounts,
      avgDiscount: discountCount > 0 ? totalDiscounts / discountCount : 0,
      maxDiscount: Math.max(...discounts),
      minDiscount: Math.min(...discounts),
      discountCount,
    };
  }, [discountData]);

  // Group discounts by category
  const discountsByCategory = useMemo(() => {
    if (!discountData || discountData.length === 0) return [];

    const map = new Map<string, { count: number; total: number }>();
    discountData.forEach((d: any) => {
      const category = d.category || d.discountType || 'General';
      if (!map.has(category)) {
        map.set(category, { count: 0, total: 0 });
      }
      const data = map.get(category)!;
      data.count += 1;
      data.total += d.discountAmount || 0;
    });

    return Array.from(map.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        total: data.total,
        avg: data.total / data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [discountData]);

  if (discountLoading) {
    return (
      <ExecutiveSectionCard
        title="Discounts & Promotions"
        icon={Percent}
        borderColor="amber"
        description="Discount trends, impact analysis, and ROI"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Discounts & Promotions"
      icon={Percent}
      borderColor="amber"
      description="Discount trends, impact analysis, and ROI"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-700 uppercase">Total Discounts</p>
                <p className="text-2xl font-bold text-amber-900">{formatCurrency(discountMetrics.totalDiscounts)}</p>
                <p className="text-xs text-amber-600">Revenue reduced</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Discount Count</p>
                <p className="text-2xl font-bold text-blue-900">{discountMetrics.discountCount}</p>
                <p className="text-xs text-blue-600">Transactions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Avg Discount</p>
                <p className="text-2xl font-bold text-emerald-900">{formatCurrency(discountMetrics.avgDiscount)}</p>
                <p className="text-xs text-emerald-600">Per transaction</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-rose-700 uppercase">Max Discount</p>
                <p className="text-2xl font-bold text-rose-900">{formatCurrency(discountMetrics.maxDiscount)}</p>
                <p className="text-xs text-rose-600">Highest value</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Discount Categories Breakdown */}
      {discountsByCategory.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Discounts by Category</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-amber-700 to-amber-900 text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Count</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Total Discount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Avg Discount</th>
                </tr>
              </thead>
              <tbody>
                {discountsByCategory.map((item) => (
                  <tr
                    key={item.category}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{item.category}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{item.count}</td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-700">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {formatCurrency(item.avg)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-center">
                    {discountsByCategory.reduce((sum, item) => sum + item.count, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatCurrency(discountsByCategory.reduce((sum, item) => sum + item.total, 0))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {formatCurrency(
                      discountsByCategory.reduce((sum, item) => sum + item.avg, 0) /
                        discountsByCategory.length
                    )}
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

export default ExecutiveDiscountsSection;
