# Performance Optimization Guide
**Physique57 Analytics Hub**

## Quick Reference: All Pages Use Universal Loader ✅

Every route in the application now integrates with the **GlobalLoader** system via the `useGlobalLoading` hook. This ensures:
- ✅ Consistent loading experience across all pages
- ✅ No flash of unstyled content (FOUC)
- ✅ Pages display only when fully loaded
- ✅ Smooth transitions with progress indication

---

## Loading System Architecture

### 3-Layer Loading System:

```
┌─────────────────────────────────────────────┐
│  Layer 1: InitialLoadGate                  │
│  Shows UniversalLoader on first app visit  │
│  Hides after animation + route ready       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 2: React.Suspense                    │
│  Handles code-splitting lazy loads         │
│  Minimal fallback (InitialLoadGate covers) │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 3: GlobalLoader                      │
│  Shows UniversalLoader during data fetch   │
│  Controlled by each page's setLoading()    │
└─────────────────────────────────────────────┘
```

---

## How to Add Loading to a New Page

### Step 1: Import the hook
```typescript
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
```

### Step 2: Use the hook in your component
```typescript
const MyPage = () => {
  const { setLoading } = useGlobalLoading();
  const { data, loading } = useMyData();
  
  // Track loading state
  React.useEffect(() => {
    setLoading(loading, 'Loading my page data...');
  }, [loading, setLoading]);
  
  return <div>My Page Content</div>;
};
```

### Step 3: For pages with NO data loading
```typescript
const StaticPage = () => {
  const { setLoading } = useGlobalLoading();
  
  // Signal page is ready immediately
  React.useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  
  return <div>Static Content</div>;
};
```

---

## Performance Best Practices

### 1. Component Memoization

Use `React.memo` for components that:
- Render frequently
- Have expensive calculations
- Receive the same props often

```typescript
// Before
export const MyHeavyComponent = ({ data }) => {
  // expensive rendering
};

// After
const MyHeavyComponentInner = ({ data }) => {
  // expensive rendering
};

export const MyHeavyComponent = React.memo(MyHeavyComponentInner);
```

### 2. Use useMemo for Expensive Calculations

```typescript
const expensiveValue = React.useMemo(() => {
  // Only recalculates when dependencies change
  return heavyCalculation(data);
}, [data]);
```

### 3. Use useCallback for Event Handlers

```typescript
const handleClick = React.useCallback(() => {
  // Function reference stays the same
  doSomething(id);
}, [id]);
```

### 4. Lazy Load Heavy Components

```typescript
const HeavyChart = React.lazy(() => import('./HeavyChart'));

// In render:
<React.Suspense fallback={<div>Loading chart...</div>}>
  <HeavyChart data={data} />
</React.Suspense>
```

---

## Data Loading Patterns

### Pattern 1: Single Data Source
```typescript
const MyPage = () => {
  const { setLoading } = useGlobalLoading();
  const { data, loading } = useMyData();
  
  React.useEffect(() => {
    setLoading(loading, 'Loading data...');
  }, [loading, setLoading]);
  
  return <div>{data.map(...)}</div>;
};
```

### Pattern 2: Multiple Data Sources
```typescript
const MyPage = () => {
  const { setLoading } = useGlobalLoading();
  const { data: sales, loading: salesLoading } = useSalesData();
  const { data: sessions, loading: sessionsLoading } = useSessionsData();
  
  const isLoading = salesLoading || sessionsLoading;
  
  React.useEffect(() => {
    setLoading(isLoading, 'Loading sales and session data...');
  }, [isLoading, setLoading]);
  
  return <div>...</div>;
};
```

### Pattern 3: Progressive Loading
```typescript
const MyPage = () => {
  const { setLoading } = useGlobalLoading();
  const { data: critical, loading: criticalLoading } = useCriticalData();
  const { data: extra, loading: extraLoading } = useExtraData();
  
  // Only block on critical data
  React.useEffect(() => {
    setLoading(criticalLoading, 'Loading essential data...');
  }, [criticalLoading, setLoading]);
  
  return (
    <div>
      <CriticalSection data={critical} />
      {extraLoading ? <Skeleton /> : <ExtraSection data={extra} />}
    </div>
  );
};
```

---

## Performance Monitoring

### Check Loading Performance

Use browser DevTools:
1. Open **Performance** tab
2. Click **Record**
3. Navigate to a page
4. Stop recording
5. Look for:
   - Long tasks (>50ms)
   - Layout shifts
   - Slow network requests

### Monitor in Console

The app logs:
- Long tasks (>200ms)
- Route changes
- Data loading times

---

## Optimization Checklist

### For Every New Page:
- [ ] Add `useGlobalLoading` integration
- [ ] Use React.lazy() for route definition
- [ ] Implement useMemo for derived data
- [ ] Implement useCallback for handlers
- [ ] Add loading states for all async operations

### For Heavy Components:
- [ ] Wrap with React.memo
- [ ] Use useMemo for expensive calculations
- [ ] Consider code-splitting with React.lazy
- [ ] Implement virtual scrolling if >100 rows

### For Data Fetching:
- [ ] Use QueryClient caching (already configured)
- [ ] Set appropriate staleTime (default: 10min)
- [ ] Avoid redundant API calls
- [ ] Implement optimistic updates where applicable

---

## Common Issues & Solutions

### Issue: Page flashes during load
**Solution:** Ensure `setLoading(loading, "message")` is called in useEffect

### Issue: Loader doesn't hide
**Solution:** Check that `setLoading(false)` is called when loading completes

### Issue: Slow page transitions
**Solution:** 
1. Check Network tab for slow API calls
2. Use React DevTools Profiler
3. Consider lazy loading heavy components

### Issue: Page freezes during render
**Solution:**
1. Use React.memo on expensive components
2. Implement virtualization for long lists
3. Break large components into smaller ones

---

## Advanced Optimizations

### 1. Prefetch Critical Data
Already implemented in `usePerformanceOptimization`:
- Executive Summary
- Sales Analytics
- Funnel Leads
- Client Retention
- Trainer Performance

### 2. Code Splitting
All routes use React.lazy():
```typescript
const MyPage = React.lazy(() => import('./pages/MyPage'));
```

### 3. Bundle Analysis
Run: `npm run build` and check bundle sizes
Large bundles should be split further.

### 4. Image Optimization
- Use WebP format
- Lazy load images with `loading="lazy"`
- Optimize image sizes (current: automatic via IntersectionObserver)

---

## Query Client Configuration

Already optimized in `App.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,      // 10 minutes
      gcTime: 60 * 60 * 1000,         // 60 minutes
      refetchOnWindowFocus: false,     // Don't refetch on focus
      refetchOnReconnect: true,        // Refetch on reconnect
      retry: 1,                        // Retry once on failure
    },
  },
});
```

This means:
- Data is cached for 10 minutes
- No refetching when window regains focus
- Automatic retry on network failure
- Garbage collection after 60 minutes

---

## Summary

✅ **All pages use GlobalLoader** - Consistent loading experience  
✅ **Smart prefetching** - Critical pages load faster  
✅ **Code splitting** - Smaller initial bundle  
✅ **Caching optimized** - Reduced API calls  
✅ **Performance monitoring** - Identify bottlenecks  
✅ **React.memo implemented** - Prevent unnecessary re-renders  

The app is now optimized for production with industry-standard performance practices.
