import * as React from "react";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";
import { useLocation } from "react-router-dom";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export default function AutoRegisterHeadings() {
  const { sections, addSection, removeSection } = useSectionNavigation();
  const location = useLocation();

  const register = React.useCallback(() => {
    // Build a set of existing ids registered by SectionAnchor or others
    const existing = new Set(sections.map((s) => s.id));

    // Find headings in main content
    const root = (document.querySelector("main") || document.body) as HTMLElement;
    // Ignore headings inside tablists or tab triggers, accordions, and filter regions
    const nodes = Array.from(root.querySelectorAll("h2, h3")) as HTMLElement[];
    const candidates = nodes.filter((el) => {
      // Opt-out via data attribute
      if (el.hasAttribute('data-nav-disable')) return false;
      if (el.closest('[data-nav-skip-scan]')) return false;
      const text = (el.getAttribute('data-nav-label') || el.textContent || '').trim().toLowerCase();
      if (!text) return false;
      if (text.length < 3) return false;
      if (/^\d+$/.test(text)) return false;
      // Skip generic or UI labels
      if (["filters", "filter", "tabs", "dashboard", "navigation"].includes(text)) return false;
      // Skip headings within tab headers or tablist containers
      const withinTabUi = el.closest('[role="tablist"], [data-radix-tabs], .location-tabs');
      if (withinTabUi) return false;
      // Skip inside elements marked as filters or toolbars
      const withinFilters = el.closest('[data-role="filters"], .filters, [data-filters], [data-toolbar]');
      if (withinFilters) return false;
      // Skip headings inside sections whose id suggests filters or tabs
      const ancestorSection = el.closest('section');
      if (ancestorSection && ancestorSection.id) {
        const id = ancestorSection.id.toLowerCase();
        if (id.includes('filter') || id.includes('tab')) return false;
      }
      return true;
    });

    for (const el of candidates) {
  const label = (el.getAttribute('data-nav-label') || el.textContent || '').trim();
      if (!label) continue;
      let id = el.id || slugify(label);
      if (!id) continue;
      // ensure id uniqueness in document if setting
      if (!el.id) {
        let unique = id;
        let i = 1;
        while (document.getElementById(unique)) {
          unique = `${id}-${i++}`;
        }
        el.id = unique;
        id = unique;
      }
      if (existing.has(id)) continue; // respect explicit SectionAnchor/registrations
      addSection({ id, label, getElement: () => document.getElementById(id) });
    }
  }, [sections, addSection]);

  React.useEffect(() => {
    const t = setTimeout(register, 150);
    // Also observe DOM changes for a short period to catch late mounts
    const obs = new MutationObserver(() => register());
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(t);
      obs.disconnect();
    };
  }, [location.pathname, register]);

  return null;
}
