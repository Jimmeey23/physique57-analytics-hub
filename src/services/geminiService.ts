import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private model: any;

  constructor(model: any) {
    this.model = model;
  }

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
      return ['September 2025 analysis unavailable at this time'];
    } else if (error?.status === 403) {
      return ['September 2025 analysis access denied - check configuration'];
    }
    
    return ['September 2025 analysis unavailable at this time'];
  }
}

  private extractTableStatistics(data: any[], columns: any[]): any {
    return {
      totalRows: data.length,
      numericColumns: {},
      textColumns: {},
      dateColumns: {}
    };
  }

  private parseGeminiResponse(text: string): any {
    return {
      summary: '',
      keyInsights: [],
      trends: [],
      recommendations: undefined
    };
  }

  private extractBulletPoints(text: string, count?: number): string[] {
    const lines = text.split('\n').filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return count ? lines.slice(0, count) : lines;
  }

  private generateTimeBasedContext(data: any[], dateColumn: any): string {
    return '';
  }

  private getColumnPurpose(col: any): string {
    return 'Analysis column';
  }

  public formatCurrency(value: number): string {
    return `₹${value.toLocaleString('en-IN')}`;
  }

  public formatNumber(value: number): string {
    return value.toLocaleString('en-IN');
  }

  async testConnection(): Promise<{ success: boolean; model?: string; error?: string }> {
    try {
      const result = await this.model.generateContent("Hello, please respond with 'Connection successful'");
      const response = await result.response;
      return {
        success: true,
        model: this.model.model || 'gemini-model',
      };
    } catch (error: any) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error?.message || 'Connection failed'
      };
    }
  }
}

// Add missing type definitions
export interface TableSummaryOptions {
  tableData: any[];
  columns: TableColumn[];
  tableName?: string;
  context?: string;
  summaryType?: string;
  includeRecommendations?: boolean;
  maxRows?: number;
}

export interface TableColumn {
  header: string;
  key: string;
  type?: string;
}

export interface GeminiSummaryResult {
  summary: string;
  keyInsights: string[];
  trends: string[];
  recommendations?: string[];
  error?: string;
}

// Initialize Google Generative AI and export singleton instance
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSy-REDACTED_GEMINI_KEY';
const genAI = new GoogleGenerativeAI(apiKey);

