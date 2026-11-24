import { Menu } from 'lucide-react';
import type { MachineProfile, NavigationTab } from '../../types/diagnostics';

interface TopbarProps {
  currentTab: NavigationTab;
  selectedProfile: MachineProfile;
  onSelectProfile: (profile: MachineProfile) => void;
  onOpenMobileMenu: () => void;
  isProcessing: boolean;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Plant Acoustic Overview',
    subtitle: 'Fleet health metrics, tool wear progression, and recent diagnostic logs',
  },
  upload: {
    title: 'Acoustic Upload & Profile Routing',
    subtitle: 'Ingest 16-bit PCM .wav recordings for real-time PyTorch CNN inference',
  },
  status: {
    title: 'DSP & Inference Pipeline Monitor',
    subtitle: 'Live stage telemetry from Librosa spectrogram extraction to model scoring',
  },
  analysis: {
    title: 'Acoustic Signal Analysis',
    subtitle: 'Interactive time-domain waveform playback and frequency profile inspection',
  },
  results: {
    title: 'Diagnostic Report & Sign-Off',
    subtitle: 'Model probabilities, predictive health score, and maintenance triage',
  },
  reports: {
    title: 'Inspection Audit History',
    subtitle: 'Filterable log of executed acoustic scans with CSV export',
  },
  settings: {
    title: 'System Configuration',
    subtitle: 'FastAPI gateway endpoint, alert thresholds, and operator metadata',
  },
};

export function Topbar({
  currentTab,
  selectedProfile,
  onSelectProfile,
  onOpenMobileMenu,
  isProcessing,
}: TopbarProps) {
  const meta = TAB_TITLES[currentTab];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
            {meta.title}
          </h2>
          <p className="hidden truncate text-xs text-zinc-500 sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Engine Status */}
        <div className="hidden md:flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
          <span
            className={`h-2 w-2 rounded-full ${
              isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
            }`}
          />
          <span>{isProcessing ? 'Running Inference' : 'FastAPI Connected'}</span>
        </div>

        {/* Segmented Profile Switcher */}
        <div className="inline-flex rounded-md border border-zinc-200 bg-zinc-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onSelectProfile('metal-cutter')}
            className={`rounded px-2.5 py-1 font-medium transition ${
              selectedProfile === 'metal-cutter'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            CNC Cutter
          </button>
          <button
            type="button"
            onClick={() => onSelectProfile('industrial-pump')}
            className={`rounded px-2.5 py-1 font-medium transition ${
              selectedProfile === 'industrial-pump'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Pump
          </button>
        </div>
      </div>
    </header>
  );
}