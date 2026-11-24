import { useRef, useState } from 'react';
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildStages(
  profile: MachineProfile,
  activeStep: number, // -1 = idle, 0..3 = currently running stage, 4 = all completed
  errorStep: number | null,
): PipelineStage[] {
  const statusFor = (idx: number): PipelineStage['status'] => {
    if (errorStep !== null) {
      if (idx < errorStep) return 'completed';
      if (idx === errorStep) return 'error';
      return 'pending';
    }
    if (activeStep === -1) return 'pending';
    if (idx < activeStep) return 'completed';
    if (idx === activeStep) return 'running';
    return 'pending';
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

  // Per-stage pipeline progression state (-1 = idle, 0..3 = running stage, 4 = all done)
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [errorStageIndex, setErrorStageIndex] = useState<number | null>(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Guards against overlapping runs if the user clicks Re-run quickly
  const runTokenRef = useRef<number>(0);

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
    setActiveStageIndex(-1);
    setErrorStageIndex(null);
    setApiError(null);
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
  });

  const handleStartInspection = async () => {
    if (!audioDetails || isPipelineRunning) return;

    const currentToken = ++runTokenRef.current;
    const profileSnapshot = selectedProfile;
    const machineSnapshot = machineId;
    const fileSnapshot = audioDetails.file;

    setIsPipelineRunning(true);
    setApiError(null);
    setErrorStageIndex(null);
    setElapsedSec(null);
    setActiveStageIndex(0);
    setCurrentTab('status');

    // Kick off the real FastAPI request immediately in parallel with the UI stage stepper
    const apiPromise =
      profileSnapshot === 'metal-cutter'
        ? toolMutation.mutateAsync(fileSnapshot)
        : pumpMutation.mutateAsync(fileSnapshot);

    try {
      // Stage 1: WAV Payload Ingestion
      await sleep(280);
      if (runTokenRef.current !== currentToken) return;
      setActiveStageIndex(1);

      // Stage 2: Librosa DSP & Log-Mel Spectrogram
      await sleep(320);
      if (runTokenRef.current !== currentToken) return;
      setActiveStageIndex(2);

      // Stage 3: PyTorch CNN Forward Pass — waits for BOTH real API response & minimum visual beat
      const [result] = await Promise.all([apiPromise, sleep(380)]);
      if (runTokenRef.current !== currentToken) return;

      setElapsedSec(result.latency);
      setActiveStageIndex(3);

      // Stage 4: Diagnostic Report & Audit Logging
      await sleep(280);
      if (runTokenRef.current !== currentToken) return;

      const runId = `INSP-26-${Math.floor(1000 + Math.random() * 9000)}`;
      const ts = formatTimestamp();

      if (profileSnapshot === 'metal-cutter') {
        const data = result.data as ToolWearInferenceResponse;
        setActiveRun({
          id: runId,
          profile: 'metal-cutter',
          machineId: machineSnapshot,
          timestamp: ts,
          latencySec: result.latency,
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
            machineId: machineSnapshot,
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
      } else {
        const data = result.data as PumpInferenceResponse;
        setActiveRun({
          id: runId,
          profile: 'industrial-pump',
          machineId: machineSnapshot,
          timestamp: ts,
          latencySec: result.latency,
          pumpResult: data,
        });

        const isAnomaly = data.analysis.prediction === 'anomaly';

        setInspections((prev) => [
          {
            id: runId,
            timestamp: ts,
            machineProfile: 'industrial-pump',
            machineId: machineSnapshot,
            filename: data.filename,
            resultStatus: isAnomaly ? 'ANOMALY' : 'HEALTHY',
            isAnomaly,
            confidence: Number((data.analysis.confidence * 100).toFixed(2)),
            reviewStatus: isAnomaly ? 'Pending Review' : 'Approved',
            operator: engineerName,
          },
          ...prev,
        ]);
      }

      // Mark all 4 stages completed and hold briefly so user sees 100% green checkmarks
      setActiveStageIndex(4);
      await sleep(350);
      if (runTokenRef.current !== currentToken) return;

      setIsPipelineRunning(false);
      setCurrentTab('results');
    } catch (err) {
      if (runTokenRef.current !== currentToken) return;
      const message = err instanceof Error ? err.message : 'Inference request failed.';
      setApiError(message);
      setErrorStageIndex((prev) => (prev !== null ? prev : 2));
      setIsPipelineRunning(false);
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
          isProcessing={isPipelineRunning}
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
              isProcessing={isPipelineRunning}
              apiError={apiError}
            />
          )}

          {currentTab === 'status' && (
            <PipelineStatusView
              stages={buildStages(selectedProfile, activeStageIndex, errorStageIndex)}
              isProcessing={isPipelineRunning}
              elapsedSec={elapsedSec}
              selectedProfile={selectedProfile}
              audioDetails={audioDetails}
              apiError={apiError}
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