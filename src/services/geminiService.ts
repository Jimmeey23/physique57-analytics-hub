/**
 * Generate AI summary of table data using Gemini
 */
async generateTableSummary(options: TableSummaryOptions): Promise<GeminiSummaryResult> {
  try {
    if (!options.tableData || options.tableData.length === 0) {
      return {
        summary: 'No data available for analysis.',
        keyInsights: ['No data to analyze'],
        trends: ['Insufficient data for trend analysis'],
        error: 'No data provided'
      };
    }

    const prompt = this.createAnalysisPrompt(options);
    
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the structured response
    const sections = this.parseGeminiResponse(text);

    return {
      summary: sections.summary || text.slice(0, 1000) + (text.length > 1000 ? '...' : ''),
      keyInsights: sections.keyInsights || this.extractBulletPoints(text).slice(0, 8),
      trends: sections.trends || this.extractBulletPoints(text).slice(0, 6),
      recommendations: sections.recommendations || undefined
    };
    
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'AI analysis temporarily unavailable. Please try again later.';
    if (error?.status === 404) {
      errorMessage = 'Model not found. Please check the Gemini model configuration.';
    } else if (error?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
    } else if (error?.status === 403) {
      errorMessage = 'API access denied. Please check your API key.';
    }
    
    return {
      summary: errorMessage,
      keyInsights: ['AI service encountered an error'],
      trends: ['Unable to analyze trends at this time'],
      error: error?.message || error?.status || 'Unknown error occurred'
    };
  }
}

/**
 * Create an enhanced, detailed prompt for Gemini with comprehensive month-over-month analysis
 */
