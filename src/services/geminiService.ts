import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPreviousMonthPeriod } from '@/utils/dateUtils';

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

      // Strict JSON parse first
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          return {
            summary: parsed.summary || 'No summary generated.',
            keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
            trends: Array.isArray(parsed.trends) ? parsed.trends : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : undefined,
            diagnostics: parsed.diagnostics,
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
      if (!data || data.length === 0) return ['No data available'];
      const stats = this.extractTableStatistics(data, columns);
      const { label, prevLabel } = this.resolveFocusPeriod(data, columns);

      const prompt = `Analyze this ${tableName || 'business'} data with EXCLUSIVE FOCUS on ${label} performance and provide 5 detailed key insights:\n\nData: ${data.length} rows\nKey metrics: ${Object.values(stats.numericColumns).map((stat: any) => `${stat.header}: ${this.formatCurrency(stat.sum)}`).join(', ')}\n\n${label} FOCUS REQUIREMENTS for insights:\n1. Start each insight with "${label}:" when referring to performance data\n2. Include ${label} vs ${prevLabel} comparisons (month-over-month) if available\n3. Show how ${label} ranks against other months in the dataset\n4. Highlight ${label} specific performance metrics and achievements\n5. Compare ${label} to historical averages and identify trends\n\nProvide exactly 5 detailed bullet points focusing EXCLUSIVELY on ${label} performance with specific numbers, percentages, and month-over-month comparisons for the Indian fitness/wellness market:`;

      const text = await this.callModelWithRetries(prompt);
      return this.extractBulletPoints(text, 5);
    } catch (error: any) {
      console.error('Quick insights error:', error);
      return ['Insights unavailable at this time'];
    }
  }

  // Prompt builder
  private buildJSONPrompt(options: TableSummaryOptions): string {
    const { tableData, columns, tableName, context, summaryType, includeRecommendations, maxRows } = options;
    const stats = this.extractTableStatistics(tableData, columns);
    const limitedData = maxRows ? tableData.slice(0, Math.min(maxRows, 5)) : tableData.slice(0, 5);

    const focus = this.resolveFocusPeriod(tableData, columns);
    const { label: focusLabel, prevLabel, yoyLabel } = focus;

    let prompt = `You are a senior business intelligence analyst for fitness/wellness (India). Produce JSON ONLY, no prose outside JSON.\n\nFOCUS: Entire analysis must focus on ${focusLabel}. Where comparisons are requested, compare ${focusLabel} vs ${prevLabel} (MoM) and vs ${yoyLabel} (YoY) ONLY if those periods exist in the data; otherwise state \"not available\".\n\n📊 DATA CONTEXT & OVERVIEW - ${focusLabel} FOCUS\n**Business Entity**: ${tableName || 'Business Performance Analytics'}\n**Primary Analysis Focus**: **${focusLabel} PERFORMANCE ASSESSMENT**\n**Context**: ${context || `${focusLabel} business performance tracking and optimization`}\n**Dataset Size**: ${stats.totalRows} total records\n**Analysis Framework**: ${summaryType || 'comprehensive'} deep-dive analysis of ${focusLabel}\n**Currency**: All financial figures in Indian Rupees (₹)\n`;

    // Numeric metrics
    if (Object.keys(stats.numericColumns).length > 0) {
      prompt += `\n**${focusLabel} QUANTITATIVE METRICS & FINANCIAL INDICATORS:**\n\n`;
      Object.entries(stats.numericColumns).forEach(([, stat]: [string, any]) => {
        const formatValue = (val: number) => {
          if (stat.type === 'currency') return this.formatCurrency(val);
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
          if (col.type === 'currency' && typeof value === 'number') return this.formatCurrency(value);
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

  private async callModelWithRetries(prompt: string): Promise<string> {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    let attempt = 0; let lastError: any = null;
    while (attempt <= maxRetries) {
      try {
        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }]}],
          generationConfig: { temperature: 0.2, topP: 0.9, topK: 40, maxOutputTokens: 2048 },
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

  public formatCurrency(value: number): string { return `₹${value.toLocaleString('en-IN')}`; }
  public formatNumber(value: number): string { return value.toLocaleString('en-IN'); }
}

// Initialize Google Generative AI and export singleton instance
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) { console.error('Gemini API key missing. Set VITE_GEMINI_API_KEY in environment.'); }
const genAI = new GoogleGenerativeAI(apiKey);

let model: any;
try { model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); }
catch { try { model = genAI.getGenerativeModel({ model: 'gemini-pro' }); } catch { model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }); } }

export const geminiService = new GeminiServiceImpl(model);
