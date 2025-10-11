import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionData } from '@/hooks/useSessionsData';
import { Users, Target, Calendar, XCircle, CheckCircle2, ClipboardList, Percent, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type CanonicalFormat = 'powercycle' | 'barre' | 'strength' | 'other';

const mapToCanonical = (s: SessionData): CanonicalFormat => {
  const t = (s.classType || s.cleanedClass || '').toLowerCase();
  if (/power|cycle/.test(t)) return 'powercycle';
  if (/barre/.test(t)) return 'barre';
  if (/strength/.test(t)) return 'strength';
  return 'other';
};

interface FormatComparisonSummaryCardsProps {
  data: SessionData[];
}

export const FormatComparisonSummaryCards: React.FC<FormatComparisonSummaryCardsProps> = ({ data }) => {
  const stats = useMemo(() => {
    const groups: Record<CanonicalFormat, SessionData[]> = { powercycle: [], barre: [], strength: [], other: [] };
    data.forEach(s => groups[mapToCanonical(s)].push(s));

    const calc = (arr: SessionData[]) => {
      const sessions = arr.length;
      const scheduled = arr.reduce((sum, s) => sum + ((s as any).classes || s.classes || 0), 0);
      const sessionsTaught = arr.filter(s => (s.checkedInCount || 0) > 0).length;
      const emptyClasses = arr.filter(s => (s.checkedInCount || 0) === 0).length;
      const checkIns = arr.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const capacity = arr.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const lateCancelled = arr.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
      const booked = arr.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
      const revenue = arr.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const fillRate = capacity > 0 ? (checkIns / capacity) * 100 : 0;
      const cancellationRate = booked > 0 ? (lateCancelled / booked) * 100 : 0;
      const classAvgWithEmpty = sessions > 0 ? checkIns / sessions : 0;
      const classAvgWithoutEmpty = sessionsTaught > 0 ? checkIns / sessionsTaught : 0;
      const utilisation = fillRate;
      return {
        sessions, scheduled, sessionsTaught, emptyClasses, checkIns, capacity,
        lateCancelled, booked, revenue, fillRate, cancellationRate,
        classAvgWithEmpty, classAvgWithoutEmpty, utilisation,
      };
    };

    return {
      powercycle: calc(groups.powercycle),
      barre: calc(groups.barre),
      strength: calc(groups.strength),
    };
  }, [data]);

  const cards = [
    { key: 'powercycle', title: 'PowerCycle', accent: 'from-cyan-600 to-cyan-700' },
    { key: 'barre', title: 'Barre', accent: 'from-cyan-600 to-cyan-700' },
    { key: 'strength', title: 'Strength Lab', accent: 'from-cyan-600 to-cyan-700' },
  ] as const;

  const metricRow = (
    label: string,
    value: React.ReactNode,
    Icon: React.ElementType,
  ) => (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((c) => {
        const s = (stats as any)[c.key];
        return (
          <Card key={c.key} className={`bg-white border border-slate-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <div className={`w-9 h-9 bg-gradient-to-r ${c.accent} rounded-xl shadow-sm`} />
                <span>{c.title}</span>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {formatNumber(s.sessions)} sessions
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {s.fillRate.toFixed(1)}% fill
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {metricRow('Sessions taught', formatNumber(s.sessionsTaught), CheckCircle2)}
                {metricRow('Empty classes', formatNumber(s.emptyClasses), XCircle)}
                {metricRow('Check-ins', formatNumber(s.checkIns), Users)}
                {metricRow('Capacity', formatNumber(s.capacity), ClipboardList)}
                {metricRow('Fill rate', `${s.fillRate.toFixed(1)}%`, Target)}
                {metricRow('Avg class (incl. empty)', s.classAvgWithEmpty.toFixed(1), Calendar)}
                {metricRow('Avg class (excl. empty)', s.classAvgWithoutEmpty.toFixed(1), Calendar)}
                {metricRow('Bookings', formatNumber(s.booked), ClipboardList)}
                {metricRow('Cancellation rate', `${s.cancellationRate.toFixed(1)}%`, Percent)}
                {metricRow('Revenue', formatCurrency(s.revenue), DollarSign)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FormatComparisonSummaryCards;
