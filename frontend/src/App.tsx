import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  inferenceService,
  type PumpInferenceResponse,
  type ToolWearInferenceResponse,
} from './api/inferenceClient';
import type {
  ActiveDiagnosticRun,
  AudioFileDetails,
  InspectionRecord,
  MachineProfile,
  NavigationTab,
  PipelineStage,
  ReviewStatus,
} from './types/diagnostics';
import { INITIAL_INSPECTIONS } from './data/seedInspections';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './features/dashboard/DashboardView';
import { UploadView } from './features/upload/UploadView';
import { PipelineStatusView } from './features/pipeline/PipelineStatusView';
import { AudioAnalysisView } from './features/analysis/AudioAnalysisView';
import { ResultsView } from './features/results/ResultsView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';

function buildStages(
  profile: MachineProfile,
  state: 'idle' | 'running' | 'completed' | 'error',
): PipelineStage[] {
  const statusFor = (idx: number): PipelineStage['status'] => {
    if (state === 'idle') return 'pending';
    if (state === 'completed') return 'completed';
    if (state === 'error') return idx < 2 ? 'completed' : idx === 2 ? 'error' : 'pending';
    return idx === 0 ? 'completed' : idx === 1 ? 'running' : 'pending';
  };

  return [
    {
      id: 1,
      name: 'WAV Payload Ingestion',
      detail: 'Validating 16-bit PCM .wav upload and streaming multipart form data to FastAPI.',
      status: statusFor(0),
    },
    {
      id: 2,
      name: 'Librosa DSP & Log-Mel Spectrogram',
      detail: 'Resampling to 16,000 Hz mono, padding/trimming to 10s, extracting [1, 1, 128, 313] tensor.',
      status: statusFor(1),
    },
    {
      id: 3,
      name:
        profile === 'metal-cutter'
          ? 'ToolWearCNN Forward Pass (Phase 2)'
          : 'AnomalyDetectionCNN Forward Pass (Phase 1)',
      detail:
        profile === 'metal-cutter'
          ? 'Evaluating 4-class Softmax probabilities (BASE, FRESH, MODERATE, BROKEN) and health score.'
          : 'Evaluating binary anomaly logit against MIMII -6 dB / 0 dB / +6 dB acoustic baseline.',
      status: statusFor(2),
    },
    {
      id: 4,
      name: 'Diagnostic Report & Audit Logging',
      detail: 'Serializing prediction JSON, checking is_about_to_break threshold, and appending session log.',
      status: statusFor(3),
    },
  ];
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedProfile, setSelectedProfile] = useState<MachineProfile>('metal-cutter');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [engineerName, setEngineerName] = useState('M. Tariq');
  const [machineId, setMachineId] = useState('CNC-MILL-04');
  const [audioDetails, setAudioDetails] = useState<AudioFileDetails | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS);
  const [activeRun, setActiveRun] = useState<ActiveDiagnosticRun | null>(null);
  const [elapsedSec, setElapsedSec] = useState<number | null>(null);
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  const formatTimestamp = () => {
    const now = new Date();
    return `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
  };

  const handleSelectProfile = (next: MachineProfile) => {
    setSelectedProfile(next);
    setMachineId(next === 'metal-cutter' ? 'CNC-MILL-04' : 'PUMP-HYD-00');
  };

  const handleSelectFile = (file: File) => {
    const sizeKb = file.size / 1024;
    const sizeFormatted =
      sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb.toFixed(1)} KB`;
    setAudioDetails({
      file,
      name: file.name,
      sizeFormatted,
      lastModified: new Date(file.lastModified).toLocaleDateString(),
    });
    setPipelineState('idle');
    setElapsedSec(null);
  };

  const toolMutation = useMutation<
    { data: ToolWearInferenceResponse; latency: number },
    Error,
    File
  >({
    mutationFn: async (file) => {
      const t0 = performance.now();
      const data = await inferenceService.analyzeToolWear(file);
      return { data, latency: (performance.now() - t0) / 1000 };
    },
    onSuccess: ({ data, latency }) => {
      const runId = `INSP-26-${Math.floor(1000 + Math.random() * 9000)}`;
      const ts = formatTimestamp();
      setElapsedSec(latency);
      setPipelineState('completed');
      setActiveRun({
        id: runId,
        profile: 'metal-cutter',
        machineId,
        timestamp: ts,
        latencySec: latency,
        toolResult: data,
      });

      const isAnomaly =
        data.analysis.prediction === 'BROKEN' ||
        data.analysis.prediction === 'MODERATE' ||
        data.analysis.is_about_to_break;

      setInspections((prev) => [
        {
          id: runId,
          timestamp: ts,
          machineProfile: 'metal-cutter',
          machineId,
          filename: data.filename,
          resultStatus: data.analysis.prediction,
          isAnomaly,
          healthScore: data.analysis.tool_health_score_percent,
          confidence: Number((data.analysis.confidence * 100).toFixed(2)),
          reviewStatus: isAnomaly ? 'Pending Review' : 'Approved',
          operator: engineerName,
        },
        ...prev,
      ]);
      setCurrentTab('results');
    },
    onError: () => {
      setPipelineState('error');
    },
  });

  const pumpMutation = useMutation<
    { data: PumpInferenceResponse; latency: number },
    Error,
    File
  >({
    mutationFn: async (file) => {
      const t0 = performance.now();
      const data = await inferenceService.analyzePump(file);
      return { data, latency: (performance.now() - t0) / 1000 };
    },
    onSuccess: ({ data, latency }) => {
      const runId = `INSP-26-${Math.floor(1000 + Math.random() * 9000)}`;
      const ts = formatTimestamp();
      setElapsedSec(latency);
      setPipelineState('completed');
      setActiveRun({
        id: runId,
        profile: 'industrial-pump',
        machineId,
        timestamp: ts,
        latencySec: latency,
        pumpResult: data,
      });

      const isAnomaly = data.analysis.prediction === 'anomaly';

      setInspections((prev) => [
        {
          id: runId,
          timestamp: ts,
          machineProfile: 'industrial-pump',
          machineId,
          filename: data.filename,
          resultStatus: isAnomaly ? 'ANOMALY' : 'HEALTHY',
          isAnomaly,
          confidence: Number((data.analysis.confidence * 100).toFixed(2)),
          reviewStatus: isAnomaly ? 'Pending Review' : 'Approved',
          operator: engineerName,
        },
        ...prev,
      ]);
      setCurrentTab('results');
    },
    onError: () => {
      setPipelineState('error');
    },
  });

  const isProcessing = toolMutation.isPending || pumpMutation.isPending;
  const activeError =
    selectedProfile === 'metal-cutter'
      ? toolMutation.error?.message ?? null
      : pumpMutation.error?.message ?? null;

  const handleStartInspection = () => {
    if (!audioDetails) return;
    setPipelineState('running');
    setElapsedSec(null);
    setCurrentTab('status');
    if (selectedProfile === 'metal-cutter') {
      toolMutation.mutate(audioDetails.file);
    } else {
      pumpMutation.mutate(audioDetails.file);
    }
  };

  const handleSubmitSignOff = (
    runId: string,
    reviewStatus: ReviewStatus,
    notes: string,
  ) => {
    setInspections((prev) =>
      prev.map((row) =>
        row.id === runId ? { ...row, reviewStatus, notes } : row,
      ),
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f6f7f9] text-zinc-900 antialiased">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedProfile={selectedProfile}
        onToggleProfile={handleSelectProfile}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        engineerName={engineerName}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          currentTab={currentTab}
          selectedProfile={selectedProfile}
          onSelectProfile={handleSelectProfile}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isProcessing={isProcessing}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              inspections={inspections}
              onNavigate={setCurrentTab}
              onSelectProfile={handleSelectProfile}
            />
          )}

          {currentTab === 'upload' && (
            <UploadView
              selectedProfile={selectedProfile}
              onSelectProfile={handleSelectProfile}
              machineId={machineId}
              onChangeMachineId={setMachineId}
              audioDetails={audioDetails}
              onSelectFile={handleSelectFile}
              onStartInspection={handleStartInspection}
              isProcessing={isProcessing}
              apiError={activeError}
            />
          )}

          {currentTab === 'status' && (
            <PipelineStatusView
              stages={buildStages(selectedProfile, pipelineState)}
              isProcessing={isProcessing}
              elapsedSec={elapsedSec}
              selectedProfile={selectedProfile}
              audioDetails={audioDetails}
              apiError={activeError}
              onRerun={handleStartInspection}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'analysis' && (
            <AudioAnalysisView
              audioDetails={audioDetails}
              selectedProfile={selectedProfile}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'results' && (
            <ResultsView
              activeRun={activeRun}
              engineerName={engineerName}
              onSubmitSignOff={handleSubmitSignOff}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'reports' && <ReportsView inspections={inspections} />}

          {currentTab === 'settings' && (
            <SettingsView
              engineerName={engineerName}
              onChangeEngineerName={setEngineerName}
              defaultProfile={selectedProfile}
              onChangeDefaultProfile={handleSelectProfile}
            />
          )}
        </main>
      </div>
    </div>
  );
}