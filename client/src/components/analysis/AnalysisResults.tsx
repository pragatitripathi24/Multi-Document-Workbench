import { Check, Copy, FileText } from 'lucide-react';
import { useState } from 'react';
import type { AnalysisResult } from '../../types';
import { FindingBadge } from '../ui/Badge';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const [copied, setCopied] = useState(false);

  const copyPayload = () => {
    const text = JSON.stringify(
      {
        id: result.id,
        prompt: result.prompt,
        mode: result.mode,
        summary: result.summary,
        findings: result.findings,
        facts: result.facts,
        documents: result.documentNames,
        createdAt: result.createdAt,
      },
      null,
      2,
    );
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Fallback for browsers/contexts without clipboard permission
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } finally {
          document.body.removeChild(area);
        }
      });
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-surface-muted">
              Analysis summary
            </p>
            <h3 className="mt-1 text-lg font-semibold text-navy">
              {result.mode === 'cross_document'
                ? 'Cross-document comparison'
                : 'Individual document analysis'}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-surface-muted">
              {result.summary}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={copyPayload}>
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy results'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge bg-rose-50 text-rose-700">
            {result.conflictCount} conflicts
          </span>
          <span className="badge bg-amber-50 text-amber-700">
            {result.missingInfoCount} missing
          </span>
          <span className="badge bg-navy-50 text-navy">
            {result.documentNames.length} documents
          </span>
        </div>
        <p className="mt-3 text-xs text-surface-muted">
          Prompt: {result.prompt}
        </p>
      </div>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-navy">
          Findings (interpretations)
        </h4>
        <div className="space-y-3">
          {result.findings.map((finding) => (
            <div key={finding.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <FindingBadge kind={finding.kind} />
                <span className="badge bg-surface text-surface-muted capitalize">
                  {finding.fieldType.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-navy">
                {finding.title}
              </p>
              <p className="mt-1 text-sm text-surface-muted">{finding.detail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {finding.sourceDocumentNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-navy"
                  >
                    <FileText className="h-3 w-3" />
                    {name}
                  </span>
                ))}
              </div>
              {finding.relatedFactValues.length > 0 ? (
                <div className="mt-3 rounded-xl bg-surface px-3 py-2 text-xs text-surface-muted">
                  <span className="font-medium text-navy">Related facts: </span>
                  {finding.relatedFactValues.join(' · ')}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-navy">
          Extracted facts (provenance)
        </h4>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-surface-border bg-surface/80 text-xs uppercase tracking-wide text-surface-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Field</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Snippet</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {result.facts.map((fact) => (
                  <tr key={fact.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 capitalize text-navy">
                      {fact.fieldType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">
                      {fact.value}
                    </td>
                    <td className="px-4 py-3 text-surface-muted">
                      {fact.documentName}
                      {fact.pageOrRow ? (
                        <span className="block text-xs">{fact.pageOrRow}</span>
                      ) : null}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-surface-muted">
                      {fact.sourceSnippet}
                    </td>
                    <td className="px-4 py-3 text-surface-muted">
                      {Math.round(fact.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
