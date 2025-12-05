import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Clock, 
  BarChart3, 
  Monitor, 
  Cpu, 
  HardDrive,
  Wifi,
  Eye,
  EyeOff
} from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  networkRequests: number;
  fps: number;
  loadTime: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    networkRequests: 0,
    fps: 0,
    loadTime: 0
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderStart = useRef(0);

  useEffect(() => {
    // Monitor FPS
    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount.current * 1000) / (currentTime - lastTime.current))
        }));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    // Monitor memory usage
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }));
      }
    };

    // Monitor network requests
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      setMetrics(prev => ({
        ...prev,
        networkRequests: prev.networkRequests + entries.length
      }));
    });

    observer.observe({ entryTypes: ['resource'] });

    // Monitor load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        loadTime: Math.round(loadTime)
      }));
    });

    measureFPS();
    const memoryInterval = setInterval(measureMemory, 1000);

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, []);

  // Measure render time for components
  const startRender = () => {
    renderStart.current = performance.now();
  };

  const endRender = () => {
    const renderTime = performance.now() - renderStart.current;
    setMetrics(prev => ({
      ...prev,
      renderTime: Math.round(renderTime)
    }));
  };

  return { metrics, startRender, endRender };
};

// Performance monitor component
export const PerformanceMonitor: React.FC<{ show?: boolean }> = ({ show = false }) => {
  const { metrics } = usePerformanceMonitor();
  const [isVisible, setIsVisible] = useState(show);

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 left-4 z-50 opacity-60 hover:opacity-100"
        onClick={() => setIsVisible(true)}
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  const getPerformanceLevel = (fps: number) => {
    if (fps >= 55) return { level: 'excellent', color: 'bg-green-500', text: 'Excellent' };
    if (fps >= 45) return { level: 'good', color: 'bg-blue-500', text: 'Good' };
    if (fps >= 30) return { level: 'fair', color: 'bg-yellow-500', text: 'Fair' };
    return { level: 'poor', color: 'bg-red-500', text: 'Poor' };
  };

  const getMemoryLevel = (memory: number) => {
    if (memory < 50) return { level: 'low', color: 'bg-green-500', text: 'Low' };
    if (memory < 100) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
    return { level: 'high', color: 'bg-red-500', text: 'High' };
  };

  const performance = getPerformanceLevel(metrics.fps);
  const memory = getMemoryLevel(metrics.memoryUsage);

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Performance Monitor
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-500" />
            <span className="text-sm">FPS</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={performance.color}>
              {metrics.fps}
            </Badge>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Memory</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={memory.color}>
              {metrics.memoryUsage}MB
            </Badge>
          </div>
        </div>

        {/* Load Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Load Time</span>
          </div>
          <div className="text-sm text-gray-600">
            {metrics.loadTime}ms
          </div>
        </div>

        {/* Network Requests */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Requests</span>
          </div>
          <div className="text-sm text-gray-600">
            {metrics.networkRequests}
          </div>
        </div>

        {/* Render Time */}
        {metrics.renderTime > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Last Render</span>
            </div>
            <div className="text-sm text-gray-600">
              {metrics.renderTime}ms
            </div>
          </div>
        )}

        {/* Performance Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Overall Performance</span>
            <span className={`text-xs ${performance.level === 'excellent' ? 'text-green-600' : performance.level === 'good' ? 'text-blue-600' : performance.level === 'fair' ? 'text-yellow-600' : 'text-red-600'}`}>
              {performance.text}
            </span>
          </div>
          <Progress 
            value={Math.min((metrics.fps / 60) * 100, 100)} 
            className="h-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

// HOC for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const PerformanceMonitoredComponent: React.FC<P> = (props) => {
    const renderStart = useRef(0);

    useEffect(() => {
      renderStart.current = performance.now();
    });

    useEffect(() => {
      const renderTime = performance.now() - renderStart.current;
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`${componentName || WrappedComponent.name || 'Component'} took ${renderTime.toFixed(2)}ms to render`);
      }
    });

    return <WrappedComponent {...props} />;
  };

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return PerformanceMonitoredComponent;
}

// Performance context
const PerformanceContext = React.createContext<{
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  toggleMonitoring: () => void;
} | null>(null);

export const usePerformanceContext = () => {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
};

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { metrics } = usePerformanceMonitor();
  const [isMonitoring, setIsMonitoring] = useState(false);

  const toggleMonitoring = () => setIsMonitoring(!isMonitoring);

  return (
    <PerformanceContext.Provider value={{ metrics, isMonitoring, toggleMonitoring }}>
      {children}
      {isMonitoring && <PerformanceMonitor show={true} />}
    </PerformanceContext.Provider>
  );
};