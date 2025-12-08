# InfoPopover HTML Content Guide

## Overview
The `InfoPopover` component allows you to add rich HTML analysis reports directly into any table or tab section. Users can paste complete HTML documents (with styles, scripts, and structure) which will be rendered in an isolated iframe with full fidelity.

## Key Features
✅ **Complete HTML Support** - Paste full HTML documents with `<head>`, `<style>`, and `<script>` tags
✅ **Automatic Persistence** - Content is saved to localStorage automatically
✅ **Iframe Isolation** - HTML renders in an isolated iframe preserving all styles
✅ **Edit & Preview** - Switch between editing HTML source and viewing rendered output
✅ **Fullscreen Mode** - Expand to fullscreen for better viewing/editing
✅ **Auto-resize** - Iframe automatically adjusts to content height

## Basic Usage

### 1. Import the Component
```tsx
import InfoPopover from '@/components/ui/InfoPopover';
```

### 2. Add to Your Table/Section Header
```tsx
<div className="flex items-center gap-2">
  <h2>Sales Analysis</h2>
  <InfoPopover
    contextKey="sales-overview"
    title="Sales Performance Insights"
    location="kwality"
    summaryScope="studio"
  />
</div>
```

### 3. Paste HTML Content
1. Click the info icon (ℹ️)
2. Switch to "Edit" tab
3. Paste your complete HTML document
4. Click "Save"
5. Switch to "Preview" to see it rendered

## HTML Content Examples

### Example 1: Simple Analysis Report
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>November Analysis</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 20px;
            line-height: 1.6;
        }
        .highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
        .metric {
            font-size: 2rem;
            font-weight: bold;
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <h1>📊 November Performance Report</h1>
    <div class="highlight">
        <h2>Key Insight</h2>
        <p>Revenue increased by <span class="metric">28.7%</span> this month!</p>
    </div>
    <h3>Recommendations</h3>
    <ul>
        <li>Double down on high-performing products</li>
        <li>Re-engage dormant customers</li>
        <li>Launch Q1 promotions early</li>
    </ul>
</body>
</html>
```

### Example 2: Data-Driven Dashboard
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Studio Analytics</title>
    <style>
        :root {
            --primary: #8b5cf6;
            --success: #10b981;
            --danger: #ef4444;
            --bg-dark: #0f111a;
        }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: var(--bg-dark);
            color: #e2e8f0;
            margin: 0;
            padding: 20px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }
        .kpi-card {
            background: #1a1d2d;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid var(--primary);
        }
        .kpi-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--success);
        }
        .insight-card {
            background: #1a1d2d;
            padding: 20px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid var(--danger);
        }
    </style>
</head>
<body>
    <h1>Studio Performance Dashboard</h1>
    
    <div class="kpi-grid">
        <div class="kpi-card">
            <h3>Total Revenue</h3>
            <div class="kpi-value">₹18.9L</div>
            <p>↓ 28.7% MoM</p>
        </div>
        <div class="kpi-card">
            <h3>Active Members</h3>
            <div class="kpi-value">186</div>
            <p>↓ 6.5% MoM</p>
        </div>
    </div>
    
    <div class="insight-card">
        <h3>🚨 Critical Alert</h3>
        <p>Membership revenue collapsed 53%. Immediate action required.</p>
    </div>
</body>
</html>
```

## Component Props

### Required Props
- `contextKey`: Unique identifier for the analysis (e.g., 'sales-overview')
- `location`: Studio location ('kwality' | 'supreme' | 'kenkere' | 'all')
- `summaryScope`: Analysis scope ('studio' | 'network')

### Optional Props
- `title`: Custom popover title (default: auto-generated from contextKey)
- `autoTriggerGeneration`: Auto-generate AI analysis (default: false)
- `allowEdit`: Allow manual HTML editing (default: true)
- `allowAIGeneration`: Show AI generation button (default: true)

## Integration Examples

### In a Table Header
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        Revenue Analysis
        <InfoPopover
          contextKey="sales-metrics"
          location="kwality"
          summaryScope="studio"
        />
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <ModernDataTable data={revenueData} columns={columns} />
  </CardContent>
</Card>
```

### In a Tab Section
```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">
      Overview
      <InfoPopover
        contextKey="sales-overview"
        location="kwality"
        summaryScope="studio"
        title="Overview Insights"
      />
    </TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* Your content */}
  </TabsContent>
