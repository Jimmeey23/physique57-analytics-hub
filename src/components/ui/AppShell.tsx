import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUp,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Dumbbell,
  Filter,
  FlaskConical,
  Gauge,
  Home,
  Layers,
  LayoutDashboard,
  LineChart,
  MapPin,
  Menu,
  Moon,
  Percent,
  Radar,
  Rows3,
  Search,
  Sparkles,
  Sun,
  TimerOff,
  TrendingUp,
  Users,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useTheme } from '@/contexts/ThemeContext';

/* ------------------------------------------------------------------ */
/* Navigation model                                                    */
/* ------------------------------------------------------------------ */

export interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Home', short: 'Home', icon: Home },
      { to: '/executive-summary', label: 'Executive Summary', short: 'Summary', icon: Gauge },
      { to: '/dashboard-overview', label: 'Dashboard Overview', short: 'Overview', icon: LayoutDashboard },
      { to: '/performance-command-center', label: 'Command Center', short: 'Command', icon: Radar },
      { to: '/studio-pulse', label: 'Studio Pulse', short: 'Pulse', icon: Activity },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { to: '/sales-analytics', label: 'Sales Analytics', short: 'Sales', icon: Wallet },
      { to: '/funnel-leads', label: 'Funnel & Leads', short: 'Funnel', icon: Filter },
      { to: '/discounts-promotions', label: 'Discounts & Promotions', short: 'Discounts', icon: Percent },
      { to: '/expiration-analytics', label: 'Expiration Analytics', short: 'Expirations', icon: Clock },
    ],
  },
  {
    label: 'Members',
    items: [
      { to: '/client-retention', label: 'Client Retention', short: 'Retention', icon: UserCheck },
      { to: '/member-lifecycle', label: 'Member 360 & Lifecycle', short: 'Member 360', icon: Users },
      { to: '/sessions', label: 'Sessions', short: 'Sessions', icon: CalendarDays },
      { to: '/late-cancellations', label: 'Late Cancellations', short: 'Late Cancels', icon: TimerOff },
    ],
  },
  {
    label: 'Studio',
    items: [
      { to: '/class-attendance', label: 'Class Attendance', short: 'Attendance', icon: CircleDot },
      { to: '/class-formats', label: 'Class Formats', short: 'Formats', icon: Layers },
      { to: '/trainer-performance', label: 'Trainer Performance', short: 'Trainers', icon: Dumbbell },
      { to: '/location-report', label: 'Location Report', short: 'Locations', icon: MapPin },
      { to: '/patterns-trends', label: 'Patterns & Trends', short: 'Patterns', icon: LineChart },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/forecasting-action-center', label: 'Forecasting & Actions', short: 'Forecasting', icon: Sparkles },
      { to: '/outlier-analysis', label: 'Data Lab', short: 'Data Lab', icon: FlaskConical },
      { to: '/main-dashboard', label: 'Main Dashboard', short: 'Main', icon: BarChart3 },
      { to: '/executive-report', label: 'Executive Report', short: 'Report', icon: TrendingUp },
    ],
  },
];

const PATH_TITLES: Record<string, { title: string; group: string }> = {};
NAV_GROUPS.forEach((g) =>
  g.items.forEach((i) => {
    PATH_TITLES[i.to] = { title: i.label, group: g.label };
  })
);
PATH_TITLES['/powercycle-vs-barre'] = { title: 'PowerCycle vs Barre', group: 'Studio' };

/* ------------------------------------------------------------------ */
/* Density                                                             */
/* ------------------------------------------------------------------ */

export type Density = 'comfortable' | 'compact';
const DENSITY_KEY = 'p57-density';