private createAnalysisPrompt(options: TableSummaryOptions): string {
  const { tableData, columns, tableName, context, summaryType, includeRecommendations, maxRows } = options;
  const stats = this.extractTableStatistics(tableData, columns);
  const limitedData = maxRows ? tableData.slice(0, maxRows) : tableData;

  // Detect if data has time-based information for temporal analysis
  const hasDateColumn = columns.some(col => col.type === 'date');
  const dateColumns = columns.filter(col => col.type === 'date');
  
  // Group data by time periods if date columns exist
  let timeBasedAnalysis = '';
  if (hasDateColumn && dateColumns.length > 0) {
    timeBasedAnalysis = this.generateTimeBasedContext(tableData, dateColumns[0]);
  }

  let prompt = `You are a senior business intelligence analyst with expertise in the fitness and wellness industry, specializing in Indian market dynamics, member behavior analysis, and revenue optimization. Your task is to perform a comprehensive, data-driven analysis that executives can use for strategic decision-making.

**CRITICAL REQUIREMENT: THE ENTIRE ANALYSIS MUST FOCUS SPECIFICALLY ON SEPTEMBER 2025 PERFORMANCE. Every section, insight, and recommendation must directly relate to September 2025 data and performance metrics.**

═══════════════════════════════════════════════════════════════════════════════
📊 DATA CONTEXT & OVERVIEW - SEPTEMBER 2025 FOCUS
═══════════════════════════════════════════════════════════════════════════════

**Business Entity**: ${tableName || 'Business Performance Analytics'}
**Primary Analysis Focus**: **SEPTEMBER 2025 PERFORMANCE ASSESSMENT**
**Context**: ${context || 'September 2025 business performance tracking and optimization'}
**Dataset Size**: ${stats.totalRows} total records
**Analysis Framework**: ${summaryType || 'comprehensive'} deep-dive analysis of September 2025
**Currency**: All financial figures in Indian Rupees (₹), presented in lakhs for amounts ≥ ₹1,00,000

**SEPTEMBER 2025 ANALYSIS PRIORITY:**
- Primary focus on September 2025 performance metrics
- Compare September 2025 vs August 2025 (month-over-month)
- Compare September 2025 vs September 2024 (year-over-year)
- Analyze September 2025 trends and patterns
- Identify September 2025 specific opportunities and challenges

═══════════════════════════════════════════════════════════════════════════════
📋 DATA STRUCTURE & SCHEMA
═══════════════════════════════════════════════════════════════════════════════

**Columns Available for September 2025 Analysis:**
${columns.map((col, idx) => `${idx + 1}. **${col.header}** (${col.key})
   - Data Type: ${col.type || 'text'}
   - Purpose: ${this.getColumnPurpose(col)}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
📈 SEPTEMBER 2025 STATISTICAL FOUNDATION
═══════════════════════════════════════════════════════════════════════════════
`;

  // Enhanced Numeric Metrics Section
  if (Object.keys(stats.numericColumns).length > 0) {
    prompt += '\n**SEPTEMBER 2025 QUANTITATIVE METRICS & FINANCIAL INDICATORS:**\n\n';
    Object.entries(stats.numericColumns).forEach(([, stat]: [string, any]) => {
      const formatValue = (val: number) => {
        if (stat.type === 'currency') return this.formatCurrency(val);
        if (stat.type === 'percentage') return `${val.toFixed(1)}%`;
        return this.formatNumber(val);
      };
      
      const range = stat.max - stat.min;
      const variance = range / stat.average * 100;
      
      prompt += `📊 **${stat.header} - September 2025 Performance**
   • September 2025 Total: ${formatValue(stat.sum)}
   • September 2025 Average: ${formatValue(stat.average)}
   • September 2025 Range: ${formatValue(stat.min)} → ${formatValue(stat.max)}
   • September 2025 Variance: ${variance.toFixed(1)}%
   • September 2025 Sample Size: ${stat.count} data points
\n`;
    });
  }

  // Enhanced Categorical Analysis
  if (Object.keys(stats.textColumns).length > 0) {
    prompt += '\n**SEPTEMBER 2025 CATEGORICAL DISTRIBUTION & SEGMENTATION:**\n\n';
    Object.entries(stats.textColumns).forEach(([, stat]: [string, any]) => {
      const dominancePercentage = ((stat.mostCommon.count / stats.totalRows) * 100).toFixed(1);
      prompt += `🏷️ **${stat.header} - September 2025 Analysis**
   • September 2025 Categories: ${stat.uniqueCount}
   • September 2025 Leader: "${stat.mostCommon.value}" (${dominancePercentage}% share)
   • September 2025 Distribution: ${stat.examples.join(', ')}
\n`;
    });
  }

  // Enhanced Time Period Analysis
  if (Object.keys(stats.dateColumns).length > 0) {
    prompt += '\n**SEPTEMBER 2025 TEMPORAL SCOPE & TIME-SERIES CONTEXT:**\n\n';
    Object.entries(stats.dateColumns).forEach(([, stat]: [string, any]) => {
      prompt += `📅 **${stat.header} - September 2025 Focus**
   • September 2025 Analysis Period: Focus on September 1-30, 2025 data
   • Data Coverage: ${stat.count} September 2025 records
   • September 2025 Granularity: Daily/weekly performance within the month
\n`;
    });
  }

  // Add time-based grouping if available
  if (timeBasedAnalysis) {
    prompt += '\n**SEPTEMBER 2025 PERIOD-OVER-PERIOD BREAKDOWN:**\n\n';
    prompt += timeBasedAnalysis;
  }

  // Enhanced Sample Data Presentation
  if (limitedData.length > 0) {
    prompt += '\n═══════════════════════════════════════════════════════════════════════════════\n';
    prompt += '📋 SEPTEMBER 2025 SAMPLE DATA EXTRACT\n';
    prompt += '═══════════════════════════════════════════════════════════════════════════════\n\n';
    
    const sampleData = limitedData.slice(0, 10);
    const headers = columns.map(col => col.header).join(' | ');
    prompt += `${headers}\n`;
    prompt += '─'.repeat(headers.length) + '\n';
    
    sampleData.forEach((row, idx) => {
      const rowData = columns.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return 'N/A';
        if (col.type === 'currency' && typeof value === 'number') return this.formatCurrency(value);
        if (col.type === 'number' && typeof value === 'number') return this.formatNumber(value);
        if (col.type === 'date' && value) return new Date(value).toLocaleDateString('en-IN');
        return String(value);
      }).join(' | ');
      prompt += `${idx + 1}. ${rowData}\n`;
    });
  }

  prompt += `\n\n═══════════════════════════════════════════════════════════════════════════════
🎯 SEPTEMBER 2025 COMPREHENSIVE ANALYSIS REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

**MANDATORY FOCUS: Every section below MUST specifically analyze SEPTEMBER 2025 performance. Do not provide generic analysis - focus exclusively on September 2025 data, trends, and insights.**

───────────────────────────────────────────────────────────────────────────────
1️⃣ SEPTEMBER 2025 EXECUTIVE SUMMARY (Minimum 6-8 sentences)
───────────────────────────────────────────────────────────────────────────────

Provide a compelling narrative overview specifically about September 2025 that answers:
• How did September 2025 perform compared to August 2025? (specific ₹ amounts and % changes)
• What were the 3-4 most critical September 2025 findings that leadership must know?
• What is September 2025's overall performance status? (Excellent/Good/Fair/Concerning)
• What is the primary business narrative emerging from September 2025 data?
• Include specific September 2025 KPIs, growth rates, and financial metrics
• How does September 2025 rank among recent months?

**Writing Style**: Professional, confident, data-driven. Write as if presenting September 2025 results to the CEO and CFO.

───────────────────────────────────────────────────────────────────────────────
2️⃣ SEPTEMBER 2025 PERFORMANCE ANALYSIS (Critical Priority)
───────────────────────────────────────────────────────────────────────────────

**SEPTEMBER 2025 DETAILED PERFORMANCE BREAKDOWN:**

📊 **September 2025 Key Metrics:**
   • **September 2025 Revenue**: ₹X lakhs (±Y% vs August 2025, ±Z% vs September 2024)
   • **September 2025 Volume**: X transactions/members (±Y% vs August 2025)
   • **September 2025 Average Values**: ₹X per transaction (±Y% vs August 2025)
   • **September 2025 Daily Average**: ₹X lakhs per day
   • **September 2025 Weekly Trends**: Week 1 vs Week 2 vs Week 3 vs Week 4 performance

🔍 **September 2025 Comparative Analysis:**
   • How did September 2025 rank among the last 6 months?
   • What made September 2025 unique compared to other months?
   • September 2025 vs August 2025: Detailed month-over-month comparison
   • September 2025 vs September 2024: Year-over-year growth analysis
   • September 2025 momentum: Growing/Stable/Declining trajectory

**Required September 2025 Metrics:**
   • Absolute September 2025 performance numbers
   • September 2025 vs August 2025 change (₹X lakhs increase/decrease, ±Y%)
   • September 2025 vs September 2024 change if available
   • September 2025 daily/weekly performance patterns
   • September 2025 market position and competitive performance

───────────────────────────────────────────────────────────────────────────────
3️⃣ SEPTEMBER 2025 KEY BUSINESS INSIGHTS (Minimum 8-10 detailed insights)
───────────────────────────────────────────────────────────────────────────────

**EVERY INSIGHT MUST BE SPECIFICALLY ABOUT SEPTEMBER 2025 PERFORMANCE**

Each insight must follow this structure:

**September 2025 Insight #X: [Clear, Action-Oriented Title]**
   • **September 2025 Finding**: What the September 2025 data shows (with specific numbers)
   • **September 2025 Context**: Why this September 2025 result matters to the business
   • **September 2025 Impact**: Financial or operational implications of September 2025 performance
   • **September 2025 vs Benchmark**: How September 2025 compares to previous months/years
   • **September 2025 Evidence**: Supporting September 2025 data points or calculations

**Required September 2025 Focus Areas:**
   ✓ September 2025 revenue performance and drivers
   ✓ September 2025 customer/member behavior patterns
   ✓ September 2025 service/product mix performance
   ✓ September 2025 efficiency and productivity metrics
   ✓ September 2025 growth trajectory and momentum
   ✓ September 2025 market positioning results
   ✓ September 2025 risk factors identified
   ✓ September 2025 optimization opportunities discovered

───────────────────────────────────────────────────────────────────────────────
4️⃣ SEPTEMBER 2025 TREND ANALYSIS & PATTERN RECOGNITION (Minimum 6-8 trends)
───────────────────────────────────────────────────────────────────────────────

Identify and explain September 2025 specific patterns:

**September 2025 Growth Trends:**
   • September 2025 month-over-month growth rate vs August 2025
   • September 2025 weekly progression (Week 1 → Week 4 trajectory)
   • September 2025 daily patterns and peak performance days

**September 2025 Seasonal Patterns:**
   • How did September 2025 perform vs typical September expectations?
   • September 2025 post-monsoon recovery patterns (if applicable)
   • September 2025 festival season preparation impact

**September 2025 Anomalies & Standout Events:**
   • Unexpected September 2025 spikes or drops (with ±% quantification)
   • September 2025 one-time events vs systematic changes
   • September 2025 performance outliers and explanations

**September 2025 Momentum Indicators:**
   • September 2025 leading indicators for October 2025 forecast
   • September 2025 customer behavior shifts observed
   • September 2025 operational efficiency changes

${includeRecommendations ? `
───────────────────────────────────────────────────────────────────────────────
5️⃣ SEPTEMBER 2025 STRATEGIC RECOMMENDATIONS & ACTION PLAN (7-10 recommendations)
───────────────────────────────────────────────────────────────────────────────

**EVERY RECOMMENDATION MUST BE BASED ON SEPTEMBER 2025 PERFORMANCE DATA**

Each recommendation must be structured as:

**September 2025 Recommendation #X: [Clear Action Title Based on September 2025 Insights]**
   • **Objective**: What this aims to achieve based on September 2025 learnings
   • **September 2025 Rationale**: Why September 2025 data supports this action
   • **Action Steps**: 3-5 specific steps to implement for October 2025 and beyond
   • **Expected Impact**: Quantified outcome based on September 2025 patterns
   • **Timeline**: Implementation period starting October 2025
   • **September 2025 Success Pattern**: Reference to what worked well in September 2025
   • **Priority**: Based on September 2025 performance gaps and opportunities

**Categories Based on September 2025 Analysis:**
   • Revenue optimization opportunities identified in September 2025
   • Cost reduction insights from September 2025 efficiency analysis
   • Customer experience improvements suggested by September 2025 behavior
   • Risk mitigation based on September 2025 vulnerability assessment
   • Growth acceleration initiatives inspired by September 2025 successes
   • Operational improvements needed based on September 2025 bottlenecks
` : ''}

───────────────────────────────────────────────────────────────────────────────
6️⃣ SEPTEMBER 2025 OUTLOOK & OCTOBER 2025 PROJECTIONS
───────────────────────────────────────────────────────────────────────────────

Based on September 2025 performance trends:

**October 2025 Forecast Based on September 2025 Momentum:**
   • Expected October 2025 trajectory if September 2025 trends continue
   • Optimistic October 2025 scenario (if September 2025 improvements are sustained)
   • Conservative October 2025 scenario (if September 2025 challenges persist)

**Key Questions for Leadership Based on September 2025 Results:**
   • What decisions need to be made based on September 2025 performance?
   • Where should October 2025 investment focus based on September 2025 learnings?
   • What September 2025 successes should be scaled in October 2025?

═══════════════════════════════════════════════════════════════════════════════
📝 CRITICAL FORMATTING & QUALITY REQUIREMENTS FOR SEPTEMBER 2025 ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

**Mandatory Standards for September 2025 Focus:**
✅ Every claim must reference September 2025 specifically with numbers from the data
✅ Use "September 2025" explicitly in headings and key statements
✅ Compare September 2025 to August 2025 and September 2024 where possible
✅ Include September 2025 percentages alongside absolute numbers
✅ Focus on September 2025 daily/weekly patterns within the month
✅ Highlight September 2025's ranking among recent months
✅ Provide September 2025 context for all numbers and comparisons
✅ Use September 2025-specific insights, not generic business advice

**Prohibited in September 2025 Analysis:**
❌ Generic insights that don't specifically reference September 2025
❌ Vague statements about "recent performance" without September 2025 specificity
❌ Analysis of other months without connecting back to September 2025
❌ Unsupported claims not backed by September 2025 data

**YOUR SEPTEMBER 2025 ANALYSIS BEGINS BELOW:**`;

  return prompt;
}

/**
 * Quick insight generation specifically focused on September 2025
 */
async generateQuickInsights(data: any[], columns: TableColumn[], tableName?: string): Promise<string[]> {
  try {
    const stats = this.extractTableStatistics(data, columns);
    
    const prompt = `Analyze this ${tableName || 'business'} data with EXCLUSIVE FOCUS on SEPTEMBER 2025 performance and provide 5 detailed key insights:

**CRITICAL REQUIREMENT: ALL INSIGHTS MUST SPECIFICALLY ANALYZE SEPTEMBER 2025 PERFORMANCE**

Data: ${data.length} rows
Key metrics: ${Object.values(stats.numericColumns).map((stat: any) => `${stat.header}: ${this.formatCurrency(stat.sum)}`).join(', ')}

SEPTEMBER 2025 FOCUS REQUIREMENTS for insights:
1. Start each insight with "September 2025:" when referring to performance data
2. Include September 2025 vs August 2025 comparisons (month-over-month)
3. Show how September 2025 ranks against other months in the dataset
4. Highlight September 2025 specific performance metrics and achievements
5. Compare September 2025 to historical averages and identify trends

Note: All currency figures are in Indian Rupees (₹) and large amounts should be presented in lakhs.

Provide exactly 5 detailed bullet points focusing EXCLUSIVELY on September 2025 performance with specific numbers, percentages, and month-over-month comparisons for the Indian fitness/wellness market:`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return this.extractBulletPoints(text, 5);
  } catch (error: any) {
    console.error('Quick insights error:', error);
    
    if (error?.status === 404) {
      return ['September 2025 analysis unavailable - model configuration error'];
    } else if (error?.status === 429) {
      return ['September 2025 analysis rate limited - please try again'];
    } else if (error?.status === 403) {
      return ['September 2025 analysis access denied - check configuration'];
    }
    
    return ['September 2025 analysis unavailable at this time'];
  }
}
