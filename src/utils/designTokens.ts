/**
 * Physique 57 — "Atelier" design tokens (Athena-inspired).
 * Single source of truth for class strings shared across the app.
 * NOTE: prefer the `p57-*` CSS primitives in index.css for new code;
 * this module keeps legacy `designTokens.*` imports working.
 */

export const designTokens = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem',
    xxxl: '3rem',
  },

  card: {
    padding: 'p-6',
    shadow: 'shadow-card',
    border: 'border border-border',
    background: 'bg-card',
    radius: 'rounded-[20px]',
    hover: 'transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5',
  },

  colors: {
    brand: {
      DEFAULT: '#005eed',
      soft: '#eaf2ff',
      deep: '#0047b8',
    },
    ink: {
      DEFAULT: '#0e1729',
      soft: '#1a2740',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
  },

  typography: {
    display: 'font-display text-4xl md:text-5xl font-extrabold tracking-tight',
    h1: 'font-display text-3xl md:text-4xl font-bold tracking-tight',
    h2: 'font-display text-2xl md:text-3xl font-bold tracking-tight',
    h3: 'font-display text-xl md:text-2xl font-bold',
    h4: 'text-lg md:text-xl font-semibold',
    body: 'text-sm md:text-base text-foreground/90',
    caption: 'text-xs md:text-sm text-muted-foreground',
    label: 'text-sm font-medium text-foreground',
    eyebrow: 'p57-eyebrow',
    numeric: 'p57-num',
  },

  table: {
    frame: 'p57-table-frame',
    scroll: 'p57-table-scroll',
    header: '',
    headerCell: 'px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground',
    row: 'bg-card border-b border-border transition-colors hover:bg-accent/60',
    cell: 'px-3.5 py-2 text-[13px] font-medium text-foreground/90 tabular-nums whitespace-nowrap',
    totalsRow: 'bg-ink text-white font-bold dark:bg-[#101a2e]',
    pill: {
      green: 'p57-pill p57-pill-green',
      red: 'p57-pill p57-pill-red',
      amber: 'p57-pill p57-pill-amber',
      blue: 'p57-pill p57-pill-blue',
      violet: 'p57-pill p57-pill-violet',
      slate: 'p57-pill p57-pill-slate',
      rose: 'p57-pill p57-pill-rose',
    },
  },

  tabs: {
    list: 'p57-tabs',
    trigger: 'p57-tab',
  },

  metric: {
    card: 'p57-metric',
    label: 'p57-metric-label',
    value: 'p57-metric-value',
    sub: 'p57-metric-sub',
  },

  section: {
    head: 'p57-section-head',
    title: 'p57-section-title',
    sub: 'p57-section-sub',
  },

  filterBar: 'p57-filterbar',
  filterBarLabel: 'p57-filterbar-label',

  hero: {
    frame: 'p57-hero',
    badge: 'p57-hero-badge',
    title: 'p57-hero-title',
    sub: 'p57-hero-sub',
  },

  grid: {
    gap: 'gap-4 md:gap-5',
    section: 'space-y-4 md:space-y-5',
  },

  button: {
    base: 'p57-btn-press',
    header: 'bg-ink text-white hover:bg-ink-soft dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
  },
} as const;

export type DesignTokens = typeof designTokens;

/** Chart palette shared by all recharts visuals. */
export const chartPalette = [
  '#005eed', // brand blue
  '#7c5cf0', // violet
  '#0e9f6e', // emerald
  '#e08a00', // amber
  '#0ea5b7', // teal
  '#f0529a', // pink
  '#64748b', // slate
] as const;

/** Location accent colors (stable mapping). */
export const locationAccents: Record<string, string> = {
  Kwality: '#005eed',
  Supreme: '#7c5cf0',
  Kenkere: '#0e9f6e',
  All: '#e08a00',
};

export default designTokens;
