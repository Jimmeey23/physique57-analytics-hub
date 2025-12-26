# Quick Reference: Executive Dashboard Filtering Pattern

## Copy-Paste Template

When updating a NEW section to use filtering, use this template:

```typescript
import React, { useMemo, useState } from 'react';
import { useYourDataHook } from '@/hooks/useYourDataHook';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { parseDate } from '@/utils/dateUtils';

export const YourSection = () => {
  const { data: rawData, loading } = useYourDataHook();
  const { filters } = useGlobalFilters();  // ← ADD THIS
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  // ✅ ADD THIS BLOCK - Filter by date range & location
  const filteredData = useMemo(() => {
    if (!rawData) return [];

    return rawData.filter(item => {
      // Date range filtering
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const itemDate = parseDate(item.YOUR_DATE_FIELD);
        const filterStart = new Date(filters.dateRange.start);
        const filterEnd = new Date(filters.dateRange.end);
        filterEnd.setHours(23, 59, 59, 999);

        if (!itemDate || itemDate < filterStart || itemDate > filterEnd) {
          return false;
        }
      }

      // Location filtering
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) 
          ? filters.location 
          : [filters.location];
        
        if (!locations.includes('all') && 
            !locations.some(loc => item.YOUR_LOCATION_FIELD?.includes(loc))) {
          return false;
        }
      }

      return true;
    });
  }, [rawData, filters.dateRange, filters.location]); // ← IMPORTANT: Add both filters

  // ✅ USE filteredData EVERYWHERE (not rawData)
  return (
    <>
      <MetricCards data={filteredData} />        {/* ← Use filtered */}
      <DataTable data={filteredData} />          {/* ← Use filtered */}
      <DrillDownModal data={filteredData} />     {/* ← Use filtered */}
    </>
  );
};
```

---

## Field Name Reference

### Date Fields by Hook
| Hook | Date Field | Type |
|------|-----------|------|
| useSessionsData | `sessionDate` | string |
| useLeadsData | `createdAt` | string |
| useDiscountAnalysis | `paymentDate` | string |
| useLateCancellationsData | `dateIST` | string \| number |
| useExpirationsData | `endDate` | string |
| usePayrollData | (None - location only) | - |

### Location Fields by Hook
| Hook | Location Field | Type |
|------|----------------|------|
| useSessionsData | `location` | string |
| useLeadsData | `center` | string |
| useDiscountAnalysis | `location` | string |
| useLateCancellationsData | `location` | string |
| useExpirationsData | `homeLocation` | string |
| usePayrollData | `location` | string |

---

## Common Mistakes to Avoid

### ❌ WRONG: Using raw data
```typescript
return (
  <MetricCards data={rawData} />  // ❌ Wrong! Not filtered
);
```

### ✅ RIGHT: Using filtered data
```typescript
return (
  <MetricCards data={filteredData} />  // ✅ Correct! Filtered
);
```

### ❌ WRONG: Missing dependency
```typescript
const filtered = useMemo(() => {
  return rawData.filter(...);
}, [rawData]);  // ❌ Missing filters.dateRange, filters.location
```

### ✅ RIGHT: All dependencies included
```typescript
const filtered = useMemo(() => {
  return rawData.filter(...);
}, [rawData, filters.dateRange, filters.location]);  // ✅ Complete
```

### ❌ WRONG: Hardcoding dates
```typescript
const startDate = new Date('2024-01-01');  // ❌ Wrong! Ignores user filter
```

### ✅ RIGHT: Using global filters
```typescript
const startDate = new Date(filters.dateRange.start);  // ✅ Respects user selection
```

---

## Components Ready to Use

### StandardizedMetricCard
**Location**: `/src/components/dashboard/StandardizedMetricCard.tsx`
```typescript
<StandardizedMetricCard
  title="Total Revenue"
  value={1250000}
  change={+15.2}
  icon={TrendingUp}
  color="emerald"
  subtitle="(+$150K vs last period)"
/>
```

**Available Colors**: emerald, blue, purple, rose, amber, sky, indigo, pink

### StandardizedTable
**Location**: `/src/components/dashboard/StandardizedTable.tsx`
```typescript
<StandardizedTable
  data={filteredLeads}
  columns={[
    { key: 'source', label: 'Lead Source', format: 'text' },
    { key: 'count', label: 'Total', format: 'number' },
    { key: 'revenue', label: 'Revenue', format: 'currency' },
    { key: 'rate', label: 'Conversion', format: 'percentage' },
  ]}
  headerColor="from-slate-700 to-slate-900"
  striped
/>
```

---

## Debug Checklist

If filters aren't working:

- [ ] Did you import `useGlobalFilters`?
- [ ] Did you call `const { filters } = useGlobalFilters()`?
- [ ] Did you create the `filteredData` useMemo?
- [ ] Did you use the correct date field name (see reference above)?
- [ ] Did you use the correct location field name (see reference above)?
- [ ] Did you pass `filteredData` to ALL components (not just one)?
- [ ] Did you include both filters in the dependency array?
- [ ] Does the date field exist on your data? (Check with console.log)
- [ ] Is the location string or array? (Check with console.log)

---

## Testing in Browser

1. Open DevTools Console (F12)
2. Go to Dashboard
3. Check filter controls in UI
4. Select a date range
5. Select a location
6. **Verify**: All metric values change to reflect filtered data
7. **Verify**: Tables show only filtered rows
8. **Verify**: Drill-down modals show filtered items

---

## Deployment Checklist

Before committing changes:

- [ ] Run `npm run build` - No errors?
- [ ] Check `get_errors()` - Zero errors?
- [ ] Dev server running? `npm run dev`
- [ ] Manual test in browser with filters
- [ ] Commit changes to git

---

## Related Documentation

- **Main Implementation**: [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)
- **Standardization Summary**: [STANDARDIZATION_COMPLETION_SUMMARY.md](./STANDARDIZATION_COMPLETION_SUMMARY.md)
- **Status Overview**: [FILTERING_IMPLEMENTATION_COMPLETE.md](./FILTERING_IMPLEMENTATION_COMPLETE.md)

---

## Questions?

**Where is GlobalFiltersContext?** 
→ `/src/contexts/GlobalFiltersContext.tsx`

**What does parseDate do?**
→ Converts string to Date object. Handles edge cases. Located in `/src/utils/dateUtils.ts`

**How do I test filtering locally?**
→ Use npm run dev, manually change filters in UI, verify metrics update

**Can I use different filter combinations?**
→ Yes! Each section can filter by date, location, or both. See individual section implementations for patterns.

**Where do I find examples?**
→ Check `/src/components/dashboard/ExecutiveSessionsSection.tsx` - it's the reference implementation.
