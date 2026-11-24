import { FileAudio, Sliders, Upload } from 'lucide-react';
import type {
  AudioFileDetails,
  MachineProfile,
  NavigationTab,
} from '../../types/diagnostics';
import { WaveformPlayer } from '../../components/audio/WaveformPlayer';

interface AudioAnalysisViewProps {
  audioDetails: AudioFileDetails | null;
  selectedProfile: MachineProfile;
  onNavigate: (tab: NavigationTab) => void;
}

export function AudioAnalysisView({
  audioDetails,
  selectedProfile,
  onNavigate,
}: AudioAnalysisViewProps) {
  return (
    <div className="space-y-6">
      {/* Time-Domain Waveform */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Time-Domain Waveform Playback (WaveSurfer.js Canvas)
          </h3>
          {audioDetails && (
            <span className="font-mono text-[11px] text-zinc-500">
              {audioDetails.sizeFormatted}
            </span>
          )}
        </div>

        {audioDetails ? (
          <WaveformPlayer file={audioDetails.file} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <FileAudio className="h-8 w-8 text-zinc-400 mb-2" />
            <p className="text-sm font-medium text-zinc-800">
              No acoustic file loaded
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Upload a .wav recording to inspect its time-domain waveform and run CNN inference.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              <Upload className="h-3.5 w-3.5" />
              Go to Acoustic Upload
            </button>
          </div>
        )}
      </section>

      {/* DSP & Model Feature Specification Grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal-700" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Librosa DSP Preprocessing Contract
              </h4>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">
              AudioPreprocessor
            </span>
          </div>

          <dl className="divide-y divide-zinc-100 text-xs">
            <div className="flex justify-between py-2">
              <dt className="text-zinc-500">Target Sampling Rate</dt>
              <dd className="font-mono font-medium text-zinc-900">16,000 Hz (Mono)</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-zinc-500">Fixed Window Length</dt>
              <dd className="font-mono font-medium text-zinc-900">10.0s (160,000 samples)</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-zinc-500">Feature Representation</dt>
              <dd className="font-mono font-medium text-zinc-900">128-Bin Log-Mel Spectrogram</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-zinc-500">Input Tensor Shape</dt>
              <dd className="font-mono font-medium text-zinc-900">[1, 1, 128, 313]</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Active CNN Architecture Profile
            </h4>
            <span className="rounded bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-800 border border-teal-200">
              {selectedProfile === 'metal-cutter' ? 'PHASE 2' : 'PHASE 1'}
            </span>
          </div>

          {selectedProfile === 'metal-cutter' ? (
            <dl className="divide-y divide-zinc-100 text-xs">
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Model Class</dt>
                <dd className="font-mono font-medium text-zinc-900">ToolWearCNN</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Backbone</dt>
                <dd className="font-mono font-medium text-zinc-900">3-Block Conv2d + GAP</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Output Head</dt>
                <dd className="font-mono font-medium text-zinc-900">4-Class Softmax</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Predictive Rule</dt>
                <dd className="font-mono font-medium text-amber-700">
                  10% &lt; Health &le; 50% Warning
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="divide-y divide-zinc-100 text-xs">
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Model Class</dt>
                <dd className="font-mono font-medium text-zinc-900">AnomalyDetectionCNN</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Backbone</dt>
                <dd className="font-mono font-medium text-zinc-900">3-Block Conv2d + GAP</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Output Head</dt>
                <dd className="font-mono font-medium text-zinc-900">Binary Sigmoid (0.50 thresh)</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500">Training Noise Floors</dt>
                <dd className="font-mono font-medium text-zinc-900">MIMII -6 dB, 0 dB, +6 dB</dd>
              </div>
            </dl>
          )}
        </div>
      </section>
    </div>
  );
}