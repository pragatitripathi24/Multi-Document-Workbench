import {
  BrainCircuit,
  FileSearch,
  History,
  LayoutDashboard,
  Menu,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getStats, isUsingMockFallback } from '../../api/client';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/analyze', label: 'Analyze', icon: FileSearch },
  { to: '/history', label: 'History', icon: History },
];

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    void getStats().then((res) => {
      if (!cancelled) {
        setMockMode(res.source === 'mock' || isUsingMockFallback());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-surface-border bg-navy text-white lg:flex">
        <Brand />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-white/60">
          Banking document intelligence
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-navy text-white shadow-elevated">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <button
                type="button"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              {navItems.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-border bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-navy hover:bg-surface lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <span className="text-sm font-semibold text-navy">DocuMind</span>
            </div>
            <p className="hidden text-sm text-surface-muted sm:block">
              Multi-Document Intelligence Workbench
            </p>
          </div>
          {mockMode ? (
            <span className="badge bg-amber-50 text-amber-700">
              Demo data (API offline)
            </span>
          ) : (
            <span className="badge bg-emerald-50 text-emerald-700">
              Live API
            </span>
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo">
        <BrainCircuit className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-tight">DocuMind</p>
        <p className="text-[11px] text-white/50">Document Intelligence</p>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-white/70 hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
