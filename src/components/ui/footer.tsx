import React from 'react';

/**
 * Slim page footer. The AppShell renders the global footer;
 * this component keeps legacy `import { Footer }` usages consistent.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-border/70 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
  );
};

export default Footer;
