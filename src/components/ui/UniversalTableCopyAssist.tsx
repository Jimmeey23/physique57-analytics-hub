import React from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { discoverPageTables } from '@/utils/tableCopy';

interface OverlayTableTarget {
  id: string;
  name: string;
  table: HTMLTableElement;
  host: HTMLDivElement;
}

const createOverlayHost = (table: HTMLTableElement) => {
  const wrapper =
    (table.closest('.overflow-x-auto, .overflow-auto, [data-table-host], .table-wrapper') as HTMLElement | null) ||
    (table.parentElement as HTMLElement | null);

  if (!wrapper) return null;

  const host = document.createElement('div');
  host.setAttribute('data-auto-copy-overlay', 'true');
  host.className = 'pointer-events-auto absolute right-2 top-2 z-30';

  if (window.getComputedStyle(wrapper).position === 'static') {
    wrapper.style.position = 'relative';
  }

  wrapper.appendChild(host);
  return host;
};

export const UniversalTableCopyAssist: React.FC = () => {
  const location = useLocation();
  const [targets, setTargets] = React.useState<OverlayTableTarget[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      setTargets((prev) => {
        prev.forEach((target) => target.host.remove());
        return [];
      });
    };

    const scan = () => {
      if (cancelled) return;

      cleanup();

      const nextTargets = discoverPageTables(document)
        .filter(({ element }) => !element.hasAttribute('data-has-copy-button'))
        .filter(({ element }) => element.offsetParent !== null)
        .map(({ id, name, element }) => {
          const host = createOverlayHost(element);
          if (!host) return null;
          return { id, name, table: element, host };
        })
        .filter((target): target is OverlayTableTarget => target !== null);

      if (!cancelled) {
        setTargets(nextTargets);
      }
    };

    const timeoutId = window.setTimeout(scan, 450);
    const observer = new MutationObserver(() => {
      window.clearTimeout(timeoutId);
      window.setTimeout(scan, 150);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-has-copy-button', 'data-table', 'data-table-name'],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timeoutId);
      cleanup();
    };
  }, [location.pathname]);

  if (targets.length === 0) return null;

  return (
    <>
      {targets.map((target) =>
        createPortal(
          <CopyTableButton
            tableRef={{ current: target.table }}
            tableName={target.name}
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
          />,
          target.host,
          target.id,
        ),
      )}
    </>
  );
};

export default UniversalTableCopyAssist;