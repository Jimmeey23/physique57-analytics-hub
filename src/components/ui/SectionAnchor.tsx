import * as React from "react";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";

type SectionAnchorProps = {
  id: string;
  label: string;
  activate?: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  enabled?: boolean; // when false, do not register this section
};

export function SectionAnchor({ id, label, activate, children, className, enabled = true }: SectionAnchorProps) {
  const { addSection, removeSection } = useSectionNavigation();

  React.useEffect(() => {
    const shouldHide = /^(filters?)$/i.test(label.trim());
    if (enabled && !shouldHide) {
      addSection({ id, label, activate, getElement: () => document.getElementById(id) });
    }
    return () => removeSection(id);
  }, [id, label, activate, addSection, removeSection, enabled]);

  return (
    <section id={id} className={"scroll-mt-24 " + (className ?? "") }>
      {children}
    </section>
  );
}

export default SectionAnchor;
