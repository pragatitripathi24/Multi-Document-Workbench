export type DocumentType = 'pdf' | 'csv' | 'txt';
export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'error';
export type FactFieldType =
  | 'name'
  | 'address'
  | 'revenue'
  | 'date'
  | 'registration_number'
  | 'other';
export type AnalysisMode = 'individual' | 'cross_document';
export type FindingKind = 'conflict' | 'missing_info' | 'match' | 'insight';

export interface DocumentDTO {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileType: DocumentType;
  sizeBytes: number;
  status: DocumentStatus;
  uploadedAt: string;
  errorMessage?: string | null;
  extractedTextPreview?: string | null;
}

export interface ExtractedFactDTO {
  id: string;
  documentId: string;
  documentName: string;
  fieldType: FactFieldType;
  value: string;
  confidence: number;
  sourceSnippet: string;
  pageOrRow?: string | null;
}

export interface AnalysisFindingDTO {
  id: string;
  kind: FindingKind;
  fieldType: FactFieldType;
  title: string;
  detail: string;
  sourceDocumentIds: string[];
  sourceDocumentNames: string[];
  relatedFactValues: string[];
}

export interface AnalysisDTO {
  id: string;
  prompt: string;
  mode: AnalysisMode;
  documentIds: string[];
  documentNames: string[];
  createdAt: string;
  summary: string;
  findings: AnalysisFindingDTO[];
  facts: ExtractedFactDTO[];
  conflictCount: number;
  missingInfoCount: number;
}

export interface DashboardStatsDTO {
  documentCount: number;
  analysisCount: number;
  conflictCount: number;
  missingInfoCount: number;
}

export interface ParsedDocument {
  text: string;
  parser: string;
}

export interface ExtractedFactInput {
  fieldType: FactFieldType;
  value: string;
  confidence: number;
  sourceSnippet: string;
  pageOrRow?: string | null;
}
