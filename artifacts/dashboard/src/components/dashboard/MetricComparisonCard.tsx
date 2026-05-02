
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/formatters";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricComparisonCardProps {
  label: string;
  currentValue: number;
  comparisonValue: number;
  format: 'number' | 'currency' | 'percent';
  comparisonLabel?: string;
}

export const MetricComparisonCard: React.FC<MetricComparisonCardProps> = ({
  label,
  currentValue,
  comparisonValue,
  format,
  comparisonLabel
}) => {
  const diff = currentValue - comparisonValue;
  const percentChange = comparisonValue !== 0 ? (diff / comparisonValue) * 100 : 0;
  
  const isPositive = diff > 0;
  const isZero = diff === 0;

  const formattedValue = format === 'currency' 
    ? formatCurrency(currentValue)
    : format === 'percent'
    ? formatPercentage(currentValue)
    : formatNumber(currentValue);

  const formattedComparison = format === 'currency'
    ? formatCurrency(comparisonValue)
    : format === 'percent'
    ? formatPercentage(comparisonValue)
    : formatNumber(comparisonValue);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-1.5">
          <p className="text-sm font-medium text-slate-500 leading-none">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">{formattedValue}</h3>
            {!isZero && (
              <Badge 
                variant="outline" 
                className={cn(
                  "px-1.5 py-0 border-none flex items-center gap-0.5",
                  isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}
              >
                {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                <span className="text-[10px] font-bold">{Math.abs(percentChange).toFixed(1)}%</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-xs text-slate-400 font-medium">
              {comparisonLabel || 'vs. previous'}: <span className="text-slate-500 font-semibold">{formattedComparison}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
