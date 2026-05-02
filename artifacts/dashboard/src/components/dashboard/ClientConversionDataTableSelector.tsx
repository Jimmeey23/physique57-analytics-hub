import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BarChart3, TrendingUp, UserCheck, Users } from 'lucide-react';

interface ClientConversionDataTableSelectorProps {
  activeTable: string;
  onTableChange: (table: string) => void;
  dataLength: number;
  isPending?: boolean;
}

type TableOption = {
  key: string;
  label: string;
  icon: React.ElementType;
  activeClass: string;
};

const TABLE_OPTIONS: TableOption[] = [
  {
    key: 'monthonmonthbytype',
    label: 'By Client Type',
    icon: Users,
    activeClass:
      'data-[state=active]:from-blue-600 data-[state=active]:via-blue-700 data-[state=active]:to-blue-800',
  },
  {
    key: 'monthonmonth',
    label: 'Month on Month',
    icon: Calendar,
    activeClass:
      'data-[state=active]:from-emerald-600 data-[state=active]:via-emerald-700 data-[state=active]:to-emerald-800',
  },
  {
    key: 'yearonyear',
    label: 'Year on Year',
    icon: TrendingUp,
    activeClass:
      'data-[state=active]:from-purple-600 data-[state=active]:via-purple-700 data-[state=active]:to-purple-800',
  },
  {
    key: 'hostedclasses',
    label: 'Hosted Classes',
    icon: Users,
    activeClass:
      'data-[state=active]:from-indigo-600 data-[state=active]:via-indigo-700 data-[state=active]:to-indigo-800',
  },
  {
    key: 'memberships',
    label: 'Memberships',
    icon: BarChart3,
    activeClass:
      'data-[state=active]:from-orange-600 data-[state=active]:via-orange-700 data-[state=active]:to-orange-800',
  },
  {
    key: 'teacherperformance',
    label: 'Teacher Performance',
    icon: UserCheck,
    activeClass:
      'data-[state=active]:from-teal-600 data-[state=active]:via-teal-700 data-[state=active]:to-teal-800',
  },
  {
    key: 'newclientpurchases',
    label: 'New Client Purchases',
    icon: Users,
    activeClass:
      'data-[state=active]:from-pink-600 data-[state=active]:via-pink-700 data-[state=active]:to-pink-800',
  },
];

export const ClientConversionDataTableSelector: React.FC<ClientConversionDataTableSelectorProps> = memo(
  ({ activeTable, onTableChange, dataLength, isPending = false }) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Data Analysis Tables</h3>
            <p className="text-sm text-gray-600">Choose a retention view with cleaner, accent-coded navigation</p>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">Optimizing...</Badge>
            )}
            <Badge className="border-slate-200 bg-slate-100 text-slate-800">{dataLength} Records</Badge>
          </div>
        </div>

        <Tabs value={activeTable} onValueChange={onTableChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-slate-50/90 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] lg:grid-cols-4 xl:grid-cols-7">
            {TABLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = activeTable === option.key;
              return (
                <TabsTrigger
                  key={option.key}
                  value={option.key}
                  className={`relative min-h-[68px] rounded-2xl border border-transparent px-3 py-3 text-left font-semibold text-xs text-slate-700 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-sm data-[state=active]:bg-gradient-to-br ${option.activeClass} data-[state=active]:border-white/25 data-[state=active]:text-white data-[state=active]:shadow-[0_14px_30px_rgba(15,23,42,0.18)]`}
                >
                  <div className="flex w-full items-start gap-3">
                    <div className={`mt-0.5 rounded-xl p-2 transition-colors ${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="max-w-full whitespace-normal break-words text-sm font-semibold leading-5">
                        {option.label}
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    );
  }
);

ClientConversionDataTableSelector.displayName = 'ClientConversionDataTableSelector';
