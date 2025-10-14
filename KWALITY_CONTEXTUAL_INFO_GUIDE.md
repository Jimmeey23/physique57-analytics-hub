# Kwality House Contextual Data Integration - Implementation Guide

## Overview
This implementation adds contextual information from external documents (Google Docs) that appears as info icons beside components when the **Kwality House** location is selected in any tab across the application.

## Architecture

### 1. Core Services

#### External Document Service (`src/services/externalDocumentService.ts`)
- Handles fetching data from Google Docs API
- Implements caching mechanism (5-minute cache)
- Provides structured data mapping
- Includes fallback data for offline scenarios

#### Data Hook (`src/hooks/useExternalDocumentData.ts`)
- React hook for managing external document data
- Auto-fetches when Kwality House is selected
- Supports auto-refresh functionality
- Handles loading states and error management

#### Location Detection Hook (`src/hooks/useKwalityHouseSelection.ts`)
- Detects when Kwality House is currently selected
- Works across different page structures
- Checks URL parameters and component state

### 2. UI Components

#### Contextual Info Icon (`src/components/ui/ContextualInfoIcon.tsx`)
- Displays as an info (i) icon beside components
- Shows rich popover with structured insights
- Includes refresh functionality and source link
- Responsive design with multiple sections

#### Wrapper Component (`src/components/ui/WithContextualInfo.tsx`)
- Higher-order component that adds contextual info to any component
- Auto-detects Kwality House selection
- Maps data types to appropriate content sections
- Configurable positioning and styling

## Data Structure

The system expects data organized by categories:

```typescript
interface ExternalDocumentData {
  trainerPerformance?: {
    topTrainers: Array<{
      name: string;
      performance: string;
      metrics: string;
      location?: string;
    }>;
    insights: string[];
    recommendations: string[];
  };
  salesInsights?: {
    performanceNotes: string[];
    trends: string[];
    actionItems: string[];
  };
  classFormatData?: {
    popularFormats: string[];
    attendance: string[];
    feedback: string[];
  };
  clientRetentionData?: {
    retentionTips: string[];
    churnAnalysis: string[];
    successStories: string[];
  };
  sessionsData?: {
    peakTimes: string[];
    utilization: string[];
    optimization: string[];
  };
  generalInsights?: {
    marketTrends: string[];
    competitorAnalysis: string[];
    opportunities: string[];
  };
}
```

## Implementation Locations

### Pages Enhanced:
1. **Trainer Performance** - Enhanced ranking tables and metric cards
2. **Sales Analytics** - Added to metric cards and analysis tables
3. **Class Formats** - Added to format comparison cards
4. **Client Retention** - Enhanced metric cards
5. **Sessions** - Added to session metric cards

### Components Updated:
- `EnhancedTrainerPerformanceSection.tsx`
- `SalesAnalyticsSection.tsx`
- `ClassFormatsComparison.tsx`
- `ClientRetention.tsx`
- `SessionsSection.tsx`

## Usage Examples

### Adding Contextual Info to Any Component

```tsx
import { WithContextualInfo } from '@/components/ui/WithContextualInfo';

// Wrap any component to add contextual info
<WithContextualInfo
  dataType="trainerPerformance"        // Data category
  currentLocation={selectedLocation}    // Current location state
  title="Custom Title"                 // Optional custom title
  iconPosition="top-right"             // Icon positioning
  iconSize="md"                        // Icon size
>
  <YourComponent />
</WithContextualInfo>
```

### Direct Icon Usage

```tsx
import { ContextualInfoIcon } from '@/components/ui/ContextualInfoIcon';

const info = {
  title: "Custom Insights",
  insights: ["Insight 1", "Insight 2"],
  recommendations: ["Recommendation 1"]
};

<ContextualInfoIcon 
  info={info}
  onRefresh={refreshHandler}
  loading={isLoading}
/>
```

## Configuration Options

### Icon Positioning
- `top-right` (default)
- `top-left`
- `bottom-right`
- `bottom-left`
- `inline` (flows with content)

### Icon Sizes
- `sm` - 16px
- `md` - 20px (recommended)
- `lg` - 24px

### Data Types
- `trainerPerformance` - Trainer insights and metrics
- `salesInsights` - Sales performance data
- `classFormatData` - Class format analytics
- `clientRetentionData` - Retention intelligence
- `sessionsData` - Session optimization
- `generalInsights` - Market intelligence

## Google Docs Integration

### Current Implementation
The service includes a placeholder for Google Docs API integration:

```typescript
// TODO: Implement actual Google Docs API call
const data = await this.parseDocumentContent();
```

### To Complete Integration:
1. Set up Google Docs API credentials
2. Implement authentication flow
3. Create document parsing logic
4. Map document sections to data structure

### Document Structure Expected:
- **Trainer Performance Section** - Contains trainer metrics and insights
- **Sales Analysis Section** - Sales trends and performance notes
- **Class Format Data** - Format popularity and feedback
- **Client Retention** - Retention strategies and analysis
- **Session Optimization** - Peak times and utilization data
- **General Insights** - Market trends and opportunities

## Features

### ✅ Implemented Features:
- Automatic Kwality House detection across all pages
- Contextual info icons with rich content display
- Caching mechanism for performance
- Loading states and error handling
- Responsive design and positioning options
- Integration with major dashboard components

### 📋 Content Display:
- **Key Insights** with bullet points
- **Recommendations** with actionable items
- **Trends** and performance notes
- **Top Performer Metrics** in card format
- **Analysis** and success stories
- **Action Items** with priority indicators

### 🔧 Technical Features:
- TypeScript type safety
- Automatic refresh capability
- Source document link
- Error boundaries and fallbacks
- Performance optimization with memoization

## Testing

### Manual Testing Steps:
1. Navigate to any page with location tabs
2. Select "Kwality House" location
3. Verify info icons appear beside components
4. Click info icons to view contextual data
5. Test refresh functionality
6. Verify data persists across page navigation

### Integration Testing:
```bash
# Run development server
npm run dev

# Test pages with contextual info:
# - /trainer-performance (with Kwality selected)
# - /sales-analytics (with Kwality selected) 
# - /class-formats (with Kwality selected)
# - /client-retention (with Kwality selected)
# - /sessions (with Kwality selected)
```

## Future Enhancements

### Planned Features:
1. **Real-time Updates** - WebSocket integration for live data
2. **Custom Content Types** - User-defined data categories
3. **Analytics Integration** - Track info icon usage
4. **Offline Support** - Enhanced caching and offline data
5. **Multi-language Support** - Internationalization
6. **Advanced Filtering** - Filter insights by date/category

### Document Integration Roadmap:
1. **Phase 1** - Manual data entry interface
2. **Phase 2** - Google Docs API integration  
3. **Phase 3** - Multiple document source support
4. **Phase 4** - AI-powered content extraction
5. **Phase 5** - Real-time collaborative editing

## Maintenance

### Regular Tasks:
- Monitor cache performance and hit rates
- Update external document parsing logic
- Review and update data structure as needed
- Ensure icon positioning works across viewport sizes
- Test integration after component updates

### Performance Monitoring:
- Track external API response times
- Monitor cache effectiveness
- Analyze info icon interaction rates
- Review error rates and fallback usage

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Kwality House selection in location filters
3. Test with sample data in `parseDocumentContent()`
4. Review component props and data structure matching