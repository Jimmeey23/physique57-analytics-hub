# InfoPopover Quick Reference Card

> **🎨 HTML Renders Properly!** Content is rendered using `<iframe>` or `dangerouslySetInnerHTML`, NOT displayed as text.

## 🎯 What It Does
Paste complete HTML documents (with styles & scripts) into info icon popovers throughout your dashboard. Content **renders with full fidelity** in isolated iframes, preserving all styling and structure. Saves automatically to localStorage.

## 📍 Where to Find It
Look for blue **ℹ️** icons next to:
- Section headers
- Table titles  
- Tab labels
- Metric cards

**Already integrated in:** Sales, Client Retention, Trainer Performance, Funnel/Leads, Class Formats, Attendance, Discounts, Cancellations, Expirations, Sessions

## 🚀 Quick Start (3 Steps)

### 1. Click Info Icon
```
Sales Performance [ℹ️] ← Click this
```

### 2. Edit & Paste
- Open popover → Click "Edit" tab
- Paste your complete HTML document
- Click "Save"

### 3. Preview
- Switch to "Preview" tab
- Click expand icon (⤢) for fullscreen
- Done! 🎉

## ✅ HTML Requirements

### Must Have:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <style>
        /* All your CSS here */
    </style>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

### Key Rules:
- ✅ Complete HTML document with DOCTYPE
- ✅ All CSS in `<style>` tags (no external files)
- ✅ Dark theme colors (#1a1a1a background recommended)
- ✅ Responsive units (rem, %, vh)
- ❌ No external stylesheets
- ❌ No nested iframes

## 🎨 Recommended Styles

```css
:root {
    --bg-dark: #1a1a1a;
    --card-bg: #2c2c2c;
    --text-light: #e0e0e0;
    --primary: #8b5cf6;
    --success: #10b981;
    --danger: #ef4444;
}

body {
    font-family: 'Inter', sans-serif;
    background: var(--bg-dark);
    color: var(--text-light);
    padding: 20px;
    line-height: 1.6;
}

.kpi-card {
    background: var(--card-bg);
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid var(--primary);
}
```

## 💾 Storage
- Auto-saves to localStorage
- Key pattern: `popover-content-{location}-{contextKey}-{scope}`
- ~5-10MB browser limit

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Content not showing | Verify `<!DOCTYPE html>` at start |
| Styles broken | Check all CSS is in `<style>` tags |
| Cut off content | Wait 1-2s for auto-resize or use fullscreen |
| Can't save | Check localStorage isn't full |

## 📝 Your Example HTML
The Physique 57 November Analysis HTML you provided is **perfect**! It already has:
- ✅ Complete document structure
- ✅ Inline styles in `<head>`
- ✅ Dark theme design
- ✅ Responsive grids
- ✅ CSS variables

**Just paste it directly - it will work immediately!**

## 🎯 Common Use Cases

### Business Reports
Paste monthly/quarterly analysis with KPIs, trends, and recommendations

### Performance Dashboards  
Add interactive charts and metrics breakdowns

### Strategic Insights
Include deep-dive analysis with color-coded alerts and action items

### Client Summaries
Show member behavior patterns with visual breakdowns

## 🔗 Full Documentation
- Detailed Guide: `docs/INFO_POPOVER_USAGE.md`
- Visual Guide: `docs/INFO_POPOVER_VISUAL_GUIDE.md`

## ⚡ Pro Tips
1. **Use CSS variables** for easy theme updates
2. **Design for dark mode** (background: #1a1a1a)
3. **Test in Preview mode** before finalizing
4. **Use fullscreen mode** for long reports
5. **Keep it responsive** with flexible grids

---

**Ready to use! Find any ℹ️ icon in your dashboard and start pasting your HTML reports.**
