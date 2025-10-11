import * as React from "react";

export default function ForceTopOnLoad() {
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    try {
      if ('scrollRestoration' in history) {
        // Avoid browser restoring scroll position or auto-scrolling to anchors
        (history as any).scrollRestoration = 'manual';
      }
    } catch {}

    try {
      // If a hash is present on initial load, strip it so the browser doesn't auto-jump
      if (window.location.hash) {
        const url = window.location.pathname + window.location.search;
        history.replaceState(null, '', url);
      }
    } catch {}

    // Force scroll to top now and after first paints to override any layout-induced shifts
    const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    scrollTop();
    requestAnimationFrame(() => {
      scrollTop();
      setTimeout(scrollTop, 120);
    });
  }, []);

  return null;
}
