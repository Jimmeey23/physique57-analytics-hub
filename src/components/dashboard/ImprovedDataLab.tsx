import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Settings,
  Table2,
  BarChart3,
  Save,
  Plus,
  Trash2,
  Play,
  Edit3,
  Grid3X3,
  FileSpreadsheet,
  Wand2,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowUp,
  ArrowDown,
  X,
  GripVertical,
  Copy,
  Check,
  MousePointer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type RowData = Record<string, any>;

interface DataSource {
  key: string;
  label: string;
  data: RowData[];
  fields: Field[];
}

interface Field {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  source: string;
  sampleValues: string[];
}

interface PivotConfig {
  name: string;
  dataSources: string[];
  rows: string[];
  columns: string[];
  values: ValueConfig[];
  filters: FilterConfig[];
  sorting: SortConfig[];
  formatting: FormatConfig;
}

interface ValueConfig {
  id: string;
  field: string;
  label: string;
  aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'countUnique';
  format: 'number' | 'currency' | 'percentage';
}

interface FilterConfig {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
  value: string;
  enabled: boolean;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface FormatConfig {
  theme: 'modern' | 'classic' | 'minimal';
  showHeaders: boolean;
  showGridLines: boolean;
  alternateRows: boolean;
  compactMode: boolean;
}

interface SavedTable {
  id: string;
  name: string;
  config: PivotConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface ImprovedDataLabProps {
  dataSources: Record<string, RowData[]>;
}

const STORAGE_KEYS = {
  TABLES: 'datalab-saved-tables-v3',
  ACTIVE: 'datalab-active-table-v3',
};

export const ImprovedDataLab: React.FC<ImprovedDataLabProps> = ({ dataSources }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('builder');
  const [savedTables, setSavedTables] = useState<SavedTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [headerEditValue, setHeaderEditValue] = useState('');
  const [draggedField, setDraggedField] = useState<Field | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dataSources: true,
    fields: true,
    config: true,
  });

  // Initialize default table
  const [currentConfig, setCurrentConfig] = useState<PivotConfig>({
    name: 'Untitled Table',
    dataSources: Object.keys(dataSources),
    rows: [],
    columns: [],
    values: [],
    filters: [],
    sorting: [],
    formatting: {
      theme: 'modern',
      showHeaders: true,
      showGridLines: true,
      alternateRows: true,
      compactMode: false,
    },
  });

  // Process data sources into standardized format
  const processedDataSources = useMemo((): DataSource[] => {
    return Object.entries(dataSources).map(([key, data]) => {
      const sampleRow = data[0] || {};
      const fields: Field[] = Object.keys(sampleRow).map(fieldName => {
        const sampleValues = data
          .slice(0, 10)
          .map(row => String(row[fieldName] || ''))
          .filter(v => v.length > 0);
        
        const fieldType = inferFieldType(sampleValues);
        
        return {
          name: fieldName,
          label: formatFieldLabel(fieldName),
          type: fieldType,
          source: key,
          sampleValues: sampleValues.slice(0, 3),
        };
      });

      return {
        key,
        label: formatSourceLabel(key),
        data,
        fields,
      };
    });
  }, [dataSources]);

  // All available fields from all sources
  const allFields = useMemo(() => {
    return processedDataSources.flatMap(source => source.fields);
  }, [processedDataSources]);

  // Generate preview data based on current config
  const previewData = useMemo(() => {
    if (currentConfig.rows.length === 0 && currentConfig.columns.length === 0) {
      return { headers: [], rows: [], summary: 'Configure rows, columns, and values to see preview' };
    }

    // This would be the actual pivot table logic
    // For now, return a simple preview
    return {
      headers: ['Sample Header 1', 'Sample Header 2', 'Sample Value'],
      rows: [
        ['Row 1', 'Col 1', '100'],
        ['Row 2', 'Col 2', '200'],
      ],
      summary: `${2} rows × ${3} columns`,
    };
  }, [currentConfig]);

