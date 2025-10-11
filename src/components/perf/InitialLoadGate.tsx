import * as React from "react";
import { createPortal } from "react-dom";
import { UniversalLoader } from "@/components/ui/UniversalLoader";

type Ctx = {
  markRouteReady: () => void;
};

const InitialLoadContext = React.createContext<Ctx | null>(null);

export function useInitialLoad() {
  const ctx = React.useContext(InitialLoadContext);
  if (!ctx) throw new Error("useInitialLoad must be used within InitialLoadGate");
  return ctx;
}

export default function InitialLoadGate({ children }: { children: React.ReactNode }) {
  const [progressDone, setProgressDone] = React.useState(false);
  const [routeReady, setRouteReady] = React.useState(false);
  const [hasCompletedOnce, setHasCompletedOnce] = React.useState(false);

  // Only show on first app load before both conditions are met
  const showOverlay = !hasCompletedOnce && !(progressDone && routeReady);

  const onComplete = React.useCallback(() => setProgressDone(true), []);
  const markRouteReady = React.useCallback(() => setRouteReady(true), []);

  React.useEffect(() => {
    if (!hasCompletedOnce && progressDone && routeReady) {
      // Slight delay for a smooth fade-out
      const t = setTimeout(() => setHasCompletedOnce(true), 150);
      return () => clearTimeout(t);
    }
  }, [progressDone, routeReady, hasCompletedOnce]);

  return (
    <InitialLoadContext.Provider value={{ markRouteReady }}>
      {children}
      {showOverlay && createPortal(
        <div className="fixed inset-0 z-[70] bg-white">
          <UniversalLoader variant="default" subtitle="Loading page..." onComplete={onComplete} />
        </div>,
        document.body
      )}
    </InitialLoadContext.Provider>
  );
}
