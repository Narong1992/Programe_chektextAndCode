export enum ComparisonStatus {
  MATCH = 'MATCH',
  MISMATCH = 'MISMATCH',
  MISSING_IN_CHECK = 'MISSING_IN_CHECK', // Exists in Source, Empty in Check
  EXTRA_IN_CHECK = 'EXTRA_IN_CHECK',     // Empty in Source, Exists in Check
  EMPTY_BOTH = 'EMPTY_BOTH'
}

export interface RowResult {
  id: number;
  sourceValue: string;
  checkValue: string;
  status: ComparisonStatus;
  explanation?: string;
}

export interface AiAnalysisResult {
  summary: string;
  suggestions: string[];
}