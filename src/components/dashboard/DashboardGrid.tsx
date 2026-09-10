import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Database as DatabaseIcon,
  DollarSign,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  List,
  Rows3,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'compact' | 'list';

interface DashboardGridProps {
  onButtonClick: (sectionId: string) => void;
}

interface DashboardSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  tint: string;
  insight: string;
}

const STORAGE_KEYS = {
  order: 'p57-home-card-order',
  hidden: 'p57-home-hidden-cards',
  view: 'p57-home-view-mode',
};

const VIEW_OPTIONS: Array<{ id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'compact', label: 'Compact', icon: Rows3 },
  { id: 'list', label: 'List', icon: List },
];

/** Maps legacy stored view modes to the new set. */
const normalizeView = (stored: string | null): ViewMode => {
  if (stored === 'compact' || stored === 'dense') return 'compact';
  if (stored === 'list') return 'list';
  return 'grid';
};

const DASHBOARD_SECTIONS: DashboardSection[] = [
  { id: 'executive-summary', title: 'Executive Summary', description: 'High-level business metrics and KPIs', icon: TrendingUp, accent: '#005eed', tint: '#eaf2ff', insight: 'Leadership' },
  { id: 'dashboard-overview', title: 'Dashboard Overview', description: 'One summary canvas across the core analytics modules', icon: Eye, accent: '#0e1729', tint: '#ececef', insight: 'Overview' },
  { id: 'performance-command-center', title: 'Performance Command Center', description: 'Executive metrics, trends, tables and rankings in one view', icon: Activity, accent: '#7c5cf0', tint: '#efecfe', insight: 'Command' },
  { id: 'sales-analytics', title: 'Sales Analytics', description: 'Revenue trends and sales performance', icon: DollarSign, accent: '#0e9f6e', tint: '#e7f6ef', insight: 'Revenue' },
  { id: 'class-attendance', title: 'Class Attendance', description: 'Session attendance and capacity analysis', icon: Users, accent: '#d63a6a', tint: '#fdeef3', insight: 'Operations' },
  { id: 'trainer-performance', title: 'Trainer Performance', description: 'Individual trainer metrics and rankings', icon: UserCheck, accent: '#e08a00', tint: '#fdf3e2', insight: 'Instructors' },
  { id: 'client-retention', title: 'Client Retention', description: 'Member retention and conversion analysis', icon: Target, accent: '#0ea5b7', tint: '#e5f6f9', insight: 'Retention' },
  { id: 'forecasting-action-center', title: 'Forecasting & Action Center', description: 'Predict revenue, rank risk, surface next best actions', icon: TrendingUp, accent: '#7c3aed', tint: '#f1eafd', insight: 'Predict' },
  { id: 'member-lifecycle', title: 'Member 360 & Lifecycle', description: 'Member value, engagement and momentum in one workspace', icon: Users, accent: '#0e9f6e', tint: '#e7f6ef', insight: 'Lifecycle' },
  { id: 'studio-pulse', title: 'Studio Pulse', description: 'Live 360° operating view across revenue, attendance and leads', icon: Activity, accent: '#0e1729', tint: '#ececef', insight: 'Pulse' },
  { id: 'discounts-promotions', title: 'Discounts & Promotions', description: 'Discount analysis and promotional effectiveness', icon: BarChart3, accent: '#f0529a', tint: '#fdeaf3', insight: 'Pricing' },
  { id: 'funnel-leads', title: 'Funnel & Leads', description: 'Lead conversion and sales funnel analysis', icon: Activity, accent: '#005eed', tint: '#eaf2ff', insight: 'Growth' },
  { id: 'class-formats', title: 'Class Formats & Performance', description: 'PowerCycle vs Barre vs Strength comparison metrics', icon: BarChart3, accent: '#0ea5b7', tint: '#e5f6f9', insight: 'Formats' },
  { id: 'late-cancellations', title: 'Late Cancellations', description: 'Analysis of late cancellations and no-shows', icon: Clock, accent: '#dc2626', tint: '#fdeaea', insight: 'Risk' },
  { id: 'patterns-trends', title: 'Patterns & Trends', description: 'Member visit patterns and product usage trends', icon: TrendingUp, accent: '#7c5cf0', tint: '#efecfe', insight: 'Trends' },
  { id: 'expiration-analytics', title: 'Expirations & Churn', description: 'Membership expirations and retention analysis', icon: Calendar, accent: '#e08a00', tint: '#fdf3e2', insight: 'Churn' },
  { id: 'outlier-analysis', title: 'Custom Data Lab', description: 'Build pivot tables and chart models across data sources', icon: DatabaseIcon, accent: '#7c3aed', tint: '#f1eafd', insight: 'Data Lab' },
  { id: 'executive-report', title: 'Executive Report', description: 'Full studio performance report: sales, classes, trainers, funnel, churn', icon: Target, accent: '#b9975b', tint: '#f6f0e2', insight: 'Report' },
];

const DEFAULT_ORDER = DASHBOARD_SECTIONS.map((section) => section.id);

const parseArray = (value: string | null) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const normalizeOrder = (storedOrder: string[]) => {
  const valid = storedOrder.filter((id) => DEFAULT_ORDER.includes(id));
  return [...valid, ...DEFAULT_ORDER.filter((id) => !valid.includes(id))];
};

const reorderCards = (items: string[], draggedId: string, targetId: string) => {
  const source = items.indexOf(draggedId);
  const target = items.indexOf(targetId);
  if (source < 0 || target < 0 || source === target) return items;
  const updated = [...items];
  const [moved] = updated.splice(source, 1);
  updated.splice(target, 0, moved);
  return updated;
};

