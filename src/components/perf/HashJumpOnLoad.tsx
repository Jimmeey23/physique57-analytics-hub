import * as React from "react";
import { useLocation } from "react-router-dom";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";

// Attempts to jump to the hash target on initial load or when hash changes.
// Waits briefly for sections to register if necessary.
export default function HashJumpOnLoad() {
  const { hash } = useLocation();
  const { jumpTo } = useSectionNavigation();
  const didMount = React.useRef(false);

  React.useEffect(() => {
    // Skip automatic jump on the very first mount to avoid unintended deep-linking from stale hashes
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (!hash || hash.length < 2) return;
    const id = decodeURIComponent(hash.slice(1));
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // ~1s at 50ms intervals

    const tryJump = async () => {
      if (cancelled) return;
      const ok = await jumpTo(id, false);
      if (!ok && attempts < maxAttempts) {
        attempts += 1;
        setTimeout(tryJump, 50);
      }
    };
    // slight delay to allow route content to mount
    const t = setTimeout(tryJump, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hash, jumpTo]);

  return null;
}
