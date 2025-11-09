/**
 * Performance monitoring utilities for tracking Core Web Vitals and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly thresholds = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    TTFB: { good: 800, needsImprovement: 1800 },
    FCP: { good: 1800, needsImprovement: 3000 },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWebVitals();
    }
  }

  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[metric as keyof typeof this.thresholds];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private initWebVitals() {
    // Largest Contentful Paint (LCP)
    const observeLCP = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const value = lastEntry.renderTime || lastEntry.loadTime;
      this.recordMetric('LCP', value);
    });
    
    try {
      observeLCP.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observation not supported');
    }

    // First Input Delay (FID)
    const observeFID = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.recordMetric('FID', entry.processingStart - entry.startTime);
      });
    });
    
    try {
      observeFID.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observation not supported');
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const observeCLS = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.recordMetric('CLS', clsValue);
    });
    
    try {
      observeCLS.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observation not supported');
    }

    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        const ttfb = navTiming.responseStart - navTiming.requestStart;
        this.recordMetric('TTFB', ttfb);
        
        const fcp = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
        this.recordMetric('FCP', fcp);
      }
    });

    // Long Tasks (tasks taking more than 50ms)
    const observeLongTasks = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.duration > 50) {
          this.recordMetric('LongTask', entry.duration);
          console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
        }
      }
    });
    
    try {
      observeLongTasks.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('Long task observation not supported');
    }
  }

  recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      rating: this.getRating(name, value),
    };
    
    this.metrics.push(metric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${emoji} ${name}: ${value.toFixed(2)}ms (${metric.rating})`);
    }
    
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Implement your analytics service here (e.g., Google Analytics, Mixpanel, etc.)
    // Example: gtag('event', 'web_vitals', { ...metric });
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  getAverageByName(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Custom metric tracking for specific user journeys
  markStart(name: string) {
    performance.mark(`${name}-start`);
  }

  markEnd(name: string) {
    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name)[0];
      this.recordMetric(name, measure.duration);
      
      // Clean up marks
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    } catch (e) {
      console.warn(`Failed to measure ${name}`, e);
    }
  }

  // Resource timing analysis
  getSlowResources(threshold: number = 1000): PerformanceResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.filter(r => r.duration > threshold);
  }

  // Bundle size analysis
  analyzeBundleSize() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const scripts = resources.filter(r => r.initiatorType === 'script');
    const totalSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    console.log('📦 Bundle Analysis:');
    console.log(`Total JS Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    
    scripts
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 10)
      .forEach(r => {
        console.log(`  ${r.name}: ${((r.transferSize || 0) / 1024).toFixed(2)}KB (${r.duration.toFixed(2)}ms)`);
      });
  }

  // Memory usage tracking
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('💾 Memory Usage:');
      console.log(`  Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  // Generate performance report
  generateReport() {
    console.log('📊 Performance Report:');
    console.log('─'.repeat(50));
    
    const metrics = ['LCP', 'FID', 'CLS', 'TTFB', 'FCP'];
    metrics.forEach(name => {
      const avg = this.getAverageByName(name);
      if (avg > 0) {
        const rating = this.getRating(name, avg);
        const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(`${emoji} ${name}: ${avg.toFixed(2)}ms (${rating})`);
      }
    });
    
    console.log('─'.repeat(50));
    
    const slowResources = this.getSlowResources(1000);
    if (slowResources.length > 0) {
      console.log(`\n⚠️ ${slowResources.length} slow resources detected (>1s):`);
      slowResources.forEach(r => {
        console.log(`  ${r.name}: ${r.duration.toFixed(2)}ms`);
      });
    }
    
    this.analyzeBundleSize();
    this.trackMemoryUsage();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for React hooks
export const usePerformanceMonitor = () => {
  return {
    markStart: (name: string) => performanceMonitor.markStart(name),
    markEnd: (name: string) => performanceMonitor.markEnd(name),
    recordMetric: (name: string, value: number) => performanceMonitor.recordMetric(name, value),
  };
};

// Auto-generate report on page unload in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.generateReport();
  });
}
