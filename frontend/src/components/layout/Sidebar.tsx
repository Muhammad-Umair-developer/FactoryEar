import {
  LayoutDashboard,
  Upload,
  Activity,
  AudioLines,
  ClipboardCheck,
  History,
  Settings,
  Wrench,
  Cpu,
  X,
} from 'lucide-react';
import type { MachineProfile, NavigationTab } from '../../types/diagnostics';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  selectedProfile: MachineProfile;
  onToggleProfile: (profile: MachineProfile) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  engineerName: string;
}

const NAV_ITEMS: { id: NavigationTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'upload', label: 'Acoustic Upload', icon: Upload },
  { id: 'status', label: 'Pipeline Monitor', icon: Activity },
  { id: 'analysis', label: 'Signal Analysis', icon: AudioLines },
  { id: 'results', label: 'Diagnostic Report', icon: ClipboardCheck },
  { id: 'reports', label: 'Audit History', icon: History },
  { id: 'settings', label: 'Configuration', icon: Settings },
];

export function Sidebar({
  currentTab,
  onSelectTab,
  selectedProfile,
  onToggleProfile,
  mobileOpen,
  onCloseMobile,
  engineerName,
}: SidebarProps) {
  const initials = engineerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-zinc-800 bg-[#121417] text-zinc-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex h-16 items-center justify-between border-b border-zinc-800/90 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white font-mono text-xs font-bold">
                FE
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-white">
                  Factory Ear
                </h1>
                <p className="text-[11px] text-zinc-400">Acoustic Telemetry</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Active Model Indicator */}
          <div className="border-b border-zinc-800/80 px-4 py-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Active Model
              </span>
              <span className="font-mono text-[10px] text-teal-400">16 kHz DSP</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onToggleProfile(
                  selectedProfile === 'metal-cutter' ? 'industrial-pump' : 'metal-cutter',
                )
              }
              className="flex w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-left text-xs transition hover:border-zinc-700"
            >
              <span className="flex items-center gap-2 font-medium text-zinc-100">
                {selectedProfile === 'metal-cutter' ? (
                  <>
                    <Wrench className="h-3.5 w-3.5 text-teal-400" />
                    CNC Tool Wear
                  </>
                ) : (
                  <>
                    <Cpu className="h-3.5 w-3.5 text-teal-400" />
                    Industrial Pump
                  </>
                )}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Switch</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5 px-3 py-4">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = currentTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onSelectTab(id);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-zinc-800/90 text-white border-l-2 border-teal-500 rounded-l-none'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-teal-400' : 'text-zinc-500'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Operator Badge */}
        <div className="border-t border-zinc-800/90 p-4">
          <div className="flex items-center gap-3 rounded-md bg-zinc-900/70 px-3 py-2.5 border border-zinc-800/80">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-semibold text-teal-400 border border-zinc-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-100">{engineerName}</p>
              <p className="truncate text-[11px] text-zinc-500">Reliability Eng.</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between px-1 font-mono text-[10px] text-zinc-500">
            <span>PyTorch 2D CNN</span>
            <span className="text-emerald-500">API Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}