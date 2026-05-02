import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPreviousMonthPeriod } from '@/utils/dateUtils';
import { formatCurrency, formatNumber } from '@/utils/formatters';

// Types
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
  type?: string; // 'number' | 'currency' | 'percentage' | 'date' | 'text'
}

export interface GeminiSummaryResult {
  summary: string;
  keyInsights: string[];
  trends: string[];
  recommendations?: string[];
  diagnostics?: { focus?: string; comparedAgainst?: { mom?: string | 'not available'; yoy?: string | 'not available' } };
  error?: string;
}

class GeminiServiceImpl {
  constructor(private model: any) {}

  async generateTableSummary(options: TableSummaryOptions): Promise<GeminiSummaryResult> {
    try {
      const { tableData } = options;
      if (!tableData || tableData.length === 0) {
        return {
          summary: 'No data available for analysis.',
          keyInsights: ['No data to analyze'],
          trends: ['Insufficient data for trend analysis'],
        };
      }

      const prompt = this.buildJSONPrompt(options);
      const text = await this.callModelWithRetries(prompt);

      // Compute default diagnostics from local data in case model omits them
      const focus = this.resolveFocusPeriod(options.tableData, options.columns);
      const monthSet = this.collectMonthValues(options.tableData, options.columns);
      const diagnosticsDefault = {
        focus: focus.label,
        comparedAgainst: {
          mom: monthSet.has(focus.prev) ? focus.prevLabel : 'not available',
          yoy: monthSet.has(focus.yoy) ? focus.yoyLabel : 'not available',
        },
      } as any;

      // Strict JSON parse first
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          return {
            summary: parsed.summary || 'No summary generated.',
            keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
            trends: Array.isArray(parsed.trends) ? parsed.trends : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : undefined,
            diagnostics: parsed.diagnostics ?? diagnosticsDefault,
          };
        }
      } catch {}

