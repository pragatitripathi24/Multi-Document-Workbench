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

export interface DocumentRecord {
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

export interface ExtractedFact {
  id: string;
  documentId: string;
  documentName: string;
  fieldType: FactFieldType;
  value: string;
  confidence: number;
  sourceSnippet: string;
  pageOrRow?: string | null;
}

export interface AnalysisFinding {
  id: string;
  kind: FindingKind;
  fieldType: FactFieldType;
  title: string;
  detail: string;
  /** Document IDs that contribute to this finding */
  sourceDocumentIds: string[];
  sourceDocumentNames: string[];
  /** Extracted fact values involved (kept separate from interpretation) */
  relatedFactValues: string[];
}

export interface AnalysisResult {
  id: string;
  prompt: string;
  mode: AnalysisMode;
  documentIds: string[];
  documentNames: string[];
  createdAt: string;
  summary: string;
  findings: AnalysisFinding[];
  /** Raw extracted facts used as inputs (provenance layer) */
  facts: ExtractedFact[];
  conflictCount: number;
  missingInfoCount: number;
}

export interface DashboardStats {
  documentCount: number;
  analysisCount: number;
  conflictCount: number;
  missingInfoCount: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

export const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.txt'] as const;
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
] as const;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
