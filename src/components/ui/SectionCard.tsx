import React from 'react';
import { Info, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as PopoverPrimitive from '@radix-ui/react-popover';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  info?: string;
  children: React.ReactNode;
  className?: string;
  headClassName?: string;
  bodyClassName?: string;
  flush?: boolean;
  id?: string;
}

/**
 * Canonical content section: title rail + description + actions + body.
 */
export const SectionCard = React.forwardRef<HTMLElement, SectionCardProps>(
  (
    {
      title,
      description,
      icon: Icon,
      actions,
      info,
      children,
      className,
      headClassName,
      bodyClassName,
      flush = false,
      id,
    },
    ref
  ) => {
    return (
      <section ref={ref} id={id} className={cn('p57-card scroll-mt-20', className)}>
        {(title || actions) && (
          <header className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-4', headClassName)}>
            <div className="min-w-0">
              {title && (
                <h2 className="p57-section-title">
                  {Icon && <Icon className="h-[18px] w-[18px] shrink-0 text-primary" />}
                  <span className="min-w-0 truncate">{title}</span>
                  {info && (
                    <PopoverPrimitive.Root>
                      <PopoverPrimitive.Trigger asChild>
                        <button
                          aria-label="About this section"
                          className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-primary"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverPrimitive.Trigger>
                      <PopoverPrimitive.Portal>
                        <PopoverPrimitive.Content
                          side="top"
                          align="start"
                          sideOffset={8}
                          className="z-[70] max-w-xs rounded-xl border border-border bg-popover p-3 text-[12px] leading-relaxed text-popover-foreground shadow-pop"
                        >
                          {info}
                          <PopoverPrimitive.Arrow className="fill-popover" />
                        </PopoverPrimitive.Content>
                      </PopoverPrimitive.Portal>
                    </PopoverPrimitive.Root>
                  )}
                </h2>
              )}
              {description && <p className="p57-section-sub">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </header>
        )}
        <div className={cn(flush ? 'mt-3' : 'p-5 pt-3', bodyClassName)}>{children}</div>
      </section>
    );
  }
);
SectionCard.displayName = 'SectionCard';

export default SectionCard;
