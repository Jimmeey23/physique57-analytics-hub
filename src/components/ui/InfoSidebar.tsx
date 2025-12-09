import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Info, 
  Pin, 
  PinOff, 
  X, 
  GripHorizontal, 
  Edit2, 
  Save, 
  Eye, 
  Copy, 
  Download, 
  Maximize2 
} from 'lucide-react';
import { Button } from './button';
import { Textarea } from './textarea';

interface InfoPopoverProps {
  context: string;
  locationId: string;
  iframeSrc?: string;
  startAsSidebar?: boolean;
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

const InfoPopover: React.FC<InfoPopoverProps> = ({
  context,
  locationId,
  iframeSrc,
  startAsSidebar = true
}) => {
  const storageKey = `info-sidebar-${context}-${locationId}`;

  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':width');
    return saved ? parseInt(saved, 10) : 450;
  });
  const [pinned, setPinned] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':pinned');
    return saved ? JSON.parse(saved) : false;
  });

  const [isSidebarMode, setIsSidebarMode] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':sidebar');
    return saved ? JSON.parse(saved) : startAsSidebar;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(() => {
    const saved = localStorage.getItem(storageKey + ':content');
    if (saved) {
      return saved;
    } else {
      return `# ${context}\n\n**Location:** ${locationId}\n\nAdd your notes and insights here...`;
    }
  });

  const [previewMode, setPreviewMode] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // Persistence effects
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

  // Build iframe URL: prefer explicit prop, otherwise map to existing HTML files
  const getIframeSrc = () => {
    if (iframeSrc) return iframeSrc;
    
    // Map context and locationId to existing HTML files
    if (context === 'sales-overview') {
      if (locationId === 'kwality' || locationId === 'kh') {
        return '/popovers/sales-kh.html';
      }
      if (locationId === 'supreme' || locationId === 'shq') {
        return '/popovers/sales-shq.html';
      }
      // For 'all' or other locations, use the new structure
      return `/popovers/sales-overview/${locationId}.html`;
    }
    
    // Try the directory structure for other contexts
    const contextMappings: Record<string, string> = {
      'class-attendance-overview': 'class-attendance-overview',
      'class-formats-overview': 'class-formats-overview', 
      'funnel-leads-overview': 'funnel-leads-overview',
      'client-retention-overview': 'client-retention-overview',
      'patterns-trends': 'patterns-trends',
      'outlier-analysis-overview': 'outlier-analysis-overview'
    };
    
    const mappedContext = contextMappings[context] || context;
    const directoryPath = `/popovers/${mappedContext}/${encodeURIComponent(locationId)}.html`;
    
    // Always return the directory path - if file doesn't exist, user can edit content instead
    return directoryPath;
  };

  const src = getIframeSrc();

  const renderSidebar = () => (
    <div
      ref={panelRef}
      className="absolute top-0 right-0 bottom-0 bg-white shadow-2xl border-l border-gray-200 pointer-events-auto flex flex-col"
      style={{ width }}
    >
      {/* Enhanced Header with Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-800">
            {context} - {locationId}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(!isEditing)}
            className="h-7 w-7 p-0"
            title="Edit content"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPreviewMode(!previewMode)}
            className="h-7 w-7 p-0"
            title="Toggle preview"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
            title="Copy content"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-7 w-7 p-0"
            title="Download content"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMode}
            className="h-7 w-7 p-0"
            title="Toggle modal view"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPinned(!pinned)}
            className={`h-7 w-7 p-0 ${pinned ? 'bg-blue-100' : ''}`}
            title={pinned ? 'Unpin panel' : 'Pin panel'}
          >
            <Pin className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-7 w-7 p-0"
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Editing Mode</span>
              <Button size="sm" onClick={handleSave} className="flex items-center space-x-1">
                <Save className="h-3 w-3" />
                <span>Save</span>
              </Button>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none font-mono text-sm"
              placeholder="Enter your content here... (Supports basic Markdown)"
            />
          </div>
        ) : (
          <div className="h-full">
            {previewMode ? (
              <div className="p-4 prose max-w-none h-full overflow-auto">
                <div dangerouslySetInnerHTML={{
                  __html: renderMarkdown(content || 'No content yet. Click the edit button to add content.')
                }} />
              </div>
            ) : (
              <iframe
                src={src}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-forms"
                title={`Info for ${context} - ${locationId}`}
              />
            )}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize bg-transparent hover:bg-blue-200 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag();
        }}
      />

      {/* Width Indicator */}
      <div className="absolute left-0 bottom-2 -ml-10 flex items-center rotate-90">
        <div className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1 bg-white/80 rounded shadow-sm">
          <GripHorizontal className="w-3 h-3" />
          <span>{Math.round(width)}px</span>
        </div>
      </div>
    </div>
  );

  const renderModal = () => (
    <div className="fixed inset-0 z-[9999] pointer-events-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-8">
      <div 
        ref={panelRef}
        className="bg-white rounded-lg shadow-2xl flex flex-col max-w-4xl w-full h-full max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {context} - {locationId}
          </h3>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 w-7 p-0"
              title="Edit content"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewMode(!previewMode)}
              className="h-7 w-7 p-0"
              title="Toggle preview"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-7 w-7 p-0"
              title="Copy content"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="h-7 w-7 p-0"
              title="Download content"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMode}
              className="h-7 w-7 p-0"
              title="Toggle sidebar view"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-7 w-7 p-0"
              title="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <div className="h-full flex flex-col p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Editing Mode</span>
                <Button size="sm" onClick={handleSave} className="flex items-center space-x-1">
                  <Save className="h-3 w-3" />
                  <span>Save</span>
                </Button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
                placeholder="Enter your content here... (Supports basic Markdown)"
              />
            </div>
          ) : (
            <div className="h-full">
              {previewMode ? (
                <div className="p-6 prose max-w-none h-full overflow-auto">
                  <div dangerouslySetInnerHTML={{
                    __html: renderMarkdown(content || 'No content yet. Click the edit button to add content.')
                  }} />
                </div>
              ) : (
                <iframe
                  src={src}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms"
                  title={`Info for ${context} - ${locationId}`}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render the trigger and the portal'ed sidebar/modal
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          aria-label="Open info panel"
          title="Open info panel"
          onClick={() => setOpen((s) => !s)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {typeof document !== 'undefined' && createPortal(
        open ? (
          <div className="fixed inset-0 z-[9999] pointer-events-none">
            {isSidebarMode ? (
              <>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
                {renderSidebar()}
              </>
            ) : (
              renderModal()
            )}
          </div>
        ) : null,
        document.body
      )}
    </>
  );
};

export default InfoPopover;
export { InfoPopover };