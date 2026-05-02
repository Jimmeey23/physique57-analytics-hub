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

class SupabaseService {
  async saveSummary(
    _context: string,
    _locationId: string,
    _summary: SummaryResult,
    _filters?: Record<string, any>,
    _dateRange?: { start: string; end: string }
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    return { success: false, error: 'Persistence not available' };
  }

  async getSummaries(
    _context: string,
    _locationId: string,
    _limit: number = 5
  ): Promise<{ success: boolean; summaries?: StoredSummary[]; error?: string }> {
    return { success: true, summaries: [] };
  }

  async getLatestSummary(
    _context: string,
    _locationId: string,
    _filters?: Record<string, any>,
    _dateRange?: { start: string; end: string }
  ): Promise<{ success: boolean; summary?: StoredSummary; error?: string }> {
    return { success: true, summary: undefined };
  }

  async deleteSummary(_id: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Not available' };
  }

  async clearSummaries(
    _context: string,
    _locationId: string
  ): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Not available' };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Supabase not configured' };
  }
}

export const supabaseService = new SupabaseService();
