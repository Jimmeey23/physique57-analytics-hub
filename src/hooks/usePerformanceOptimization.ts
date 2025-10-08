import { useEffect } from 'react';

export const usePerformanceOptimization = () => {
  useEffect(() => {
    // Warm up critical page bundles for faster navigation by dynamically importing
    // the page modules instead of prefetching the route URLs (which triggers
    // browser requests to those paths and can produce 404s on some servers).
    const preloadPages = async () => {
      const imports: Record<string, () => Promise<any>> = {
        '/executive-summary': () => import('../pages/ExecutiveSummary'),
        '/sales-analytics': () => import('../pages/SalesAnalytics'),
        '/funnel-leads': () => import('../pages/FunnelLeads'),
        '/client-retention': () => import('../pages/ClientRetention'),
        '/trainer-performance': () => import('../pages/TrainerPerformance'),
      };

      // Fire-and-forget imports to warm the code-split chunks. We intentionally
      // don't await all of them serially to avoid blocking the main thread.
      Object.values(imports).forEach((fn) => {
        try {
          fn().catch(() => {
            // Ignore any load errors -- warming bundles should be best-effort
          });
        } catch (e) {
          // Defensive: ignore synchronous import errors
        }
      });
    };

    // Preload critical resources on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadPages);
    } else {
      setTimeout(preloadPages, 100);
    }

    // Enable performance observer for monitoring
    let performanceObserver: PerformanceObserver | null = null;
    const intersectionObservers: IntersectionObserver[] = [];
    
    if ('PerformanceObserver' in window) {
      performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log long tasks for debugging (reduced threshold for better detection)
          if (entry.entryType === 'longtask' && entry.duration > 100) {
            console.warn('Long task detected:', entry.duration + 'ms', 'at', entry.startTime);
          }
        });
      });

      try {
        performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Fallback for browsers that don't support longtask
      }
    }

    // Optimize images loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[loading="lazy"]');
      images.forEach((img) => {
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const image = entry.target as HTMLImageElement;
                if (image.dataset.src) {
                  image.src = image.dataset.src;
                  image.removeAttribute('data-src');
                  imageObserver.unobserve(image);
                }
              }
            });
          });
          imageObserver.observe(img);
          intersectionObservers.push(imageObserver);
        }
      });
    };

    // Run image optimization
    optimizeImages();

    // Cleanup function
    return () => {
      // Clean up performance observer
      if (performanceObserver) {
        performanceObserver.disconnect();
      }
      
      // Clean up intersection observers
      intersectionObservers.forEach(observer => {
        observer.disconnect();
      });
    };
  }, []);
};