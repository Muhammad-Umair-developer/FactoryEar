import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  ShieldCheck,
  Upload,
  Wrench,
} from 'lucide-react';
import type {
  InspectionRecord,
  MachineProfile,
  NavigationTab,
} from '../../types/diagnostics';

interface DashboardViewProps {
  inspections: InspectionRecord[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectProfile: (profile: MachineProfile) => void;
}

export function DashboardView({
  inspections,
  onNavigate,
  onSelectProfile,
}: DashboardViewProps) {
  const totalScans = inspections.length;
  const anomalyCount = inspections.filter((i) => i.isAnomaly).length;
  const healthyCount = totalScans - anomalyCount;
  const fleetHealthPct = totalScans > 0 ? ((healthyCount / totalScans) * 100).toFixed(1) : '100.0';

  const cutterScans = inspections.filter((i) => i.machineProfile === 'metal-cutter');
  const pumpScans = inspections.filter((i) => i.machineProfile === 'industrial-pump');

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Logged Inspections
            </span>
            <Activity className="h-4 w-4 text-teal-700" />
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-zinc-900">
            {totalScans}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {cutterScans.length} CNC Cutter • {pumpScans.length} Pump
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Nominal Baseline
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-zinc-900">
            {healthyCount}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">
            Within acoustic threshold
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Flagged / Wear Alerts
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-zinc-900">
            {anomalyCount}
          </p>
          <p className="mt-1 text-[11px] text-amber-700">
            Requires maintenance triage
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Fleet Health Index
            </span>
            <ShieldCheck className="h-4 w-4 text-teal-700" />
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-teal-700">
            {fleetHealthPct}%
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Dual PyTorch 2D CNN active
          </p>
        </div>
      </section>

      {/* Main Grid: Degradation Curve + Quick Launch */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tool-Wear Health Reference Curve */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                CNC Cutting Insert — Predictive Health Degradation Curve
              </h3>
              <p className="text-xs text-zinc-500">
                Weighted health scoring across FRESH (100%), MODERATE (50%), and BROKEN (0%) states
              </p>
            </div>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
              88.57% Val Acc
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 560 190" className="h-48 w-full min-w-[420px]">
              {/* Warning Band (10% - 50% Health) */}
              <rect x="44" y="88" width="496" height="58" fill="#fef3c7" fillOpacity="0.45" />
              <text x="534" y="102" fill="#b45309" fontSize="9.5" textAnchor="end" fontFamily="monospace">
                PREDICTIVE WARNING BAND (10–50%)
              </text>

              {/* Critical Band (0% - 10% Health) */}
              <rect x="44" y="146" width="496" height="18" fill="#fee2e2" fillOpacity="0.6" />

              {/* Gridlines */}
              <line x1="44" y1="20" x2="540" y2="20" stroke="#e4e4e7" strokeDasharray="3 3" />
              <line x1="44" y1="88" x2="540" y2="88" stroke="#d4d4d8" strokeDasharray="3 3" />
              <line x1="44" y1="164" x2="540" y2="164" stroke="#d4d4d8" />

              {/* Health Curve */}
              <path
                d="M 54 28 C 140 30, 210 42, 290 72 C 360 98, 430 120, 520 156"
                fill="none"
                stroke="#0f766e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Milestone Nodes */}
              <circle cx="54" cy="28" r="4" fill="#059669" />
              <circle cx="290" cy="72" r="4" fill="#0f766e" />
              <circle cx="405" cy="112" r="4.5" fill="#d97706" />
              <circle cx="520" cy="156" r="4.5" fill="#e11d48" />

              {/* Y-Axis Labels */}
              <text x="36" y="24" fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">100%</text>
              <text x="36" y="92" fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">50%</text>
              <text x="36" y="166" fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">0%</text>

              {/* X-Axis Labels */}
              <text x="54" y="182" fill="#71717a" fontSize="10" textAnchor="start">FRESH</text>
              <text x="290" y="182" fill="#71717a" fontSize="10" textAnchor="middle">EARLY WEAR</text>
              <text x="405" y="182" fill="#b45309" fontSize="10" textAnchor="middle">MODERATE (ALERT)</text>
              <text x="520" y="182" fill="#be123c" fontSize="10" textAnchor="end">BROKEN</text>
            </svg>
          </div>
        </div>

        {/* Quick Model Launchers */}
        <div className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">
              Diagnostic Profiles
            </h3>

            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                  <Wrench className="h-3.5 w-3.5 text-teal-700" />
                  CNC Metal Cutter
                </span>
                <span className="font-mono text-[10px] text-zinc-500">4-Class CNN</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Detects BASE, FRESH, MODERATE, and BROKEN states with predictive failure warning.
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectProfile('metal-cutter');
                  onNavigate('upload');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Scan Cutter Audio <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                  <Cpu className="h-3.5 w-3.5 text-teal-700" />
                  Industrial Fluid Pump
                </span>
                <span className="font-mono text-[10px] text-zinc-500">Binary CNN</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Trained across MIMII -6 dB, 0 dB, and +6 dB factory noise floors.
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectProfile('industrial-pump');
                  onNavigate('upload');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Scan Pump Audio <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-800"
          >
            <Upload className="h-4 w-4" />
            New Acoustic Inspection
          </button>
        </div>
      </section>

      {/* Recent Inspections Table */}
      <section className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900">Recent Acoustic Scans</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            View Full History →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3">Run ID</th>
                <th className="px-5 py-3">Asset</th>
                <th className="px-5 py-3">File</th>
                <th className="px-5 py-3">Classification</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {inspections.slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/80">
                  <td className="px-5 py-3 font-mono font-medium text-zinc-900">{row.id}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-zinc-900 block">{row.machineId}</span>
                    <span className="text-[11px] text-zinc-500">
                      {row.machineProfile === 'metal-cutter' ? 'CNC Cutter' : 'Fluid Pump'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-zinc-600">{row.filename}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 font-mono text-[11px] font-medium ${
                        !row.isAnomaly
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : row.resultStatus === 'MODERATE'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {row.resultStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono tabular-nums text-zinc-700">
                    {row.confidence.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                      {row.reviewStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}