# InfoPopover Visual Integration Guide

## Where to Find Info Icons in Your Dashboard

The InfoPopover component (blue ℹ️ icon) is already integrated throughout your analytics dashboard. Here's where you'll find them:

### 📊 Sales Page
- **Section Headers**: Next to "Sales Metrics", "Top Products", "Payment Methods"
- **Table Headers**: In the data table title bars
- **Tab Labels**: In metric comparison tabs

### 👥 Client Retention
- **Overview Section**: Next to the main retention metrics
- **Cohort Analysis**: In the cohort table header
- **Churn Analysis**: Next to churn rate visualizations

### 📈 Trainer Performance
- **Performance Grid**: Each trainer card has an info icon
- **Summary Section**: Overview insights button
- **Comparison Tables**: In table headers

### 🎯 Funnel & Leads
- **Conversion Funnel**: At each funnel stage
- **Lead Analysis**: In the lead source breakdown
- **Pipeline Metrics**: In KPI card sections

### 🏋️ Class Formats & Attendance
- **Format Comparison**: Next to each format metric
- **Attendance Trends**: In the trends section
- **Capacity Analysis**: In utilization tables

### 💰 Discounts & Promotions
- **Discount Analysis**: Main section header
- **ROI Metrics**: In the ROI calculation section
- **Campaign Performance**: Each campaign row

### ⏰ Late Cancellations
- **Cancellation Trends**: Main overview
- **Member Patterns**: In the pattern analysis section

### 📅 Expiration Analytics
- **Upcoming Expirations**: In the forecast section
- **Historical Trends**: In the timeline view

### 🔄 Sessions Overview
- **Booking Patterns**: In the patterns section
- **Utilization Metrics**: In capacity analysis

## How to Use

### Step 1: Locate the Info Icon
Look for the blue ℹ️ icon next to section titles, tab labels, or table headers:

```
┌─────────────────────────────────────┐
│ Sales Performance Metrics      [ℹ️] │  ← Click here
├─────────────────────────────────────┤
│                                     │
│  Revenue: ₹18.9L                   │
│  Trend: ↓ 28.7%                    │
│                                     │
└─────────────────────────────────────┘
```

### Step 2: Open the Popover
Click the ℹ️ icon to open a large modal with two tabs:
- **Preview**: See rendered HTML content
- **Edit**: Paste and edit HTML source

### Step 3: Add Your HTML Content
1. Click the "Edit" tab
2. Paste your complete HTML document (including `<!DOCTYPE html>`)
3. Click "Save"
4. Switch to "Preview" to see it rendered

### Step 4: View Full Report
- Click the expand icon (⤢) for fullscreen mode
- Scroll through the rendered report
- Close with the X button when done

## Example: Adding Analysis to Sales Table

```tsx
// In your Sales component
<Card>
  <CardHeader>
    <div className="flex items-center gap-2">
      <CardTitle>November Sales Analysis</CardTitle>
      {/* Info icon already present! */}
      <InfoPopover
        contextKey="sales-overview"
        location="kwality"
        summaryScope="studio"
      />
    </div>
  </CardHeader>
  <CardContent>
    {/* Your table content */}
  </CardContent>
</Card>
```

## Storage Location

Your HTML content is automatically saved to browser localStorage:

```
Key Pattern:
popover-content-{location}-{contextKey}-{summaryScope}

Examples:
- popover-content-kwality-sales-overview-studio
- popover-content-supreme-trainer-performance-studio
- popover-content-all-client-retention-network
```

## Quick Test

1. Navigate to any page with tables (e.g., Sales, Client Retention)
2. Look for the blue ℹ️ icon in a section header
3. Click it to open the popover
4. Click "Edit" tab
5. Paste the example HTML below
6. Click "Save"
7. Switch to "Preview" tab - you should see a formatted report!

### Test HTML (Copy & Paste This)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Report</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 20px;
            margin: 0;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: white;
            font-size: 2rem;
        }
        .kpi-card {
            background: #2c2c2c;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            margin: 10px 0;
        }
        .kpi-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #10b981;
        }
        .insight {
            background: #2c2c2c;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✨ Test Report - It Works!</h1>
        <p>If you can see this formatted nicely, everything is working perfectly.</p>
    </div>
    
    <div class="kpi-card">
        <h3>Test Metric</h3>
        <div class="kpi-value">100%</div>
        <p>System is operational ✅</p>
    </div>
    
    <div class="insight">
        <h3>💡 Insight</h3>
        <p>The InfoPopover component is successfully rendering your HTML with all styles intact. You can now paste any complete HTML document and it will display beautifully!</p>
    </div>
    
    <h2>Next Steps</h2>
    <ul>
        <li>Replace this test content with your actual analysis</li>
        <li>Use the provided examples in the documentation</li>
        <li>Customize colors and styles to match your brand</li>
        <li>Save and view in fullscreen mode</li>
    </ul>
</body>
</html>
```

## Tips for Best Results

### ✅ DO:
- Use complete HTML documents with DOCTYPE
- Include all styles in `<style>` tags in the `<head>`
- Use relative units (rem, %, vh) for responsive design
- Test in Preview mode before saving
- Use CSS variables for consistent theming
- Design for dark backgrounds (#1a1a1a, #2c2c2c)

### ❌ DON'T:
- Link external stylesheets (they won't load in iframe)
- Use `<iframe>` inside your HTML (nested iframes can be problematic)
- Reference external images without full URLs
- Forget to include `<!DOCTYPE html>`
- Use very large files (localStorage has ~5-10MB limit)

## Keyboard Shortcuts

When the popover is open:
- **Esc**: Close the popover
- **Ctrl/Cmd + S**: Save (when in Edit mode)
- **Tab**: Switch between Preview and Edit

## Troubleshooting

### "Content not displaying"
✓ Check that your HTML starts with `<!DOCTYPE html>`
✓ Verify no JavaScript errors in browser console
✓ Make sure styles are in `<style>` tags, not external files

### "Styles look different"
✓ Ensure all CSS is inline in the `<head>` section
✓ Check for CSS specificity issues
✓ Verify color contrast (light text on dark background)

### "Content is cut off"
✓ The iframe auto-resizes, wait 1-2 seconds
✓ Check for `max-height` or `overflow: hidden` in your CSS
✓ Use fullscreen mode for very long content

### "Can't save changes"
✓ Check browser localStorage isn't full
✓ Verify you clicked the "Save" button
✓ Check browser console for errors

## Real-World Example

Your example HTML (Physique 57 November Analysis) is **perfect** for this system! It includes:

✅ Complete document structure (`<!DOCTYPE html>`)
✅ All styles inline in `<head>`
✅ Professional dark theme design
✅ Responsive grid layouts
✅ CSS variables for theming
✅ Semantic HTML structure

Just paste it directly into any InfoPopover and it will render beautifully with:
- Dark theme preserved
- All gradients and colors intact
- Responsive layout working
- KPI cards styled correctly
- Insight cards with proper borders
- Typography and spacing perfect

## Summary

The InfoPopover component is **already built and integrated** throughout your entire dashboard. You don't need to add any new components - just:

1. **Find** the blue ℹ️ icons (they're everywhere!)
2. **Click** to open the popover
3. **Paste** your HTML content in Edit mode
4. **Save** and switch to Preview
5. **Enjoy** beautifully rendered analysis reports

Your HTML content example will work perfectly out of the box! 🎉
