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
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    });
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
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export type { TableSummaryOptions, GeminiSummaryResult, TableColumn };