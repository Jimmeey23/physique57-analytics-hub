import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, FileText, Clock, Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Palette, Type, Eye, Users, CheckSquare, Zap, Calendar, Hash, Sparkles, Brain, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGeminiAnalysis, type TableColumn } from '@/hooks/useGeminiAnalysis';

interface PersistentTableFooterProps {
  tableId: string;
  initialText?: string;
  className?: string;
  tableData?: any[];
  tableColumns?: TableColumn[];
  tableName?: string;
  tableContext?: string;
}

interface NoteData {
  content: string;
  rawContent?: string;
  isRichText: boolean;
  formatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    alignment?: 'left' | 'center' | 'right';
    listType?: 'bullet' | 'numbered' | 'none';
  };
  style?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export const PersistentTableFooter: React.FC<PersistentTableFooterProps> = ({
  tableId,
  initialText = '',
  className,
  tableData = [],
  tableColumns = [],
  tableName,
  tableContext
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [footerText, setFooterText] = useState(initialText);
  const [tempText, setTempText] = useState(initialText);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRichTextMode, setIsRichTextMode] = useState(true);
  const [currentFormatting, setCurrentFormatting] = useState({
    isBold: false,
    isItalic: false,
    alignment: 'left' as 'left' | 'center' | 'right',
    listType: 'bullet' as 'bullet' | 'numbered' | 'none'
  });
  const [currentStyle, setCurrentStyle] = useState({
    backgroundColor: '#ffffff',
    textColor: '#374151'
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [noteData, setNoteData] = useState<NoteData>({
    content: initialText,
    rawContent: initialText,
    isRichText: false,
    formatting: currentFormatting,
    style: currentStyle
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewText, setPreviewText] = useState('');
  const formatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // AI Analysis hooks and state
  const { isLoading: isAiLoading, result: aiResult, error: aiError, generateSummary, generateQuickInsights, reset: resetAi } = useGeminiAnalysis();
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummaryType, setAiSummaryType] = useState<'comprehensive' | 'insights' | 'trends' | 'brief'>('comprehensive');

  // Diagnostics adapter: format focus and comparison availability for display
  const renderDiagnostics = () => {
    if (!aiResult || !aiResult.diagnostics) return null;
    const mom = aiResult.diagnostics.comparedAgainst?.mom ?? 'not available';
    const yoy = aiResult.diagnostics.comparedAgainst?.yoy ?? 'not available';
    const badgeClass = 'text-[10px] md:text-xs px-2 py-1 rounded-full border shadow-sm';
    const unavailable = 'not available';
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <Badge variant="outline" className="text-[10px] md:text-xs">
          Focus: {aiResult.diagnostics.focus || 'Previous Month'}
        </Badge>
        <span className="text-[10px] md:text-xs text-slate-400">•</span>
        <span className={cn(badgeClass, mom === unavailable ? 'border-slate-300 text-slate-400 bg-white' : 'border-blue-200 text-blue-700 bg-blue-50')}
          title="Month-over-month comparison">
          MoM: {mom}
        </span>
        <span className="text-[10px] md:text-xs text-slate-400">•</span>
        <span className={cn(badgeClass, yoy === unavailable ? 'border-slate-300 text-slate-400 bg-white' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}
          title="Year-over-year comparison">
          YoY: {yoy}
        </span>
      </div>
    );
  };
  
  // Real-time formatting with immediate application and preview update
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawText = e.target.value;
    setTempText(rawText);
    
    // Clean and format text immediately
    const cleanedText = rawText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove unprintable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim(); // Remove leading/trailing spaces
    
    // Apply auto-formatting with better structure
    const formatted = cleanedText ? applyAutoFormatting(cleanedText) : '';
    setPreviewText(formatted);
    
    // Update note data with formatted content
    setNoteData(prev => ({
      ...prev,
      content: formatted,
      rawContent: rawText
    }));
  };  // Load saved text from localStorage on component mount
  useEffect(() => {
    const savedNoteData = localStorage.getItem(`table-footer-${tableId}`);
    const savedTimestamp = localStorage.getItem(`table-footer-${tableId}-timestamp`);
    
    if (savedNoteData) {
      try {
        const parsedData = JSON.parse(savedNoteData);
        if (typeof parsedData === 'string') {
          // Legacy format - just text
          setFooterText(parsedData);
          setTempText(parsedData);
          setNoteData({
            content: parsedData,
            rawContent: parsedData,
            isRichText: false,
            formatting: currentFormatting,
            style: currentStyle
          });
        } else {
          // New format - rich text data
          setFooterText(parsedData.content || '');
          setTempText(parsedData.rawContent || parsedData.content || '');
          setNoteData(parsedData);
          setIsRichTextMode(parsedData.isRichText || false);
          if (parsedData.formatting) {
            setCurrentFormatting(parsedData.formatting);
          }
          if (parsedData.style) {
            setCurrentStyle(parsedData.style);
          }
        }
      } catch (e) {
        console.error('Error parsing saved note data:', e);
        // Fallback to treating as plain text
        setFooterText(savedNoteData);
        setTempText(savedNoteData);
      }
    }
    
    if (savedTimestamp) {
      setLastSaved(new Date(savedTimestamp));
    }
  }, [tableId]);

  // Enhanced auto-formatting function with better structure
  const applyAutoFormatting = (text: string): string => {
    if (!text.trim()) return '';
    
    let formatted = text.trim();
    
    // First, normalize line breaks and remove excessive whitespace
    formatted = formatted.replace(/\r\n/g, '\n');
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Auto-detect and format headers with proper spacing
    formatted = formatted.replace(/^#{3,}\s+(.+)$/gm, '� **$1**\n');
    formatted = formatted.replace(/^##\s+(.+)$/gm, '▶️ **$1**\n');
    formatted = formatted.replace(/^#\s+(.+)$/gm, '� **$1**\n');
    
    // Auto-format action items with proper spacing
    formatted = formatted.replace(/^\[\s*[xX]\s*\]\s*(.+)$/gm, '✅ $1');
    formatted = formatted.replace(/^\[\s*\]\s*(.+)$/gm, '☐ $1');
    
    // Auto-format priorities with enhanced styling
    formatted = formatted.replace(/^!!!\s*(.+)$/gm, '� **HIGH PRIORITY:** $1');
    formatted = formatted.replace(/^!!\s*(.+)$/gm, '⚠️ **MEDIUM PRIORITY:** $1');
    formatted = formatted.replace(/^!\s*(.+)$/gm, '� **LOW PRIORITY:** $1');
    
    // Enhanced bullet point formatting
    formatted = formatted.replace(/^[-*+•]\s+(.+)$/gm, '• $1');
    
    // Auto-format numbered lists
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '$1. $2');
    
    // Auto-format dates with various formats
    formatted = formatted.replace(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/g, '📅 $1');
    formatted = formatted.replace(/\b(\d{4}[-/]\d{2}[-/]\d{2})\b/g, '📅 $1');
    formatted = formatted.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi, '📅 $&');
    
    // Auto-format times
    formatted = formatted.replace(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AaPp][Mm])?)\b/g, '🕐 $1');
    
    // Auto-format keywords and important terms
    formatted = formatted.replace(/\b(TODO|FIXME|NOTE|IMPORTANT)\b/gi, '⚡ **$1**');
    formatted = formatted.replace(/\b(DONE|COMPLETED|FINISHED)\b/gi, '✅ **$1**');
    
    // Smart line structuring - add line breaks after sections
    const lines = formatted.split('\n');
    const structuredLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      structuredLines.push(line);
      
      // Add spacing after headers, priorities, or section dividers
      if (line.match(/^(📋|▶️|🔹|🚨|⚠️|📌)/)) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && !nextLine.match(/^[•☐✅\d+\.]/) && i < lines.length - 1) {
          structuredLines.push('');
        }
      }
    }
    
    // Auto-convert simple text into bullet points if it's a list-like structure
    const result = structuredLines.join('\n');
    const listPattern = result.split('\n\n').map(section => {
      const sectionLines = section.split('\n').filter(line => line.trim());
      
      // If section has multiple lines without formatting, convert to bullets
      if (sectionLines.length > 2 && !sectionLines[0].match(/^(📋|▶️|🔹|🚨|⚠️|📌|•|☐|✅|\d+\.)/) && 
          sectionLines.every(line => !line.match(/^(📋|▶️|🔹|🚨|⚠️|📌|•|☐|✅|\d+\.)/))) {
        const header = sectionLines[0];
        const items = sectionLines.slice(1).map(line => `• ${line.trim()}`).join('\n');
        return `${header}\n${items}`;
      }
      
      return section;
    }).join('\n\n');
    
    return result.trim();
  };

  // Render formatted content as HTML
  const renderFormattedContent = (noteData: NoteData): string => {
    if (!noteData.isRichText) {
      return noteData.content.replace(/\n/g, '<br>');
    }
    
    let content = noteData.content;
    
    // Convert markdown-style formatting to HTML
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/^• (.+)$/gm, '<li>$1</li>');
    content = content.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    content = content.replace(/\n/g, '<br>');
    
    // Wrap consecutive list items in ul/ol tags
    content = content.replace(/(<li>.*<\/li><br>)+/g, (match) => {
      const items = match.replace(/<br>/g, '').trim();
      return noteData.formatting?.listType === 'numbered' ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
    });
    
    return content;
  };

  // Rich text formatting functions
  const toggleBold = () => {
    setCurrentFormatting(prev => ({ ...prev, isBold: !prev.isBold }));
  };
  
  const toggleItalic = () => {
    setCurrentFormatting(prev => ({ ...prev, isItalic: !prev.isItalic }));
  };
  
  const setAlignment = (alignment: 'left' | 'center' | 'right') => {
    setCurrentFormatting(prev => ({ ...prev, alignment }));
  };
  
  const setListType = (listType: 'bullet' | 'numbered' | 'none') => {
    setCurrentFormatting(prev => ({ ...prev, listType }));
  };
  
  const insertTemplate = (template: string) => {
    setTempText(template);
    setShowTemplates(false);
  };
  
  const noteTemplates = {
    analysis: '📊 **Analysis Summary**\n\n🎯 **Key Findings:**\n• \n• \n• \n\n📈 **Trends Observed:**\n• \n• \n\n⚡ **Action Items:**\n☐ \n☐ \n☐ ',
    insights: '💡 **Key Insights**\n\n🔍 **What the data shows:**\n• \n• \n\n🎯 **Impact on business:**\n• \n• \n\n📋 **Next steps:**\n☐ \n☐ ',
    performance: '📈 **Performance Review**\n\n✅ **Strengths:**\n• \n• \n\n⚠️ **Areas for improvement:**\n• \n• \n\n🎯 **Recommendations:**\n• \n• ',
    trends: `📊 **Trend Analysis - ${new Date().toLocaleDateString()}**\n\n📈 **Positive trends:**\n• \n• \n\n📉 **Concerning patterns:**\n• \n• \n\n🔮 **Predictions:**\n• \n• `
  };

  // Enhanced save function with comprehensive auto-formatting
  const saveToStorage = async (text: string) => {
    setIsSaving(true);
    
    try {
      // Always apply some level of formatting for better structure
      let formattedContent = text.trim();
      
      if (isRichTextMode) {
        // Apply full rich text formatting
        formattedContent = applyAutoFormatting(text);
      } else {
        // Apply comprehensive cleanup and basic formatting even in plain text mode
        const cleaned = text.trim()
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
          .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
          .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
          .replace(/\r\n|\r/g, '\n')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n');
        const lines = cleaned.split('\n').filter(line => line.trim());
        
        formattedContent = lines
          .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // Capitalize first letter and add bullets to list-like items in plain text mode
            const capitalizedLine = trimmed.replace(/^[a-z]/, (c: string) => c.toUpperCase());
            
            if (!trimmed.match(/^[-•*+]/) && 
                !trimmed.match(/^\d+\./) && 
                !trimmed.match(/^[#>]/) &&
                trimmed.length > 3 && 
                trimmed.length < 100) {
              return `• ${capitalizedLine}`;
            }
            return capitalizedLine;
          })
          .join('\n');
      }
      
      const noteDataToSave: NoteData = {
        content: formattedContent,
        rawContent: text,
        isRichText: isRichTextMode,
        formatting: { ...currentFormatting },
        style: { ...currentStyle }
      };
      
      // Save to localStorage
      localStorage.setItem(`table-footer-${tableId}`, JSON.stringify(noteDataToSave));
      const timestamp = new Date().toISOString();
      localStorage.setItem(`table-footer-${tableId}-timestamp`, timestamp);
      
      // Simulate API call to Google Sheets
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setLastSaved(new Date());
      setFooterText(formattedContent);
      setNoteData(noteDataToSave);
      
    } catch (error) {
      console.error('Failed to save footer text:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    await saveToStorage(tempText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempText(footerText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // AI Analysis functions
  const handleGenerateAISummary = async () => {
    if (!tableData.length || !tableColumns.length) {
      console.warn('No table data or columns available for AI analysis');
      return;
    }

    try {
      await generateSummary({
        tableData,
        columns: tableColumns,
        tableName: tableName || `${tableId} Analysis`,
        context: tableContext || 'Business performance data analysis',
        summaryType: aiSummaryType,
        includeRecommendations: aiSummaryType === 'comprehensive',
        maxRows: 500 // Limit data size for API efficiency
      });
      setShowAiSummary(true);
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    }
  };

  const handleQuickInsights = async () => {
    if (!tableData.length || !tableColumns.length) {
      console.warn('No table data or columns available for quick insights');
      return;
    }

    try {
      await generateQuickInsights(
        tableData.slice(0, 100), // Limit for quick analysis
        tableColumns,
        tableName || tableId
      );
      setShowAiSummary(true);
    } catch (error) {
      console.error('Failed to generate quick insights:', error);
    }
  };

  const insertAiSummaryToNote = () => {
    if (!aiResult) return;

    const timestamp = new Date();
    const currentDate = new Date();
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthName = previousMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    let aiText = `🤖 **${previousMonthName} Performance Analysis Report**\n`;
    aiText += `📅 Generated on ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}\n`;
    aiText += `${tableName ? `📊 Table: ${tableName}` : ''}\n`;
    aiText += `🎯 **Focus: ${previousMonthName} vs Previous Months Comparison**\n\n`;
    aiText += `═══════════════════════════════════════\n\n`;
    
    if (aiResult.summary) {
      aiText += `📊 **EXECUTIVE SUMMARY**\n`;
      aiText += `${aiResult.summary}\n\n`;
    }
    
    if (aiResult.keyInsights && aiResult.keyInsights.length > 0) {
      aiText += `💡 **KEY BUSINESS INSIGHTS** (${aiResult.keyInsights.length} insights)\n`;
      aiResult.keyInsights.forEach((insight, index) => {
        aiText += `${index + 1}. ${insight}\n\n`;
      });
    }
    
    if (aiResult.trends && aiResult.trends.length > 0) {
      aiText += `📈 **TRENDS & PERFORMANCE ANALYSIS** (${aiResult.trends.length} findings)\n`;
      aiResult.trends.forEach((trend, index) => {
        aiText += `▶ ${trend}\n\n`;
      });
    }
    
    if (aiResult.recommendations && aiResult.recommendations.length > 0) {
      aiText += `🎯 **STRATEGIC RECOMMENDATIONS** (${aiResult.recommendations.length} actions)\n`;
      aiResult.recommendations.forEach((rec, index) => {
        aiText += `🔸 **Action ${index + 1}:** ${rec}\n\n`;
      });
    }

    aiText += `───────────────────────────────────────\n`;
    aiText += `💼 **Note:** All revenue figures are in Indian Rupees (₹) and large amounts are shown in lakhs.\n`;
    aiText += `🔄 This analysis should be reviewed and validated with current business context.\n\n`;

    // Insert or append to existing text
    const newText = tempText ? `${tempText}\n\n${aiText}` : aiText;
    setTempText(newText);
    setShowAiSummary(false);
    
    // Focus on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newText.length, newText.length);
    }
  };

  const isAiAnalysisAvailable = tableData.length > 0 && tableColumns.length > 0;

  return (
    <Card className={cn(
      "mt-6 p-4 bg-gradient-to-r from-slate-50 via-blue-50/50 to-blue-50/30 border-t-4 border-t-blue-500",
      "shadow-lg backdrop-blur-sm transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-700">Analysis Notes</h4>
          {lastSaved && (
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Last saved: {lastSaved.toLocaleDateString()} at {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:bg-blue-100 transition-all duration-200"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit Notes
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-slate-600 hover:bg-slate-100"
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Notes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="prose prose-sm max-w-none">
          {footerText ? (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              {noteData.isRichText ? (
                <div 
                  className="text-slate-700"
                  dangerouslySetInnerHTML={{ __html: renderFormattedContent(noteData) }}
                  style={{
                    backgroundColor: noteData.style?.backgroundColor || '',
                    color: noteData.style?.textColor || '',
                    textAlign: noteData.formatting?.alignment as 'left' | 'center' | 'right' || 'left'
                  }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-slate-700">
                  {footerText}
                </div>
              )}
              {noteData.isRichText && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Rich Text
                </Badge>
              )}
            </div>
          ) : (
            <div 
              className="text-slate-400 italic p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
              onClick={() => setIsEditing(true)}
            >
              Click to add analysis notes, insights, or key findings for this table...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Rich Text Mode Toggle and AI Options */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isRichTextMode}
                  onChange={(e) => setIsRichTextMode(e.target.checked)}
                  className="rounded"
                />
                Rich Text Mode
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="gap-1"
              >
                <FileText className="w-3 h-3" />
                Templates
              </Button>
            </div>

            {/* AI Analysis Section */}
            {isAiAnalysisAvailable && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickInsights}
                  disabled={isAiLoading}
                  className="gap-1 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300"
                >
                  {isAiLoading ? (
                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-purple-600" />
                  )}
                  Quick AI Insights
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAISummary}
                  disabled={isAiLoading}
                  className="gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300"
                >
                  {isAiLoading ? (
                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  ) : (
                    <Brain className="w-3 h-3 text-blue-600" />
                  )}
                  Previous Month Analysis
                </Button>
              </div>
            )}
          </div>

          {/* Template Selector */}
          {showTemplates && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTemplate(noteTemplates.analysis)}
                className="justify-start gap-2"
              >
                <Hash className="w-3 h-3" />
                Analysis Summary
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTemplate(noteTemplates.insights)}
                className="justify-start gap-2"
              >
                <Zap className="w-3 h-3" />
                Key Insights
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTemplate(noteTemplates.performance)}
                className="justify-start gap-2"
              >
                <CheckSquare className="w-3 h-3" />
                Performance Review
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTemplate(noteTemplates.trends)}
                className="justify-start gap-2"
              >
                <Calendar className="w-3 h-3" />
                Trend Analysis
              </Button>
            </div>
          )}

          {/* AI Summary Display */}
          {showAiSummary && aiResult && (
            <Card className="p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border border-purple-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-slate-700">Previous Month Performance Analysis</h4>
                  {tableName && (
                    <Badge variant="outline" className="text-xs">
                      {tableName}
                    </Badge>
                  )}
                </div>
                {/* Diagnostics: Focus/MoM/YoY */}
                {renderDiagnostics()}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={insertAiSummaryToNote}
                    className="text-blue-600 hover:bg-blue-100"
                  >
                    Insert to Notes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiSummary(false)}
                    className="text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-5 max-h-[600px] overflow-y-auto">
                {/* AI Summary */}
                {aiResult.summary && (
                  <div>
                    <h5 className="font-medium text-slate-700 flex items-center gap-1 mb-3">
                      <FileText className="w-4 h-4" />
                      Executive Summary
                    </h5>
                    <div className="text-sm text-slate-600 bg-white p-4 rounded-lg border shadow-sm leading-relaxed">
                      {aiResult.summary.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-2 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {aiResult.keyInsights && aiResult.keyInsights.length > 0 && (
                  <div>
                    <h5 className="font-medium text-slate-700 flex items-center gap-1 mb-3">
                      <Zap className="w-4 h-4" />
                      Key Insights ({aiResult.keyInsights.length} insights)
                    </h5>
                    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                      {aiResult.keyInsights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 pb-2 border-b border-slate-100 last:border-b-0 last:pb-0">
                          <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                              {insight}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trends */}
                {aiResult.trends && aiResult.trends.length > 0 && (
                  <div>
                    <h5 className="font-medium text-slate-700 flex items-center gap-1 mb-3">
                      <TrendingUp className="w-4 h-4" />
                      Trends & Performance Analysis ({aiResult.trends.length} findings)
                    </h5>
                    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                      {aiResult.trends.map((trend, index) => (
                        <div key={index} className="flex items-start gap-3 pb-2 border-b border-slate-100 last:border-b-0 last:pb-0">
                          <span className="text-emerald-500 font-bold text-lg leading-none mt-0.5">📈</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                              {trend}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-slate-700 flex items-center gap-1 mb-3">
                      <CheckSquare className="w-4 h-4" />
                      Strategic Recommendations ({aiResult.recommendations.length} actions)
                    </h5>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200 shadow-sm space-y-3">
                      {aiResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b border-orange-200 last:border-b-0 last:pb-0">
                          <span className="text-orange-500 font-bold text-lg leading-none mt-0.5">🎯</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                              {rec}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {aiError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Analysis Error</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">{aiError}</p>
                </div>
              )}

              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Generated by AI • Review and edit as needed
              </div>
            </Card>
          )}

          {/* AI Not Available Notice */}
          {!isAiAnalysisAvailable && isEditing && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">AI Analysis Unavailable</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                AI analysis requires table data and column definitions to generate insights.
              </p>
            </div>
          )}

          {/* Rich Text Toolbar */}
          {isRichTextMode && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border">
              {/* Formatting Controls */}
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={currentFormatting.isBold ? "default" : "ghost"}
                  size="sm"
                  onClick={() => toggleBold()}
                  className="w-8 h-8 p-0"
                >
                  <Bold className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant={currentFormatting.isItalic ? "default" : "ghost"}
                  size="sm"
                  onClick={() => toggleItalic()}
                  className="w-8 h-8 p-0"
                >
                  <Italic className="w-3 h-3" />
                </Button>
              </div>

              {/* Alignment Controls */}
              <div className="flex gap-1 border-l pl-2">
                <Button
                  type="button"
                  variant={currentFormatting.alignment === 'left' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAlignment('left')}
                  className="w-8 h-8 p-0"
                >
                  <AlignLeft className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant={currentFormatting.alignment === 'center' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAlignment('center')}
                  className="w-8 h-8 p-0"
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant={currentFormatting.alignment === 'right' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAlignment('right')}
                  className="w-8 h-8 p-0"
                >
                  <AlignRight className="w-3 h-3" />
                </Button>
              </div>

              {/* List Controls */}
              <div className="flex gap-1 border-l pl-2">
                <Button
                  type="button"
                  variant={currentFormatting.listType === 'bullet' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setListType('bullet')}
                  className="w-8 h-8 p-0"
                >
                  <List className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant={currentFormatting.listType === 'numbered' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setListType('numbered')}
                  className="w-8 h-8 p-0"
                >
                  <ListOrdered className="w-3 h-3" />
                </Button>
              </div>

              {/* Style Controls */}
              <div className="flex gap-1 border-l pl-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStyle(prev => ({ ...prev, backgroundColor: prev.backgroundColor === '#fef3c7' ? '#ffffff' : '#fef3c7' }))}
                  className="w-8 h-8 p-0"
                  style={{ backgroundColor: currentStyle.backgroundColor === '#fef3c7' ? '#fef3c7' : '' }}
                >
                  <Palette className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <Type className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={tempText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isRichTextMode ? "Type your analysis... Text will be auto-formatted with bullets, headers, priorities, and structure" : "Add your analysis notes... Simple formatting will be applied automatically"}
            className={`min-h-[120px] border-2 border-blue-200 focus:border-blue-500 bg-white shadow-sm resize-vertical ${isRichTextMode ? 'font-mono' : ''}`}
            style={{
              backgroundColor: currentStyle.backgroundColor || '',
              color: currentStyle.textColor || '',
              textAlign: currentFormatting.alignment as 'left' | 'center' | 'right'
            }}
            autoFocus
          />

          {/* Live Preview */}
          {tempText && (
            <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="text-xs text-slate-600 mb-3 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" />
                {isRichTextMode ? 'Rich Text Preview:' : 'Auto-Formatted Preview:'}
              </div>
              <div 
                className="prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: renderFormattedContent({
                  content: previewText || (isRichTextMode ? applyAutoFormatting(tempText) : tempText.replace(/\n/g, '<br>')),
                  rawContent: tempText,
                  isRichText: isRichTextMode || tempText.length > 0,
                  formatting: currentFormatting,
                  style: currentStyle
                }) }}
              />
            </div>
          )}

          <p className="text-xs text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Ctrl+Enter</kbd> to save, or <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Esc</kbd> to cancel
          </p>
        </div>
      )}
      
      {footerText && !isEditing && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>✨ Notes are automatically saved and preserved across sessions</span>
            <span>{footerText.length} characters</span>
          </div>
        </div>
      )}
    </Card>
  );
};