  // Load saved tables on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (saved) {
      try {
        const tables = JSON.parse(saved);
        setSavedTables(tables);
        
        const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE);
        if (activeId && tables.find((t: SavedTable) => t.id === activeId)) {
          setActiveTableId(activeId);
          const activeTable = tables.find((t: SavedTable) => t.id === activeId);
          if (activeTable) {
            setCurrentConfig(activeTable.config);
          }
        }
      } catch (error) {
        console.error('Failed to load saved tables:', error);
      }
    }
  }, []);

  // Save tables when they change
  const saveTables = (tables: SavedTable[]) => {
    setSavedTables(tables);
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  };

  const createNewTable = () => {
    const newTable: SavedTable = {
      id: `table_${Date.now()}`,
      name: `Table ${savedTables.length + 1}`,
      config: {
        name: `Table ${savedTables.length + 1}`,
        dataSources: Object.keys(dataSources),
        rows: [],
        columns: [],
        values: [],
        filters: [],
        sorting: [],
        formatting: {
          theme: 'modern',
          showHeaders: true,
          showGridLines: true,
          alternateRows: true,
          compactMode: false,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTables = [...savedTables, newTable];
    saveTables(updatedTables);
    setActiveTableId(newTable.id);
    setCurrentConfig(newTable.config);
    localStorage.setItem(STORAGE_KEYS.ACTIVE, newTable.id);
    
    toast({
      title: "New table created",
      description: "You can now configure your pivot table settings.",
    });
  };

  const updateCurrentConfig = (updates: Partial<PivotConfig>) => {
    const newConfig = { ...currentConfig, ...updates };
    setCurrentConfig(newConfig);

    if (activeTableId) {
      const updatedTables = savedTables.map(table =>
        table.id === activeTableId
          ? { ...table, config: newConfig, updatedAt: new Date() }
          : table
      );
      saveTables(updatedTables);
    }
  };

  const addField = (field: Field, target: 'rows' | 'columns' | 'values') => {
    if (target === 'values') {
      const valueConfig: ValueConfig = {
        id: `value_${Date.now()}`,
        field: field.name,
        label: field.label,
        aggregation: field.type === 'number' ? 'sum' : 'count',
        format: field.type === 'number' ? 'number' : 'number',
      };
      updateCurrentConfig({
        values: [...currentConfig.values, valueConfig],
      });
    } else {
      updateCurrentConfig({
        [target]: [...currentConfig[target], field.name],
      });
    }
  };

  const removeField = (field: string, target: 'rows' | 'columns') => {
    updateCurrentConfig({
      [target]: currentConfig[target].filter(f => f !== field),
    });
  };

  const removeValue = (valueId: string) => {
    updateCurrentConfig({
      values: currentConfig.values.filter(v => v.id !== valueId),
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const startEditingHeader = (index: number, currentValue: string) => {
    setEditingHeader(index);
    setHeaderEditValue(currentValue);
  };

  const saveHeaderEdit = () => {
    if (editingHeader !== null) {
      // Here you would update the actual header in your configuration
      toast({
        title: "Header updated",
        description: `Header changed to "${headerEditValue}"`,
      });
      setEditingHeader(null);
      setHeaderEditValue('');
    }
  };

  const cancelHeaderEdit = () => {
    setEditingHeader(null);
    setHeaderEditValue('');
  };

  const handleDragStart = (field: Field) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToZone = (e: React.DragEvent, zone: 'rows' | 'columns' | 'values') => {
    e.preventDefault();
    if (draggedField) {
      addField(draggedField, zone);
      setDraggedField(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Wand2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Custom Data Lab</h1>
                <p className="text-sm text-gray-500">Build pivot tables and analytics across your data sources</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {savedTables.length} saved tables
              </Badge>
              <Button onClick={createNewTable} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Table
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-120px)]">
        
        {/* Left Sidebar - Configuration */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Saved Tables */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Saved Tables</h3>
              <Button onClick={createNewTable} size="sm" variant="outline" className="h-7 px-2">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {savedTables.map(table => (
                <button
                  key={table.id}
                  onClick={() => {
                    setActiveTableId(table.id);
                    setCurrentConfig(table.config);
                    localStorage.setItem(STORAGE_KEYS.ACTIVE, table.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    table.id === activeTableId
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{table.config.name}</span>
                    {table.id === activeTableId && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(!isEditing);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Table Name */}
          {activeTableId && (
            <div className="p-4 border-b border-gray-200">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={currentConfig.name}
                    onChange={(e) => updateCurrentConfig({ name: e.target.value })}
                    className="h-8"
                    placeholder="Table name"
                  />
                  <div className="flex gap-1">
                    <Button onClick={() => setIsEditing(false)} size="sm" className="h-7">Save</Button>
                    <Button onClick={() => setIsEditing(false)} size="sm" variant="outline" className="h-7">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{currentConfig.name}</h4>
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Configuration Sections */}
          <div className="flex-1 overflow-y-auto">
            
            {/* Data Sources */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('dataSources')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Data Sources</span>
                </div>
                {expandedSections.dataSources ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.dataSources && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-2">
                      {processedDataSources.map(source => (
                        <div key={source.key} className="p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{source.label}</span>
                            <Badge variant="secondary" className="text-xs">
                              {source.data.length} rows
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {source.fields.length} fields available
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Available Fields */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('fields')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Available Fields</span>
                </div>
                {expandedSections.fields ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.fields && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 max-h-64 overflow-y-auto">
                      <div className="space-y-1">
                        {allFields.map((field, index) => (
                          <div
                            key={`${field.source}-${field.name}-${index}`}
                            draggable
                            onDragStart={() => handleDragStart(field)}
                            className="group p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-3 h-3 text-gray-400" />
                                <span className="text-xs font-medium text-gray-700 truncate">
                                  {field.label}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  field.type === 'number' ? 'default' :
                                  field.type === 'date' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                {field.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">{field.source}</div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => addField(field, 'rows')}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                              >
                                + Row
                              </Button>
                              <Button
                                onClick={() => addField(field, 'columns')}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                              >
                                + Col
                              </Button>
                              <Button
                                onClick={() => addField(field, 'values')}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
                              >
                                + Val
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pivot Configuration */}
            <div>
              <button
                onClick={() => toggleSection('config')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Pivot Configuration</span>
                </div>
                {expandedSections.config ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.config && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      
                      {/* Rows */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">Rows</label>
                        <div 
                          className="space-y-1 min-h-[80px] p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 transition-colors hover:bg-blue-50"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropToZone(e, 'rows')}
                        >
                          {currentConfig.rows.map((row, index) => (
                            <div key={`row-${index}`} className="flex items-center justify-between p-2 bg-blue-100 border border-blue-200 rounded">
                              <span className="text-xs text-blue-800">{formatFieldLabel(row)}</span>
                              <Button
                                onClick={() => removeField(row, 'rows')}
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-blue-600 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {currentConfig.rows.length === 0 && (
                            <div className="flex items-center justify-center h-12 text-xs text-gray-500 text-center">
                              <MousePointer className="w-4 h-4 mr-2" />
                              Drag fields here or use + Row buttons
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Columns */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">Columns</label>
                        <div 
                          className="space-y-1 min-h-[80px] p-3 border-2 border-dashed border-green-300 rounded-lg bg-green-50/50 transition-colors hover:bg-green-50"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropToZone(e, 'columns')}
                        >
                          {currentConfig.columns.map((col, index) => (
                            <div key={`col-${index}`} className="flex items-center justify-between p-2 bg-green-100 border border-green-200 rounded">
                              <span className="text-xs text-green-800">{formatFieldLabel(col)}</span>
                              <Button
                                onClick={() => removeField(col, 'columns')}
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-green-600 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {currentConfig.columns.length === 0 && (
                            <div className="flex items-center justify-center h-12 text-xs text-gray-500 text-center">
                              <MousePointer className="w-4 h-4 mr-2" />
                              Drag fields here or use + Col buttons
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Values */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">Values</label>
                        <div 
                          className="space-y-1 min-h-[80px] p-3 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50/50 transition-colors hover:bg-purple-50"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropToZone(e, 'values')}
                        >
                          {currentConfig.values.map((value) => (
                            <div key={value.id} className="p-2 bg-purple-100 border border-purple-200 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-purple-800">{value.label}</span>
                                <Button
                                  onClick={() => removeValue(value.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-purple-600 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={value.aggregation}
                                  onChange={(e) => {
                                    const updatedValues = currentConfig.values.map(v =>
                                      v.id === value.id ? { ...v, aggregation: e.target.value as any } : v
                                    );
                                    updateCurrentConfig({ values: updatedValues });
                                  }}
                                  className="text-xs border border-purple-300 rounded px-1 py-0.5 bg-white"
                                >
                                  <option value="sum">Sum</option>
                                  <option value="count">Count</option>
                                  <option value="avg">Average</option>
                                  <option value="min">Min</option>
                                  <option value="max">Max</option>
                                  <option value="countUnique">Count Unique</option>
                                </select>
                                <select
                                  value={value.format}
                                  onChange={(e) => {
                                    const updatedValues = currentConfig.values.map(v =>
                                      v.id === value.id ? { ...v, format: e.target.value as any } : v
                                    );
                                    updateCurrentConfig({ values: updatedValues });
                                  }}
                                  className="text-xs border border-purple-300 rounded px-1 py-0.5 bg-white"
                                >
                                  <option value="number">Number</option>
                                  <option value="currency">Currency</option>
                                  <option value="percentage">Percentage</option>
                                </select>
                              </div>
                            </div>
                          ))}
                          {currentConfig.values.length === 0 && (
                            <div className="flex items-center justify-center h-12 text-xs text-gray-500 text-center">
                              <MousePointer className="w-4 h-4 mr-2" />
                              Drag fields here or use + Val buttons
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Main Content Area - Table Preview */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-0 p-0">
                <TabsTrigger 
                  value="builder" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none border-b-2 border-transparent"
                >
                  <Table2 className="w-4 h-4 mr-2" />
                  Table Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="chart" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none border-b-2 border-transparent"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Chart View
                </TabsTrigger>
                <TabsTrigger 
                  value="export" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none border-b-2 border-transparent"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Options
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="builder" className="mt-0 h-full">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{currentConfig.name} - Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{previewData.summary}</Badge>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewData.headers.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            {previewData.headers.map((header, index) => (
                              <th
                                key={index}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                              >
                                <div className="flex items-center justify-between">
                                  {editingHeader === index ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        value={headerEditValue}
                                        onChange={(e) => setHeaderEditValue(e.target.value)}
                                        className="h-6 text-xs"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            saveHeaderEdit();
                                          } else if (e.key === 'Escape') {
                                            cancelHeaderEdit();
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <Button 
                                        onClick={saveHeaderEdit}
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-green-600"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        onClick={cancelHeaderEdit}
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <span 
                                        className="cursor-pointer hover:text-gray-700"
                                        onClick={() => startEditingHeader(index, header)}
                                      >
                                        {header}
                                      </span>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                          onClick={() => startEditingHeader(index, header)}
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-5 w-5 p-0 hover:bg-gray-200"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-gray-200">
                                          <ArrowUp className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-gray-200">
                                          <ArrowDown className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 group">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                                >
                                  <div className="flex items-center justify-between group">
                                    <span>{cell}</span>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                      <Table2 className="w-12 h-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Build Your Pivot Table</h3>
                      <p className="text-gray-500 text-center max-w-md mb-4">
                        Follow these steps to create your custom pivot table:
                      </p>
                      <div className="space-y-2 text-sm text-gray-600 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">1</span>
                          <span>Add fields to <strong>Rows</strong> (what you want to group by)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-medium">2</span>
                          <span>Add fields to <strong>Columns</strong> (what you want to compare across)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">3</span>
                          <span>Add fields to <strong>Values</strong> (what you want to measure)</span>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-2">
                        <Button 
                          onClick={() => {
                            // Auto-add some sample fields for quick start
                            if (allFields.length > 0) {
                              const firstField = allFields[0];
                              addField(firstField, 'rows');
                              toast({
                                title: "Quick start!",
                                description: `Added "${firstField.label}" to rows. Now add a value field to see your data.`,
                              });
                            }
                          }}
                          size="sm" 
                          className="gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Quick Start
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setExpandedSections({
                          dataSources: true,
                          fields: true,
                          config: true,
                        })}>
                          Show All Fields
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart" className="mt-0 h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Chart Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                    <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chart preview coming soon</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Chart visualization will be available once you configure your pivot table.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="mt-0 h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Export Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <FileSpreadsheet className="w-6 h-6" />
                        Export to Excel
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Download className="w-6 h-6" />
                        Download CSV
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Copy className="w-6 h-6" />
                        Copy to Clipboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper functions
function inferFieldType(values: string[]): 'string' | 'number' | 'date' | 'boolean' {
  if (values.length === 0) return 'string';
  
  const numericCount = values.filter(v => !isNaN(Number(v)) && v !== '').length;
  if (numericCount > values.length * 0.7) return 'number';
  
  const dateCount = values.filter(v => !isNaN(Date.parse(v))).length;
  if (dateCount > values.length * 0.7) return 'date';
  
  return 'string';
}

function formatFieldLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

function formatSourceLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export default ImprovedDataLab;