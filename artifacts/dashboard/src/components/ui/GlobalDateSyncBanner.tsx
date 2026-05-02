import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface GlobalDateSyncBannerProps {
  dateRange: { start: string; end: string };
  onSync: () => void;
  onDismiss: () => void;
}

export const GlobalDateSyncBanner: React.FC<GlobalDateSyncBannerProps> = ({
  dateRange,
  onSync,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Alert className="w-80 border-primary bg-primary/5 shadow-lg">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold">Sync Date Range?</AlertTitle>
        <AlertDescription className="text-xs mt-1">
          Date range updated. Apply this range to all other dashboard tabs?
        </AlertDescription>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setVisible(false); onDismiss(); }} className="h-8 text-xs">
            Dismiss
          </Button>
          <Button variant="default" size="sm" onClick={() => { onSync(); setVisible(false); }} className="h-8 text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Apply to All
          </Button>
        </div>
      </Alert>
    </div>
  );
};
