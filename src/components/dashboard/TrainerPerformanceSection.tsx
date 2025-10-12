import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayrollData } from '@/hooks/usePayrollData';
import { ImprovedYearOnYearTrainerTable } from './ImprovedYearOnYearTrainerTable';
import { MonthOnMonthTrainerTable } from './MonthOnMonthTrainerTable';
import { TrainerDrillDownModal } from './TrainerDrillDownModal';
import { processTrainerData } from './TrainerDataProcessor';
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

export const TrainerPerformanceSection = () => {
  const { data: payrollData, isLoading, error } = usePayrollData();
  const [selectedTab, setSelectedTab] = useState('month-on-month');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);

  const processedData = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    return processTrainerData(payrollData);
  }, [payrollData]);

  const handleRowClick = (trainer: string, data: any) => {
    setSelectedTrainer(trainer);
    setDrillDownData(data);
  };

  const closeDrillDown = () => {
    setSelectedTrainer(null);
    setDrillDownData(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <BrandSpinner size="sm" />
            <span className="text-slate-700 font-medium">Loading trainer performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading trainer data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!processedData.length) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <p className="text-center text-slate-600">No trainer performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm h-14">
          <TabsTrigger
            value="month-on-month"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4" />
            Month-on-Month Analysis
          </TabsTrigger>
          <TabsTrigger
            value="year-on-year"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-blue-700"
          >
            <TrendingUp className="w-4 h-4" />
            Year-on-Year Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month-on-month" className="space-y-4">
          <MonthOnMonthTrainerTable
            data={processedData}
            defaultMetric="totalSessions"
            onRowClick={handleRowClick}
          />
        </TabsContent>

        <TabsContent value="year-on-year" className="space-y-4">
          <ImprovedYearOnYearTrainerTable
            data={processedData}
            defaultMetric="totalSessions"
            onRowClick={handleRowClick}
          />
        </TabsContent>
      </Tabs>

      {selectedTrainer && drillDownData && (
        <TrainerDrillDownModal
          isOpen={!!selectedTrainer}
          onClose={closeDrillDown}
          trainerName={selectedTrainer}
          trainerData={drillDownData}
        />
      )}
    </div>
  );
};
