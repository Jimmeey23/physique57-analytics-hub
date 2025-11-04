# Editable Popovers with Google Drive Storage

## Overview

The info popovers across all tabs (Sales, Discounts, etc.) now support **editing and persistent storage** using Google Drive as the database.

## Features

✅ **Edit any popover content** - Click "Customize This Content" button
✅ **Persistent storage** - Saves to Google Drive automatically
✅ **Location-specific** - Different content for each location (Kwality, Supreme, etc.)
✅ **Context-aware** - Different content for different sections (metrics, overview, etc.)
✅ **Visual indicators** - Green dot shows custom content is active
✅ **Restore defaults** - Easy rollback to original content
✅ **HTML support** - Use basic HTML formatting in custom content

## How to Use

### 1. View Info Popover
- Click the **info icon (ⓘ)** in any section
- Popover opens showing default or custom content
- **Green dot** on icon = custom content is active

### 2. Edit Content
- Click **"Customize This Content"** button at the bottom
- Edit in the textarea (supports plain text and HTML)
- Click **"Save to Drive"** to persist changes
- Click **"Cancel"** to discard changes

### 3. Restore Default Content
- When viewing custom content, click **"Restore Default"**
- Confirms before deleting custom content
- Reverts to original default content

## Technical Implementation

### Google Drive Integration

**Service**: `/src/services/googleDriveService.ts`
- Authenticates using OAuth 2.0 refresh token
- Creates folder: `Physique57_Analytics_Popovers`
- Stores data in: `popover_content.json`
- Auto-refreshes access tokens

**Credentials** (already configured):
```javascript
CLIENT_ID: "YOUR_CLIENT_ID_2.apps.googleusercontent.com"
CLIENT_SECRET: "GOCSPX-REDACTED_SECRET_2"
REFRESH_TOKEN: "REDACTED_REFRESH_TOKEN_2"
```

### Data Structure

Content is stored in JSON format:
```json
{
  "sales-metrics": {
    "kwality": "<p>Custom content for Kwality metrics...</p>",
    "supreme": "<p>Custom content for Supreme metrics...</p>"
  },
  "sales-overview": {
    "all": "<p>Custom overview content...</p>"
  }
}
```

### Component Architecture

**InfoPopover** (`/src/components/ui/InfoPopover.tsx`):
- Enhanced existing component with edit capabilities
- Shows default content from `KWALITY_SUMMARY`, `SUPREME_SUMMARY`, etc.
- Loads custom content from Google Drive on mount
- Provides edit/save/restore interface

**EditableInfoPopover** (`/src/components/ui/EditableInfoPopover.tsx`):
- Standalone editable version (alternative implementation)
- Can be used instead of InfoPopover if preferred

## Content Contexts

Each popover can have different content based on:

### Context Types
- `sales-metrics` - Sales metrics overview
- `sales-top-bottom` - Top/bottom performers
- `sales-mom` - Month-over-month analysis
- `sales-yoy` - Year-over-year analysis
- `sales-product` - Product insights
- `sales-category` - Category breakdown
- `sales-soldby` - Sales rep performance
- `sales-payment` - Payment methods
- `sales-customer` - Customer behavior
- `sales-deep-insights` - Deep dive analysis
- `sales-overview` - Location overview

### Location IDs
- `kwality` - Kwality House, Kemps Corner
- `supreme` - Supreme HQ, Bandra
- `kenkere` - Kenkere House, Bengaluru
- `all` - All Locations

## Formatting Tips

### Basic HTML Formatting

**Bold text:**
```html
<strong>Important point</strong>
```

**Lists:**
```html
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>
```

**Headings:**
```html
<h3>Section Title</h3>
<p>Section content...</p>
```

**Line breaks:**
```html
First line<br/>
Second line
```

## Troubleshooting

### Content not saving
1. Check browser console for errors
2. Verify Google Drive credentials are valid
3. Check internet connection
4. Try again - token might be refreshing

### Content not loading
1. Wait for loader to finish
2. Check browser console
3. Try closing and reopening popover
4. Clear browser cache if needed

### Want to bulk edit
1. Access Google Drive folder: "Physique57_Analytics_Popovers"
2. Edit `popover_content.json` directly
3. Follow the JSON structure shown above
4. Refresh the application

## Best Practices

1. **Keep it concise** - Users should quickly grasp key insights
2. **Use formatting** - Structure with headings, lists, bold text
3. **Be specific** - Include numbers, metrics, actionable items
4. **Update regularly** - Keep content fresh with latest data
5. **Test changes** - Preview before saving
6. **Backup important edits** - Google Drive auto-saves, but export JSON periodically

## Security Notes

- Credentials use OAuth 2.0 refresh token (secure)
- Data stored in private Google Drive folder
- Only authorized users can access/edit
- All changes are logged with timestamps in Drive

## Future Enhancements

Potential improvements:
- Rich text editor (WYSIWYG)
- Version history
- Multi-user collaboration indicators
- Export/import functionality
- Templates for common sections
- AI-assisted content suggestions

---

**Need Help?** Check the browser console for detailed error messages or contact the development team.
