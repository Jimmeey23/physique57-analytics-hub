import React, { useState, useEffect, useCallback } from 'react';
import { 
  listOfflineDatasets, 
  saveOfflineDatasetRows, 
  deleteOfflineDataset, 
  parseSpreadsheetFileToRows 
} from '@/lib/offlineDataStore';
import { 
  OFFLINE_DATASET_KEYS, 
  OFFLINE_DATASET_LABELS, 
  OfflineDatasetSummary,
  OfflineDatasetKey
} from '@/types/offlineData';
import { DashboardMotionHero } from '@/components/ui/DashboardMotionHero';
import { Footer } from '@/components/ui/footer';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { logAuditEvent } from '@/hooks/useAuditLog';
import { 
  Upload, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  RefreshCw,
  HardDrive,
  Info,
  Clock,
  History
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function DataManagement() {
  const [datasets, setDatasets] = useState<OfflineDatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const summaries = await listOfflineDatasets();
      setDatasets(summaries);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dataset status.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleFileUpload = async (key: OfflineDatasetKey, file: File) => {
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const rows = await parseSpreadsheetFileToRows(file);
      await saveOfflineDatasetRows(key, rows, 'upload', file.name);
      
      logAuditEvent('upload', `Uploaded ${file.name} to ${OFFLINE_DATASET_LABELS[key]}`, '/data-management');
      
      toast({
        title: 'Upload Successful',
        description: `Imported ${rows.length - 1} rows to ${OFFLINE_DATASET_LABELS[key]}.`,
      });
      
      // Notify other components (like DataFreshnessBar)
      window.dispatchEvent(new CustomEvent('p57-datasets-updated'));
      fetchDatasets();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error during parsing.',
        variant: 'destructive',
      });
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleClear = async (key: OfflineDatasetKey) => {
    if (!confirm(`Are you sure you want to clear the ${OFFLINE_DATASET_LABELS[key]} dataset? This will remove all local data for this category.`)) {
      return;
    }

    try {
      await deleteOfflineDataset(key);
      logAuditEvent('upload', `Cleared ${OFFLINE_DATASET_LABELS[key]} dataset`, '/data-management');
      
      toast({
        title: 'Dataset Cleared',
        description: `Local data for ${OFFLINE_DATASET_LABELS[key]} has been removed.`,
      });
      
      window.dispatchEvent(new CustomEvent('p57-datasets-updated'));
      fetchDatasets();
    } catch (error) {
      toast({
        title: 'Clear Failed',
        description: 'Failed to delete the dataset.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name.toLowerCase();
      
      // Attempt to auto-detect the dataset by filename
      let targetKey: OfflineDatasetKey | null = null;
      
      if (fileName.includes('sales')) targetKey = 'sales';
      else if (fileName.includes('session')) targetKey = 'sessions';
      else if (fileName.includes('payroll')) targetKey = 'payroll';
      else if (fileName.includes('new') || fileName.includes('client')) targetKey = 'new-clients';
      else if (fileName.includes('lead')) targetKey = 'leads';
      else if (fileName.includes('checkin')) targetKey = 'checkins';
      else if (fileName.includes('expir')) targetKey = 'expirations';

      if (targetKey) {
        try {
          const rows = await parseSpreadsheetFileToRows(file);
          await saveOfflineDatasetRows(targetKey, rows, 'upload', file.name);
          successCount++;
        } catch (e) {
          console.error(`Failed to auto-upload ${file.name}:`, e);
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      logAuditEvent('upload', `Bulk uploaded ${successCount} files`, '/data-management');
      toast({
        title: 'Bulk Upload Complete',
        description: `Successfully imported ${successCount} files. ${failCount > 0 ? `${failCount} files could not be matched.` : ''}`,
      });
      window.dispatchEvent(new CustomEvent('p57-datasets-updated'));
      fetchDatasets();
    } else if (failCount > 0) {
      toast({
        title: 'Bulk Upload Failed',
        description: 'Could not match any files to known datasets. Please upload individually.',
        variant: 'destructive',
      });
    }
    
    // Reset input
    event.target.value = '';
  };

  const totalRows = datasets.reduce((sum, d) => sum + d.rowCount, 0);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <DashboardMotionHero
        title="Data Management"
        subtitle="Manage your local datasets, upload CSVs, and monitor data health."
        metrics={[
          { label: 'Active Datasets', value: datasets.filter(d => d.available).length.toString() },
          { label: 'Total Records', value: totalRows.toLocaleString() },
          { label: 'Storage Mode', value: 'Local IndexedDB' }
        ]}
        icons={[
          { Icon: Database, color: '#3b82f6' },
          { Icon: HardDrive, color: '#10b981' }
        ]}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Bulk Upload Section */}
        <section className="mb-10">
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
            <CardContent className="py-10 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Bulk Upload Datasets</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                Drag and drop multiple CSV or Excel files. We'll automatically match them to the correct datasets based on filenames.
              </p>
              <div className="flex gap-4">
                <Button className="relative overflow-hidden group">
                  <Upload className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-1" />
                  Select Files
                  <input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleBulkUpload}
                    accept=".csv, .xlsx, .xls"
                  />
                </Button>
                <Button variant="outline" onClick={fetchDatasets}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dataset List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <Card key={dataset.key} className={cn(
              "overflow-hidden transition-all duration-300 hover:shadow-md",
              dataset.available ? "border-slate-200" : "border-dashed border-slate-300 opacity-80"
            )}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {dataset.label}
                    </CardTitle>
                    <CardDescription>
                      {dataset.available 
                        ? `${dataset.rowCount.toLocaleString()} records stored`
                        : "No local data found"}
                    </CardDescription>
                  </div>
                  {dataset.available ? (
                    <Badge variant="outline" className={cn(
                      "capitalize",
                      dataset.source === 'remote' ? "bg-green-50 text-green-700 border-green-200" :
                      dataset.source === 'upload' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {dataset.source}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500">Missing</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="space-y-4">
                  {/* Status Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1 p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-muted-foreground uppercase font-semibold text-[10px]">Updated</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dataset.updatedAt ? formatDistanceToNow(parseISO(dataset.updatedAt), { addSuffix: true }) : 'Never'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-muted-foreground uppercase font-semibold text-[10px]">Filename</span>
                      <span className="font-medium truncate" title={dataset.fileName || 'N/A'}>
                        {dataset.fileName || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {uploading[dataset.key] && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span>Parsing Spreadsheet...</span>
                        <span>Working</span>
                      </div>
                      <Progress value={85} className="h-1 animate-pulse" />
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0 flex gap-2">
                <Button 
                  className="flex-1 relative overflow-hidden h-9" 
                  variant="outline"
                  disabled={uploading[dataset.key]}
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {dataset.available ? 'Replace' : 'Upload'}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(dataset.key, file);
                    }}
                    accept=".csv, .xlsx, .xls"
                  />
                </Button>
                {dataset.available && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleClear(dataset.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Info Panel */}
        <section className="mt-12 p-6 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Info className="h-32 w-32" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" />
              Dataset History & Storage Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-400">
              <div className="space-y-3">
                <p>
                  All data you upload is stored <strong className="text-white">locally in your browser</strong> using IndexedDB. This ensures fast performance and offline access while keeping sensitive data on your machine.
                </p>
                <div className="flex items-center gap-2 py-2 px-3 rounded bg-slate-800/50 border border-slate-700 text-xs">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Browser storage limit: Approximately 50MB-250MB (plenty for CSVs)</span>
                </div>
              </div>
              <div className="space-y-3">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Supported formats: <code className="text-blue-300">.csv</code>, <code className="text-blue-300">.xlsx</code>, <code className="text-blue-300">.xls</code></li>
                  <li>Maximum suggested file size: 10MB per dataset</li>
                  <li>Clear a dataset to revert to bundled demo data</li>
                  <li>History of uploads is tracked in the <strong className="text-white">Audit Log</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
