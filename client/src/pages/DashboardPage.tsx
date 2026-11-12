import {
  AlertTriangle,
  FileSearch,
  FileText,
  Info,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyses, getDocuments, getStats } from '../api/client';
import { FileTypeBadge, StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatCard } from '../components/ui/StatCard';
import { formatBytes, formatRelative } from '../lib/format';
import type { AnalysisResult, DashboardStats, DocumentRecord } from '../types';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'mock'>('mock');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [statsRes, docsRes, analysesRes] = await Promise.all([
        getStats(),
        getDocuments(),
        getAnalyses(),
      ]);
      if (cancelled) return;
      setStats(statsRes.data);
      setDocuments(docsRes.data);
      setAnalyses(analysesRes.data);
      setSource(statsRes.source);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !stats) {
    return <LoadingSpinner label="Loading dashboard…" />;
  }

  const recentDocs = [...documents]
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )
    .slice(0, 5);
  const recentAnalyses = [...analyses]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-surface-muted">
            Document and analysis statistics for your workbench
            {source === 'mock' ? ' · showing demo data until the API is online' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/upload" className="btn-secondary">
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <Link to="/analyze" className="btn-primary">
            <FileSearch className="h-4 w-4" />
            New analysis
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Documents"
          value={stats.documentCount}
          icon={FileText}
          accent="navy"
          hint="Uploaded files"
        />
        <StatCard
          label="Analyses"
          value={stats.analysisCount}
          icon={FileSearch}
          accent="indigo"
          hint="Completed runs"
        />
        <StatCard
          label="Conflicts"
          value={stats.conflictCount}
          icon={AlertTriangle}
          accent="rose"
          hint="Across analyses"
        />
        <StatCard
          label="Missing info"
          value={stats.missingInfoCount}
          icon={Info}
          accent="amber"
          hint="Gaps detected"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="card xl:col-span-3">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Recent documents
            </h2>
            <Link
              to="/upload"
              className="text-xs font-medium text-indigo hover:underline"
            >
              Upload more
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload PDF, CSV, or TXT files to get started."
              action={
                <Link to="/upload" className="btn-primary">
                  Upload documents
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-surface/60 text-xs uppercase tracking-wide text-surface-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Size</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface/40">
                      <td className="px-5 py-3 font-medium text-navy">
                        {doc.originalName}
                      </td>
                      <td className="px-5 py-3">
                        <FileTypeBadge type={doc.fileType} />
                      </td>
                      <td className="px-5 py-3 text-surface-muted">
                        {formatBytes(doc.sizeBytes)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-5 py-3 text-surface-muted">
                        {formatRelative(doc.uploadedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Recent analyses
            </h2>
            <Link
              to="/history"
              className="text-xs font-medium text-indigo hover:underline"
            >
              View all
            </Link>
          </div>
          {recentAnalyses.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No analyses yet"
              description="Run an individual or cross-document analysis."
            />
          ) : (
            <ul className="divide-y divide-surface-border">
              {recentAnalyses.map((analysis) => (
                <li key={analysis.id} className="px-5 py-4">
                  <Link
                    to={`/history?id=${analysis.id}`}
                    className="block transition hover:opacity-80"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-navy">
                      {analysis.prompt}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-surface-muted">
                      <span className="capitalize">
                        {analysis.mode.replace('_', ' ')}
                      </span>
                      <span>·</span>
                      <span>{formatRelative(analysis.createdAt)}</span>
                      {analysis.conflictCount > 0 ? (
                        <>
                          <span>·</span>
                          <span className="text-rose-600">
                            {analysis.conflictCount} conflicts
                          </span>
                        </>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
