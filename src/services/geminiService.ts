import { GoogleGenerativeAI } from '@google/generative-ai';

interface TableColumn {
  key: string;
  header: string;
  type?: 'number' | 'currency' | 'percentage' | 'text' | 'date';
}

interface TableSummaryOptions {
  tableData: any[];
  columns: TableColumn[];
  tableName?: string;
  context?: string;
  summaryType?: 'comprehensive' | 'insights' | 'trends' | 'performance' | 'brief';
  includeRecommendations?: boolean;
  maxRows?: number;
}

interface GeminiSummaryResult {
  summary: string;
  keyInsights: string[];
  trends: string[];
  recommendations?: string[];
  error?: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSy-REDACTED_GEMINI_KEY';
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the exact model name from your reference
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",  // Matching your bash script reference
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    });
  }

  /**
   * Test the Gemini connection and model availability
   */
  async testConnection(): Promise<{ success: boolean; model?: string; error?: string }> {
    try {
      const testResult = await this.model.generateContent("Hello, please respond with 'Connection successful'");
      const response = await testResult.response;
      const text = response.text();
      
      return {
        success: true,
        model: "gemini-flash-latest",
      };
    } catch (error: any) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error?.message || 'Connection failed'
      };
    }
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
   * Format currency values for AI analysis in INR lakhs
   */
  private formatCurrency(value: number): string {
    const valueInLakhs = value / 100000; // Convert to lakhs
    if (valueInLakhs >= 1) {
      return `₹${valueInLakhs.toFixed(2)} lakhs`;
    } else {
      // For values less than 1 lakh, show in thousands
      const valueInThousands = value / 1000;
      if (valueInThousands >= 1) {
        return `₹${valueInThousands.toFixed(1)}K`;
      } else {
        return `₹${value.toLocaleString('en-IN')}`;
      }
    }
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
Based on this ${tableName || 'table'} data, please provide a comprehensive and detailed analysis:

1. **Executive Summary**: A detailed overview of what this data shows, highlighting the most significant findings and overall business performance (4-5 sentences minimum)

2. **Key Insights**: 5-8 specific, actionable insights from the data with supporting numbers and percentages. Each insight should be detailed and explain the business impact

3. **Trends & Patterns**: Detailed analysis of notable trends, patterns, seasonality, growth rates, or anomalies you observe. Include month-over-month or period-over-period comparisons where applicable

4. **Performance Assessment**: Comprehensive evaluation of performance across different metrics/categories, including:
   - Top performers and underperformers
   - Efficiency metrics and ratios
   - Comparative analysis between categories/segments
   - Performance benchmarks and targets

5. **Financial Analysis**: Detailed revenue analysis including:
   - Revenue distribution and concentration
   - Average transaction values and member spending patterns
   - Revenue per category/service breakdown
   - Growth rates and financial health indicators

${includeRecommendations ? '6. **Strategic Recommendations**: 5-7 specific, actionable recommendations with implementation steps and expected outcomes\n' : ''}

**CURRENCY FORMAT NOTE**: All revenue/financial figures are in Indian Rupees (₹) and should be presented in lakhs for large amounts (1 lakh = ₹100,000).

**DETAILED FORMATTING REQUIREMENTS:**
- Use clear, business-appropriate language suitable for executive reporting
- Include specific numbers, percentages, and financial metrics throughout
- Focus on actionable insights for fitness/wellness business operations in the Indian market
- Use detailed bullet points with sub-points where necessary
- Highlight the most important findings with emphasis
- Provide context for all metrics and comparisons
- Each section should be comprehensive and informative
- Include growth rates, ratios, and benchmark comparisons
- Explain the business implications of each finding

**RESPONSE FORMAT:**
Structure your response with clear section headers and detailed bullet points. Be extremely specific and data-driven in your analysis. Ensure no important insights are missed and provide comprehensive business intelligence.`;

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
      // Enhanced pattern matching for more comprehensive sections
      const summaryMatch = text.match(/(?:Executive Summary|Summary)[:\s]*\n([\s\S]*?)(?=\n\s*(?:\d+\.|\*\*(?:Key Insights|Insights|Trends|Performance|Financial|Recommendations)))/i);
      if (summaryMatch) {
        sections.summary = summaryMatch[1].trim();
      }

      // Capture Key Insights with more flexible matching
      const insightsMatch = text.match(/(?:Key Insights|Insights)[:\s]*\n([\s\S]*?)(?=\n\s*(?:\d+\.|\*\*(?:Trends|Performance|Financial|Recommendations)))/i);
      if (insightsMatch) {
        sections.keyInsights = this.extractBulletPoints(insightsMatch[1], 8);
      }

      // Capture Trends, Performance Assessment, and Financial Analysis together
      const trendsMatch = text.match(/(?:Trends|Patterns|Performance Assessment|Financial Analysis)[\s\S]*?\n([\s\S]*?)(?=\n\s*(?:\d+\.|\*\*(?:Strategic|Recommendations))|$)/i);
      if (trendsMatch) {
        sections.trends = this.extractBulletPoints(trendsMatch[1], 8);
      }

      const recommendationsMatch = text.match(/(?:Strategic Recommendations|Recommendations)[:\s]*\n([\s\S]*?)$/i);
      if (recommendationsMatch) {
        sections.recommendations = this.extractBulletPoints(recommendationsMatch[1], 8);
      }
      
      // If structured parsing fails, try to extract all bullet points from the full text
      if (!sections.keyInsights || sections.keyInsights.length === 0) {
        const allPoints = this.extractBulletPoints(text, 15);
        sections.keyInsights = allPoints.slice(0, 8);
        sections.trends = allPoints.slice(8, 14);
        if (allPoints.length > 14) {
          sections.recommendations = allPoints.slice(14);
        }
      }
      
    } catch (error) {
      console.warn('Error parsing Gemini response structure:', error);
    }

    return sections;
  }

  /**
   * Extract bullet points from text with configurable limits
   */
  private extractBulletPoints(text: string, maxPoints: number = 8): string[] {
    if (!text) return [];
    
    // Split by various bullet point indicators and numbered lists
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove various bullet point prefixes
        return line.replace(/^[-•*+→▶]\s*/, '')
                  .replace(/^\d+\.\s*/, '')
                  .replace(/^[a-zA-Z]\.\s*/, '')
                  .trim();
      })
      .filter(line => {
        // Filter out very short lines, headers, and section markers
        return line.length > 15 && 
               !line.match(/^\*\*.*\*\*$/) && // Remove markdown headers
               !line.match(/^#{1,6}\s/) && // Remove markdown headers
               !line.includes('**') && // Remove bold markers
               line.length < 500; // Remove overly long paragraphs
      })
      .map(line => {
        // Clean up the text and ensure proper formatting
        return line.replace(/\*\*/g, '').trim();
      })
      .filter(line => line.length > 15); // Final length filter
    
    return lines.slice(0, maxPoints);
  }

  /**
   * Quick insight generation for smaller data sets
   */
  async generateQuickInsights(data: any[], columns: TableColumn[], tableName?: string): Promise<string[]> {
    try {
      const stats = this.extractTableStatistics(data, columns);
      
      const prompt = `Analyze this ${tableName || 'business'} data and provide 5 detailed key insights in bullet points:

Data: ${data.length} rows
Key metrics: ${Object.values(stats.numericColumns).map((stat: any) => `${stat.header}: ${this.formatCurrency(stat.sum)}`).join(', ')}

Note: All currency figures are in Indian Rupees (₹) and large amounts should be presented in lakhs.

Provide exactly 5 detailed bullet points with specific numbers, percentages, and actionable business insights for the Indian fitness/wellness market:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.extractBulletPoints(text, 5);
    } catch (error: any) {
      console.error('Quick insights error:', error);
      
      if (error?.status === 404) {
        return ['Model configuration error - please contact support'];
      } else if (error?.status === 429) {
        return ['Rate limit exceeded - please try again in a moment'];
      } else if (error?.status === 403) {
        return ['API access denied - please check configuration'];
      }
      
      return ['Analysis unavailable at this time'];
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export type { TableSummaryOptions, GeminiSummaryResult, TableColumn };