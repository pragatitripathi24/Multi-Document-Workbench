import { FileSearch, Layers, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createAnalysis, getDocuments } from '../api/client';
import { AnalysisResults } from '../components/analysis/AnalysisResults';
import { FileTypeBadge, StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ToastStack } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import type { AnalysisMode, AnalysisResult, DocumentRecord } from '../types';

const DEFAULT_PROMPT =
  'Compare entity identity fields and flag any conflicts in name, address, revenue, dates, or registration numbers. Also report missing information.';

export function AnalyzePage() {
  const toast = useToast();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [mode, setMode] = useState<AnalysisMode>('cross_document');
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await getDocuments();
      if (cancelled) return;
      const ready = res.data.filter((d) => d.status === 'ready');
      setDocuments(ready);
      setSelected(ready.slice(0, Math.min(3, ready.length)).map((d) => d.id));
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDoc = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const runAnalysis = async () => {
    if (!prompt.trim()) {
      toast.error('Prompt required', 'Describe what you want to analyze.');
      return;
    }
    if (selected.length === 0) {
      toast.error('Select documents', 'Choose at least one document.');
      return;
    }
    if (mode === 'individual' && selected.length !== 1) {
      toast.error(
        'Individual mode',
        'Select exactly one document for individual analysis.',
      );
      return;
    }
    if (mode === 'cross_document' && selected.length < 2) {
      toast.error(
        'Cross-document mode',
        'Select at least two documents to compare.',
      );
      return;
    }

    setRunning(true);
    try {
      const res = await createAnalysis({
        prompt: prompt.trim(),
        mode,
        documentIds: selected,
      });
      setResult(res.data);
      toast.success(
        'Analysis complete',
        res.source === 'mock'
          ? 'Mock result (API offline). Live Mock AI arrives in Phase 4.'
          : 'Results are ready.',
      );
    } catch {
      toast.error('Analysis failed', 'Please try again.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading documents…" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Analyze
        </h1>
        <p className="mt-1 text-sm text-surface-muted">
          User-defined prompts for individual or cross-document analysis
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-navy">Analysis mode</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ModeButton
                active={mode === 'individual'}
                icon={FileSearch}
                label="Individual"
                onClick={() => setMode('individual')}
              />
              <ModeButton
                active={mode === 'cross_document'}
                icon={Layers}
                label="Cross-document"
                onClick={() => setMode('cross_document')}
              />
            </div>
          </section>

          <section className="card p-5">
            <label
              htmlFor="prompt"
              className="text-sm font-semibold text-navy"
            >
              Analysis prompt
            </label>
            <textarea
              id="prompt"
              className="input-field mt-3 min-h-[140px] resize-y"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should DocuMind look for?"
            />
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-surface-border px-5 py-4">
              <h2 className="text-sm font-semibold text-navy">
                Documents ({selected.length} selected)
              </h2>
            </div>
            {documents.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title="No ready documents"
                description="Upload and process documents before running analysis."
              />
            ) : (
              <ul className="max-h-72 divide-y divide-surface-border overflow-y-auto">
                {documents.map((doc) => {
                  const checked = selected.includes(doc.id);
                  return (
                    <li key={doc.id}>
                      <label className="flex cursor-pointer items-start gap-3 px-5 py-3 hover:bg-surface/50">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-surface-border text-indigo focus:ring-indigo"
                          checked={checked}
                          onChange={() => toggleDoc(doc.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-navy">
                            {doc.originalName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <FileTypeBadge type={doc.fileType} />
                            <StatusBadge status={doc.status} />
                          </div>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => void runAnalysis()}
            disabled={running || documents.length === 0}
          >
            <Sparkles className="h-4 w-4" />
            {running ? 'Running analysis…' : 'Run analysis'}
          </button>
        </div>

        <div className="lg:col-span-3">
          {result ? (
            <AnalysisResults result={result} />
          ) : (
            <div className="card">
              <EmptyState
                icon={Sparkles}
                title="Results will appear here"
                description="Configure a prompt, select documents, and run analysis. Findings keep interpretations separate from extracted facts."
              />
            </div>
          )}
        </div>
      </div>

      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof FileSearch;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition',
        active
          ? 'border-indigo bg-indigo-50 text-indigo'
          : 'border-surface-border bg-white text-surface-muted hover:border-indigo/30',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