<<<<<<< HEAD
// Create model instance with fallback model names
let model;
try {
  model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
} catch {
  try {
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch {
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
=======
  constructor() {
    const apiKey = 'AIzaSy-REDACTED_GEMINI_KEY';
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Extract key statistics from table data
   */
  private extractTableStatistics(data: any[], columns: TableColumn[]): any {
    if (!data.length) return {};

    const stats: any = {
      totalRows: data.length,
      numericColumns: {},
      textColumns: {},
      dateColumns: {}
    };

    columns.forEach(column => {
      const values = data.map(row => row[column.key]).filter(val => val !== null && val !== undefined);
      
      if (column.type === 'number' || column.type === 'currency' || column.type === 'percentage') {
        const numericValues = values.map(v => typeof v === 'string' ? parseFloat(v.replace(/[$,%]/g, '')) : Number(v))
          .filter(v => !isNaN(v));
        
        if (numericValues.length > 0) {
          stats.numericColumns[column.key] = {
            header: column.header,
            count: numericValues.length,
            sum: numericValues.reduce((a, b) => a + b, 0),
            average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            type: column.type
          };
        }
      } else if (column.type === 'text') {
        const uniqueValues = [...new Set(values)];
        stats.textColumns[column.key] = {
          header: column.header,
          uniqueCount: uniqueValues.length,
          mostCommon: this.getMostCommonValue(values),
          examples: uniqueValues.slice(0, 5)
        };
      } else if (column.type === 'date') {
        const dateValues = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (dateValues.length > 0) {
          stats.dateColumns[column.key] = {
            header: column.header,
            count: dateValues.length,
            earliest: new Date(Math.min(...dateValues.map(d => d.getTime()))),
            latest: new Date(Math.max(...dateValues.map(d => d.getTime()))),
            range: this.getDateRange(dateValues)
          };
        }
      }
    });

    return stats;
  }

  /**
   * Get the most common value in an array
   */
  private getMostCommonValue(values: any[]): { value: any; count: number } {
    const frequency: Record<string, number> = {};
    values.forEach(val => {
      const key = String(val);
      frequency[key] = (frequency[key] || 0) + 1;
    });
    
    const entries = Object.entries(frequency);
    const mostCommon = entries.reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
    return { value: mostCommon[0], count: mostCommon[1] };
  }

  /**
   * Calculate date range description
   */
  private getDateRange(dates: Date[]): string {
    if (dates.length < 2) return 'Single date';
    
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    const diffInDays = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) return `${diffInDays} days`;
    if (diffInDays < 365) return `${Math.ceil(diffInDays / 30)} months`;
    return `${Math.ceil(diffInDays / 365)} years`;
  }

  /**
   * Format currency values for AI analysis
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Format number values for AI analysis
   */
  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Create a prompt for Gemini based on table data and options
   */
  private createAnalysisPrompt(options: TableSummaryOptions): string {
    const { tableData, columns, tableName, context, summaryType, includeRecommendations, maxRows } = options;
    const stats = this.extractTableStatistics(tableData, columns);
    const limitedData = maxRows ? tableData.slice(0, maxRows) : tableData;

    let prompt = `You are an expert business analyst specializing in fitness/wellness industry data analysis. Please analyze the following table data and provide insights.

**TABLE INFORMATION:**
- Table Name: ${tableName || 'Analytics Table'}
- Context: ${context || 'Business performance data'}
- Total Rows: ${stats.totalRows}
- Analysis Type: ${summaryType || 'comprehensive'}

**COLUMN STRUCTURE:**
${columns.map(col => `- ${col.header} (${col.key}): ${col.type || 'text'} data`).join('\n')}

**STATISTICAL SUMMARY:**`;

    // Add numeric column statistics
    if (Object.keys(stats.numericColumns).length > 0) {
      prompt += '\n\n**NUMERIC METRICS:**\n';
      Object.entries(stats.numericColumns).forEach(([key, stat]: [string, any]) => {
        const formatValue = (val: number) => {
          if (stat.type === 'currency') return this.formatCurrency(val);
          if (stat.type === 'percentage') return `${val.toFixed(1)}%`;
          return this.formatNumber(val);
        };
        
        prompt += `- ${stat.header}: Total: ${formatValue(stat.sum)}, Average: ${formatValue(stat.average)}, Range: ${formatValue(stat.min)} - ${formatValue(stat.max)}\n`;
      });
    }

    // Add text column statistics
    if (Object.keys(stats.textColumns).length > 0) {
      prompt += '\n**CATEGORICAL DATA:**\n';
      Object.entries(stats.textColumns).forEach(([key, stat]: [string, any]) => {
        prompt += `- ${stat.header}: ${stat.uniqueCount} unique values, Most common: "${stat.mostCommon.value}" (${stat.mostCommon.count} times)\n`;
      });
    }

    // Add date range information
    if (Object.keys(stats.dateColumns).length > 0) {
      prompt += '\n**TIME PERIOD:**\n';
      Object.entries(stats.dateColumns).forEach(([key, stat]: [string, any]) => {
        prompt += `- ${stat.header}: From ${stat.earliest.toLocaleDateString()} to ${stat.latest.toLocaleDateString()} (${stat.range})\n`;
      });
    }

    // Add sample data
    if (limitedData.length > 0) {
      prompt += '\n**SAMPLE DATA (First 10 rows):**\n';
      const sampleData = limitedData.slice(0, 10);
      const headers = columns.map(col => col.header).join(' | ');
      prompt += `${headers}\n`;
      prompt += '-'.repeat(headers.length) + '\n';
      
      sampleData.forEach(row => {
        const rowData = columns.map(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return 'N/A';
          if (col.type === 'currency' && typeof value === 'number') return this.formatCurrency(value);
          if (col.type === 'number' && typeof value === 'number') return this.formatNumber(value);
          return String(value);
        }).join(' | ');
        prompt += `${rowData}\n`;
      });
    }

    prompt += `\n\n**ANALYSIS REQUEST:**
Based on this ${tableName || 'table'} data, please provide:

1. **Executive Summary**: A concise overview of what this data shows (2-3 sentences)

2. **Key Insights**: 3-5 specific, actionable insights from the data

3. **Trends & Patterns**: Notable trends, patterns, or anomalies you observe

4. **Performance Assessment**: How is performance across different metrics/categories?

${includeRecommendations ? '5. **Strategic Recommendations**: 3-4 specific, actionable recommendations based on the data\n' : ''}

**FORMATTING REQUIREMENTS:**
- Use clear, business-appropriate language
- Include specific numbers and percentages where relevant  
- Focus on actionable insights for fitness/wellness business operations
- Use bullet points for clarity
- Highlight the most important findings
- Keep each section concise but informative

**RESPONSE FORMAT:**
Structure your response with clear section headers and bullet points. Be specific and data-driven in your analysis.`;

    return prompt;
  }

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
        summary: sections.summary || text.slice(0, 500) + '...',
        keyInsights: sections.keyInsights || ['Analysis completed successfully'],
        trends: sections.trends || ['Multiple patterns identified'],
        recommendations: sections.recommendations || undefined
      };
      
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        summary: 'AI analysis temporarily unavailable. Please try again later.',
        keyInsights: ['AI service encountered an error'],
        trends: ['Unable to analyze trends at this time'],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse Gemini response into structured sections
   */
  private parseGeminiResponse(text: string): {
    summary?: string;
    keyInsights?: string[];
    trends?: string[];
    recommendations?: string[];
  } {
    const sections: any = {};
    
    try {
      // Split by common section headers
      const summaryMatch = text.match(/(?:Executive Summary|Summary)[:\s]*\n(.*?)(?=\n.*(?:Key Insights|Insights|Trends|Recommendations)|$)/is);
      if (summaryMatch) {
        sections.summary = summaryMatch[1].trim();
      }

      const insightsMatch = text.match(/(?:Key Insights|Insights)[:\s]*\n(.*?)(?=\n.*(?:Trends|Performance|Recommendations)|$)/is);
      if (insightsMatch) {
        sections.keyInsights = this.extractBulletPoints(insightsMatch[1]);
      }

      const trendsMatch = text.match(/(?:Trends|Patterns|Performance)[:\s]*\n(.*?)(?=\n.*(?:Recommendations|Strategic)|$)/is);
      if (trendsMatch) {
        sections.trends = this.extractBulletPoints(trendsMatch[1]);
      }

      const recommendationsMatch = text.match(/(?:Strategic Recommendations|Recommendations)[:\s]*\n(.*?)$/is);
      if (recommendationsMatch) {
        sections.recommendations = this.extractBulletPoints(recommendationsMatch[1]);
      }
    } catch (error) {
      console.warn('Error parsing Gemini response structure:', error);
    }

    return sections;
  }

  /**
   * Extract bullet points from text
   */
  private extractBulletPoints(text: string): string[] {
    if (!text) return [];
    
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 10); // Filter out very short lines
    
    return lines.slice(0, 6); // Limit to 6 points maximum
  }

  /**
   * Quick insight generation for smaller data sets
   */
  async generateQuickInsights(data: any[], columns: TableColumn[], tableName?: string): Promise<string[]> {
    try {
      const stats = this.extractTableStatistics(data, columns);
      
      const prompt = `Analyze this ${tableName || 'business'} data and provide 3 key insights in bullet points:

Data: ${data.length} rows
Key metrics: ${Object.values(stats.numericColumns).map((stat: any) => `${stat.header}: ${this.formatCurrency(stat.sum)}`).join(', ')}

Provide exactly 3 bullet points with actionable insights:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.extractBulletPoints(text).slice(0, 3);
    } catch (error) {
      console.error('Quick insights error:', error);
      return ['Analysis unavailable at this time'];
    }
>>>>>>> parent of d2e692a (feat: Update Gemini API key handling and model configuration)
  }
}

// Export singleton instance
export const geminiService = new GeminiService(model);
