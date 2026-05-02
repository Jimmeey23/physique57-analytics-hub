import { useState, useEffect } from 'react';
import { GlobalFilters } from '@/contexts/GlobalFiltersContext';

export interface FilterPreset {
  id: string;
  name: string;
  createdAt: string;
  filters: GlobalFilters;
}

const STORAGE_KEY = 'p57-filter-presets';

export const useFilterPresets = () => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse filter presets', e);
      }
    }
  }, []);

  const savePreset = (name: string, filters: GlobalFilters) => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      filters: { ...filters },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const listPresets = () => presets;

  return {
    presets,
    savePreset,
    deletePreset,
    listPresets,
  };
};
