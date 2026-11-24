import type {
  PumpInferenceResponse,
  ToolWearInferenceResponse,
} from '../api/inferenceClient';

export type NavigationTab =
  | 'dashboard'
  | 'upload'
  | 'status'
  | 'analysis'
  | 'results'
  | 'reports'
  | 'settings';

export type MachineProfile = 'metal-cutter' | 'industrial-pump';

export type ToolWearClass = 'BASE' | 'FRESH' | 'MODERATE' | 'BROKEN';

export type ReviewStatus = 'Approved' | 'Pending Review' | 'Flagged';

export interface AudioFileDetails {
  file: File;
  name: string;
  sizeFormatted: string;
  lastModified: string;
}

export interface InspectionRecord {
  id: string;
  timestamp: string;
  machineProfile: MachineProfile;
  machineId: string;
  filename: string;
  resultStatus: string;
  isAnomaly: boolean;
  healthScore?: number;
  confidence: number;
  reviewStatus: ReviewStatus;
  operator: string;
  notes?: string;
}

export interface PipelineStage {
  id: number;
  name: string;
  detail: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  latencyMs?: number;
}

export interface ActiveDiagnosticRun {
  id: string;
  profile: MachineProfile;
  machineId: string;
  timestamp: string;
  latencySec: number;
  toolResult?: ToolWearInferenceResponse;
  pumpResult?: PumpInferenceResponse;
}