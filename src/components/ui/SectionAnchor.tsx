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

  React.useEffect(() => {
    addSection({ id, label, activate, getElement: () => document.getElementById(id) });
    return () => removeSection(id);
  }, [id, label, activate, addSection, removeSection]);

  return (
    <section id={id} className={"scroll-mt-24 " + (className ?? "") }>
      {children}
    </section>
  );
}

export default SectionAnchor;
