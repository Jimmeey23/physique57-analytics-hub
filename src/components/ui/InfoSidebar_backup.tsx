// Archived duplicate: InfoSidebar_backup.tsx
// This backup copy was left in the repository by accident. It has been replaced with
// a small placeholder to avoid duplicate components being bundled.

export {};

  const [isSidebarMode, setIsSidebarMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(storageKey + ':sidebar');
      return raw ? JSON.parse(raw) : startAsSidebar;
    } catch (e) {
      return startAsSidebar;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(storageKey + ':content');
      return raw || `# ${context}\n\n**Location:** ${locationId}\n\nAdd your notes and insights here...`;
    } catch (e) {
      return `# ${context}\n\n**Location:** ${locationId}\n\nAdd your notes and insights here...`;
    }
  });

  const [previewMode, setPreviewMode] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(storageKey + ':width', String(width));
  }, [width, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':pinned', JSON.stringify(pinned));
  }, [pinned, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':open', JSON.stringify(open));
  }, [open, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':sidebar', JSON.stringify(isSidebarMode));
  }, [isSidebarMode, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + ':content', content);
  }, [content, storageKey]);

  // Close on outside click if not pinned
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open || pinned) return;
      const el = panelRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, pinned]);

  // Resize handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX));
      setWidth(newWidth);
    };
    const onUp = () => (draggingRef.current = false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = () => {
    draggingRef.current = true;
  };

  const handleSave = () => {
    setIsEditing(false);
    // Content is automatically saved to localStorage via useEffect
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(content);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${context}-${locationId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleMode = () => {
    setIsSidebarMode(!isSidebarMode);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-md font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n/gim, '<br/>');
  };

  // Build iframe URL: prefer explicit prop, otherwise follow a convention
  const src = iframeSrc ?? `/popovers/${encodeURIComponent(context)}/${encodeURIComponent(locationId)}`;

  // Render the trigger and the portal'ed sidebar
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          aria-label="Open info sidebar"
          title="Open info sidebar"
          onClick={() => setOpen((s) => !s)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {typeof document !== 'undefined' && createPortal(
        open ? (
          <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* translucent overlay but allow clicking through when pinned is false (we close on outside click) */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />

            <div
              ref={panelRef}
              className="absolute top-0 right-0 bottom-0 bg-white shadow-2xl pointer-events-auto flex flex-col"
              style={{ width }}
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">Info</div>
                  <div className="text-xs text-slate-500">{context} · {locationId}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    title={pinned ? 'Unpin panel' : 'Pin panel'}
                    onClick={() => setPinned((p) => !p)}
                    className="p-1 rounded hover:bg-slate-100"
                  >
                    {pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                  </button>
                  <button
                    title="Close"
                    onClick={() => setOpen(false)}
                    className="p-1 rounded hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50">
                <iframe
                  src={src}
                  title={`info-${context}-${locationId}`}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  allow="clipboard-read; clipboard-write; geolocation; microphone; camera; encrypted-media"
                />
              </div>

              <div
                onMouseDown={startDrag}
                style={{ cursor: 'col-resize' }}
                className="absolute left-0 top-0 bottom-0 w-2 flex items-center justify-center"
              >
                <div className="w-0.5 h-12 bg-slate-200/80 rounded" />
              </div>

              <div className="absolute left-0 bottom-2 -ml-10 flex items-center rotate-90">
                <div className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1 bg-white/80 rounded shadow-sm">
                  <GripHorizontal className="w-3 h-3" />
                  <span>{Math.round(width)}px</span>
                </div>
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}
    </>
  );
};

export default InfoPopover;
export { InfoPopover };
