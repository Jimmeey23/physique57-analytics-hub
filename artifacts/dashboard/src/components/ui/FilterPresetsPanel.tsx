import React, { useState } from 'react';
import { useFilterPresets, FilterPreset } from '@/hooks/useFilterPresets';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Bookmark, Trash2, Plus, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const FilterPresetsPanel: React.FC = () => {
  const { filters, updateFilters } = useGlobalFilters();
  const { presets, savePreset, deletePreset } = useFilterPresets();
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (newPresetName.trim()) {
      savePreset(newPresetName.trim(), filters);
      setNewPresetName('');
      setIsSaving(false);
    }
  };

  const applyPreset = (preset: FilterPreset) => {
    updateFilters(preset.filters);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Presets
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Filter Presets</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSaving(!isSaving)}
              className="h-8 w-8 p-0"
            >
              <Plus className={`h-4 w-4 transition-transform ${isSaving ? 'rotate-45' : ''}`} />
            </Button>
          </div>

          {isSaving && (
            <div className="flex gap-2">
              <Input
                placeholder="Preset name..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={handleSave} className="h-8">
                Save
              </Button>
            </div>
          )}

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {presets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved presets yet.
              </p>
            ) : (
              presets.map((preset) => (
                <Card key={preset.id} className="p-3 hover:bg-accent cursor-pointer group relative" onClick={() => applyPreset(preset)}>
                  <div className="flex flex-col gap-1 pr-8">
                    <span className="font-medium text-sm">{preset.name}</span>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(preset.filters.dateRange.start), 'MMM d')} - {format(new Date(preset.filters.dateRange.end), 'MMM d, yyyy')}
                      </div>
                      {preset.filters.location.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {preset.filters.location.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePreset(preset.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
