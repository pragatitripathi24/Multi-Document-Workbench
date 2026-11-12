import type {
  AnalysisFindingDTO,
  AnalysisMode,
  ExtractedFactDTO,
  FactFieldType,
} from '../types.js';

const TRACKED_FIELDS: FactFieldType[] = [
  'name',
  'address',
  'revenue',
  'date',
  'registration_number',
];

function normalizeForCompare(fieldType: FactFieldType, value: string): string {
  let v = value.toLowerCase().trim();
  v = v.replace(/[.,]/g, ' ');
  v = v.replace(/\s+/g, ' ');
  if (fieldType === 'name') {
    v = v.replace(/\b(ltd|limited|llc|inc|corp|corporation|plc)\b/g, '').trim();
  }
  if (fieldType === 'address') {
    v = v.replace(/\bstreet\b/g, 'st').replace(/\broad\b/g, 'rd');
  }
  if (fieldType === 'revenue') {
    v = v.replace(/\s*gbp\s*/g, '').replace(/[^\d.]/g, '');
  }
  if (fieldType === 'registration_number') {
    v = v.replace(/[\s\-]/g, '');
  }
  return v;
}

function fieldLabel(fieldType: FactFieldType): string {
  return fieldType.replace(/_/g, ' ');
}

export interface AnalysisEngineResult {
  summary: string;
  findings: Omit<AnalysisFindingDTO, 'id'>[];
  conflictCount: number;
  missingInfoCount: number;
}

export function runMockAnalysis(options: {
  prompt: string;
  mode: AnalysisMode;
  facts: ExtractedFactDTO[];
  documentIds: string[];
  documentNames: string[];
}): AnalysisEngineResult {
  const { prompt, mode, facts, documentIds, documentNames } = options;
  const findings: Omit<AnalysisFindingDTO, 'id'>[] = [];

  if (mode === 'individual') {
    const docName = documentNames[0] ?? 'document';
    const byField = new Map<FactFieldType, ExtractedFactDTO[]>();
    for (const fact of facts) {
      const list = byField.get(fact.fieldType) ?? [];
      list.push(fact);
      byField.set(fact.fieldType, list);
    }

    for (const field of TRACKED_FIELDS) {
      const values = byField.get(field) ?? [];
      if (values.length === 0) {
        findings.push({
          kind: 'missing_info',
          fieldType: field,
          title: `${fieldLabel(field)} not found`,
          detail: `No ${fieldLabel(field)} could be extracted from ${docName}.`,
          sourceDocumentIds: documentIds,
          sourceDocumentNames: documentNames,
          relatedFactValues: [],
        });
      } else {
        findings.push({
          kind: 'insight',
          fieldType: field,
          title: `${fieldLabel(field)} extracted`,
          detail: `Found ${values.map((v) => v.value).join('; ')} in ${docName}.`,
          sourceDocumentIds: [values[0].documentId],
          sourceDocumentNames: [values[0].documentName],
          relatedFactValues: values.map((v) => v.value),
        });
      }
    }

    if (prompt.toLowerCase().includes('summar')) {
      findings.unshift({
        kind: 'insight',
        fieldType: 'other',
        title: 'Prompt-focused summary',
        detail: `Deterministic Mock AI summarized identity fields from ${docName} per prompt: "${prompt.slice(0, 120)}"`,
        sourceDocumentIds: documentIds,
        sourceDocumentNames: documentNames,
        relatedFactValues: facts.slice(0, 5).map((f) => f.value),
      });
    }
  } else {
    for (const field of TRACKED_FIELDS) {
      const fieldFacts = facts.filter((f) => f.fieldType === field);
      if (fieldFacts.length === 0) {
        findings.push({
          kind: 'missing_info',
          fieldType: field,
          title: `${fieldLabel(field)} missing across documents`,
          detail: `None of the selected documents contained a detectable ${fieldLabel(field)}.`,
          sourceDocumentIds: documentIds,
          sourceDocumentNames: documentNames,
          relatedFactValues: [],
        });
        continue;
      }

      const presentDocIds = new Set(fieldFacts.map((f) => f.documentId));
      const missingDocs = documentIds
        .map((id, i) => ({ id, name: documentNames[i] }))
        .filter((d) => !presentDocIds.has(d.id));

      if (missingDocs.length > 0) {
        findings.push({
          kind: 'missing_info',
          fieldType: field,
          title: `${fieldLabel(field)} missing in some documents`,
          detail: `Present in ${presentDocIds.size} document(s); missing from: ${missingDocs.map((d) => d.name).join(', ')}.`,
          sourceDocumentIds: missingDocs.map((d) => d.id),
          sourceDocumentNames: missingDocs.map((d) => d.name),
          relatedFactValues: fieldFacts.map((f) => f.value),
        });
      }

      const groups = new Map<string, ExtractedFactDTO[]>();
      for (const fact of fieldFacts) {
        const key = normalizeForCompare(field, fact.value);
        const list = groups.get(key) ?? [];
        list.push(fact);
        groups.set(key, list);
      }

      if (groups.size > 1) {
        const values = [...groups.values()].map((g) => g[0].value);
        const docs = [
          ...new Set(fieldFacts.map((f) => f.documentName)),
        ];
        findings.push({
          kind: 'conflict',
          fieldType: field,
          title: `Conflicting ${fieldLabel(field)} values`,
          detail: `Documents disagree on ${fieldLabel(field)}: ${values.join(' vs ')}.`,
          sourceDocumentIds: [...new Set(fieldFacts.map((f) => f.documentId))],
          sourceDocumentNames: docs,
          relatedFactValues: values,
        });
      } else {
        findings.push({
          kind: 'match',
          fieldType: field,
          title: `${fieldLabel(field)} consistent`,
          detail: `${fieldLabel(field)} matches across documents: ${fieldFacts[0].value}.`,
          sourceDocumentIds: [...new Set(fieldFacts.map((f) => f.documentId))],
          sourceDocumentNames: [
            ...new Set(fieldFacts.map((f) => f.documentName)),
          ],
          relatedFactValues: [fieldFacts[0].value],
        });
      }
    }
  }

  const conflictCount = findings.filter((f) => f.kind === 'conflict').length;
  const missingInfoCount = findings.filter(
    (f) => f.kind === 'missing_info',
  ).length;

  const summary =
    mode === 'cross_document'
      ? `Cross-document review of ${documentNames.length} file(s) found ${conflictCount} conflict(s) and ${missingInfoCount} missing-information item(s).`
      : `Individual analysis of ${documentNames[0] ?? 'document'} extracted ${facts.length} fact(s) with ${missingInfoCount} missing field(s).`;

  return { summary, findings, conflictCount, missingInfoCount };
}
