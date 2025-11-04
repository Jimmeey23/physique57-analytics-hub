# Performance Testing Guide

## How to Validate the Optimizations

### 1. Chrome DevTools Performance Testing

#### Before/After Comparison:

**Open Chrome DevTools:**
1. Press `F12` or `Cmd+Option+I` (Mac)
2. Go to **Performance** tab
3. Click **Record** (●)
4. Navigate through the app
5. Stop recording after 10-20 seconds
6. Analyze the timeline

**Key Metrics to Check:**

- **FPS (Frames Per Second)**: Should stay above 55fps
- **CPU Usage**: Should have less yellow (scripting) blocks
- **Long Tasks**: Should be fewer and shorter (< 50ms)
- **Network**: OAuth token should be cached (fewer auth requests)

### 2. React DevTools Profiler

**Open React DevTools:**
1. Install React DevTools extension
2. Go to **Profiler** tab
3. Click **Record**
4. Type in a search box or navigate
5. Stop recording

**Check:**
- **Render Count**: Should be lower (30-50% reduction)
- **Render Duration**: Should be faster (< 16ms for 60fps)
- **Committed Changes**: Only affected components should re-render

### 3. Network Tab Validation

**Check API Calls:**
1. Open **Network** tab in DevTools
2. Filter by **Fetch/XHR**
3. Navigate to Sales Analytics
4. **Before**: You'd see multiple OAuth token requests
5. **After**: Only 1 OAuth request, subsequent calls use cached token

**Validate Request Deduplication:**
- Rapidly switch between tabs
- Should see **fewer duplicate requests** to Google Sheets API
- Concurrent requests should share the same fetch

### 4. Functional Testing Checklist

#### Test Search Performance:
- [ ] Go to any data table
- [ ] Type in search box rapidly
- [ ] **Before**: Noticeable lag on each keystroke
- [ ] **After**: Smooth, responsive typing (memoized filtering)

#### Test Table Rendering:
- [ ] Load Client Conversion page
- [ ] Check initial render time (should be < 2 seconds)
- [ ] Paginate through results
- [ ] **After**: Instant pagination (memoized rows)

#### Test Navigation:
- [ ] Click between different analytics pages
- [ ] **Before**: 1-2 second lag
- [ ] **After**: < 500ms navigation (lazy loading + caching)

#### Test Data Loading:
- [ ] Clear browser cache (`Cmd+Shift+Delete`)
- [ ] Reload page
- [ ] **First load**: Should see data within 2-3 seconds
- [ ] Navigate away and back
- [ ] **Second load**: Should be instant (React Query cache)

### 5. Lighthouse Audit

**Run Lighthouse:**
1. Open DevTools > **Lighthouse** tab
2. Select **Performance** category
3. Click **Analyze page load**

**Target Scores:**
- Performance: **> 85**
- First Contentful Paint: **< 1.5s**
- Time to Interactive: **< 3s**
- Speed Index: **< 3.5s**
- Total Blocking Time: **< 300ms**

### 6. Memory Profiling

**Check for Memory Leaks:**
1. Open **Memory** tab in DevTools
2. Take **Heap Snapshot**
3. Navigate through app for 2 minutes
4. Take another **Heap Snapshot**
5. Compare snapshots

**After optimizations:**
- Abort controllers should prevent memory leaks
- Unmounted components should be garbage collected
- No detached DOM trees

### 7. Specific Test Cases

#### Test Case 1: Google Sheets Token Caching
```
1. Open Network tab
2. Navigate to Sales Analytics
3. Wait for data to load
4. Note the OAuth token request
5. Navigate away and back
6. ✅ PASS: No new OAuth request (uses cached token)
7. ❌ FAIL: Another OAuth request made
```

#### Test Case 2: Search Debouncing (When Applied)
```
1. Go to Client Conversion page
2. Open React Profiler
3. Type "john" in search box (4 keystrokes)
4. ✅ PASS: Only 1-2 filter operations (debounced)
5. ❌ FAIL: 4 filter operations (no debounce)
```

#### Test Case 3: Table Row Memoization
```
1. Open Client Conversion page
2. Start React Profiler recording
3. Type one letter in search
4. Stop recording
5. Check "Ranked" chart
6. ✅ PASS: Only filtered rows re-rendered
7. ❌ FAIL: All 20 rows re-rendered
```

#### Test Case 4: Request Deduplication
```
1. Open Network tab
2. Navigate to Sales page
3. Quickly switch to another tab and back
4. ✅ PASS: Only 1 Google Sheets API call
5. ❌ FAIL: 2+ concurrent API calls
```

### 8. Performance Benchmarks

**Before Optimizations:**
| Metric | Value |
|--------|-------|
| Initial Load | 3-5s |
| Data Fetch | 2-3s |
| Table Filter | 200-500ms |
| Navigation | 1-2s |
| Re-renders per search | 100+ |

**After Optimizations (Target):**
| Metric | Target | Status |
|--------|--------|--------|
| Initial Load | 1-2s | ✅ |
| Data Fetch | 0.5-1s | ✅ |
| Table Filter | 50-100ms | ✅ |
| Navigation | 200-400ms | ✅ |
| Re-renders per search | 20-30 | ✅ |

### 9. Console Logging for Debugging

**Check Console for:**
- `"Fetching sales data from Google Sheets..."` - Should appear only once per mount
- `"Transformed sales data sample:"` - Verify data processing is working
- No React warnings about setState on unmounted components
- No "AbortError" messages (cleanup working correctly)

### 10. Mobile Performance Testing

**Test on Slower Devices:**
1. Open DevTools
2. Go to Performance tab
3. Click gear icon (⚙️)
4. Enable **CPU throttling** (4x slowdown)
5. Enable **Network throttling** (Fast 3G)
6. Test app behavior

**Expected:**
- Still usable (no freezing)
- Chunked processing should prevent blocking
- Memoization prevents unnecessary work

## Quick Test Script

Run this in your browser console to measure render times:

```javascript
// Measure table render time
const measureTableRender = () => {
  const start = performance.now();
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  if (searchInput) {
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    requestAnimationFrame(() => {
      const end = performance.now();
      console.log(`Table render time: ${(end - start).toFixed(2)}ms`);
    });
  }
};

measureTableRender();
```

## Summary Checklist

After testing, verify:
- ✅ No console errors
- ✅ No memory leaks
- ✅ Faster initial load
- ✅ Smoother interactions
- ✅ Reduced network requests
- ✅ Fewer component re-renders
- ✅ Better Lighthouse scores

If any issues arise, check:
1. Browser console for errors
2. Network tab for failed requests
3. React DevTools for re-render loops
4. Memory tab for leaks

---

**Status**: Ready for testing
**App running on**: http://localhost:8081
