import type {
  AnalysisMode,
  AnalysisResult,
  DashboardStats,
  DocumentRecord,
  DocumentType,
} from '../types';
import { mockAnalyses, mockDocuments } from './mockData';

/** Empty string uses Vite `/api` proxy in dev; set VITE_API_URL for a direct backend. */
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export type DataSource = 'api' | 'mock';

export interface ApiResponse<T> {
  data: T;
  source: DataSource;
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        error:
          (body as { message?: string }).message ??
          `Request failed (${res.status})`,
      };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'API unreachable' };
  }
}

function detectFileType(file: File): DocumentType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (name.endsWith('.csv') || file.type === 'text/csv') return 'csv';
  if (name.endsWith('.txt') || file.type === 'text/plain') return 'txt';
  return null;
}

/** In-memory store so uploads/analyses persist during a session when using mock fallback */
let sessionDocuments: DocumentRecord[] = [...mockDocuments];
let sessionAnalyses: AnalysisResult[] = [...mockAnalyses];
let usingMock = false;

export function isUsingMockFallback(): boolean {
  return usingMock;
}

export async function getStats(): Promise<ApiResponse<DashboardStats>> {
  const result = await fetchJson<DashboardStats>('/api/stats');
  if (result.ok) {
    usingMock = false;
    return { data: result.data, source: 'api' };
  }
  usingMock = true;
  const stats: DashboardStats = {
    documentCount: sessionDocuments.length,
    analysisCount: sessionAnalyses.length,
    conflictCount: sessionAnalyses.reduce((n, a) => n + a.conflictCount, 0),
    missingInfoCount: sessionAnalyses.reduce(
      (n, a) => n + a.missingInfoCount,
      0,
    ),
  };
  return { data: stats, source: 'mock' };
}

export async function getDocuments(): Promise<ApiResponse<DocumentRecord[]>> {
  const result = await fetchJson<DocumentRecord[]>('/api/documents');
  if (result.ok) {
    usingMock = false;
    sessionDocuments = result.data;
    return { data: result.data, source: 'api' };
  }
  usingMock = true;
  return { data: sessionDocuments, source: 'mock' };
}

export async function uploadDocuments(
  files: File[],
): Promise<ApiResponse<DocumentRecord[]>> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));

  const result = await fetchJson<DocumentRecord[]>('/api/documents/upload', {
    method: 'POST',
    body: form,
  });

  if (result.ok) {
    usingMock = false;
    sessionDocuments = [...result.data, ...sessionDocuments];
    return { data: result.data, source: 'api' };
  }

  usingMock = true;
  const created: DocumentRecord[] = files.map((file, i) => {
    const fileType = detectFileType(file) ?? 'txt';
    return {
      id: `local-${Date.now()}-${i}`,
      originalName: file.name,
      storedName: `local-${file.name}`,
      mimeType: file.type || 'application/octet-stream',
      fileType,
      sizeBytes: file.size,
      status: 'ready' as const,
      uploadedAt: new Date().toISOString(),
      extractedTextPreview:
        'Pending server-side extraction. Backend will process this file in Phase 2+.',
    };
  });
  sessionDocuments = [...created, ...sessionDocuments];
  return { data: created, source: 'mock' };
}

export async function getAnalyses(): Promise<ApiResponse<AnalysisResult[]>> {
  const result = await fetchJson<AnalysisResult[]>('/api/analyses');
  if (result.ok) {
    usingMock = false;
    sessionAnalyses = result.data;
    return { data: result.data, source: 'api' };
  }
  usingMock = true;
  return { data: sessionAnalyses, source: 'mock' };
}

export async function getAnalysis(
  id: string,
): Promise<ApiResponse<AnalysisResult | null>> {
  const result = await fetchJson<AnalysisResult>(`/api/analyses/${id}`);
  if (result.ok) {
    usingMock = false;
    return { data: result.data, source: 'api' };
  }
  usingMock = true;
  const found = sessionAnalyses.find((a) => a.id === id) ?? null;
  return { data: found, source: 'mock' };
}

export interface CreateAnalysisPayload {
  prompt: string;
  mode: AnalysisMode;
  documentIds: string[];
}

export async function createAnalysis(
  payload: CreateAnalysisPayload,
): Promise<ApiResponse<AnalysisResult>> {
  const result = await fetchJson<AnalysisResult>('/api/analyses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (result.ok) {
    usingMock = false;
    sessionAnalyses = [result.data, ...sessionAnalyses];
    return { data: result.data, source: 'api' };
  }

  usingMock = true;
  const docs = sessionDocuments.filter((d) =>
    payload.documentIds.includes(d.id),
  );
  const analysis: AnalysisResult = {
    id: `an-local-${Date.now()}`,
    prompt: payload.prompt,
    mode: payload.mode,
    documentIds: payload.documentIds,
    documentNames: docs.map((d) => d.originalName),
    createdAt: new Date().toISOString(),
    summary:
      payload.mode === 'cross_document'
        ? `Mock cross-document analysis of ${docs.length} document(s). Connect the API for live conflict detection.`
        : `Mock individual analysis of ${docs[0]?.originalName ?? 'document'}. Connect the API for live extraction.`,
    conflictCount: 0,
    missingInfoCount: payload.mode === 'cross_document' ? 1 : 0,
    facts: docs.slice(0, 2).map((d, i) => ({
      id: `lf-${Date.now()}-${i}`,
      documentId: d.id,
      documentName: d.originalName,
      fieldType: 'name' as const,
      value: d.originalName.replace(/\.[^.]+$/, ''),
      confidence: 0.7,
      sourceSnippet: d.extractedTextPreview?.slice(0, 80) ?? d.originalName,
      pageOrRow: null,
    })),
    findings: [
      {
        id: `lfind-${Date.now()}`,
        kind: 'insight' as const,
        fieldType: 'other' as const,
        title: 'Mock analysis complete',
        detail:
          'This result was generated by the client mock fallback because the API was unreachable. Phase 2+ will replace this with the deterministic Mock AI engine.',
        sourceDocumentIds: payload.documentIds,
        sourceDocumentNames: docs.map((d) => d.originalName),
        relatedFactValues: [],
      },
      ...(payload.mode === 'cross_document'
        ? [
            {
              id: `lfind-missing-${Date.now()}`,
              kind: 'missing_info' as const,
              fieldType: 'registration_number' as const,
              title: 'Registration number check pending',
              detail:
                'Server-side fact extraction is required to confirm registration numbers across documents.',
              sourceDocumentIds: payload.documentIds,
              sourceDocumentNames: docs.map((d) => d.originalName),
              relatedFactValues: [] as string[],
            },
          ]
        : []),
    ],
  };
  sessionAnalyses = [analysis, ...sessionAnalyses];
  return { data: analysis, source: 'mock' };
}