</Tabs>
```

### In a Dashboard Section
```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <h2 className="text-2xl font-bold">Performance Metrics</h2>
    <InfoPopover
      contextKey="performance-overview"
      location="kwality"
      summaryScope="studio"
    />
  </div>
  
  {/* Your metrics here */}
</div>
```

## Storage Keys
Content is automatically saved to localStorage with the key pattern:
```
popover-content-{location}-{contextKey}-{summaryScope}
```

Example: `popover-content-kwality-sales-overview-studio`

## Best Practices

### 1. **Use Self-Contained HTML**
Always include a complete HTML document with `<!DOCTYPE html>` for best results:
```html
<!DOCTYPE html>
<html>
<head>
    <style>/* your styles */</style>
</head>
<body>
    <!-- your content -->
</body>
</html>
```

### 2. **Inline All Styles**
Since the HTML renders in an iframe, all CSS should be inline in `<style>` tags:
```html
<style>
    body { font-family: sans-serif; background: #1a1a1a; }
    .card { padding: 20px; border-radius: 8px; }
</style>
```

### 3. **Use CSS Variables for Theming**
Define color schemes with CSS custom properties for easy updates:
```css
:root {
    --primary: #8b5cf6;
    --bg-dark: #1a1a1a;
    --text-light: #e0e0e0;
}
```

### 4. **Make It Responsive**
Use responsive units and grid layouts:
```css
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}
```

### 5. **Optimize for Dark Backgrounds**
Most of the app uses dark mode, so design accordingly:
```css
body {
    background-color: #1a1a1a;
    color: #e0e0e0;
}
```

## Troubleshooting

### Content Not Displaying
- Ensure HTML starts with `<!DOCTYPE html>`
- Check browser console for errors
- Verify iframe sandbox permissions

### Styles Not Applying
- Make sure styles are in `<head>` within `<style>` tags
- Check for CSS syntax errors
- Verify no external stylesheet dependencies

### Height Issues
- The iframe auto-resizes to content
- Allow 100-500ms for content to load
- Complex layouts may need explicit height

### localStorage Limits
- Browser limit: ~5-10MB per domain
- Keep HTML concise and optimized
- Remove unused CSS/JS

## Advanced Features

### Custom Interactions
You can include JavaScript for interactive charts:
```html
<script>
    // Simple chart rendering
    function renderChart(data) {
        // Your chart logic
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        renderChart([10, 20, 30]);
    });
</script>
```

### Dynamic Content
Load data dynamically (within iframe security constraints):
```html
<script>
    // Simulate data loading
    const mockData = {
        revenue: '₹18.9L',
        trend: -28.7
    };
    
    document.getElementById('revenue').textContent = mockData.revenue;
</script>
```

## Security Notes
- All HTML is rendered in a sandboxed iframe
- `allow-same-origin` and `allow-scripts` are enabled
- No access to parent window/localStorage
- DOMPurify sanitization for snippet mode (not needed for iframe)

## Example: Complete Business Report
See the attached example HTML (from your attachment) which demonstrates:
- Professional dark theme styling
- Responsive grid layouts
- KPI cards with color-coded trends
- Insight cards with icons
- Strategic recommendations
- Full document structure

This example can be pasted directly into any InfoPopover and will render perfectly with all styles intact.

## Next Steps
1. Click any info icon (ℹ️) in your dashboard
2. Switch to "Edit" tab
3. Paste your HTML content
4. Click "Save"
5. View in "Preview" tab
6. Use fullscreen mode for better viewing

The InfoPopover component is already integrated throughout the app - just look for the blue info icons!
