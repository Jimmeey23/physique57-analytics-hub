/**
 * Unified Table Styles — "Atelier" system.
 *
 * Visual styling is driven by the global `.p57-scope table` rules in
 * index.css; these tokens keep legacy `TABLE_STYLES.*` imports working
 * and carry explicit `dark:` variants so they also render correctly
 * outside the scoped area (portals, modals). Prefer `p57-*` classes
 * for new code.
 */

export const TABLE_STYLES = {
  // Container styles
  container: "p57-table-frame p57-table-scroll",

  // Table base
  table: "min-w-full bg-card tabular-nums",

  // Header styles — airy light band / deep dark band (see index.css)
  header: {
    wrapper: "sticky top-0 z-30",
    row: "",
    cell: "px-3.5 py-2.5 text-left font-bold text-[11px] uppercase tracking-wider border-r border-border/60 last:border-r-0 whitespace-nowrap text-muted-foreground bg-white dark:bg-[#131721] dark:text-slate-300",
    cellCenter: "text-center",
    cellSticky: "sticky left-0 z-40 border-r border-border/60 bg-[#f6f7f9] dark:bg-[#141417]",
    monthCell: "min-w-[90px] text-center",
    monthDisplay: "flex flex-col items-center",
    monthText: "text-[11px] font-bold whitespace-nowrap",
    yearText: "text-muted-foreground text-[11px]",
  },

  // Body styles
  body: {
    row: "bg-card hover:bg-accent/60 border-b border-border transition-colors duration-150 dark:hover:bg-[rgba(5,155,255,0.10)]",
    rowAlternate: "bg-secondary/40",
    rowClickable: "cursor-pointer",
    cell: "px-3.5 py-2 text-[13px] font-medium text-foreground/90 border-r border-border/60 last:border-r-0 tabular-nums whitespace-nowrap dark:text-slate-200",
    cellCenter: "text-center",
    cellBold: "font-bold text-foreground",
    cellMono: "font-mono",
    cellSticky: "sticky left-0 bg-card border-r border-border z-20",
    cellHover: "hover:bg-accent cursor-pointer transition-colors duration-150",
  },

  // Group/Category row styles
  group: {
    row: "p57-group-row bg-secondary hover:bg-secondary/70 border-b border-border transition-colors duration-150",
    cell: "px-4 py-2 text-[13px] font-bold text-foreground",
    cellSticky: "sticky left-0 bg-secondary border-r border-border z-20",
    badge: "inline-flex items-center px-2 py-0.5 text-xs font-bold bg-secondary text-secondary-foreground rounded-md",
    expandIcon: "w-4 h-4 text-muted-foreground transition-transform duration-200",
    expandIconRotated: "rotate-90",
  },

  // Total/Footer row styles — ink band light / blue-tinted band dark
  footer: {
    row: "p57-total-row bg-ink text-white font-bold sticky bottom-0 z-20 dark:bg-[#0D1520]",
    cell: "px-3.5 py-2 text-[13px] font-bold border-r border-white/10 last:border-r-0 tabular-nums",
    cellCenter: "text-center",
    cellSticky: "sticky left-0 bg-ink border-r border-white/10 z-30 dark:bg-[#0D1520]",
    label: "text-[11px] uppercase tracking-wider",
  },

  // Growth indicators
  growth: {
    positive: "p57-up",
    negative: "p57-down",
    neutral: "p57-flat",
    badge: "p57-delta",
    badgePositive: "p57-delta-up",
    badgeNegative: "p57-delta-down",
    icon: "w-3 h-3 ml-0.5",
  },

  // Ranking styles
  ranking: {
    first: "p57-rank p57-rank-1",
    second: "p57-rank p57-rank-2",
    third: "p57-rank p57-rank-3",
    badge: "p57-rank p57-rank-rest",
  },

  // Metric tabs
  metricTabs: {
    container: "p57-filterbar",
    label: "p57-filterbar-label",
    button: "p57-tab",
    buttonActive: "p57-tab",
    buttonInactive: "p57-tab",
  },

  // Card wrapper (flat + hairline; new code should use P57TableShell)
  card: {
    container: "p57-card overflow-hidden",
    header: "border-b border-border bg-white px-4 py-3 dark:bg-[#101013]",
    headerTitle: "font-display text-[14px] font-bold text-foreground",
    headerDescription: "text-muted-foreground text-xs font-medium",
    headerIcon: "p57-shell-ic",
    content: "p-0",
  },

  // Canonical badge (P57Badge) — uniform 22px geometry in every table
  badge: {
    base: "p57-badge",
    green: "p57-badge p57-badge-green",
    red: "p57-badge p57-badge-red",
    amber: "p57-badge p57-badge-amber",
    blue: "p57-badge p57-badge-blue",
    violet: "p57-badge p57-badge-violet",
    slate: "p57-badge p57-badge-slate",
  },

  // Sortable header affordance (see P57SortTh)
  sortable: {
    th: "cursor-pointer select-none",
    icon: "p57-sort-ic",
    iconActive: "p57-sort-ic p57-sort-pop",
  },
} as const;

// Header accents for different sections (used as rails/badges, not full gradients)
export const HEADER_GRADIENTS = {
  default: "bg-ink dark:bg-primary",
  sales: "bg-ink dark:bg-primary",
  funnel: "bg-ink dark:bg-primary",
  retention: "bg-ink dark:bg-primary",
  trainer: "bg-ink dark:bg-primary",
  class: "bg-ink dark:bg-primary",
  discount: "bg-ink dark:bg-primary",
  expiration: "bg-ink dark:bg-primary",
  sessions: "bg-ink dark:bg-primary",
} as const;

// CSS class builder utility
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Get ranking badge styles based on rank
export function getRankingBadgeStyle(rank: number): string {
  if (rank === 1) return TABLE_STYLES.ranking.first;
  if (rank === 2) return TABLE_STYLES.ranking.second;
  if (rank === 3) return TABLE_STYLES.ranking.third;
  return "p57-rank p57-rank-rest";
}

// Get growth color based on value
export function getGrowthColor(growth: number): string {
  if (growth > 0) return TABLE_STYLES.growth.positive;
  if (growth < 0) return TABLE_STYLES.growth.negative;
  return TABLE_STYLES.growth.neutral;
}

// Get growth badge style
export function getGrowthBadgeStyle(growth: number): string {
  const base = TABLE_STYLES.growth.badge;
  if (growth > 0) return `${base} ${TABLE_STYLES.growth.badgePositive}`;
  if (growth < 0) return `${base} ${TABLE_STYLES.growth.badgeNegative}`;
  return `${base} p57-delta-flat`;
}