      // Fallback: loose parsing
      const sections = this.parseGeminiResponse(text);
      return {
        summary: sections.summary || text.slice(0, 1000) + (text.length > 1000 ? '...' : ''),
        keyInsights: sections.keyInsights || this.extractBulletPoints(text).slice(0, 8),
        trends: sections.trends || this.extractBulletPoints(text).slice(0, 6),
        recommendations: sections.recommendations || undefined,
        diagnostics: diagnosticsDefault,
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      let errorMessage = 'AI analysis temporarily unavailable. Please try again later.';
      if (error?.status === 404) errorMessage = 'Model not found. Please check the Gemini model configuration.';
      else if (error?.status === 429) errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
      else if (error?.status === 403) errorMessage = 'API access denied. Please check your API key.';

      return {
        summary: errorMessage,
        keyInsights: ['AI service encountered an error'],
        trends: ['Unable to analyze trends at this time'],
        error: error?.message || error?.status || 'Unknown error occurred',
      };
    }
  }

  async generateQuickInsights(data: any[], columns: TableColumn[], tableName?: string): Promise<string[]> {
    try {
      if (!data || data.length === 0) return ['No data available for analysis'];
      const stats = this.extractTableStatistics(data, columns);
      const { label, prevLabel, prev, yoyLabel, yoy } = this.resolveFocusPeriod(data, columns);
      const monthSet = this.collectMonthValues(data, columns);

      // Build detailed metrics summary with INR currency
      let metricsDetails = '';
      Object.entries(stats.numericColumns).forEach(([key, stat]: [string, any]) => {
        const formatValue = (val: number) => {
          if (stat.type === 'currency') return formatCurrency(val);
          if (stat.type === 'percentage') return `${val.toFixed(1)}%`;
          return formatNumber(val);
        };
        metricsDetails += `\n• ${stat.header}: Total ${formatValue(stat.sum)}, Average ${formatValue(stat.average)}, Range ${formatValue(stat.min)}-${formatValue(stat.max)}`;
      });

      const hasMoMData = monthSet.has(prev);
      const hasYoYData = monthSet.has(yoy);

      const prompt = `You are analyzing ${tableName || 'business performance'} data for an Indian fitness/wellness studio.

📊 DATASET OVERVIEW:
• Total Records: ${data.length} entries
• Analysis Period: ${label}
• Previous Period (MoM): ${hasMoMData ? prevLabel : 'Not Available'}
• Year-over-Year: ${hasYoYData ? yoyLabel : 'Not Available'}
• Currency: Indian Rupees (₹)

📈 KEY METRICS FOR ${label.toUpperCase()}:${metricsDetails}

🎯 ANALYSIS REQUIREMENTS:
Generate 5-7 HIGHLY DETAILED and ACTIONABLE insights focusing EXCLUSIVELY on ${label}. Each insight MUST:

1. **Be Specific & Quantitative**: Include exact numbers, percentages, and currency values in INR (₹)
2. **Show Comparisons**: ${hasMoMData ? `Compare ${label} vs ${prevLabel} (month-over-month)` : 'Focus on absolute performance'}
3. **Identify Trends**: Highlight positive/negative trends with specific percentage changes
4. **Be Actionable**: Provide context that leads to business decisions
5. **Focus on Impact**: Prioritize insights that affect revenue, client retention, and operational efficiency
6. **Use Indian Market Context**: Reference Indian fitness industry benchmarks when relevant

💡 INSIGHT CATEGORIES TO COVER:
• Revenue Performance & Growth Trends (in ₹)
• Client Acquisition & Retention Metrics
• Operational Efficiency (fill rates, utilization)
• Conversion & Sales Performance
• Areas of Concern or Risk
• Opportunities for Growth

FORMAT: Return as bullet points starting with • or -
EXAMPLE: "• ${label} revenue reached ₹8.5L, showing a 12.3% increase from ${prevLabel}'s ₹7.6L, driven by higher transaction values"

Provide ${hasMoMData ? '7' : '5'} detailed, data-driven insights:`;

      const text = await this.callModelWithRetries(prompt);
      const insights = this.extractBulletPoints(text, hasMoMData ? 7 : 5);
      
      // Ensure insights are not empty and have substance
      return insights.length > 0 ? insights : [
        `${label}: ${Object.values(stats.numericColumns)[0] ? formatCurrency((Object.values(stats.numericColumns)[0] as any).sum) : 'Data available'} across ${data.length} records`,
        'AI analysis temporarily unavailable - showing basic metrics'
      ];
    } catch (error: any) {
      console.error('Quick insights error:', error);
      return ['AI insights temporarily unavailable. Please try again.'];
    }
  }

  // Prompt builder
  private buildJSONPrompt(options: TableSummaryOptions): string {
    const { tableData, columns, tableName, context, summaryType, includeRecommendations, maxRows } = options;
    const stats = this.extractTableStatistics(tableData, columns);
    const limitedData = maxRows ? tableData.slice(0, Math.min(maxRows, 5)) : tableData.slice(0, 5);

    const focus = this.resolveFocusPeriod(tableData, columns);
    const { label: focusLabel, prevLabel, yoyLabel } = focus;

    let prompt = `You are a senior business intelligence analyst for fitness/wellness studios in India. Produce JSON ONLY, no prose outside JSON.\n\nFOCUS: Entire analysis must focus on ${focusLabel}. Where comparisons are requested, compare ${focusLabel} vs ${prevLabel} (MoM) and vs ${yoyLabel} (YoY) ONLY if those periods exist in the data; otherwise state "not available".\n\n📊 DATA CONTEXT & OVERVIEW - ${focusLabel} FOCUS\n**Business Entity**: ${tableName || 'Business Performance Analytics'}\n**Primary Analysis Focus**: **${focusLabel} PERFORMANCE ASSESSMENT**\n**Context**: ${context || `${focusLabel} business performance tracking and optimization`}\n**Dataset Size**: ${stats.totalRows} total records\n**Analysis Framework**: ${summaryType || 'comprehensive'} deep-dive analysis of ${focusLabel}\n**Currency**: ALL financial figures MUST be in Indian Rupees (₹) - NEVER use USD ($) or other currencies\n`;

    // Numeric metrics
    if (Object.keys(stats.numericColumns).length > 0) {
      prompt += `\n**${focusLabel} QUANTITATIVE METRICS & FINANCIAL INDICATORS:**\n\n`;
      Object.entries(stats.numericColumns).forEach(([, stat]: [string, any]) => {
        const formatValue = (val: number) => {
          if (stat.type === 'currency') return formatCurrency(val);
          if (stat.type === 'percentage') return `${val.toFixed(1)}%`;
          return this.formatNumber(val);
        };
        const range = stat.max - stat.min;
        const variance = (stat.average !== 0 ? (range / Math.max(1e-6, stat.average)) * 100 : 0);
        prompt += `📊 **${stat.header} - ${focusLabel} Performance**\n` +
                  `• ${focusLabel} Total: ${formatValue(stat.sum)}\n` +
                  `• ${focusLabel} Average: ${formatValue(stat.average)}\n` +
                  `• ${focusLabel} Range: ${formatValue(stat.min)} → ${formatValue(stat.max)}\n` +
                  `• ${focusLabel} Variance: ${variance.toFixed(1)}%\n` +
                  `• ${focusLabel} Sample Size: ${stat.count} data points\n\n`;
      });
    }

    // Categorical metrics
    if (Object.keys(stats.textColumns).length > 0) {
      prompt += `\n**${focusLabel} CATEGORICAL DISTRIBUTION & SEGMENTATION:**\n\n`;
      Object.entries(stats.textColumns).forEach(([, stat]: [string, any]) => {
        const dominancePercentage = ((stat.mostCommon.count / Math.max(1, stats.totalRows)) * 100).toFixed(1);
        prompt += `🏷️ **${stat.header} - ${focusLabel} Analysis**\n` +
                  `• ${focusLabel} Categories: ${stat.uniqueCount}\n` +
                  `• ${focusLabel} Leader: "${stat.mostCommon.value}" (${dominancePercentage}% share)\n` +
                  `• ${focusLabel} Distribution: ${stat.examples.join(', ')}\n\n`;
      });
    }

    // Dates
    if (Object.keys(stats.dateColumns).length > 0) {
      prompt += `\n**${focusLabel} TEMPORAL SCOPE & TIME-SERIES CONTEXT:**\n\n`;
      Object.entries(stats.dateColumns).forEach(([, stat]: [string, any]) => {
        prompt += `📅 **${stat.header} - ${focusLabel} Focus**\n` +
                  `• ${focusLabel} Analysis Period: Focus on ${focusLabel}\n` +
                  `• Data Coverage: ${stat.count} ${focusLabel} records\n` +
                  `• ${focusLabel} Granularity: Daily/weekly performance within the month\n\n`;
      });
    }

    // Sample rows
    const limited = Array.isArray(limitedData) ? limitedData : [];
    if (limited.length > 0) {
      prompt += `\n═══════════════════════════════════════════════════════════════════════════════\n`;
      prompt += `📋 ${focusLabel} SAMPLE DATA EXTRACT\n`;
      prompt += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
      const headers = columns.map(c => c.header).join(' | ');
      prompt += `${headers}\n`;
      prompt += `${'─'.repeat(headers.length)}\n`;
      limited.slice(0, 5).forEach((row, idx) => {
        const rowData = columns.map(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return 'N/A';
          if (col.type === 'currency' && typeof value === 'number') return formatCurrency(value);
          if (col.type === 'number' && typeof value === 'number') return this.formatNumber(value);
          if (col.type === 'date' && value) return new Date(value).toLocaleDateString('en-IN');
          return String(value);
        }).join(' | ');
        prompt += `${idx + 1}. ${rowData}\n`;
      });
    }

    // Requirements and JSON schema
    prompt += `\n\n═══════════════════════════════════════════════════════════════════════════════\n` +
              `🎯 ${focusLabel} COMPREHENSIVE ANALYSIS REQUIREMENTS\n` +
              `═══════════════════════════════════════════════════════════════════════════════\n\n` +
              `**MANDATORY FOCUS: Every section must specifically analyze ${focusLabel} performance. If a requested comparison period doesn't exist in the data, clearly say \"not available\".**\n\n` +
              `OUTPUT REQUIREMENT: Respond ONLY with valid JSON matching this schema (no prose outside JSON):\n` +
              `{\"summary\": string, \"keyInsights\": string[], \"trends\": string[], \"recommendations\": string[] | null, \"diagnostics\": {\"focus\": string, \"comparedAgainst\": {\"mom\": string | \"not available\", \"yoy\": string | \"not available\"}}}\n\n` +
              `YOUR ANALYSIS BEGINS BELOW AS JSON ONLY:`;

    return prompt;
  }

  // Utilities
  private extractTableStatistics(data: any[], columns: TableColumn[]): any {
    const result: any = { totalRows: data.length, numericColumns: {}, textColumns: {}, dateColumns: {} };
    const isNumber = (v: any) => typeof v === 'number' && isFinite(v);
    const isString = (v: any) => typeof v === 'string' && v.trim() !== '';

    // Numeric
    columns.forEach(col => {
      let count = 0, sum = 0, min = Infinity, max = -Infinity;
      for (const row of data) {
        const v = row[col.key];
        if (isNumber(v)) {
          count++; sum += v; if (v < min) min = v; if (v > max) max = v;
        }
      }
      if (count > 0) {
        result.numericColumns[col.key] = { header: col.header, key: col.key, count, sum, average: sum / count, min, max, type: col.type || 'number' };
      }
    });

    // Text
    columns.forEach(col => {
      const freq: Record<string, number> = {};
      for (const row of data) {
        const v = row[col.key];
        if (isString(v)) freq[v] = (freq[v] || 0) + 1;
      }
      const entries = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
      if (entries.length > 0) {
        result.textColumns[col.key] = { header: col.header, key: col.key, uniqueCount: entries.length, mostCommon: { value: entries[0][0], count: entries[0][1] }, examples: entries.slice(0, 5).map(e=>`${e[0]} (${e[1]})`) };
      }
    });

    // Date
    columns.filter(c => c.type === 'date').forEach(col => {
      let count = 0; for (const row of data) { if (row[col.key]) count++; }
      result.dateColumns[col.key] = { header: col.header, key: col.key, count };
    });

    return result;
  }

  private formatNumber(value: number): string {
    return formatNumber(value);
  }

  private parseGeminiResponse(text: string): any { return { summary: '', keyInsights: [], trends: [], recommendations: undefined }; }
  private extractBulletPoints(text: string, count?: number): string[] { const lines = text.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-')); return count ? lines.slice(0, count) : lines; }

  private resolveFocusPeriod(data: any[], columns: TableColumn[]) {
    const monthKeyCandidates = ['monthYear', 'month', 'period'];
    const dateColKey = columns.find(c => c.type === 'date')?.key;
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const nowPrev = getPreviousMonthPeriod();

    const monthValues = new Set<string>();
    data.forEach(r => {
      for (const k of monthKeyCandidates) {
        if (r[k] && typeof r[k] === 'string') monthValues.add(r[k]);
      }
      if (dateColKey && r[dateColKey]) {
        const d = new Date(r[dateColKey]); if (!isNaN(d.getTime())) monthValues.add(fmt(new Date(d.getFullYear(), d.getMonth(), 1)));
      }
    });

    const months = Array.from(monthValues).sort();
    const focus = months.includes(nowPrev) ? nowPrev : (months[months.length-1] || nowPrev);
    const [fy, fm] = focus.split('-').map(Number);
    const focusDate = new Date(fy, fm - 1, 1);
    const prevDate = new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, 1);
    const yoyDate = new Date(focusDate.getFullYear() - 1, focusDate.getMonth(), 1);

    const monthName = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' });
    return {
      value: focus,
      label: `${monthName(focusDate)} ${focusDate.getFullYear()}`,
      prev: fmt(prevDate),
      prevLabel: `${monthName(prevDate)} ${prevDate.getFullYear()}`,
      yoy: fmt(yoyDate),
      yoyLabel: `${monthName(yoyDate)} ${yoyDate.getFullYear()}`,
    };
  }

  // Collect month keys present in data for MoM/YoY availability checks
  private collectMonthValues(data: any[], columns: TableColumn[]): Set<string> {
    const monthKeyCandidates = ['monthYear', 'month', 'period'];
    const dateColKey = columns.find(c => c.type === 'date')?.key;
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const set = new Set<string>();
    data.forEach(r => {
      for (const k of monthKeyCandidates) {
        if (r[k] && typeof r[k] === 'string') set.add(r[k]);
      }
      if (dateColKey && r[dateColKey]) {
        const d = new Date(r[dateColKey]);
        if (!isNaN(d.getTime())) set.add(fmt(new Date(d.getFullYear(), d.getMonth(), 1)));
      }
    });
    return set;
  }

  private async callModelWithRetries(prompt: string): Promise<string> {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    let attempt = 0; let lastError: any = null;
    while (attempt <= maxRetries) {
      try {
        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }]}],
          generationConfig: { temperature: 0.3, topP: 0.95, topK: 50, maxOutputTokens: 4096 },
          safetySettings: []
        });
        const response = await result.response; return response.text();
      } catch (error: any) {
        lastError = error;
        if (error?.status === 429 || (error?.status >= 500 && error?.status < 600)) { attempt++; if (attempt > maxRetries) break; await delay(500 * attempt * attempt); continue; }
        throw error;
      }
    }
    throw lastError || new Error('AI generation failed');
  }
}

// Initialize Google Generative AI and export singleton instance
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

let model: any;
try { model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); }
catch { try { model = genAI.getGenerativeModel({ model: 'gemini-pro' }); } catch { model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }); } }

export const geminiService = new GeminiServiceImpl(model);
