import { describe, expect, it } from 'vitest';
import type { ExtractedFactDTO } from '../types.js';
import { runMockAnalysis } from './analysis.js';

function fact(
  partial: Partial<ExtractedFactDTO> &
    Pick<ExtractedFactDTO, 'documentId' | 'documentName' | 'fieldType' | 'value'>,
): ExtractedFactDTO {
  return {
    id: partial.id ?? `f-${partial.documentId}-${partial.fieldType}`,
    confidence: partial.confidence ?? 0.9,
    sourceSnippet: partial.sourceSnippet ?? partial.value,
    pageOrRow: partial.pageOrRow ?? 'line 1',
    ...partial,
  };
}

describe('runMockAnalysis', () => {
  it('detects address and revenue conflicts across documents', () => {
    const facts: ExtractedFactDTO[] = [
      fact({
        documentId: 'd1',
        documentName: 'reg.txt',
        fieldType: 'address',
        value: '12 King Street, London EC2A 4BX',
      }),
      fact({
        documentId: 'd2',
        documentName: 'kyc.txt',
        fieldType: 'address',
        value: '14 King St, London EC2A 4BX',
      }),
      fact({
        documentId: 'd1',
        documentName: 'reg.txt',
        fieldType: 'registration_number',
        value: '09876543',
      }),
      fact({
        documentId: 'd2',
        documentName: 'kyc.txt',
        fieldType: 'registration_number',
        value: '09876543',
      }),
      fact({
        documentId: 'd3',
        documentName: 'fin.csv',
        fieldType: 'revenue',
        value: '4250000 GBP',
      }),
      fact({
        documentId: 'd2',
        documentName: 'kyc.txt',
        fieldType: 'revenue',
        value: '4100000 GBP',
      }),
    ];

    const result = runMockAnalysis({
      prompt: 'Compare identity fields and flag conflicts',
      mode: 'cross_document',
      facts,
      documentIds: ['d1', 'd2', 'd3'],
      documentNames: ['reg.txt', 'kyc.txt', 'fin.csv'],
    });

    expect(result.conflictCount).toBeGreaterThanOrEqual(2);
    expect(result.findings.some((f) => f.kind === 'conflict' && f.fieldType === 'address')).toBe(
      true,
    );
    expect(result.findings.some((f) => f.kind === 'conflict' && f.fieldType === 'revenue')).toBe(
      true,
    );
    expect(
      result.findings.some(
        (f) => f.kind === 'match' && f.fieldType === 'registration_number',
      ),
    ).toBe(true);
    expect(
      result.findings.every(
        (f) => f.sourceDocumentIds.length > 0 && f.sourceDocumentNames.length > 0,
      ),
    ).toBe(true);
  });

  it('keeps document boundaries for individual analysis missing fields', () => {
    const result = runMockAnalysis({
      prompt: 'Summarize key identity facts',
      mode: 'individual',
      facts: [
        fact({
          documentId: 'd1',
          documentName: 'reg.txt',
          fieldType: 'name',
          value: 'ACME Corporation Ltd',
        }),
      ],
      documentIds: ['d1'],
      documentNames: ['reg.txt'],
    });

    expect(result.missingInfoCount).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.kind === 'insight' && f.fieldType === 'name')).toBe(
      true,
    );
    expect(result.findings.some((f) => f.kind === 'missing_info')).toBe(true);
  });
});
