import { useState, useEffect } from 'react';
import { useGlobalLoading } from './useGlobalLoading';

interface ResourceProgress {
  loaded: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

export const useResourceProgress = () => {
  const [progress, setProgress] = useState<ResourceProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    isComplete: false
  });
  
  const { setProgress: setGlobalProgress } = useGlobalLoading();

  useEffect(() => {
    // Track document ready state
    const updateDocumentProgress = () => {
      const readyState = document.readyState;
      let docProgress = 0;
      
      switch (readyState) {
        case 'loading':
          docProgress = 10;
          break;
        case 'interactive':
          docProgress = 60;
          break;
        case 'complete':
          docProgress = 100;
          break;
      }
      
      return docProgress;
    };

    // Track resource loading (images, scripts, stylesheets)
    const trackResources = () => {
      const images = Array.from(document.images);
      const scripts = Array.from(document.scripts);
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      
      const allResources = [...images, ...scripts, ...links];
      let loadedCount = 0;
      
      const checkResource = (resource: any) => {
        if (resource.complete !== undefined) {
          return resource.complete; // Images
        }
        if (resource.readyState) {
          return resource.readyState === 'loaded' || resource.readyState === 'complete';
        }
        return true; // Assume loaded if we can't determine
      };
      
      allResources.forEach(resource => {
        if (checkResource(resource)) {
          loadedCount++;
        } else {
          resource.addEventListener('load', () => {
            loadedCount++;
            updateProgress();
          });
          resource.addEventListener('error', () => {
            loadedCount++;
            updateProgress();
          });
        }
      });
      
      const updateProgress = () => {
        const docProgress = updateDocumentProgress();
        const resourceProgress = allResources.length > 0 
          ? (loadedCount / allResources.length) * 100 
          : 100;
        
        // Combine document and resource progress (70% doc, 30% resources)
        const combinedProgress = Math.round((docProgress * 0.7) + (resourceProgress * 0.3));
        
        const newProgress = {
          loaded: loadedCount,
          total: allResources.length,
          percentage: combinedProgress,
          isComplete: combinedProgress >= 100
        };
        
        setProgress(newProgress);
        setGlobalProgress(combinedProgress);
      };
      
      updateProgress();
    };

    // Initial check
    trackResources();
    
    // Listen for document state changes
    const handleReadyStateChange = () => {
      trackResources();
    };
    
    document.addEventListener('readystatechange', handleReadyStateChange);
    
    return () => {
      document.removeEventListener('readystatechange', handleReadyStateChange);
    };
  }, [setGlobalProgress]);

  return progress;
};