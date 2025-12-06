import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  X, 
  Download,
  FileSpreadsheet,
  FileText,
  FileImage,
  BarChart3,
  Database,
  Settings,
  Filter,
  Eye,
  Sparkles,
  Palette,
  Clock,
  Shield,
  Zap,
  FileJson,
  Calendar,
  Users,
  TrendingUp,
  PieChart,
  Target,
  Globe
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export interface ExportData {
  type: 'metrics' | 'table' | 'chart' | 'raw' | 'custom';
  name: string;
  data: any[];
  metadata?: {
    source: string;
    timestamp: string;
    filters?: any;
    aggregations?: string[];
  };
}

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableData: ExportData[];
  currentTab?: string;
  onExport: (config: ExportConfig) => Promise<void>;
}

export interface ExportConfig {
  selectedData: string[];
  format: 'xlsx' | 'csv' | 'json' | 'pdf' | 'png' | 'svg';
  options: {
    includeMetadata: boolean;
    includeCharts: boolean;
    includeRawData: boolean;
    customFilename: string;
    dateRange?: { start: string; end: string };
    compression: boolean;
    password?: string;
    theme: 'light' | 'dark' | 'auto';
    branding: boolean;
    watermark?: string;
    quality: number;
    orientation: 'portrait' | 'landscape';
  };
  scheduling?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    email: string;
  };
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  availableData,
  currentTab,
  onExport
}) => {
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportConfig['format']>('xlsx');
  const [filename, setFilename] = useState('');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [compression, setCompression] = useState(false);
  const [password, setPassword] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [branding, setBranding] = useState(true);
  const [watermark, setWatermark] = useState('');
  const [quality, setQuality] = useState([85]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [schedulingEnabled, setSchedulingEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('selection');
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    { 
      value: 'xlsx', 
      label: 'Excel Spreadsheet', 
      icon: FileSpreadsheet, 
      description: 'Rich formatting, formulas, charts',
      color: 'text-green-600 bg-green-50'
    },
    { 
      value: 'csv', 
      label: 'CSV File', 
      icon: FileText, 
      description: 'Universal compatibility, lightweight',
      color: 'text-blue-600 bg-blue-50'
    },
    { 
      value: 'json', 
      label: 'JSON Data', 
      icon: FileJson, 
      description: 'Structured data, API-ready',
      color: 'text-purple-600 bg-purple-50'
    },
    { 
      value: 'pdf', 
      label: 'PDF Report', 
      icon: FileText, 
      description: 'Professional presentation, printable',
      color: 'text-red-600 bg-red-50'
    },
    { 
      value: 'png', 
      label: 'PNG Image', 
      icon: FileImage, 
      description: 'High-quality visuals, web-ready',
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      value: 'svg', 
      label: 'SVG Vector', 
      icon: BarChart3, 
      description: 'Scalable graphics, interactive',
      color: 'text-indigo-600 bg-indigo-50'
    }
  ];

  const dataTypeIcons = {
    'metrics': TrendingUp,
    'table': Database,
    'chart': PieChart,
    'raw': FileText,
    'custom': Target
  };

  const selectedDataSize = useMemo(() => {
    return selectedData.reduce((total, dataId) => {
      const data = availableData.find(d => d.name === dataId);
      return total + (data?.data.length || 0);
    }, 0);
  }, [selectedData, availableData]);

  const estimatedFileSize = useMemo(() => {
    const baseSize = selectedDataSize * 50; // Approximate bytes per record
    const multiplier = format === 'xlsx' ? 2.5 : format === 'pdf' ? 5 : 1;
    const size = baseSize * multiplier;
    
    if (size < 1024) return `${size.toFixed(0)} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }, [selectedDataSize, format]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedData(availableData.map(d => d.name));
    } else {
      setSelectedData([]);
    }
  };

  const handleDataSelection = (dataName: string, checked: boolean) => {
    if (checked) {
      setSelectedData(prev => [...prev, dataName]);
    } else {
      setSelectedData(prev => prev.filter(name => name !== dataName));
    }
  };

  const generateFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const tabName = currentTab || 'dashboard';
    return `${tabName}_export_${timestamp}`;
  };

  const handleExport = async () => {
    if (selectedData.length === 0) return;

    setIsExporting(true);
    
    const config: ExportConfig = {
      selectedData,
      format,
      options: {
        includeMetadata,
        includeCharts,
        includeRawData,
        customFilename: filename || generateFilename(),
        compression,
        password: password || undefined,
        theme,
        branding,
        watermark: watermark || undefined,
        quality: quality[0],
        orientation
      },
      scheduling: schedulingEnabled ? {
        enabled: true,
        frequency,
        email
      } : undefined
    };

    try {
      await onExport(config);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatSupports = () => {
    const supports = {
      charts: ['pdf', 'png', 'svg', 'xlsx'],
      metadata: ['xlsx', 'json', 'pdf'],
      password: ['xlsx', 'pdf'],
      compression: ['xlsx', 'json'],
      branding: ['pdf', 'png', 'svg']
    };
    return supports;
  };

  const formatSupports = getFormatSupports();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200/50 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 -m-6 p-8 mb-6 relative overflow-hidden">
          {/* Premium background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-slate-900/20" />
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)' 
          }} />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  Advanced Data Export
                </DialogTitle>
                <p className="text-white/70 text-sm">
                  Export your data with full customization and professional formatting
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 backdrop-blur-md font-medium px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/10 backdrop-blur-sm rounded-xl p-2 transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100/50 rounded-xl p-1">
              <TabsTrigger value="selection" className="flex items-center gap-2 rounded-lg">
                <Database className="w-4 h-4" />
                Data Selection
              </TabsTrigger>
              <TabsTrigger value="format" className="flex items-center gap-2 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
                Format & Style
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2 rounded-lg">
                <Settings className="w-4 h-4" />
                Advanced Options
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 rounded-lg">
                <Eye className="w-4 h-4" />
                Preview & Export
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="selection" className="space-y-6 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Data Selection Panel */}
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-lg rounded-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="w-5 h-5 text-slate-700" />
                            Available Data Sources
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="select-all"
                              checked={selectedData.length === availableData.length}
                              onCheckedChange={handleSelectAll}
                            />
                            <Label htmlFor="select-all" className="text-sm font-medium">
                              Select All
                            </Label>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {availableData.map((data) => {
                          const IconComponent = dataTypeIcons[data.type];
                          return (
                            <div key={data.name} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200/50 hover:border-slate-300/70 hover:bg-slate-50/50 transition-all">
                              <Checkbox 
                                id={data.name}
                                checked={selectedData.includes(data.name)}
                                onCheckedChange={(checked) => handleDataSelection(data.name, checked as boolean)}
                              />
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                  <IconComponent className="w-4 h-4 text-slate-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={data.name} className="text-sm font-medium text-slate-900 cursor-pointer">
                                    {data.name}
                                  </Label>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {data.data.length.toLocaleString()} records • {data.type}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {data.metadata?.source || 'Unknown'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Selection Summary */}
                  <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border border-blue-200/50 shadow-lg rounded-xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                          <TrendingUp className="w-5 h-5" />
                          Selection Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Selected Items:</span>
                            <span className="font-semibold text-blue-900">{selectedData.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Total Records:</span>
                            <span className="font-semibold text-blue-900">{selectedDataSize.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Est. File Size:</span>
                            <span className="font-semibold text-blue-900">{estimatedFileSize}</span>
                          </div>
                        </div>
                        {selectedData.length > 0 && (
                          <div className="pt-3 border-t border-blue-200">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Selected:</h4>
                            <div className="space-y-1">
                              {selectedData.slice(0, 3).map(name => (
                                <p key={name} className="text-xs text-blue-700 truncate">• {name}</p>
                              ))}
                              {selectedData.length > 3 && (
                                <p className="text-xs text-blue-600">... and {selectedData.length - 3} more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="format" className="space-y-6 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Format Selection */}
                  <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-lg rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-slate-700" />
                        Export Format
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {formatOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <div 
                              key={option.value}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                format === option.value 
                                  ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                              }`}
                              onClick={() => setFormat(option.value as ExportConfig['format'])}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${option.color}`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900">{option.label}</h4>
                                  <p className="text-xs text-slate-600 mt-1">{option.description}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                                  format === option.value 
                                    ? 'border-blue-500 bg-blue-500' 
                                    : 'border-slate-300'
                                }`}>
                                  {format === option.value && (
                                    <div className="w-full h-full rounded-full bg-white scale-50" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Style Options */}
                  <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-lg rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="w-5 h-5 text-slate-700" />
                        Style & Appearance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="filename">Custom Filename</Label>
                        <Input 
                          id="filename"
                          placeholder={generateFilename()}
                          value={filename}
                          onChange={(e) => setFilename(e.target.value)}
                          className="bg-white/50"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Theme</Label>
                        <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                          <SelectTrigger className="bg-white/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light Theme</SelectItem>
                            <SelectItem value="dark">Dark Theme</SelectItem>
                            <SelectItem value="auto">Auto (System)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(format === 'pdf' || format === 'png' || format === 'svg') && (
                        <div className="space-y-3">
                          <Label>Orientation</Label>
                          <Select value={orientation} onValueChange={(value: any) => setOrientation(value)}>
                            <SelectTrigger className="bg-white/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="portrait">Portrait</SelectItem>
                              <SelectItem value="landscape">Landscape</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(format === 'png' || format === 'svg') && (
                        <div className="space-y-3">
                          <Label>Quality: {quality[0]}%</Label>
                          <Slider
                            value={quality}
                            onValueChange={setQuality}
                            max={100}
                            min={10}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Content Options */}
                  <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-lg rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-700" />
                        Content Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Include Metadata</Label>
                            <p className="text-xs text-slate-500">Export source info and timestamps</p>
                          </div>
                          <Switch 
                            checked={includeMetadata} 
                            onCheckedChange={setIncludeMetadata}
                            disabled={!formatSupports.metadata.includes(format)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Include Charts</Label>
                            <p className="text-xs text-slate-500">Export visual representations</p>
                          </div>
                          <Switch 
                            checked={includeCharts} 
                            onCheckedChange={setIncludeCharts}
                            disabled={!formatSupports.charts.includes(format)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Include Raw Data</Label>
                            <p className="text-xs text-slate-500">Export unprocessed source data</p>
                          </div>
                          <Switch 
                            checked={includeRawData} 
                            onCheckedChange={setIncludeRawData}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Company Branding</Label>
                            <p className="text-xs text-slate-500">Include logos and styling</p>
                          </div>
                          <Switch 
                            checked={branding} 
                            onCheckedChange={setBranding}
                            disabled={!formatSupports.branding.includes(format)}
                          />
                        </div>
                      </div>

                      {formatSupports.branding.includes(format) && (
                        <div className="space-y-3">
                          <Label htmlFor="watermark">Custom Watermark</Label>
                          <Input 
                            id="watermark"
                            placeholder="Enter watermark text"
                            value={watermark}
                            onChange={(e) => setWatermark(e.target.value)}
                            className="bg-white/50"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Security & Delivery */}
                  <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-lg rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-slate-700" />
                        Security & Delivery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>File Compression</Label>
                            <p className="text-xs text-slate-500">Reduce file size with ZIP</p>
                          </div>
                          <Switch 
                            checked={compression} 
                            onCheckedChange={setCompression}
                            disabled={!formatSupports.compression.includes(format)}
                          />
                        </div>

                        {formatSupports.password.includes(format) && (
                          <div className="space-y-3">
                            <Label htmlFor="password">Password Protection</Label>
                            <Input 
                              id="password"
                              type="password"
                              placeholder="Optional password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="bg-white/50"
                            />
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="space-y-0.5">
                              <Label>Scheduled Export</Label>
                              <p className="text-xs text-slate-500">Automate regular exports</p>
                            </div>
                            <Switch 
                              checked={schedulingEnabled} 
                              onCheckedChange={setSchedulingEnabled}
                            />
                          </div>

                          {schedulingEnabled && (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <Label>Frequency</Label>
                                <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                                  <SelectTrigger className="bg-white/50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-3">
                                <Label htmlFor="email">Email Address</Label>
                                <Input 
                                  id="email"
                                  type="email"
                                  placeholder="your@email.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="bg-white/50"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Export Preview */}
                  <div className="lg:col-span-2">
                    <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border border-slate-200/50 shadow-lg rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="w-5 h-5 text-slate-700" />
                          Export Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-6 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-300">
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                                {formatOptions.find(f => f.value === format)?.icon && (
                                  React.createElement(formatOptions.find(f => f.value === format)!.icon, {
                                    className: "w-8 h-8 text-white"
                                  })
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">
                                  {filename || generateFilename()}.{format}
                                </h3>
                                <p className="text-sm text-slate-600">
                                  {formatOptions.find(f => f.value === format)?.label}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <p className="font-medium text-slate-700">Content</p>
                              <div className="space-y-1 text-slate-600">
                                <p>• {selectedData.length} data sources</p>
                                <p>• {selectedDataSize.toLocaleString()} total records</p>
                                {includeCharts && <p>• Visual charts included</p>}
                                {includeMetadata && <p>• Metadata included</p>}
                                {includeRawData && <p>• Raw data included</p>}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="font-medium text-slate-700">Options</p>
                              <div className="space-y-1 text-slate-600">
                                <p>• {theme} theme</p>
                                {password && <p>• Password protected</p>}
                                {compression && <p>• Compressed file</p>}
                                {branding && <p>• Company branding</p>}
                                {schedulingEnabled && <p>• Scheduled delivery</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Export Action */}
                  <div>
                    <Card className="bg-gradient-to-br from-green-50 via-white to-green-50 border border-green-200/50 shadow-lg rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                          <Zap className="w-5 h-5" />
                          Ready to Export
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3 text-sm text-green-700">
                          <div className="flex justify-between">
                            <span>File Size:</span>
                            <span className="font-semibold">{estimatedFileSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Format:</span>
                            <span className="font-semibold">{format.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Time:</span>
                            <span className="font-semibold">~{Math.max(1, Math.floor(selectedDataSize / 1000))}s</span>
                          </div>
                        </div>

                        <Button 
                          onClick={handleExport}
                          disabled={selectedData.length === 0 || isExporting}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {isExporting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Exporting...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Download className="w-4 h-4" />
                              Export Data
                            </div>
                          )}
                        </Button>

                        {schedulingEnabled && (
                          <Button variant="outline" className="w-full rounded-xl">
                            <Clock className="w-4 h-4 mr-2" />
                            Schedule Export
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};