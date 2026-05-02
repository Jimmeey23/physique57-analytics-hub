import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditLog, AuditAction, AuditEntry } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  Filter, 
  Upload, 
  Search, 
  Trash2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActionIcon = ({ action }: { action: AuditAction }) => {
  switch (action) {
    case 'navigate': return <ExternalLink className="h-4 w-4" />;
    case 'export': return <Download className="h-4 w-4" />;
    case 'filter_change': return <Filter className="h-4 w-4" />;
    case 'upload': return <Upload className="h-4 w-4" />;
    case 'view_drilldown': return <Search className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const ActionBadge = ({ action }: { action: AuditAction }) => {
  const colors: Record<AuditAction, string> = {
    navigate: 'bg-blue-100 text-blue-800 border-blue-200',
    export: 'bg-green-100 text-green-800 border-green-200',
    filter_change: 'bg-amber-100 text-amber-800 border-amber-200',
    upload: 'bg-purple-100 text-purple-800 border-purple-200',
    view_drilldown: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <Badge variant="outline" className={`${colors[action]} capitalize font-medium`}>
      <ActionIcon action={action} />
      <span className="ml-1">{action.replace('_', ' ')}</span>
    </Badge>
  );
};

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { entries, clear } = useAuditLog();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((entry) => {
    const matchesAction = filter === 'all' || entry.action === filter;
    const matchesSearch = 
      entry.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.page.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Audit Log
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clear}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={entries.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          <DialogDescription>
            Activity history and data management events (Last {entries.length} actions)
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2 flex flex-wrap gap-4 items-center bg-muted/30">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search details or pages..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="navigate">Navigation</SelectItem>
              <SelectItem value="export">Exports</SelectItem>
              <SelectItem value="filter_change">Filter Changes</SelectItem>
              <SelectItem value="upload">Uploads</SelectItem>
              <SelectItem value="view_drilldown">Drilldowns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-0">
            {filteredEntries.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No audit entries found matching your filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ActionBadge action={entry.action} />
                          <span className="text-sm font-medium">{entry.detail}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                          </span>
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {entry.page}
                          </span>
                          {entry.tabKey && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                              Tab: {entry.tabKey}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
