import * as React from "react";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";

type SectionAnchorProps = {
  id: string;
  label: string;
  activate?: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

export function SectionAnchor({ id, label, activate, children, className }: SectionAnchorProps) {
  const { addSection, removeSection } = useSectionNavigation();

  // Memoize the activate function to prevent unnecessary re-renders
  const stableActivate = React.useCallback(activate || (() => {}), [activate]);

  React.useEffect(() => {
    addSection({ id, label, activate: stableActivate, getElement: () => document.getElementById(id) });
    return () => removeSection(id);
  }, [id, label, stableActivate]); // Remove addSection and removeSection from deps as they're memoized

  return (
    <section id={id} className={"scroll-mt-24 " + (className ?? "") }>
      {children}
    </section>
  );
}

export default SectionAnchor;
