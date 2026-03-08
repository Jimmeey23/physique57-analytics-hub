import React from 'react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type {
  OverviewAccent,
  OverviewChartDefinition,
  OverviewMetricCard,
  OverviewModuleContent,
  OverviewRankingDefinition,
  OverviewTableColumn,
  OverviewTableDefinition,
} from './types';
import { formatOverviewValue } from './filtering';

const accentStyles: Record<
  OverviewAccent,
  {
    border: string;
    icon: string;
    badge: string;
  }
> = {
  emerald: {
    border: 'border-t-emerald-500',
    icon: 'bg-emerald-500/15 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  blue: {
    border: 'border-t-blue-500',
    icon: 'bg-blue-500/15 text-blue-700',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  purple: {
    border: 'border-t-purple-500',
    icon: 'bg-purple-500/15 text-purple-700',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  rose: {
    border: 'border-t-rose-500',
    icon: 'bg-rose-500/15 text-rose-700',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  amber: {
    border: 'border-t-amber-500',
    icon: 'bg-amber-500/15 text-amber-700',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  teal: {
    border: 'border-t-teal-500',
    icon: 'bg-teal-500/15 text-teal-700',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  indigo: {
    border: 'border-t-indigo-500',
    icon: 'bg-indigo-500/15 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  slate: {
    border: 'border-t-slate-500',
    icon: 'bg-slate-500/15 text-slate-700',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

const MetricCardItem: React.FC<{ card: OverviewMetricCard }> = ({ card }) => {
  const Icon = card.icon;
  const styles = accentStyles[card.accent];

  return (
    <Card className={cn('border border-slate-200 shadow-sm border-t-4 bg-white', styles.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.title}</p>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-600">{card.description}</p>
          </div>
          <div className={cn('rounded-2xl p-3 shadow-sm', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ChartCard: React.FC<{ chart: OverviewChartDefinition }> = ({ chart }) => {
  const [mode, setMode] = React.useState<'bar' | 'line'>('bar');

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900">{chart.title}</CardTitle>
            <CardDescription className="text-slate-600">{chart.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === 'bar' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setMode('bar')}
            >
              Bar
            </Button>
            <Button
              size="sm"
              variant={mode === 'line' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setMode('line')}
            >
              Line
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chart.data.length ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'bar' ? (
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatOverviewValue(value as number, chart.format)} />
                  <Legend />
                  {chart.series.map((series) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      name={series.label}
                      fill={series.color}
                      radius={[8, 8, 0, 0]}
                    />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatOverviewValue(value as number, chart.format)} />
                  <Legend />
                  {chart.series.map((series) => (
                    <Line
                      key={series.key}
                      dataKey={series.key}
                      name={series.label}
                      stroke={series.color}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      type="monotone"
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            {chart.emptyMessage ?? 'No chart data available for the active filters.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RankingCard: React.FC<{ ranking: OverviewRankingDefinition }> = ({ ranking }) => {
  const styles = accentStyles[ranking.accent];

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900">{ranking.title}</CardTitle>
            <CardDescription className="text-slate-600">{ranking.description}</CardDescription>
          </div>
          <Badge variant="outline" className={styles.badge}>
            {ranking.entries.length} ranked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranking.entries.length ? (
          ranking.entries.map((entry, index) => (
            <div
              key={`${ranking.id}-${entry.label}`}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {index + 1}. {entry.label}
                </p>
                {entry.secondary ? <p className="text-xs text-slate-500">{entry.secondary}</p> : null}
              </div>
              <p className="text-sm font-bold text-slate-900">{formatOverviewValue(entry.value, ranking.format)}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No ranking data available for the active filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const renderCell = (value: string | number, column: OverviewTableColumn) => formatOverviewValue(value, column.format);

const TableCard: React.FC<{ table: OverviewTableDefinition }> = ({ table }) => (
  <Card className="border border-slate-200 shadow-sm bg-white">
    <CardHeader>
      <CardTitle className="text-lg text-slate-900">{table.title}</CardTitle>
      <CardDescription className="text-slate-600">{table.description}</CardDescription>
    </CardHeader>
    <CardContent>
      {table.rows.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                {table.columns.map((column) => (
                  <TableHead
                    key={`${table.id}-${column.key}`}
                    className={cn(
                      'text-xs font-semibold uppercase tracking-[0.15em] text-slate-500',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center'
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row, rowIndex) => (
                <TableRow key={`${table.id}-${rowIndex}`}>
                  {table.columns.map((column) => (
                    <TableCell
                      key={`${table.id}-${rowIndex}-${column.key}`}
                      className={cn(
                        'text-sm text-slate-700',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center'
                      )}
                    >
                      {renderCell(row[column.key] ?? '', column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          {table.emptyMessage ?? 'No table data available for the active filters.'}
        </div>
      )}
    </CardContent>
  </Card>
);

export const OverviewModuleView: React.FC<{ module: OverviewModuleContent }> = ({ module }) => (
  <div className="space-y-8">
    <Card className="border border-slate-200 bg-white/95 shadow-sm">
      <CardContent className="flex flex-col gap-2 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Overview Canvas</p>
        <h2 className="text-2xl font-bold text-slate-900">{module.title}</h2>
        <p className="max-w-3xl text-sm text-slate-600">{module.subtitle}</p>
      </CardContent>
    </Card>

    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {module.cards.map((card) => (
        <MetricCardItem key={card.id} card={card} />
      ))}
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {module.charts.map((chart) => (
        <ChartCard key={chart.id} chart={chart} />
      ))}
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <RankingCard ranking={module.topRanking} />
      <RankingCard ranking={module.bottomRanking} />
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {module.tables.map((table) => (
        <TableCard key={table.id} table={table} />
      ))}
    </section>
  </div>
);

export default OverviewModuleView;
