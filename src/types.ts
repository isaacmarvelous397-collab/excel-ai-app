export type PlanType = 'free' | 'pro';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  created_at: string;
  usage: {
    uploads_this_month: number;
    uploads_limit: number;
    ai_questions_used: number;
    ai_questions_limit: number;
    max_rows_per_file: number;
  };
}

export interface ColumnProfile {
  name: string;
  type: 'number' | 'text' | 'date' | 'boolean';
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  avg?: number;
  sum?: number;
  median?: number;
  sampleValues: (string | number | boolean | null)[];
  potentialOutliersCount?: number;
  outliersCount?: number;
}

export interface DataQualityReport {
  totalCells: number;
  totalMissing: number;
  missingPercentage: number;
  duplicateRowsCount: number;
  duplicatePercentage: number;
  emptyColumnsCount: number;
  columnsQuality: ColumnProfile[];
  qualityScore: number; // 0 to 100
  warnings: string[];
}

export interface InsightItem {
  id: string;
  category: 'revenue' | 'trend' | 'performance' | 'anomaly' | 'summary' | 'outlier' | 'quality';
  title: string;
  description: string;
  metric?: string;
  value?: string | number;
  metric_value?: string | number;
  impact?: 'positive' | 'negative' | 'neutral';
}

export interface SpreadsheetAnalysis {
  id: string;
  file_id: string;
  sheet_name: string;
  all_sheets: string[];
  row_count: number;
  column_count: number;
  column_names: string[];
  columns: ColumnProfile[];
  data_quality: DataQualityReport;
  insights: InsightItem[];
  preview_rows: Record<string, any>[];
  created_at: string;
}

export interface SpreadsheetFile {
  id: string;
  user_id: string;
  filename: string;
  file_type: 'xlsx' | 'xls' | 'csv';
  file_size: number;
  row_count: number;
  column_count: number;
  sheet_name: string;
  all_sheets?: string[];
  uploaded_at: string;
  last_analyzed: string;
  analysis?: SpreadsheetAnalysis;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  user_id?: string;
  role: 'user' | 'assistant';
  content: string;
  calculation_details?: {
    metric?: string;
    computed_value?: string | number;
    formula_used?: string;
  };
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  file_id: string;
  messages: ChatMessage[];
  created_at: string;
}

export interface FormulaResult {
  formula: string;
  description: string;
  explanation: string;
  example: string;
  tips?: string[];
}

export interface AiReport {
  id: string;
  file_id: string;
  title: string;
  executive_summary: string;
  key_findings: string[];
  trends: string[];
  data_quality_notes: string[];
  recommendations: string[];
  generated_at: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

export interface ChartConfig {
  type: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: 'sum' | 'avg' | 'count' | 'none';
  title?: string;
}
