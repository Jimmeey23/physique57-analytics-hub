import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNavigate, useLocation } from "react-router-dom";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";

type QuickLink = {
  label: string;
  to: string;
  keywords?: string[];
  shortcut?: string; // e.g., "G S" for Go Sales
};

const pages: { group: string; items: QuickLink[] }[] = [
  {
    group: "Dashboards",
    items: [
      { label: "Home", to: "/", keywords: ["index", "home", "landing"] },
      { label: "Executive Summary", to: "/executive-summary", keywords: ["exec", "summary"] },
      { label: "Sales Analytics", to: "/sales-analytics", keywords: ["revenue", "sales", "kpi"] },
      { label: "Funnel & Leads", to: "/funnel-leads", keywords: ["leads", "funnel", "mql"] },
      { label: "Client Retention", to: "/client-retention", keywords: ["retention", "churn"] },
      { label: "Trainer Performance", to: "/trainer-performance", keywords: ["trainer", "coach", "instructor"] },
      { label: "Class Attendance", to: "/class-attendance", keywords: ["attendance", "checkins"] },
      { label: "Class Formats Comparison", to: "/class-formats", keywords: ["formats", "comparison", "barre", "cycle"] },
      { label: "Discounts & Promotions", to: "/discounts-promotions", keywords: ["discounts", "promotions", "codes"] },
      { label: "Sessions", to: "/sessions", keywords: ["bookings", "classes"] },
      { label: "PowerCycle vs Barre", to: "/powercycle-vs-barre", keywords: ["cycle", "barre", "compare"] },
      { label: "Expiration Analytics", to: "/expiration-analytics", keywords: ["expirations", "passes"] },
      { label: "Late Cancellations", to: "/late-cancellations", keywords: ["late", "cxl", "cancellations"] },
    ],
  },
  {
    group: "Demos",
    items: [
      { label: "Hero Demo", to: "/hero-demo", keywords: ["hero", "motion"] },
      { label: "Gemini AI Demo", to: "/gemini-ai-demo", keywords: ["gemini", "ai"] },
      { label: "Gemini Test", to: "/gemini-test", keywords: ["gemini", "test"] },
    ],
  },
];

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { sections, jumpTo } = useSectionNavigation();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      // Cmd/Ctrl + K to open
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Press "/" to quick open when not typing in an input/textarea
      if (e.key === "/") {
        const activeTag = (document.activeElement?.tagName || "").toLowerCase();
        if (activeTag !== "input" && activeTag !== "textarea") {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type to jump… (Try: sales, retention, class)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {pages.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem key={item.to} value={`${item.label} ${item.keywords?.join(" ") ?? ""}`} onSelect={() => go(item.to)}>
                {item.label}
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {sections.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="This page">
              {sections.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.label} ${s.id}`}
                  onSelect={() => {
                    setOpen(false);
                    jumpTo(s.id);
                  }}
                >
                  {s.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Tips">
          <CommandItem disabled>
            Press ⌘/Ctrl+K to open anywhere
          </CommandItem>
          <CommandItem disabled>
            Press / to search quickly
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default GlobalCommandPalette;
