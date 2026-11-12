import { ChevronDown, ChevronRight, History } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAnalyses } from '../api/client';
import { AnalysisResults } from '../components/analysis/AnalysisResults';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, formatRelative } from '../lib/format';
import type { AnalysisResult } from '../types';

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(
    searchParams.get('id'),
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await getAnalyses();
      if (cancelled) return;
      const sorted = [...res.data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setAnalyses(sorted);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fromQuery = searchParams.get('id');
    if (fromQuery) {
      setExpandedId(fromQuery);
    }
  }, [searchParams]);

  const expanded = useMemo(
    () => analyses.find((a) => a.id === expandedId) ?? null,
    [analyses, expandedId],
  );

  const toggle = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) {
      setSearchParams({ id: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading history…" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Analysis history
        </h1>
        <p className="mt-1 text-sm text-surface-muted">
          Review past runs with structured findings and source references
        </p>
      </div>

      {analyses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={History}
            title="No analysis history"
            description="Completed analyses will appear here for audit and reuse."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => {
            const open = expandedId === analysis.id;
            return (
              <div key={analysis.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(analysis.id)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-surface/40"
                >
                  <span className="mt-0.5 text-surface-muted">
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">
                      {analysis.prompt}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-surface-muted">
                      <span className="badge bg-navy-50 capitalize text-navy">
                        {analysis.mode.replace('_', ' ')}
                      </span>
                      <span>{analysis.documentNames.length} docs</span>
                      <span>·</span>
                      <span title={formatDate(analysis.createdAt)}>
                        {formatRelative(analysis.createdAt)}
                      </span>
                      <span className="badge bg-rose-50 text-rose-700">
                        {analysis.conflictCount} conflicts
                      </span>
                      <span className="badge bg-amber-50 text-amber-700">
                        {analysis.missingInfoCount} missing
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs text-surface-muted">
                      {analysis.documentNames.join(', ')}
                    </p>
                  </div>
                </button>
                {open && expanded ? (
                  <div className="border-t border-surface-border bg-surface/30 px-5 py-5">
                    <AnalysisResults result={expanded} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
