import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionData } from '@/hooks/useSessionsData';
import { formatPercentage } from '@/utils/formatters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClassDemandHeatmapProps {
  sessions: SessionData[];
}

export const ClassDemandHeatmap: React.FC<ClassDemandHeatmapProps> = ({ sessions }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Extract unique sorted time slots
  const timeSlots = Array.from(new Set(sessions.map(s => s.time)))
    .sort((a, b) => {
      const [h1, m1] = a.split(':').map(Number);
      const [h2, m2] = b.split(':').map(Number);
      return h1 !== h2 ? h1 - h2 : m1 - m2;
    });

  // Calculate metrics
  const gridData: Record<string, { totalFill: number, count: number }> = {};
  let overallTotalFill = 0;
  let overallCount = 0;

  sessions.forEach(s => {
    const key = `${s.dayOfWeek}-${s.time}`;
    if (!gridData[key]) gridData[key] = { totalFill: 0, count: 0 };
    
    const fill = s.capacity > 0 ? (s.checkedInCount / s.capacity) * 100 : 0;
    gridData[key].totalFill += fill;
    gridData[key].count += 1;
    
    overallTotalFill += fill;
    overallCount += 1;
  });

  const avgFillRate = overallCount > 0 ? overallTotalFill / overallCount : 0;

  const getCellColor = (fill: number) => {
    if (fill === 0) return 'bg-slate-100';
    if (fill >= 100) return 'bg-blue-600 text-white';
    if (fill >= 80) return 'bg-emerald-500 text-white';
    if (fill >= 50) return 'bg-amber-400 text-amber-900';
    return 'bg-slate-300 text-slate-700';
  };

  // Top 5 slots
  const slotsList = Object.entries(gridData)
    .map(([key, data]) => ({
      slot: key,
      avgFill: data.totalFill / data.count,
      count: data.count
    }))
    .sort((a, b) => b.avgFill - a.avgFill)
    .slice(0, 5);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Class Demand Heatmap</CardTitle>
          <p className="text-sm text-muted-foreground">Average fill rate by day and time</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatPercentage(avgFillRate)}</p>
          <p className="text-xs text-muted-foreground uppercase">Overall Avg Fill</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="p-1"></th>
                {timeSlots.map(time => (
                  <th key={time} className="p-1 text-[10px] font-medium text-slate-500 rotate-45 h-12 align-bottom">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day}>
                  <td className="p-1 text-xs font-medium text-slate-600 w-20">{day}</td>
                  {timeSlots.map(time => {
                    const data = gridData[`${day}-${time}`];
                    const fill = data ? data.totalFill / data.count : 0;
                    
                    return (
                      <TooltipProvider key={time}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <td 
                              className={`w-8 h-8 rounded-sm text-[10px] flex items-center justify-center cursor-default transition-colors ${getCellColor(fill)}`}
                            >
                              {data ? Math.round(fill) : ''}
                            </td>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-bold">{day} @ {time}</p>
                              <p>Avg Fill: {formatPercentage(fill)}</p>
                              <p>Sessions: {data?.count || 0}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h4 className="text-sm font-semibold mb-3">Top 5 Highest Demand Slots</h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {slotsList.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">{item.slot.replace('-', ' ')}</p>
                <p className="text-lg font-bold text-primary">{formatPercentage(item.avgFill)}</p>
                <p className="text-[10px] text-slate-400 uppercase">{item.count} sessions</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
