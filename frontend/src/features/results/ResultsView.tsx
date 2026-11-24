import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Save,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import type {
  ActiveDiagnosticRun,
  NavigationTab,
  ReviewStatus,
} from '../../types/diagnostics';

interface ResultsViewProps {
  activeRun: ActiveDiagnosticRun | null;
  engineerName: string;
  onSubmitSignOff: (
    runId: string,
    reviewStatus: ReviewStatus,
    notes: string,
  ) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export function ResultsView({
  activeRun,
  engineerName,
  onSubmitSignOff,
  onNavigate,
}: ResultsViewProps) {
  const [decision, setDecision] = useState<ReviewStatus>('Flagged');
  const [notes, setNotes] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  if (!activeRun) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <ClipboardCheck className="h-9 w-9 text-zinc-400 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-900">
          No Diagnostic Report Available
        </h3>
        <p className="mt-1 max-w-md text-xs text-zinc-500">
          Upload a .wav recording and run inference to view live CNN probabilities, tool health scoring, and predictive failure alerts.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Acoustic File
        </button>
      </div>
    );
  }

  const toolAnalysis = activeRun.toolResult?.analysis;
  const pumpAnalysis = activeRun.pumpResult?.analysis;

  const getHealthColor = (score: number) => {
    if (score > 50) return 'text-emerald-700';
    if (score > 10) return 'text-amber-700';
    return 'text-rose-700';
  };

  const getHealthBarBg = (score: number) => {
    if (score > 50) return 'bg-emerald-600';
    if (score > 10) return 'bg-amber-500';
    return 'bg-rose-600';
  };

  const handleSave = () => {
    onSubmitSignOff(activeRun.id, decision, notes.trim());
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Run Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-5 py-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono font-semibold text-zinc-900">{activeRun.id}</span>
          <span className="text-zinc-300">|</span>
          <span className="font-mono text-zinc-600">{activeRun.machineId}</span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-500">{activeRun.timestamp}</span>
        </div>
        <span className="font-mono text-zinc-500">
          Inference Latency: <strong className="text-zinc-800">{activeRun.latencySec.toFixed(2)}s</strong>
        </span>
      </div>

      {/* PHASE 2: TOOL WEAR DIAGNOSTIC OUTPUT */}
      {toolAnalysis && (
        <div className="space-y-5">
          {/* Predictive Maintenance Warning Banner (10 < health <= 50) */}
          {toolAnalysis.is_about_to_break && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold uppercase tracking-wide text-amber-800">
                  Predictive Warning: Tool Approaching Failure
                </p>
                <p className="mt-1 text-amber-900">
                  Acoustic health score has degraded to{' '}
                  <strong className="font-mono">{toolAnalysis.tool_health_score_percent.toFixed(1)}%</strong>.
                  Schedule cutting insert replacement before catastrophic tool breakage occurs.
                </p>
              </div>
            </div>
          )}

          {/* Critical Fault Banner */}
          {toolAnalysis.prediction === 'BROKEN' && (
            <div className="flex items-start gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-950">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold uppercase tracking-wide text-rose-800">
                  Critical Fault: Tool Insert Broken
                </p>
                <p className="mt-1 text-rose-900">
                  Halt spindle immediately and inspect the cutting head before resuming production.
                </p>
              </div>
            </div>
          )}

          {/* KPI Strip */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Predicted Wear Class
              </span>
              <p className="mt-2 font-mono text-2xl font-bold text-zinc-900">
                {toolAnalysis.prediction}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                File: {activeRun.toolResult?.filename}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Live Acoustic Health Score
              </span>
              <p
                className={`mt-2 font-mono text-2xl font-bold tabular-nums ${getHealthColor(
                  toolAnalysis.tool_health_score_percent,
                )}`}
              >
                {toolAnalysis.tool_health_score_percent.toFixed(1)}%
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full transition-all duration-500 ${getHealthBarBg(
                    toolAnalysis.tool_health_score_percent,
                  )}`}
                  style={{
                    width: `${Math.min(100, Math.max(0, toolAnalysis.tool_health_score_percent))}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Top-Class Confidence
              </span>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-teal-700">
                {(toolAnalysis.confidence * 100).toFixed(2)}%
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                4-Class Softmax Output
              </p>
            </div>
          </div>

          {/* Class Probability Distribution */}
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Softmax Class Probability Distribution
            </h4>
            <div className="space-y-3">
              {(['BASE', 'FRESH', 'MODERATE', 'BROKEN'] as const).map((cls) => {
                const pct = (toolAnalysis.all_probabilities[cls] ?? 0) * 100;
                const isWinner = toolAnalysis.prediction === cls;
                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex justify-between font-mono text-xs">
                      <span className={isWinner ? 'font-semibold text-zinc-900' : 'text-zinc-600'}>
                        {cls}
                      </span>
                      <span className="tabular-nums text-zinc-700">{pct.toFixed(2)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWinner ? 'bg-teal-700' : 'bg-zinc-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 1: PUMP ANOMALY DIAGNOSTIC OUTPUT */}
      {pumpAnalysis && (
        <div className="space-y-5">
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 ${
              pumpAnalysis.prediction === 'anomaly'
                ? 'border-rose-300 bg-rose-50 text-rose-950'
                : 'border-emerald-300 bg-emerald-50 text-emerald-950'
            }`}
          >
            {pumpAnalysis.prediction === 'anomaly' ? (
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            )}
            <div className="text-xs">
              <p className="font-semibold uppercase tracking-wide">
                {pumpAnalysis.prediction === 'anomaly'
                  ? 'Acoustic Anomaly Detected in Fluid Pump'
                  : 'Pump Operating Within Normal Acoustic Baseline'}
              </p>
              <p className="mt-1 opacity-90">
                Evaluated recording:{' '}
                <span className="font-mono">{activeRun.pumpResult?.filename}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Classification
              </span>
              <p className="mt-2 font-mono text-2xl font-bold uppercase text-zinc-900">
                {pumpAnalysis.prediction}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Anomaly Probability
              </span>
              <p
                className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
                  pumpAnalysis.anomaly_probability > 0.5
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }`}
              >
                {(pumpAnalysis.anomaly_probability * 100).toFixed(2)}%
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Model Confidence
              </span>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-teal-700">
                {(pumpAnalysis.confidence * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Human-In-The-Loop Maintenance Sign-Off */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Technician Maintenance Sign-Off
            </h4>
            <p className="mt-0.5 text-xs text-zinc-500">
              Record triage action into the plant inspection audit log
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-500">Auditor: {engineerName}</span>
        </div>

        {savedBanner && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Sign-off saved to Audit History ({decision}).
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { id: 'Approved', label: 'Approve Normal', desc: 'Cleared for continued run' },
              { id: 'Pending Review', label: 'Secondary Audit', desc: 'Re-test on next shift' },
              { id: 'Flagged', label: 'Flag Maintenance', desc: 'Schedule part replacement' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDecision(opt.id)}
              className={`rounded-md border p-3 text-left transition ${
                decision === opt.id
                  ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <p className="text-xs font-semibold text-zinc-900">{opt.label}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">{opt.desc}</p>
            </button>
          ))}
        </div>

        <div>
          <label
            htmlFor="audit-notes"
            className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5"
          >
            Engineering Remarks
          </label>
          <textarea
            id="audit-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document physical inspection findings, insert wear observations, or pump pressure notes..."
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            <Save className="h-3.5 w-3.5" />
            Save Sign-Off
          </button>
        </div>
      </section>
    </div>
  );
}