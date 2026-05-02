
import { useState, useEffect } from 'react';

export interface Annotation {
  id: string;
  date: string;
  label: string;
  color: 'blue' | 'red' | 'green' | 'amber';
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY = 'p57-chart-annotations';

export const useAnnotations = () => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAnnotations(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse annotations', e);
      }
    }
  }, []);

  const saveAnnotations = (newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAnnotations));
  };

  const addAnnotation = (annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveAnnotations([...annotations, newAnnotation]);
  };

  const deleteAnnotation = (id: string) => {
    saveAnnotations(annotations.filter((a) => a.id !== id));
  };

  const getAnnotationsForRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return annotations.filter((a) => {
      const d = new Date(a.date);
      return d >= s && d <= e;
    });
  };

  return {
    annotations,
    addAnnotation,
    deleteAnnotation,
    getAnnotationsForRange,
  };
};
