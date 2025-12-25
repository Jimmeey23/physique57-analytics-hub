# Executive Dashboard Styling & Coordination Guide

## Overview
This guide ensures consistency across the executive dashboard UI, PDF exports, and filtering behavior.

## 1. Executive Section Cards - Styling

### Container Style
- **Border**: Left border (4px) with color-specific shade, not top border
- **Background**: White (no gradient)
- **Shadow**: Light shadow (`shadow-sm`), hover adds `shadow-md`
- **Spacing**: Compact with `pt-4 px-5 pb-4` padding
- **Hover**: Subtle background transition to light gray

### Header Style
- **Layout**: Icon + Title + Description (optional) + Collapse button (optional)
- **Icon**: 18px in colored background with 15% opacity
- **Title**: Font-semibold, text-base, slate-900
- **Description**: Optional, 12px, slate-500
- **Border**: Bottom border with slate-100/60

### Content Area
- **Spacing**: Variable based on section (`space-y-4`, `space-y-6`)
- **Subsections**: H4 titles in slate-700, 14px font-semibold
- **Top Separator**: `border-t border-slate-100` when dividing sections

## 2. Color Palette

### Section Colors
```
Sales:          Emerald (#22C55E)
Sessions:       Blue (#3B82F6)
Clients:        Purple (#A855F7)
Trainers:       Indigo (#6366F1)
Leads:          Rose (#EC4899)
Discounts:      Amber (#F97316)
Cancellations:  Red (#EF4444)
Expirations:    Cyan (#06B6D4)
```

### Text Colors
- **Primary**: slate-900 (titles, values)
- **Secondary**: slate-700 (subtitles)
- **Tertiary**: slate-500 (descriptions)
- **Muted**: slate-400 (disabled)

## 3. Dashboard Layout

### Executive Sections Container
```
- Top margin: mt-12
- Internal spacing: space-y-5
- Header: border-t-2 border-slate-200 with pt-8 mb-8
```

### Section Order (Fixed)
1. Sales Overview
2. Sessions Overview
3. Client Acquisition & Retention
4. Trainer Performance
5. Lead Conversion Funnel
6. Discounts & Promotions
7. Late Cancellations
8. Membership Expirations

## 4. Metrics Cards within Sections

### Grid Layout
- **Per Row**: 4 metrics in PDF, 2-3 on desktop
- **Background**: Color with 8% opacity
- **Border**: 0.5px solid color
- **Label**: 7px, normal weight, dark slate
- **Value**: 9.5px, bold, dark slate
- **Spacing**: 2px between items

### Spacing Inside Sections
- **Title to metrics**: `mb-4`
- **Metrics section to table**: `pt-4 border-t border-slate-100`
- **Table header spacing**: `mb-4`

## 5. Tables in Sections

### Header Row
- **Background**: Section color (emerald, blue, etc.)
- **Text**: White, bold, 8px
- **Padding**: Compact (1.5px vertical)

### Body Rows
- **Background**: White for odd, slate-50 for even
- **Border**: Slate-100 horizontal borders
- **Font**: 7.5px, slate-900

### Footer Row (Optional)
- **Background**: Darker slate (slate-800)
- **Text**: White, bold
- **Padding**: Same as header

## 6. PDF Layout Specifications

### Page Setup
- **Size**: A4 (210mm × 297mm)
- **Orientation**: Portrait
- **Margins**: 15mm all sides
- **Content Width**: 180mm (210 - 30)

### Section Headers (PDF)
- **Background**: Colored rectangle with 5% opacity
- **Left Border**: 2px solid, section color
- **Title**: 11px, bold, dark slate
- **Padding**: 4px left

### Metric Grid (PDF)
- **Per Row**: 4 metrics
- **Spacing**: 2px between columns, 2px between rows
- **Total Height**: Compact for more metrics per page

### Tables (PDF)
- **Header**: Section color, white text, 8px bold
- **Body**: 7.5px, slate-900
- **Row Height**: Minimal, ~3mm per row
- **Margins**: 15mm sides

