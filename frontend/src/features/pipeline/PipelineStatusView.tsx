import {
  AlertCircle,
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type {
  AudioFileDetails,
  MachineProfile,
  NavigationTab,
  PipelineStage,
} from '../../types/diagnostics';

interface PipelineStatusViewProps {
  stages: PipelineStage[];
  isProcessing: boolean;
  elapsedSec: number | null;
  selectedProfile: MachineProfile;
  audioDetails: AudioFileDetails | null;
  apiError: string | null;
  onRerun: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export function PipelineStatusView({
  stages,
  isProcessing,
  elapsedSec,
  selectedProfile,
  audioDetails,
  apiError,
  onRerun,
  onNavigate,
}: PipelineStatusViewProps) {
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progressPct = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-zinc-700">
              {selectedProfile === 'metal-cutter' ? 'ToolWearCNN' : 'AnomalyDetectionCNN'}
            </span>
            <span className="font-mono text-xs text-zinc-500">
              {audioDetails ? audioDetails.name : 'No active file'}
            </span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-zinc-900">
            Inference Execution Telemetry
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              End-to-End Latency
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-zinc-900">
              {elapsedSec !== null ? `${elapsedSec.toFixed(2)}s` : isProcessing ? 'Measuring...' : '--'}
            </span>
          </div>

          <button
            type="button"
            onClick={onRerun}
            disabled={!audioDetails || isProcessing}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Re-run
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-700">
            {apiError
              ? 'Pipeline halted due to API error'
              : isProcessing
              ? 'Executing DSP & PyTorch CNN inference on FastAPI...'
              : completedCount === stages.length
              ? 'All pipeline stages completed'
              : 'Idle — upload a .wav file to start'}
          </span>
          <span className="font-mono font-semibold tabular-nums text-teal-700">
            {progressPct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full transition-all duration-300 ${
              apiError ? 'bg-rose-600' : 'bg-teal-700'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {apiError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">FastAPI Inference Request Failed</p>
            <p className="mt-0.5 font-mono">{apiError}</p>
          </div>
        </div>
      )}

      {/* Stage List */}
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex items-start justify-between gap-4 px-5 py-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5">
                {stage.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                {stage.status === 'running' && (
                  <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
                )}
                {stage.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
                {stage.status === 'pending' && (
                  <Clock className="h-4 w-4 text-zinc-300" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">
                  {stage.id}. {stage.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{stage.detail}</p>
              </div>
            </div>

            <span
              className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-medium uppercase ${
                stage.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : stage.status === 'running'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : stage.status === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {stage.status}
            </span>
          </div>
        ))}
      </div>

      {/* Next Step Actions */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <span className="text-xs text-zinc-500">
          Inspect the audio waveform or proceed to the classification report.
        </span>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('analysis')}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          >
            <AudioLines className="h-3.5 w-3.5" />
            Signal Analysis
          </button>
          <button
            type="button"
            onClick={() => onNavigate('results')}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Diagnostic Report
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}