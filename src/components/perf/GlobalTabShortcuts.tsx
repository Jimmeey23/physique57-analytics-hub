import * as React from "react";

function isEditable(el: Element | null) {
  if (!el) return false;
  const tag = (el as HTMLElement).tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function getVisibleTablists(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[role="tablist"]'))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    });
}

function pickPrimaryTablist(): HTMLElement | null {
  const lists = getVisibleTablists();
  if (lists.length === 0) return null;
  // Prefer the tablist closest to the top of the viewport
  let best: { el: HTMLElement; score: number } | null = null;
  for (const el of lists) {
    const top = Math.abs(el.getBoundingClientRect().top);
    const score = top;
    if (!best || score < best.score) best = { el, score } as any;
  }
  return best?.el ?? null;
}

function getTabs(tablist: HTMLElement): HTMLElement[] {
  return Array.from(tablist.querySelectorAll('[role="tab"]')).filter((el): el is HTMLElement => el instanceof HTMLElement);
}

function getActiveIndex(tabs: HTMLElement[]): number {
  return Math.max(0, tabs.findIndex((t) => t.getAttribute('data-state') === 'active'));
}

function selectTab(tabs: HTMLElement[], index: number) {
  const clamped = ((index % tabs.length) + tabs.length) % tabs.length;
  const tab = tabs[clamped];
  if (tab) {
    // Prefer click so any attached handlers run properly
    (tab as HTMLButtonElement).click?.();
    tab.focus({ preventScroll: true });
  }
}

export default function GlobalTabShortcuts() {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (isEditable(active)) return;

      const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
      const list = pickPrimaryTablist();
      if (!list) return;
      const tabs = getTabs(list);
      if (tabs.length === 0) return;
      const idx = getActiveIndex(tabs);

      // Prev/Next: Cmd+Shift+[ / ] on mac, Ctrl+Shift+[ / ] on others
      const prevCombo = (isMac && e.metaKey && e.shiftKey && e.key === '[') || (!isMac && e.ctrlKey && e.shiftKey && e.key === '[');
      const nextCombo = (isMac && e.metaKey && e.shiftKey && e.key === ']') || (!isMac && e.ctrlKey && e.shiftKey && e.key === ']');
      if (prevCombo) {
        e.preventDefault();
        selectTab(tabs, idx - 1);
        return;
      }
      if (nextCombo) {
        e.preventDefault();
        selectTab(tabs, idx + 1);
        return;
      }

      // Direct: Cmd+Option+1..9 (mac) or Ctrl+Alt+1..9 (others)
      const isNumberKey = /^\d$/.test(e.key);
      const number = isNumberKey ? parseInt(e.key, 10) : NaN;
      const numberCombo = isNumberKey && ((isMac && e.metaKey && e.altKey) || (!isMac && e.ctrlKey && e.altKey));
      if (numberCombo && number >= 1) {
        e.preventDefault();
        const targetIndex = Math.min(number, tabs.length) - 1;
        selectTab(tabs, targetIndex);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown as any);
  }, []);

  return null;
}