### Font Sizes (PDF)
- **Title**: 28px (cover), 14px (section headers), 11px (subsection)
- **Body**: 9.5px (metric values), 7px (metric labels), 7.5px (table rows)
- **Navigation**: 9px (table of contents)

## 7. Global Filtering Integration

### Filter Binding
All Executive sections receive:
- `dateRange`: from GlobalFiltersContext.filters.dateRange
- `location`: from GlobalFiltersContext.filters.location

### Data Hooks
Each hook (useSalesData, useSessionsData, etc.) uses:
- GlobalFiltersContext for date/location filters
- Returns: Raw data array
- Filtering: Applied inside component useMemo

### Section Behavior
- **Sales**: Filters by paymentDate, calculatedLocation
- **Sessions**: Filters by date, location
- **Clients**: Filters by firstVisitDate, homeLocation
- **Trainers**: Filters by monthYear, location
- **Leads**: Filters by createdAt, center
- **Discounts**: Filters by paymentDate, location
- **Cancellations**: Filters by dateIST, location
- **Expirations**: Filters by expirationDate, location

## 8. Consistency Checklist

### UI Components
- [ ] All section cards use ExecutiveSectionCard wrapper
- [ ] All use proper borderColor prop (emerald, blue, purple, etc.)
- [ ] All have description text
- [ ] All show loading state with BrandSpinner
- [ ] All metrics grids in 2-column layout on desktop
- [ ] All tables have headers and optional footers
- [ ] All tables have alternating row colors

### Styling
- [ ] Consistent font weights (normal, semibold, bold)
- [ ] Consistent font sizes (xs=12px, sm=14px, base=16px)
- [ ] Consistent padding (4px = small, 8px = medium)
- [ ] Consistent border colors (slate-100 for light, slate-200 for darker)
- [ ] Consistent hover effects (shadow increase, slight lift)
- [ ] No oversized elements
- [ ] No excessive empty space

### Filtering
- [ ] All components use useGlobalFilters()
- [ ] All data hooks respect filter dates
- [ ] All data hooks respect filter locations
- [ ] Filter changes propagate to all sections
- [ ] No placeholder data displayed
- [ ] Empty state shows when filters result in no data

### PDF Export
- [ ] Compact metric grid (4 per row)
- [ ] Reduced spacing between elements
- [ ] Darktext on light backgrounds
- [ ] Color-coded section headers
- [ ] Tables fit on pages
- [ ] No orphaned headers
- [ ] Page footers on all pages
- [ ] Proper table of contents

## 9. Common Issues & Fixes

### Issue: Too Much Empty Space
**Fix**: Reduce padding, change metric grid from 2 to 4 per row, remove extra margins

### Issue: Text Not Visible
**Fix**: Ensure text color is >= 50% darker than background, use dark slate for text

### Issue: Elements Too Oversized
**Fix**: Use sm/base sizes instead of lg, reduce icon sizes to 18px

### Issue: Inconsistent Styling
**Fix**: Use ExecutiveSectionCard wrapper, follow color palette, match spacing patterns

### Issue: Filters Not Applied
**Fix**: Verify useGlobalFilters() is called, data hook respects filters, component re-renders on filter change

### Issue: PDF Pages Not Coordinated
**Fix**: Use checkAndAddPage() before drawing, reduce metric box heights, use 4-per-row grid

## 10. Performance Optimization

### Rendering
- Use `useMemo` for data transformations
- Cache filtered data by dateRange + location
- Avoid re-rendering on every filter change
- Use React.memo for metric cards

### PDF Generation
- Generate on-demand, not on load
- Use blob streaming for large documents
- Compress images (if any)
- Cache compiled layouts

## 11. Accessibility

### Color
- Never use color alone for meaning
- Maintain sufficient contrast (4.5:1 for normal text)
- Test with color-blind simulators

### Text
- Use semantic HTML (h1, h2, etc.)
- Label all form inputs
- Provide alt text for icons
- Use proper heading hierarchy

### Navigation
- Keyboard-accessible buttons
- Tab order follows visual flow
- Focus indicators visible
- Skip links for long sections

---

**Last Updated**: December 21, 2025
**Version**: 1.0
