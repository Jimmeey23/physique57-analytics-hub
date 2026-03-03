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
            <p className="text-sm text-gray-600">Consistent Sales-style table navigation</p>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">Optimizing...</Badge>
            )}
            <Badge className="border-slate-200 bg-slate-100 text-slate-800">{dataLength} Records</Badge>
          </div>
        </div>

        <Tabs value={activeTable} onValueChange={onTableChange} className="w-full">
          <TabsList className="bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-2xl border-2 border-slate-200 flex w-full max-w-7xl mx-auto overflow-visible relative">
            {TABLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <TabsTrigger
                  key={option.key}
                  value={option.key}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br ${option.activeClass} data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{option.label}</span>
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
