import type {
  Analysis,
  AnalysisFinding,
  Document,
  ExtractedFact,
} from '@prisma/client';
import type {
  AnalysisDTO,
  AnalysisFindingDTO,
  AnalysisMode,
  DocumentDTO,
  DocumentStatus,
  DocumentType,
  ExtractedFactDTO,
  FactFieldType,
  FindingKind,
} from '../types.js';

export function toDocumentDTO(doc: Document): DocumentDTO {
  return {
    id: doc.id,
    originalName: doc.originalName,
    storedName: doc.storedName,
    mimeType: doc.mimeType,
    fileType: doc.fileType as DocumentType,
    sizeBytes: doc.sizeBytes,
    status: doc.status as DocumentStatus,
    uploadedAt: doc.uploadedAt.toISOString(),
    errorMessage: doc.errorMessage,
    extractedTextPreview: doc.extractedTextPreview,
  };
}

export function toFactDTO(
  fact: ExtractedFact,
  documentName: string,
): ExtractedFactDTO {
  return {
    id: fact.id,
    documentId: fact.documentId,
    documentName,
    fieldType: fact.fieldType as FactFieldType,
    value: fact.value,
    confidence: fact.confidence,
    sourceSnippet: fact.sourceSnippet,
    pageOrRow: fact.pageOrRow,
  };
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toFindingDTO(finding: AnalysisFinding): AnalysisFindingDTO {
  return {
    id: finding.id,
    kind: finding.kind as FindingKind,
    fieldType: finding.fieldType as FactFieldType,
    title: finding.title,
    detail: finding.detail,
    sourceDocumentIds: parseJsonArray(finding.sourceDocumentIds),
    sourceDocumentNames: parseJsonArray(finding.sourceDocumentNames),
    relatedFactValues: parseJsonArray(finding.relatedFactValues),
  };
}

export function toAnalysisDTO(
  analysis: Analysis & {
    findings: AnalysisFinding[];
    documents: Array<{ document: Document & { facts: ExtractedFact[] } }>;
  },
): AnalysisDTO {
  const docs = analysis.documents.map((d) => d.document);
  const facts = docs.flatMap((doc) =>
    doc.facts.map((fact) => toFactDTO(fact, doc.originalName)),
  );

  return {
    id: analysis.id,
    prompt: analysis.prompt,
    mode: analysis.mode as AnalysisMode,
    documentIds: docs.map((d) => d.id),
    documentNames: docs.map((d) => d.originalName),
    createdAt: analysis.createdAt.toISOString(),
    summary: analysis.summary,
    findings: analysis.findings.map(toFindingDTO),
    facts,
    conflictCount: analysis.conflictCount,
    missingInfoCount: analysis.missingInfoCount,
  };
}
