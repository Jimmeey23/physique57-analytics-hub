import React from 'react';

interface SectionLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Slim page-section wrapper. The AppShell provides navigation, topbar
 * and footer; this only renders the section heading + spaced content.
 */
export const SectionLayout: React.FC<SectionLayoutProps> = ({
  title,
  subtitle = 'Real-time analytics & insights',
  actions,
  children,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="p57-section-title !text-xl">{title}</h1>
          {subtitle && <p className="p57-section-sub">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <main className="space-y-4 md:space-y-5">{children}</main>
    </div>
  );
};

export default SectionLayout;
