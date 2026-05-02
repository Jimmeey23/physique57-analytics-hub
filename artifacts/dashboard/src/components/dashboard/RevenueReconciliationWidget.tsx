
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RevenueReconciliationWidgetProps {
  salesRevenue: number;
  sessionRevenue: number;
  period: string;
}

export const RevenueReconciliationWidget: React.FC<RevenueReconciliationWidgetProps> = ({
  salesRevenue,
  sessionRevenue,
  period
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const diff = Math.abs(salesRevenue - sessionRevenue);
  const percentDiff = salesRevenue !== 0 ? (diff / salesRevenue) * 100 : 0;

  let status: 'balanced' | 'minor' | 'significant' = 'balanced';
  if (percentDiff > 20) status = 'significant';
  else if (percentDiff > 5) status = 'minor';

  const statusConfig = {
    balanced: {
      label: 'Balanced ✓',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      icon: <CheckCircle2Icon className="w-4 h-4" />
    },
    minor: {
      label: 'Minor variance',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      icon: <InfoIcon className="w-4 h-4" />
    },
    significant: {
      label: 'Significant variance',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      icon: <AlertCircleCircleIcon className="w-4 h-4" />
    }
  };

  function AlertCircleCircleIcon(props: any) {
    return <AlertCircleIcon {...props} />;
  }

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-4 bg-slate-50/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-bold">Revenue Reconciliation</CardTitle>
            <CardDescription>{period}</CardDescription>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold",
            statusConfig[status].color
          )}>
            {statusConfig[status].icon}
            {statusConfig[status].label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-8 relative">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sales Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(salesRevenue)}</h3>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Session Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(sessionRevenue)}</h3>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-12 bg-slate-100 hidden md:block" />
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Total Variance:</span>
              <span className={cn(
                "text-sm font-bold",
                status === 'balanced' ? "text-emerald-600" : status === 'minor' ? "text-amber-600" : "text-rose-600"
              )}>
                {formatCurrency(diff)} ({percentDiff.toFixed(1)}%)
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs gap-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide Details" : "Why the difference?"}
              {isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
              <p>
                <strong>Sales Revenue</strong> includes all payment types recorded in the sales system, including membership fees, merchandise, and retail products.
              </p>
              <p className="mt-2">
                <strong>Session Revenue</strong> is calculated from class sessions only, specifically the total value associated with members attending classes.
              </p>
              <p className="mt-2 text-xs italic">
                Differences are common and usually reflect non-session revenue (merch), membership upfront payments vs. session utilization, or reporting timing differences.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
