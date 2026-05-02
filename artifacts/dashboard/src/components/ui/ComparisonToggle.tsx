
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ComparisonMode = 'off' | 'prior_month' | 'prior_year';

interface ComparisonToggleProps {
  value: ComparisonMode;
  onChange: (v: ComparisonMode) => void;
}

export const ComparisonToggle: React.FC<ComparisonToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-lg border border-slate-200">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs font-medium rounded-md transition-all",
          value === 'off' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
        )}
        onClick={() => onChange('off')}
      >
        Off
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs font-medium rounded-md transition-all",
          value === 'prior_month' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
        )}
        onClick={() => onChange('prior_month')}
      >
        Prior Month
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs font-medium rounded-md transition-all",
          value === 'prior_year' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
        )}
        onClick={() => onChange('prior_year')}
      >
        Prior Year
      </Button>
    </div>
  );
};
