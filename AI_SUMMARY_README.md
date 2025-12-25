# AI-Powered Analytics Summary Feature

## Overview

The AI Summary feature provides intelligent, contextual analysis of your analytics data using OpenAI's advanced language models. It generates deep insights, identifies trends, and provides actionable recommendations based on your filtered data in real-time.

## Features

### ✨ Core Features
- **Dynamic Summary Generation**: AI analyzes your current filtered data to generate contextually aware summaries
- **Key Insights Extraction**: Identifies the most important patterns and anomalies in your data
- **Trend Analysis**: Detects meaningful trends and their business implications
- **Actionable Recommendations**: Provides specific, implementable suggestions for improvement
- **Data Quality Assessment**: Evaluates data completeness and identifies potential issues

### 🚀 Advanced Features
- **Contextual Awareness**: Summaries adapt based on the current page, location filter, and applied filters
- **Persistent Storage**: Summaries are saved using Supabase for future reference
- **Intelligent Caching**: In-memory caching for instant retrieval of recent summaries
- **Modern UI**: Beautiful, animated interface with organized sections
- **Multi-Tab Interface**: Seamlessly switch between original content and AI insights

## How It Works

### Data Extraction
The system intelligently extracts data from your current view:
1. **Table Data**: Automatically scrapes visible tables on the page
2. **Metrics Cards**: Extracts key metrics from UI components
3. **Fallback Data**: Creates relevant sample data when real data isn't available
4. **Filter Context**: Includes all active filters to ensure contextual relevance

### AI Processing
1. **Data Analysis**: OpenAI analyzes the extracted data with business context
2. **Industry Awareness**: Specialized prompts for fitness/wellness industry insights
3. **Quantified Insights**: Provides specific numbers and percentages where relevant
4. **Strategic Focus**: Executive-level recommendations for business improvement

### Storage & Retrieval
- **Supabase Integration**: Summaries are permanently stored in a PostgreSQL database
- **Smart Caching**: Recent summaries are cached in memory for instant access
- **Data Change Detection**: Automatically regenerates summaries when data changes
- **History Tracking**: Maintains a history of all generated summaries

## Usage

### Basic Usage
1. Navigate to any analytics page (Sales, Sessions, Client Retention, etc.)
2. Apply your desired filters (date range, location, etc.)
3. Click the Info icon (ℹ️) to open the InfoSidebar
4. Click the "AI Summary" tab
5. Click "Generate AI Summary" to create insights

### Advanced Usage
- **Regenerate**: Force create a new summary by clicking the refresh button
- **History**: View previous summaries for the same context
- **Delete**: Clear summaries you no longer need
- **Context Switch**: Summaries automatically adapt when you change filters or locations

## Setup Instructions

### Prerequisites
- OpenAI API account with available credits
- Supabase account (optional, for persistence)

### Environment Variables
Add these variables to your `.env.local` file:

```env
# Required for AI summary generation
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional for persistent storage
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### OpenAI Setup
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add the key to your environment variables
4. Ensure you have sufficient credits for API calls

### Supabase Setup (Optional)
1. Create a new project at [Supabase](https://supabase.com/dashboard)
2. Go to Settings > API to get your URL and keys
3. Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS analytics_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  context TEXT NOT NULL,
  location_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_insights TEXT[] NOT NULL DEFAULT '{}',
  trends TEXT[] NOT NULL DEFAULT '{}',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  data_quality_score INTEGER DEFAULT 85,
  data_quality_issues TEXT[] NOT NULL DEFAULT '{}',
  data_snapshot JSONB NOT NULL DEFAULT '{}',
  filters_applied JSONB NOT NULL DEFAULT '{}',
  date_range JSONB,
  data_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_summaries_context_location 
  ON analytics_summaries (context, location_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summaries_data_hash 
  ON analytics_summaries (data_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_summaries_updated_at 
  ON analytics_summaries (updated_at DESC);
```

## File Structure

```
src/
├── services/
│   ├── openaiService.ts          # OpenAI API integration
│   ├── supabaseService.ts        # Database operations
│   └── summaryManager.ts         # Orchestrates AI + storage
├── components/ui/
│   ├── InfoSidebar.tsx          # Enhanced with AI tab
│   └── SummaryDisplay.tsx       # Modern summary UI
└── hooks/
    └── useDataContext.ts         # Data extraction logic
```

