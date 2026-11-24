import { useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  FileAudio,
  PlayCircle,
  UploadCloud,
  Wrench,
} from 'lucide-react';
import type { AudioFileDetails, MachineProfile } from '../../types/diagnostics';
import { WaveformPlayer } from '../../components/audio/WaveformPlayer';

interface UploadViewProps {
  selectedProfile: MachineProfile;
  onSelectProfile: (profile: MachineProfile) => void;
  machineId: string;
  onChangeMachineId: (id: string) => void;
  audioDetails: AudioFileDetails | null;
  onSelectFile: (file: File) => void;
  onStartInspection: () => void;
  isProcessing: boolean;
  apiError: string | null;
}

export function UploadView({
  selectedProfile,
  onSelectProfile,
  machineId,
  onChangeMachineId,
  audioDetails,
  onSelectFile,
  onStartInspection,
  isProcessing,
  apiError,
}: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndPassFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.wav')) {
      setValidationError(
        'Unsupported format. Factory Ear requires uncompressed 16-bit PCM .wav audio files.',
      );
      return;
    }
    setValidationError(null);
    onSelectFile(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndPassFile(e.target.files?.[0]);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndPassFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Dual-Profile Model Selection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            1. Select Target Machine Model
          </h3>
          <span className="font-mono text-[11px] text-zinc-500">
            Input: 16 kHz / 128-bin Log-Mel Spectrogram
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Phase 2: CNC Metal Cutter */}
          <button
            type="button"
            onClick={() => onSelectProfile('metal-cutter')}
            className={`rounded-lg border p-5 text-left transition ${
              selectedProfile === 'metal-cutter'
                ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${
                    selectedProfile === 'metal-cutter'
                      ? 'bg-teal-700 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    CNC Metal Cutter — Tool Wear
                  </p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    ToolWearCNN • 4-Class Softmax
                  </p>
                </div>
              </div>
              <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600">
                PHASE 2
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-200/80 pt-3 text-xs">
              <div>
                <span className="text-[11px] text-zinc-500 block">Classes</span>
                <span className="font-mono text-[11px] text-zinc-800">
                  BASE, FRESH, MODERATE, BROKEN
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Endpoint</span>
                <span className="font-mono text-[11px] text-teal-700">
                  /inference/analyze-tool
                </span>
              </div>
            </div>
          </button>

          {/* Phase 1: Industrial Pump */}
          <button
            type="button"
            onClick={() => onSelectProfile('industrial-pump')}
            className={`rounded-lg border p-5 text-left transition ${
              selectedProfile === 'industrial-pump'
                ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${
                    selectedProfile === 'industrial-pump'
                      ? 'bg-teal-700 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Industrial Fluid Pump — Anomaly
                  </p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    AnomalyDetectionCNN • Binary Logit
                  </p>
                </div>
              </div>
              <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600">
                PHASE 1
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-200/80 pt-3 text-xs">
              <div>
                <span className="text-[11px] text-zinc-500 block">Noise Floors</span>
                <span className="font-mono text-[11px] text-zinc-800">
                  MIMII -6 dB, 0 dB, +6 dB
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Endpoint</span>
                <span className="font-mono text-[11px] text-teal-700">
                  /inference/analyze
                </span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Step 2: Asset Tag & WAV Ingestion */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              2. Ingest Acoustic Recording (.WAV)
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Audio is resampled to 16,000 Hz and normalized to a 10-second tensor window on the server.
            </p>
          </div>

          <div className="w-full sm:w-56">
            <label
              htmlFor="machine-id-input"
              className="block text-[11px] font-medium text-zinc-600 mb-1"
            >
              Asset / Machine ID
            </label>
            <input
              id="machine-id-input"
              type="text"
              value={machineId}
              onChange={(e) => onChangeMachineId(e.target.value)}
              placeholder="e.g. CNC-MILL-04"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
            isDragging
              ? 'border-teal-600 bg-teal-50/50'
              : 'border-zinc-300 bg-zinc-50/70 hover:border-zinc-400'
          }`}
        >
          <UploadCloud className="h-8 w-8 text-zinc-400 mb-2.5" />
          <p className="text-sm font-medium text-zinc-800">
            Drop a <span className="font-mono text-teal-700">.wav</span> recording here, or click to browse
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Uncompressed PCM WAV only • Dispatched directly to FastAPI
          </p>
          <input
            type="file"
            accept=".wav,audio/wav,audio/x-wav"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        {(validationError || apiError) && (
          <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{validationError ?? apiError}</span>
          </div>
        )}

        {/* Selected File Metadata + Live Waveform Preview */}
        {audioDetails && (
          <div className="space-y-4 border-t border-zinc-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FileAudio className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-mono text-xs font-semibold text-zinc-900">
                    {audioDetails.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {audioDetails.sizeFormatted} • Modified {audioDetails.lastModified}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                WAV Validated
              </span>
            </div>

            <WaveformPlayer file={audioDetails.file} />

            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-zinc-500">
                Target route:{' '}
                <span className="font-mono text-zinc-800">
                  POST /api/v1/inference/
                  {selectedProfile === 'metal-cutter' ? 'analyze-tool' : 'analyze'}
                </span>
              </p>

              <button
                type="button"
                onClick={onStartInspection}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlayCircle className="h-4 w-4" />
                {isProcessing ? 'Executing CNN Inference...' : 'Run Acoustic Diagnostic'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}