import React, { useState, useEffect } from 'react';
import { Info, Edit2, Save, X, Loader2, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { googleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/hooks/use-toast';

type SalesContextKey =
  | 'sales-metrics'
  | 'sales-top-bottom'
  | 'sales-mom'
  | 'sales-yoy'
  | 'sales-product'
  | 'sales-category'
  | 'sales-soldby'
  | 'sales-payment'
  | 'sales-customer'
  | 'sales-deep-insights'
  | 'sales-overview';

interface EditableInfoPopoverProps {
  context: SalesContextKey;
  locationId?: 'kwality' | 'supreme' | 'kenkere' | 'all' | string;
  className?: string;
  size?: number;
  defaultContent?: React.ReactNode[];
}

export const EditableInfoPopover: React.FC<EditableInfoPopoverProps> = ({
  context,
  locationId = 'all',
  className,
  size = 16,
  defaultContent = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load custom content from Google Drive on mount
  useEffect(() => {
    loadCustomContent();
  }, [context, locationId]);

  const loadCustomContent = async () => {
    setIsLoading(true);
    try {
      const savedContent = await googleDriveService.getPopoverContent(context, locationId);
      setCustomContent(savedContent);
      if (savedContent) {
        setContent(savedContent);
      } else {
        // Convert default content to string
        setContent(convertDefaultContentToString());
      }
    } catch (error) {
      console.error('Error loading custom content:', error);
      setContent(convertDefaultContentToString());
    } finally {
      setIsLoading(false);
    }
  };

  const convertDefaultContentToString = () => {
    if (!defaultContent || defaultContent.length === 0) {
      return 'No content available for this section.';
    }
    
    // Convert React nodes to plain text (you can customize this)
    return defaultContent.map((item, idx) => {
      if (typeof item === 'string') return item;
      if (React.isValidElement(item)) {
        // Extract text content from React elements
        const extractText = (node: any): string => {
          if (typeof node === 'string') return node;
          if (Array.isArray(node)) return node.map(extractText).join('');
          if (React.isValidElement(node) && (node.props as any).children) {
            return extractText((node.props as any).children);
          }
          return '';
        };
        return extractText(item);
      }
      return '';
    }).join('\n\n');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await googleDriveService.updatePopoverContent(context, locationId, content);
      
      if (success) {
        setCustomContent(content);
        setIsEditing(false);
        toast({
          title: "Content saved",
          description: "Your changes have been saved to Google Drive.",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error saving content",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(customContent || convertDefaultContentToString());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to restore the default content?')) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await googleDriveService.deletePopoverContent(context, locationId);
      
      if (success) {
        setCustomContent(null);
        const defaultText = convertDefaultContentToString();
        setContent(defaultText);
        setIsEditing(false);
        toast({
          title: "Content restored",
          description: "Default content has been restored.",
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error restoring content",
        description: "Failed to restore default content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Enter popover content here..."
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
            {customContent && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Restore Default
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="prose prose-slate prose-sm max-w-none">
          <div 
            className="whitespace-pre-wrap text-slate-700"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
          />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Content
          </Button>
          {customContent && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Custom content
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show summary"
          className={`${className ?? ''} inline-flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 p-1 shadow-sm hover:shadow transition relative`}
        >
          <Info width={size} height={size} />
          {customContent && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={{ top: 16, bottom: 16, left: 16, right: 16 }}
        className="z-[9999] w-[36rem] min-w-[20rem] max-w-[95vw] max-h-[80vh] overflow-y-auto overscroll-contain px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 text-sm bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-slate-200 shadow-2xl rounded-xl ring-1 ring-slate-200 focus:outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              {context.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} 
              {locationId !== 'all' && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({locationId})
                </span>
              )}
            </h3>
          </div>
          {renderContent()}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditableInfoPopover;