## API Usage & Costs

### OpenAI Model: GPT-4o-mini
- **Cost**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Typical Summary**: ~2000 input tokens + ~800 output tokens ≈ $0.0008 per summary
- **Daily Usage**: 100 summaries ≈ $0.08/day
- **Features**: JSON output, contextual awareness, business intelligence focus

### Supabase Storage
- **Free Tier**: Up to 500MB database storage
- **Typical Summary**: ~2KB per record
- **Capacity**: ~250,000 summaries on free tier

## Performance Optimizations

### Caching Strategy
- **In-Memory Cache**: 30-minute cache for immediate responses
- **Database Cache**: Permanent storage with intelligent retrieval
- **Data Hash Matching**: Avoids regenerating identical summaries

### Data Extraction Optimizations
- **Smart Limits**: Maximum 50 table rows, 20 metric cards
- **Selective Extraction**: Only extracts meaningful data with content
- **Error Handling**: Graceful fallbacks when data extraction fails
- **Performance Monitoring**: Tracks extraction time and success rates

## Troubleshooting

### Common Issues

**"OpenAI service not properly initialized"**
- Check that `VITE_OPENAI_API_KEY` is set correctly
- Verify your OpenAI account has available credits
- Ensure the API key has the correct permissions

**"Supabase service not initialized"**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check that the database table exists
- Ensure your Supabase project is active

**"Failed to generate summary"**
- Check browser console for detailed error messages
- Verify network connectivity
- Try regenerating after a few moments

**Empty or generic summaries**
- Ensure you have data visible on the current page
- Try applying filters to narrow down the dataset
- Check that tables or metrics are properly rendered

### Debug Mode
Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'ai-summary:*');
```

## Customization

### Custom Data Extractors
Modify `useDataContext.ts` to add custom data extraction logic for specific pages:

```typescript
// Add custom extraction for a new context
case 'your-custom-context':
  return () => {
    return yourCustomDataExtractionLogic();
  };
```

### Custom AI Prompts
Update the prompt building logic in `openaiService.ts` to customize AI analysis:

```typescript
// Customize the analysis focus
const customPrompt = `
Focus analysis on: ${yourSpecificFocus}
Use business terminology for: ${yourIndustry}
Include specific KPIs: ${yourKPIs}
`;
```

### UI Customization
Modify `SummaryDisplay.tsx` to customize the summary presentation:

```typescript
// Add custom sections or styling
const customSection = (
  <Card className="your-custom-styles">
    <CardContent>
      Your custom content
    </CardContent>
  </Card>
);
```

## Best Practices

### Data Quality
- Ensure your data is clean and properly formatted
- Use consistent naming conventions
- Include relevant context in filter names

### Cost Management
- Use caching effectively by not forcing regeneration unnecessarily
- Monitor OpenAI usage through their dashboard
- Consider data limits for very large datasets

### User Experience
- Generate summaries after applying meaningful filters
- Review and validate AI insights before making business decisions
- Use summaries as starting points for deeper analysis

## Future Enhancements

### Planned Features
- **Multi-language Support**: Summaries in different languages
- **Custom Templates**: User-defined summary formats
- **Scheduled Generation**: Automatic summary generation
- **Export Options**: PDF, email, and presentation exports
- **Collaborative Features**: Sharing and commenting on summaries

### Integration Opportunities
- **Slack/Teams Integration**: Automated summary notifications
- **Email Reports**: Scheduled summary delivery
- **API Endpoints**: External system integration
- **Webhook Support**: Real-time summary triggers

## Security Considerations

### Data Privacy
- Data is processed by OpenAI (review their privacy policy)
- Summaries are stored in your Supabase instance
- No data is permanently stored by OpenAI after processing

### API Security
- API keys are client-side (consider backend proxy for production)
- Supabase uses row-level security policies
- All communications use HTTPS encryption

### Compliance
- Ensure compliance with your organization's data policies
- Review OpenAI's terms of service for business use
- Consider data residency requirements for your industry

## Support

### Getting Help
- Check the browser console for detailed error messages
- Review the troubleshooting section above
- Verify all environment variables are correctly set

### Contributing
- Report issues with detailed reproduction steps
- Suggest improvements or new features
- Share custom data extractors or prompts with the community

## License
This feature is part of the Physique57 Analytics Hub project and inherits the same license terms.