function useDensity() {
  const [density, setDensity] = useState<Density>(() => {
    try {
      return (localStorage.getItem(DENSITY_KEY) as Density) || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(DENSITY_KEY, density);
    } catch { /* noop */ }
  }, [density]);
  return { density, setDensity };
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function Wordmark({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/')}
      className={cn('group flex items-center gap-2.5 px-4 pb-4 pt-5 text-left', collapsed && 'justify-center px-0')}
      title="Home"
    >
      <BrandLogo className="p57-logo-mark h-10 w-10" />
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate font-serif text-[21px] leading-none tracking-tight text-foreground">
            Analytics Hub
          </span>
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Physique 57 · India
          </span>
        </span>
      )}
    </button>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70">
        <Wordmark collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-4 [scrollbar-width:thin]">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={cn('mt-4 first:mt-3', collapsed && 'mt-3')}>
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      data-active={active}
                      className={cn(
                        'p57-rail-btn group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium',
                        collapsed && 'justify-center px-0',
                        active ? 'text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground dark:hover:bg-primary/10'
                      )}
                    >
                      <Icon className={cn('h-[17px] w-[17px] shrink-0', !active && 'text-muted-foreground/70 group-hover:text-foreground')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-border/70 p-3', collapsed && 'flex justify-center')}>
        {collapsed ? (
          <span className="p57-dot p57-dot-live" title="Live" />
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-card">
            <span className="p57-dot p57-dot-live" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground">Live data</p>
              <p className="truncate text-[10px] font-medium text-muted-foreground">Synced with source</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App shell                                                           */
/* ------------------------------------------------------------------ */

function openCommandPalette() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
    })
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('p57-sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const { density, setDensity } = useDensity();

  useEffect(() => {
    try {
      localStorage.setItem('p57-sidebar', collapsed ? 'collapsed' : 'open');
    } catch { /* noop */ }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setShowTop(window.scrollY > 640);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Alt+T toggles the theme (ignored while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        const el = document.activeElement as HTMLElement | null;
        const typing =
          el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
        if (typing) return;
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTheme]);

  const crumb = useMemo(() => {
    const hit = PATH_TITLES[location.pathname];
    if (hit) return hit;
    const key = Object.keys(PATH_TITLES).find(
      (k) => k !== '/' && location.pathname.startsWith(k)
    );
    return key ? PATH_TITLES[key] : { title: 'Analytics', group: 'Overview' };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p57-grain" aria-hidden="true" />
      <div className="p57-gloss" aria-hidden="true" />
      <div className="p57-ambient" aria-hidden="true" />
      <div className="p57-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'p57-no-print fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/70 bg-white/80 backdrop-blur-xl transition-[width] duration-200 dark:bg-[#0C0C0E]/90 lg:flex',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[76px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      <div
        className={cn(
          'p57-no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={cn(
          'p57-no-print fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-white shadow-pop transition-transform duration-200 dark:bg-[#0C0C0E] lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-5 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Main column */}
      <div className={cn('relative z-10 flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[68px]' : 'lg:pl-[240px]')}>
        {/* Topbar */}
        <header className="p57-no-print hide-scroll sticky top-0 z-30 flex h-[64px] items-center gap-2 overflow-x-auto border-b border-border/70 bg-white/80 px-4 backdrop-blur-xl dark:bg-[#0A0A0C]/85 md:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex min-w-0 shrink-0 items-baseline gap-2">
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              {crumb.group}
            </span>
            <ChevronRight className="hidden h-3 w-3 self-center text-muted-foreground/50 sm:inline" />
            <span className="truncate font-serif text-[22px] leading-none tracking-tight">{crumb.title}</span>
          </div>

          <div className="min-w-4 flex-1" />

          {/* Search */}
          <button
            onClick={openCommandPalette}
            className="hidden h-9 w-[220px] shrink-0 items-center gap-2.5 rounded-xl border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:border-primary/40 hover:text-foreground focus:border-primary md:flex"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate text-left">Search or jump to…</span>
            <kbd className="rounded-md border border-border bg-card px-1.5 py-0.5 font-sans text-[10px] font-bold text-muted-foreground">
              ⌘K
            </kbd>
          </button>
          <Button variant="ghost" size="icon-sm" className="shrink-0 md:hidden" onClick={openCommandPalette} aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>

          {/* Density */}
          <div className="hidden shrink-0 items-center rounded-xl border border-border bg-card p-[3px] shadow-sm sm:flex" title="Table density">
            <button
              onClick={() => setDensity('comfortable')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
                density === 'comfortable' ? 'bg-ink text-white dark:bg-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Rows3 className="h-3.5 w-3.5" /> Roomy
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
                density === 'compact' ? 'bg-ink text-white dark:bg-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Rows3 className="h-3.5 w-3.5 rotate-180" /> Dense
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode (Alt+T)' : 'Switch to dark mode (Alt+T)'}
            aria-label="Toggle dark mode"
            aria-keyshortcuts="alt+t"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        {/* Page content */}
        <main className="p57-scope flex-1" data-density={density}>
          <div className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="p57-no-print border-t border-border/70 bg-white/60 dark:bg-transparent">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[hsl(var(--brand-deep))] font-display text-[10px] font-extrabold text-white">
                57
              </span>
              <span className="font-serif text-[15px] tracking-tight">Physique <em className="text-primary">57</em></span>
              <span className="hidden text-[11px] text-muted-foreground sm:inline">· Advanced Business Analytics</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="p57-dot p57-dot-live" />
              <span>Live</span>
              <span className="opacity-40">|</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={cn(
          'p57-no-print fixed bottom-5 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-pop transition-all duration-200 hover:bg-ink-soft dark:bg-primary',
          showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        )}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}

export { openCommandPalette };
export default AppShell;
