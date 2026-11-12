import { prisma } from '../db.js';
import type { AnalysisDTO, AnalysisMode } from '../types.js';
import { toAnalysisDTO } from '../utils/mappers.js';
import { runMockAnalysis } from './analysis.js';
import { getFactsForDocuments } from './documents.js';

const analysisInclude = {
  findings: true,
  documents: {
    include: {
      document: {
        include: { facts: true },
      },
    },
  },
} as const;

export async function listAnalyses(): Promise<AnalysisDTO[]> {
  const rows = await prisma.analysis.findMany({
    orderBy: { createdAt: 'desc' },
    include: analysisInclude,
  });
  return rows.map(toAnalysisDTO);
}

export async function getAnalysis(id: string): Promise<AnalysisDTO | null> {
  const row = await prisma.analysis.findUnique({
    where: { id },
    include: analysisInclude,
  });
  return row ? toAnalysisDTO(row) : null;
}

export async function createAnalysis(input: {
  prompt: string;
  mode: AnalysisMode;
  documentIds: string[];
}): Promise<AnalysisDTO> {
  const docs = await prisma.document.findMany({
    where: { id: { in: input.documentIds } },
  });

  if (docs.length !== input.documentIds.length) {
    throw Object.assign(new Error('One or more documents were not found.'), {
      status: 404,
      code: 'DOCUMENT_NOT_FOUND',
    });
  }

  const notReady = docs.filter((d) => d.status !== 'ready');
  if (notReady.length > 0) {
    throw Object.assign(
      new Error(
        `Documents not ready for analysis: ${notReady.map((d) => d.originalName).join(', ')}`,
      ),
      { status: 400, code: 'DOCUMENT_NOT_READY' },
    );
  }

  // Preserve request order
  const ordered = input.documentIds.map(
    (id) => docs.find((d) => d.id === id)!,
  );
  const documentNames = ordered.map((d) => d.originalName);
  const facts = await getFactsForDocuments(input.documentIds);

  const engine = runMockAnalysis({
    prompt: input.prompt,
    mode: input.mode,
    facts,
    documentIds: input.documentIds,
    documentNames,
  });

  const created = await prisma.analysis.create({
    data: {
      prompt: input.prompt,
      mode: input.mode,
      summary: engine.summary,
      conflictCount: engine.conflictCount,
      missingInfoCount: engine.missingInfoCount,
      documents: {
        create: input.documentIds.map((documentId) => ({ documentId })),
      },
      findings: {
        create: engine.findings.map((f) => ({
          kind: f.kind,
          fieldType: f.fieldType,
          title: f.title,
          detail: f.detail,
          sourceDocumentIds: JSON.stringify(f.sourceDocumentIds),
          sourceDocumentNames: JSON.stringify(f.sourceDocumentNames),
          relatedFactValues: JSON.stringify(f.relatedFactValues),
        })),
      },
    },
    include: analysisInclude,
  });

  return toAnalysisDTO(created);
}

export async function getStats() {
  const [documentCount, analysisCount, analyses] = await Promise.all([
    prisma.document.count(),
    prisma.analysis.count(),
    prisma.analysis.findMany({
      select: { conflictCount: true, missingInfoCount: true },
    }),
  ]);

  return {
    documentCount,
    analysisCount,
    conflictCount: analyses.reduce((n, a) => n + a.conflictCount, 0),
    missingInfoCount: analyses.reduce((n, a) => n + a.missingInfoCount, 0),
  };
}
