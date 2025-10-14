/**
 * External Document Service
 * Handles fetching and caching data from external sources like Google Docs
 * for contextual information display when Kwality House tab is selected
 */

export interface ExternalDocumentData {
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
  monthlyAnalysis?: {
    trends: string[];
    insights: string[];
    recommendations: string[];
    keyMetrics: string[];
  };
  yearlyAnalysis?: {
    trends: string[];
    insights: string[];
    recommendations: string[];
    keyMetrics: string[];
  };
  productPerformance?: {
    insights: string[];
    recommendations: string[];
    topProducts: string[];
    trends: string[];
  };
  categoryPerformance?: {
    insights: string[];
    recommendations: string[];
    topCategories: string[];
    trends: string[];
  };
  salesTeamAnalysis?: {
    insights: string[];
    recommendations: string[];
    topPerformers: string[];
    strategies: string[];
  };
  paymentAnalysis?: {
    insights: string[];
    recommendations: string[];
    trends: string[];
    preferences: string[];
  };
  topBottomAnalysis?: {
    insights: string[];
    recommendations: string[];
    topPerformers: string[];
    bottomPerformers: string[];
    strategies: string[];
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

class ExternalDocumentService {
  private cache: Map<string, { data: ExternalDocumentData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly DOC_URL = 'https://docs.google.com/document/d/1p-hxVjAHFvuyBo1l04ibxRQIkNj4-VzcFO1-viFN3gw/edit?tab=t.0';

  /**
   * Fetches document data with caching
   * Uses Google Docs API to fetch real-time data from the document
   */
  async fetchDocumentData(): Promise<ExternalDocumentData> {
    const cacheKey = 'kwality-doc-data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Attempt to fetch from Google Docs API
      const data = await this.fetchFromGoogleDocs();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch external document data:', error);
      // Return empty data structure instead of fallback mock data
      return this.getEmptyDataStructure();
    }
  }

  /**
   * Fetch data from Google Docs API
   */
  private async fetchFromGoogleDocs(): Promise<ExternalDocumentData> {
    // Extract document ID from URL
    const docId = '1p-hxVjAHFvuyBo1l04ibxRQIkNj4-VzcFO1-viFN3gw';
    
    try {
      // Option 1: Try to fetch via Google Docs API (requires API key)
      // const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}?key=${API_KEY}`);
      
      // Option 2: Try to fetch published version (if document is published to web)
      const publishedUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const response = await fetch(publishedUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }
      
      const content = await response.text();
      return this.parseDocumentContent(content);
      
    } catch (error) {
      console.warn('Direct Google Docs fetch failed, document may not be public:', error);
      throw error;
    }
  }

  /**
   * Parse document content into structured data
   * Extracts real data from Google Docs content
   */
  private parseDocumentContent(content: string): ExternalDocumentData {
    const data: ExternalDocumentData = {};
    
    // Parse content by sections
    const sections = this.splitIntoSections(content);
    
    // Extract trainer performance data
    const trainerSection = this.findSection(sections, ['trainer', 'performance', 'instructor']);
    if (trainerSection) {
      data.trainerPerformance = this.parseTrainerData(trainerSection);
    }
    
    // Extract general sales insights
    const salesSection = this.findSection(sections, ['sales', 'revenue', 'performance']);
    if (salesSection) {
      data.salesInsights = this.parseSalesData(salesSection);
    }
    
    // Extract monthly analysis
    const monthlySection = this.findSection(sections, ['monthly', 'month-on-month', 'monthly analysis', 'monthly trends']);
    if (monthlySection) {
      data.monthlyAnalysis = this.parseMonthlyAnalysis(monthlySection);
    }
    
    // Extract yearly analysis
    const yearlySection = this.findSection(sections, ['yearly', 'year-on-year', 'annual', 'yearly analysis']);
    if (yearlySection) {
      data.yearlyAnalysis = this.parseYearlyAnalysis(yearlySection);
    }
    
    // Extract product performance
    const productSection = this.findSection(sections, ['product', 'membership', 'package', 'pricing']);
    if (productSection) {
      data.productPerformance = this.parseProductPerformance(productSection);
    }
    
    // Extract category performance
    const categorySection = this.findSection(sections, ['category', 'type', 'classification']);
    if (categorySection) {
      data.categoryPerformance = this.parseCategoryPerformance(categorySection);
    }
    
    // Extract sales team analysis
    const teamSection = this.findSection(sections, ['team', 'staff', 'sold by', 'employees']);
    if (teamSection) {
      data.salesTeamAnalysis = this.parseSalesTeamAnalysis(teamSection);
    }
    
    // Extract payment analysis
    const paymentSection = this.findSection(sections, ['payment', 'method', 'billing', 'transaction']);
    if (paymentSection) {
      data.paymentAnalysis = this.parsePaymentAnalysis(paymentSection);
    }
    
    // Extract top/bottom analysis
    const topBottomSection = this.findSection(sections, ['top', 'bottom', 'best', 'worst', 'ranking']);
    if (topBottomSection) {
      data.topBottomAnalysis = this.parseTopBottomAnalysis(topBottomSection);
    }
    
    // Extract class format data
    const classSection = this.findSection(sections, ['class', 'format', 'barre', 'powercycle']);
    if (classSection) {
      data.classFormatData = this.parseClassFormatData(classSection);
    }
    
    // Extract retention data
    const retentionSection = this.findSection(sections, ['retention', 'client', 'member']);
    if (retentionSection) {
      data.clientRetentionData = this.parseRetentionData(retentionSection);
    }
    
    // Extract sessions data
    const sessionsSection = this.findSection(sections, ['session', 'schedule', 'booking']);
    if (sessionsSection) {
      data.sessionsData = this.parseSessionsData(sessionsSection);
    }
    
    // Extract general insights
    const generalSection = this.findSection(sections, ['market', 'insight', 'trend']);
    if (generalSection) {
      data.generalInsights = this.parseGeneralInsights(generalSection);
    }
    
    return data;
  }

  private splitIntoSections(content: string): string[] {
    // Split content by headers (lines starting with caps or numbers)
    return content.split(/\n(?=[A-Z][A-Z\s]+|[0-9]+\.|\*\*|##)/g);
  }

  private findSection(sections: string[], keywords: string[]): string | null {
    return sections.find(section => 
      keywords.some(keyword => 
        section.toLowerCase().includes(keyword.toLowerCase())
      )
    ) || null;
  }

  private parseTrainerData(content: string): ExternalDocumentData['trainerPerformance'] {
    const lines = content.split('\n').filter(line => line.trim());
    const trainers: Array<{name: string; performance: string; metrics: string; location?: string}> = [];
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isTrainerEntry(trimmed)) {
        const trainer = this.parseTrainerEntry(trimmed);
        if (trainer) trainers.push(trainer);
      } else if (this.isInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      }
    });
    
    return { topTrainers: trainers, insights, recommendations };
  }

  private parseSalesData(content: string): ExternalDocumentData['salesInsights'] {
    const lines = content.split('\n').filter(line => line.trim());
    const performanceNotes: string[] = [];
    const trends: string[] = [];
    const actionItems: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isPerformanceNote(trimmed)) {
        performanceNotes.push(this.cleanText(trimmed));
      } else if (this.isTrend(trimmed)) {
        trends.push(this.cleanText(trimmed));
      } else if (this.isActionItem(trimmed)) {
        actionItems.push(this.cleanText(trimmed));
      }
    });
    
    return { performanceNotes, trends, actionItems };
  }

  private parseClassFormatData(content: string): ExternalDocumentData['classFormatData'] {
    const lines = content.split('\n').filter(line => line.trim());
    const popularFormats: string[] = [];
    const attendance: string[] = [];
    const feedback: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isFormatInfo(trimmed)) {
        popularFormats.push(this.cleanText(trimmed));
      } else if (this.isAttendanceInfo(trimmed)) {
        attendance.push(this.cleanText(trimmed));
      } else if (this.isFeedback(trimmed)) {
        feedback.push(this.cleanText(trimmed));
      }
    });
    
    return { popularFormats, attendance, feedback };
  }

  private parseRetentionData(content: string): ExternalDocumentData['clientRetentionData'] {
    const lines = content.split('\n').filter(line => line.trim());
    const retentionTips: string[] = [];
    const churnAnalysis: string[] = [];
    const successStories: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isRetentionTip(trimmed)) {
        retentionTips.push(this.cleanText(trimmed));
      } else if (this.isChurnAnalysis(trimmed)) {
        churnAnalysis.push(this.cleanText(trimmed));
      } else if (this.isSuccessStory(trimmed)) {
        successStories.push(this.cleanText(trimmed));
      }
    });
    
    return { retentionTips, churnAnalysis, successStories };
  }

  private parseSessionsData(content: string): ExternalDocumentData['sessionsData'] {
    const lines = content.split('\n').filter(line => line.trim());
    const peakTimes: string[] = [];
    const utilization: string[] = [];
    const optimization: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isPeakTime(trimmed)) {
        peakTimes.push(this.cleanText(trimmed));
      } else if (this.isUtilization(trimmed)) {
        utilization.push(this.cleanText(trimmed));
      } else if (this.isOptimization(trimmed)) {
        optimization.push(this.cleanText(trimmed));
      }
    });
    
    return { peakTimes, utilization, optimization };
  }

  private parseGeneralInsights(content: string): ExternalDocumentData['generalInsights'] {
    const lines = content.split('\n').filter(line => line.trim());
    const marketTrends: string[] = [];
    const competitorAnalysis: string[] = [];
    const opportunities: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isMarketTrend(trimmed)) {
        marketTrends.push(this.cleanText(trimmed));
      } else if (this.isCompetitorAnalysis(trimmed)) {
        competitorAnalysis.push(this.cleanText(trimmed));
      } else if (this.isOpportunity(trimmed)) {
        opportunities.push(this.cleanText(trimmed));
      }
    });
    
    return { marketTrends, competitorAnalysis, opportunities };
  }

  private parseMonthlyAnalysis(content: string): ExternalDocumentData['monthlyAnalysis'] {
    const lines = content.split('\n').filter(line => line.trim());
    const trends: string[] = [];
    const insights: string[] = [];
    const recommendations: string[] = [];
    const keyMetrics: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isMonthlyTrend(trimmed)) {
        trends.push(this.cleanText(trimmed));
      } else if (this.isMonthlyInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      } else if (this.isKeyMetric(trimmed)) {
        keyMetrics.push(this.cleanText(trimmed));
      }
    });
    
    return { trends, insights, recommendations, keyMetrics };
  }

  private parseYearlyAnalysis(content: string): ExternalDocumentData['yearlyAnalysis'] {
    const lines = content.split('\n').filter(line => line.trim());
    const trends: string[] = [];
    const insights: string[] = [];
    const recommendations: string[] = [];
    const keyMetrics: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isYearlyTrend(trimmed)) {
        trends.push(this.cleanText(trimmed));
      } else if (this.isYearlyInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      } else if (this.isKeyMetric(trimmed)) {
        keyMetrics.push(this.cleanText(trimmed));
      }
    });
    
    return { trends, insights, recommendations, keyMetrics };
  }

  private parseProductPerformance(content: string): ExternalDocumentData['productPerformance'] {
    const lines = content.split('\n').filter(line => line.trim());
    const insights: string[] = [];
    const recommendations: string[] = [];
    const topProducts: string[] = [];
    const trends: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isProductInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      } else if (this.isTopProduct(trimmed)) {
        topProducts.push(this.cleanText(trimmed));
      } else if (this.isProductTrend(trimmed)) {
        trends.push(this.cleanText(trimmed));
      }
    });
    
    return { insights, recommendations, topProducts, trends };
  }

  private parseCategoryPerformance(content: string): ExternalDocumentData['categoryPerformance'] {
    const lines = content.split('\n').filter(line => line.trim());
    const insights: string[] = [];
    const recommendations: string[] = [];
    const topCategories: string[] = [];
    const trends: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isCategoryInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      } else if (this.isTopCategory(trimmed)) {
        topCategories.push(this.cleanText(trimmed));
      } else if (this.isCategoryTrend(trimmed)) {
        trends.push(this.cleanText(trimmed));
      }
    });
    
    return { insights, recommendations, topCategories, trends };
  }

  private parseSalesTeamAnalysis(content: string): ExternalDocumentData['salesTeamAnalysis'] {
    const lines = content.split('\n').filter(line => line.trim());
    const insights: string[] = [];
    const recommendations: string[] = [];
    const topPerformers: string[] = [];
    const strategies: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isTeamInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      } else if (this.isTopPerformer(trimmed)) {
        topPerformers.push(this.cleanText(trimmed));
      } else if (this.isStrategy(trimmed)) {
        strategies.push(this.cleanText(trimmed));
      }
    });
    
    return { insights, recommendations, topPerformers, strategies };
  }

  private parsePaymentAnalysis(content: string): ExternalDocumentData['paymentAnalysis'] {
    const lines = content.split('\n').filter(line => line.trim());
    const insights: string[] = [];
    const recommendations: string[] = [];
    const trends: string[] = [];
    const preferences: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isPaymentInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      } else if (this.isPaymentTrend(trimmed)) {
        trends.push(this.cleanText(trimmed));
      } else if (this.isPaymentPreference(trimmed)) {
        preferences.push(this.cleanText(trimmed));
      }
    });
    
    return { insights, recommendations, trends, preferences };
  }

  private parseTopBottomAnalysis(content: string): ExternalDocumentData['topBottomAnalysis'] {
    const lines = content.split('\n').filter(line => line.trim());
    const insights: string[] = [];
    const recommendations: string[] = [];
    const topPerformers: string[] = [];
    const bottomPerformers: string[] = [];
    const strategies: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isRankingInsight(trimmed)) {
        insights.push(this.cleanText(trimmed));
      } else if (this.isRecommendation(trimmed)) {
        recommendations.push(this.cleanText(trimmed));
      } else if (this.isTopPerformer(trimmed)) {
        topPerformers.push(this.cleanText(trimmed));
      } else if (this.isBottomPerformer(trimmed)) {
        bottomPerformers.push(this.cleanText(trimmed));
      } else if (this.isStrategy(trimmed)) {
        strategies.push(this.cleanText(trimmed));
      }
    });
    
    return { insights, recommendations, topPerformers, bottomPerformers, strategies };
  }

  // Helper methods to identify content types
  
  // Monthly Analysis helpers
  private isMonthlyTrend(text: string): boolean {
    const monthlyTrendKeywords = ['month-on-month', 'monthly growth', 'monthly increase', 'monthly decrease', 'monthly trend', 'this month', 'current month', 'versus last month'];
    return monthlyTrendKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isMonthlyInsight(text: string): boolean {
    const monthlyInsightKeywords = ['monthly insight', 'monthly observation', 'monthly pattern', 'monthly performance', 'monthly analysis'];
    return monthlyInsightKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  // Yearly Analysis helpers
  private isYearlyTrend(text: string): boolean {
    const yearlyTrendKeywords = ['year-on-year', 'yearly growth', 'annual increase', 'yearly trend', 'this year', 'compared to last year', 'annual performance'];
    return yearlyTrendKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isYearlyInsight(text: string): boolean {
    const yearlyInsightKeywords = ['yearly insight', 'annual observation', 'yearly pattern', 'annual performance', 'yearly analysis'];
    return yearlyInsightKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  // Product Performance helpers
  private isProductInsight(text: string): boolean {
    const productInsightKeywords = ['product performance', 'membership sales', 'package performance', 'product insight', 'product analysis'];
    return productInsightKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isTopProduct(text: string): boolean {
    const topProductKeywords = ['top product', 'best selling', 'highest performing', 'most popular', 'leading product'];
    return topProductKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isProductTrend(text: string): boolean {
    const productTrendKeywords = ['product trend', 'membership trend', 'package trend', 'product growth', 'product decline'];
    return productTrendKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  // Category Performance helpers
  private isCategoryInsight(text: string): boolean {
    const categoryInsightKeywords = ['category performance', 'category insight', 'category analysis', 'segment performance'];
    return categoryInsightKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isTopCategory(text: string): boolean {
    const topCategoryKeywords = ['top category', 'best category', 'highest category', 'leading category'];
    return topCategoryKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isCategoryTrend(text: string): boolean {
    const categoryTrendKeywords = ['category trend', 'segment trend', 'category growth', 'category decline'];
    return categoryTrendKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  // Sales Team Analysis helpers
  private isTeamInsight(text: string): boolean {
    const teamInsightKeywords = ['team performance', 'sales team', 'team insight', 'staff performance', 'team analysis'];
    return teamInsightKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isTopPerformer(text: string): boolean {
    const topPerformerKeywords = ['top performer', 'best performer', 'highest sales', 'leading staff', 'top seller'];
    return topPerformerKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isBottomPerformer(text: string): boolean {
    const bottomPerformerKeywords = ['bottom performer', 'lowest sales', 'underperforming', 'needs improvement'];
    return bottomPerformerKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isStrategy(text: string): boolean {
    const strategyKeywords = ['strategy', 'approach', 'method', 'technique', 'best practice'];
    return strategyKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  // Payment Analysis helpers
  private isPaymentInsight(text: string): boolean {
    const paymentInsightKeywords = ['payment analysis', 'payment insight', 'payment method', 'payment preference', 'payment trend'];
    return paymentInsightKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isPaymentTrend(text: string): boolean {
    const paymentTrendKeywords = ['payment trend', 'payment growth', 'payment decline', 'payment shift'];
    return paymentTrendKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isPaymentPreference(text: string): boolean {
    const paymentPrefKeywords = ['payment preference', 'preferred payment', 'popular payment', 'common payment'];
    return paymentPrefKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  // Ranking Analysis helpers
  private isRankingInsight(text: string): boolean {
    const rankingInsightKeywords = ['ranking insight', 'performance ranking', 'top bottom', 'ranking analysis'];
    return rankingInsightKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isKeyMetric(text: string): boolean {
    const metricKeywords = ['metric', 'kpi', 'percentage', '%', 'number', 'count', 'total', 'average'];
    return metricKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  private isTrainerEntry(text: string): boolean {
    return /^[A-Z][a-z]+ [A-Z][a-z]+/g.test(text) && 
           (text.includes('trainer') || text.includes('instructor') || text.includes('performance'));
  }

  private parseTrainerEntry(text: string): {name: string; performance: string; metrics: string; location?: string} | null {
    const parts = text.split(/[:-]/);
    if (parts.length >= 2) {
      return {
        name: parts[0].trim(),
        performance: parts[1]?.trim() || '',
        metrics: parts[2]?.trim() || '',
        location: text.includes('Kwality') ? 'Kwality House, Kemps Corner' : undefined
      };
    }
    return null;
  }

  private isInsight(text: string): boolean {
    return text.includes('%') || text.includes('rate') || text.includes('increase') || 
           text.includes('decrease') || text.includes('performance') || text.includes('engagement');
  }

  private isRecommendation(text: string): boolean {
    return text.toLowerCase().includes('recommend') || text.toLowerCase().includes('should') ||
           text.toLowerCase().includes('focus') || text.toLowerCase().includes('implement');
  }

  private isPerformanceNote(text: string): boolean {
    return text.includes('revenue') || text.includes('sales') || text.includes('conversion') ||
           text.includes('%') || text.includes('₹') || text.includes('$');
  }

  private isTrend(text: string): boolean {
    return text.toLowerCase().includes('trend') || text.toLowerCase().includes('increasing') ||
           text.toLowerCase().includes('decreasing') || text.toLowerCase().includes('growing');
  }

  private isActionItem(text: string): boolean {
    return text.toLowerCase().includes('action') || text.toLowerCase().includes('implement') ||
           text.toLowerCase().includes('launch') || text.toLowerCase().includes('develop');
  }

  private isFormatInfo(text: string): boolean {
    return text.toLowerCase().includes('barre') || text.toLowerCase().includes('powercycle') ||
           text.toLowerCase().includes('strength') || text.toLowerCase().includes('format');
  }

  private isAttendanceInfo(text: string): boolean {
    return text.includes('%') && (text.toLowerCase().includes('attendance') || 
           text.toLowerCase().includes('capacity') || text.toLowerCase().includes('booking'));
  }

  private isFeedback(text: string): boolean {
    return text.toLowerCase().includes('feedback') || text.toLowerCase().includes('rating') ||
           text.toLowerCase().includes('satisfaction') || text.toLowerCase().includes('review');
  }

  private isRetentionTip(text: string): boolean {
    return text.toLowerCase().includes('retention') || text.toLowerCase().includes('tip') ||
           text.toLowerCase().includes('strategy') || text.toLowerCase().includes('keep');
  }

  private isChurnAnalysis(text: string): boolean {
    return text.toLowerCase().includes('churn') || text.toLowerCase().includes('leave') ||
           text.toLowerCase().includes('cancel') || text.toLowerCase().includes('departure');
  }

  private isSuccessStory(text: string): boolean {
    return text.toLowerCase().includes('success') || text.toLowerCase().includes('achievement') ||
           text.toLowerCase().includes('transformation') || text.toLowerCase().includes('milestone');
  }

  private isPeakTime(text: string): boolean {
    return text.includes(':') && (text.toLowerCase().includes('am') || text.toLowerCase().includes('pm')) ||
           text.toLowerCase().includes('peak') || text.toLowerCase().includes('busy');
  }

  private isUtilization(text: string): boolean {
    return text.includes('%') && (text.toLowerCase().includes('utilization') ||
           text.toLowerCase().includes('capacity') || text.toLowerCase().includes('occupancy'));
  }

  private isOptimization(text: string): boolean {
    return text.toLowerCase().includes('optimize') || text.toLowerCase().includes('improve') ||
           text.toLowerCase().includes('efficiency') || text.toLowerCase().includes('better');
  }

  private isMarketTrend(text: string): boolean {
    return text.toLowerCase().includes('market') || text.toLowerCase().includes('industry') ||
           text.toLowerCase().includes('trend') || text.toLowerCase().includes('adoption');
  }

  private isCompetitorAnalysis(text: string): boolean {
    return text.toLowerCase().includes('competitor') || text.toLowerCase().includes('competition') ||
           text.toLowerCase().includes('advantage') || text.toLowerCase().includes('positioning');
  }

  private isOpportunity(text: string): boolean {
    return text.toLowerCase().includes('opportunity') || text.toLowerCase().includes('potential') ||
           text.toLowerCase().includes('expansion') || text.toLowerCase().includes('growth');
  }

  private cleanText(text: string): string {
    return text.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
  }

  /**
   * Returns empty data structure when document cannot be fetched
   */
  private getEmptyDataStructure(): ExternalDocumentData {
    return {
      trainerPerformance: {
        topTrainers: [],
        insights: [],
        recommendations: []
      },
      salesInsights: {
        performanceNotes: [],
        trends: [],
        actionItems: []
      },
      classFormatData: {
        popularFormats: [],
        attendance: [],
        feedback: []
      },
      clientRetentionData: {
        retentionTips: [],
        churnAnalysis: [],
        successStories: []
      },
      sessionsData: {
        peakTimes: [],
        utilization: [],
        optimization: []
      },
      generalInsights: {
        marketTrends: [],
        competitorAnalysis: [],
        opportunities: []
      }
    };
  }

  /**
   * Clear cached data (useful for forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const externalDocumentService = new ExternalDocumentService();