export const DashboardGrid: React.FC<DashboardGridProps> = memo(({ onButtonClick }) => {
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ORDER;
    return normalizeOrder(parseArray(window.localStorage.getItem(STORAGE_KEYS.order)));
  });
  const [hiddenCards, setHiddenCards] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    return parseArray(window.localStorage.getItem(STORAGE_KEYS.hidden));
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    return normalizeView(window.localStorage.getItem(STORAGE_KEYS.view));
  });

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.order, JSON.stringify(cardOrder));
  }, [cardOrder]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.hidden, JSON.stringify(hiddenCards));
  }, [hiddenCards]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.view, viewMode);
  }, [viewMode]);

  const orderedSections = useMemo(() => {
    const map = new Map(DASHBOARD_SECTIONS.map((section) => [section.id, section]));
    return normalizeOrder(cardOrder).map((id) => map.get(id)).filter(Boolean) as DashboardSection[];
  }, [cardOrder]);

  const visibleSections = useMemo(
    () => orderedSections.filter((section) => !hiddenCards.includes(section.id)),
    [orderedSections, hiddenCards]
  );

  const hiddenSections = useMemo(
    () => orderedSections.filter((section) => hiddenCards.includes(section.id)),
    [orderedSections, hiddenCards]
  );

  const hideCard = useCallback((sectionId: string) => {
    setHiddenCards((previous) => (previous.includes(sectionId) ? previous : [...previous, sectionId]));
  }, []);

  const unhideCard = useCallback((sectionId: string) => {
    setHiddenCards((previous) => previous.filter((id) => id !== sectionId));
  }, []);

  const resetLayout = useCallback(() => {
    setCardOrder(DEFAULT_ORDER);
    setHiddenCards([]);
    setViewMode('grid');
  }, []);

  const onDragOverCard = useCallback(
    (event: React.DragEvent<HTMLDivElement>, sectionId: string) => {
      event.preventDefault();
      if (draggedCardId && draggedCardId !== sectionId) setDragOverCardId(sectionId);
    },
    [draggedCardId]
  );

  const onDropCard = useCallback(
    (event: React.DragEvent<HTMLDivElement>, targetId: string) => {
      event.preventDefault();
      if (!draggedCardId) return;
      setCardOrder((previous) => reorderCards(previous, draggedCardId, targetId));
      setDraggedCardId(null);
      setDragOverCardId(null);
    },
    [draggedCardId]
  );

  const gridClass = useMemo(() => {
    if (viewMode === 'list') return 'grid grid-cols-1 gap-2.5';
    if (viewMode === 'compact') return 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3';
    return 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3';
  }, [viewMode]);

  const isList = viewMode === 'list';
  const isCompact = viewMode === 'compact';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="p57-filterbar !py-2.5">
        <div className="p57-tabs">
          {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              data-state={viewMode === id ? 'active' : 'inactive'}
              className="p57-tab"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setShowHiddenPanel((v) => !v)} className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          Hidden ({hiddenSections.length})
        </Button>
        <Button variant="outline" size="sm" onClick={resetLayout}>
          Reset layout
        </Button>
      </div>

      {showHiddenPanel && (
        <div className="p57-card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[13px] font-bold">Hidden modules</p>
            <button
              type="button"
              onClick={() => setHiddenCards([])}
              className="text-xs font-bold text-primary hover:underline"
            >
              Unhide all
            </button>
          </div>
          {hiddenSections.length === 0 ? (
            <p className="text-xs text-muted-foreground">No modules are hidden.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hiddenSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => unhideCard(section.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                >
                  {section.title}
                  <EyeOff className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      <div className={gridClass}>
        {visibleSections.map((section, index) => {
          const IconComponent = section.icon;
          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDraggedCardId(section.id)}
              onDragOver={(e) => onDragOverCard(e, section.id)}
              onDrop={(e) => onDropCard(e, section.id)}
              onDragEnd={() => { setDraggedCardId(null); setDragOverCardId(null); }}
              onClick={() => onButtonClick(section.id)}
              style={{ '--p57-d': `${Math.min(index, 11) * 35}ms` } as React.CSSProperties}
              className={cn(
                'p57-enter group relative cursor-pointer overflow-hidden rounded-[18px] border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-foreground/20',
                isList ? 'flex items-center gap-4 px-4 py-3' : 'p-4',
                draggedCardId === section.id && 'opacity-50',
                dragOverCardId === section.id && 'border-primary ring-2 ring-primary/25'
              )}
            >
              <div className={cn('flex gap-3.5', isList && 'flex-1 items-center', !isList && 'items-start')}>
                {/* Icon tile */}
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: section.tint, color: section.accent }}
                >
                  <IconComponent className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={cn('truncate font-display font-bold tracking-tight', isCompact || isList ? 'text-[14px]' : 'text-[15px]')}>
                      {section.title}
                    </h3>
                  </div>
                  {!isCompact && !isList && (
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                  {isList && (
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{section.description}</p>
                  )}
                  {!isList && (
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: section.tint, color: section.accent }}
                      >
                        {section.insight}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-muted-foreground transition-colors group-hover:text-primary">
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isList && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-muted-foreground transition-colors group-hover:text-primary">
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              )}

              {/* Hover tools */}
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <span
                  className="cursor-grab rounded-md bg-secondary p-1 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); hideCard(section.id); }}
                  className="rounded-md bg-secondary p-1 text-muted-foreground hover:text-foreground"
                  aria-label={`Hide ${section.title}`}
                  title="Hide module"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default DashboardGrid;
