import { useState, type DragEvent, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FileAudio,
  Gauge,
  Loader2,
  ShieldAlert,
  UploadCloud,
  Wrench,
} from 'lucide-react';
import {
  inferenceService,
  type PumpInferenceResponse,
  type ToolWearInferenceResponse,
} from './api/inferenceClient';
import { WaveformPlayer } from './components/WaveformPlayer';

type MachineProfile = 'tool' | 'pump';

export default function App() {
  const [profile, setProfile] = useState<MachineProfile>('tool');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pumpMutation = useMutation<PumpInferenceResponse, Error, File>({
    mutationFn: (file) => inferenceService.analyzePump(file),
  });

  const toolMutation = useMutation<ToolWearInferenceResponse, Error, File>({
    mutationFn: (file) => inferenceService.analyzeToolWear(file),
  });

  const isAnalyzing = pumpMutation.isPending || toolMutation.isPending;
  const activeError = profile === 'pump' ? pumpMutation.error : toolMutation.error;

  const handleProfileChange = (nextProfile: MachineProfile) => {
    setProfile(nextProfile);
    setFileError(null);
    pumpMutation.reset();
    toolMutation.reset();
  };

  const validateAndSetFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.wav')) {
      setFileError('Invalid file format. Only uncompressed .wav audio files are supported.');
      return;
    }
    setFileError(null);
    setSelectedFile(file);
    pumpMutation.reset();
    toolMutation.reset();
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    if (profile === 'pump') {
      pumpMutation.mutate(selectedFile);
    } else {
      toolMutation.mutate(selectedFile);
    }
  };

  const toolResult = toolMutation.data?.analysis;
  const pumpResult = pumpMutation.data?.analysis;

  const getHealthColor = (score: number) => {
    if (score > 60) return 'text-emerald-400';
    if (score > 10) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getHealthBarColor = (score: number) => {
    if (score > 60) return 'bg-emerald-500';
    if (score > 10) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/30">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/30">
              <Activity className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Factory Ear</h1>
              <p className="text-xs text-slate-400">
                Industrial Acoustic Anomaly &amp; Predictive Maintenance Workbench
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Inference Engine Ready
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Dual-Profile Selector */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleProfileChange('tool')}
            className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition ${
              profile === 'tool'
                ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="rounded-xl bg-sky-500/15 p-2.5 text-sky-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white">CNC Metal Cutter — Tool Wear</h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                  PHASE 2
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                4-class CNN (BASE, FRESH, MODERATE, BROKEN) with 0–100% health score &amp; predictive failure alert.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleProfileChange('pump')}
            className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition ${
              profile === 'pump'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="rounded-xl bg-indigo-500/15 p-2.5 text-indigo-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white">Industrial Pump — Anomaly Detection</h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  PHASE 1
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Binary MIMII CNN trained across -6dB, 0dB, and 6dB noise floors for fault isolation.
              </p>
            </div>
          </button>
        </section>

        {/* Upload & Waveform Section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
              isDragging
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
            }`}
          >
            <UploadCloud className="h-9 w-9 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-200">
              Drag &amp; drop a <span className="font-mono text-sky-400">.wav</span> acoustic recording, or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Target endpoint: {profile === 'tool' ? 'POST /api/v1/inference/analyze-tool' : 'POST /api/v1/inference/analyze'}
            </p>
            <input
              type="file"
              accept=".wav,audio/wav"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          {fileError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {fileError}
            </div>
          )}

          {selectedFile && (
            <div className="space-y-4">
              <WaveformPlayer
                file={selectedFile}
                accentColor={profile === 'tool' ? '#38bdf8' : '#818cf8'}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileAudio className="h-4 w-4 text-slate-500" />
                  <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running CNN Inference...
                    </>
                  ) : (
                    <>
                      <Gauge className="h-4 w-4" />
                      Run Acoustic Diagnostic
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300">
              <strong>API Request Failed:</strong> {activeError.message}
            </div>
          )}
        </section>

        {/* Phase 2: Tool Wear Results */}
        {profile === 'tool' && toolResult && (
          <section className="space-y-5">
            {/* Predictive Maintenance Warning Banner */}
            {toolResult.is_about_to_break && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/15 p-5 text-amber-200">
                <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                    Predictive Maintenance Warning: Tool Approaching Failure
                  </h3>
                  <p className="mt-1 text-xs text-amber-100/90">
                    Acoustic health score has dropped to <strong>{toolResult.tool_health_score_percent}%</strong>. Schedule cutting-edge replacement before catastrophic breakage occurs.
                  </p>
                </div>
              </div>
            )}

            {toolResult.prediction === 'BROKEN' && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/60 bg-rose-500/15 p-5 text-rose-200">
                <ShieldAlert className="h-6 w-6 shrink-0 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-rose-300">
                    Critical Fault: Tool Broken
                  </h3>
                  <p className="mt-1 text-xs text-rose-100/90">
                    Halt spindle operation immediately and inspect the cutting insert.
                  </p>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Predicted Wear State
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {toolResult.prediction}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Tool Health Score
                </p>
                <p className={`mt-2 text-3xl font-bold tracking-tight ${getHealthColor(toolResult.tool_health_score_percent)}`}>
                  {toolResult.tool_health_score_percent.toFixed(1)}%
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${getHealthBarColor(toolResult.tool_health_score_percent)}`}
                    style={{ width: `${Math.min(100, Math.max(0, toolResult.tool_health_score_percent))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Model Confidence
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-sky-400">
                  {(toolResult.confidence * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Class Probability Distribution */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">
                Softmax Class Probability Distribution
              </h3>
              <div className="space-y-3">
                {(['BASE', 'FRESH', 'MODERATE', 'BROKEN'] as const).map((label) => {
                  const pct = (toolResult.all_probabilities[label] ?? 0) * 100;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">{label}</span>
                        <span className="text-slate-400">{pct.toFixed(2)}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Phase 1: Pump Anomaly Results */}
        {profile === 'pump' && pumpResult && (
          <section className="space-y-5">
            <div
              className={`flex items-center gap-3 rounded-2xl border p-5 ${
                pumpResult.prediction === 'anomaly'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-200'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {pumpResult.prediction === 'anomaly' ? (
                <ShieldAlert className="h-6 w-6 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
              )}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {pumpResult.prediction === 'anomaly'
                    ? 'Acoustic Anomaly Detected'
                    : 'Pump Operating Normally'}
                </h3>
                <p className="mt-0.5 text-xs opacity-90">
                  File evaluated: <span className="font-mono">{pumpMutation.data?.filename}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Classification
                </p>
                <p className="mt-2 text-3xl font-bold uppercase text-white">
                  {pumpResult.prediction}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Anomaly Probability
                </p>
                <p className="mt-2 text-3xl font-bold text-indigo-400">
                  {(pumpResult.anomaly_probability * 100).toFixed(2)}%
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Model Confidence
                </p>
                <p className="mt-2 text-3xl font-bold text-sky-400">
                  {(pumpResult.confidence * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}