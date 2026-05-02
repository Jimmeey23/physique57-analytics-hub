import { SummaryResult } from './openaiService';

export interface StoredSummary {
  id: string;
  context: string;
  location_id: string;
  summary: string;
  key_insights: string[];
  trends: string[];
  recommendations: string[];
  data_quality_score: number;
  data_quality_issues: string[];
  data_snapshot: {
    totalRows: number;
    columnsAnalyzed: number;
    keyMetrics: Record<string, any>;
  };
  filters_applied: Record<string, any>;
  date_range: {
    start: string;
    end: string;
  } | null;
  created_at: string;
  updated_at: string;
  data_hash: string;
}

function rowToStored(row: any): StoredSummary {
  return {
    id: String(row.id),
    context: row.context,
    location_id: row.locationId ?? row.location_id,
    summary: row.summary,
    key_insights: row.keyInsights ?? row.key_insights ?? [],
    trends: row.trends ?? [],
    recommendations: row.recommendations ?? [],
    data_quality_score: row.dataQualityScore ?? row.data_quality_score ?? 0,
    data_quality_issues: row.dataQualityIssues ?? row.data_quality_issues ?? [],
    data_snapshot: row.dataSnapshot ?? row.data_snapshot ?? { totalRows: 0, columnsAnalyzed: 0, keyMetrics: {} },
    filters_applied: row.filtersApplied ?? row.filters_applied ?? {},
    date_range: row.dateRangeStart
      ? { start: row.dateRangeStart, end: row.dateRangeEnd ?? '' }
      : null,
    created_at: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    updated_at: row.updatedAt ?? row.updated_at ?? new Date().toISOString(),
    data_hash: row.dataHash ?? row.data_hash ?? '',
  };
}

class SupabaseService {
  async saveSummary(
    context: string,
    locationId: string,
    summary: SummaryResult,
    filters?: Record<string, any>,
    dateRange?: { start: string; end: string }
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const resp = await fetch('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          locationId,
          summary: summary.summary,
          keyInsights: summary.keyInsights ?? [],
          trends: summary.trends ?? [],
          recommendations: summary.recommendations ?? [],
          dataQualityScore: summary.dataQuality?.score ?? 0,
          dataQualityIssues: summary.dataQuality?.issues ?? [],
          dataSnapshot: summary.dataSnapshot ?? null,
          filtersApplied: filters ?? null,
          dateRangeStart: dateRange?.start ?? null,
          dateRangeEnd: dateRange?.end ?? null,
          dataHash: '',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data.error };
      return { success: true, id: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getSummaries(
    context: string,
    locationId: string,
    limit: number = 5
  ): Promise<{ success: boolean; summaries?: StoredSummary[]; error?: string }> {
    try {
      const params = new URLSearchParams({ context, location_id: locationId, limit: String(limit) });
      const resp = await fetch(`/api/summaries?${params}`);
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data.error };
      return { success: true, summaries: (data.summaries ?? []).map(rowToStored) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getLatestSummary(
    context: string,
    locationId: string,
    _filters?: Record<string, any>,
    _dateRange?: { start: string; end: string }
  ): Promise<{ success: boolean; summary?: StoredSummary; error?: string }> {
    try {
      const params = new URLSearchParams({ context, location_id: locationId });
      const resp = await fetch(`/api/summaries/latest?${params}`);
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data.error };
      return { success: true, summary: data.summary ? rowToStored(data.summary) : undefined };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async deleteSummary(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const resp = await fetch(`/api/summaries/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data.error };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async clearSummaries(
    context: string,
    locationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const params = new URLSearchParams({ context, location_id: locationId });
      const resp = await fetch(`/api/summaries?${params}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) return { success: false, error: data.error };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const resp = await fetch('/api/healthz');
      return { success: resp.ok };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const supabaseService = new SupabaseService();
