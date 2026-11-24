import { useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import type { MachineProfile } from '../../types/diagnostics';

interface SettingsViewProps {
  engineerName: string;
  onChangeEngineerName: (name: string) => void;
  defaultProfile: MachineProfile;
  onChangeDefaultProfile: (profile: MachineProfile) => void;
}

export function SettingsView({
  engineerName,
  onChangeEngineerName,
  defaultProfile,
  onChangeDefaultProfile,
}: SettingsViewProps) {
  const [nameInput, setNameInput] = useState(engineerName);
  const [profileInput, setProfileInput] = useState<MachineProfile>(defaultProfile);
  const [plantName, setPlantName] = useState('Metal Fabrication Bay 04');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChangeEngineerName(nameInput.trim() || 'Reliability Engineer');
    onChangeDefaultProfile(profileInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {saved && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Configuration updated for this session.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Operator & Plant */}
        <section className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
          <h3 className="border-b border-zinc-100 pb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Operator &amp; Facility
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Auditor / Engineer Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Plant / Bay Identifier
              </label>
              <input
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Default Machine Profile
              </label>
              <select
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value as MachineProfile)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-teal-700 focus:outline-none"
              >
                <option value="metal-cutter">CNC Metal Cutter (Phase 2 ToolWearCNN)</option>
                <option value="industrial-pump">Industrial Pump (Phase 1 AnomalyDetectionCNN)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Backend & DSP Contract */}
        <section className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
          <h3 className="border-b border-zinc-100 pb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Inference Gateway &amp; DSP Contract
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                FastAPI Base URL
              </label>
              <input
                type="text"
                disabled
                value="http://127.0.0.1:8000/api/v1"
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-500"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Audio Resampling Standard
              </label>
              <input
                type="text"
                disabled
                value="16,000 Hz Mono • 10s Window • 128-Bin Log-Mel"
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-500"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Predictive Tool Warning Threshold
              </label>
              <input
                type="text"
                disabled
                value="10.0% < tool_health_score_percent <= 50.0%"
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-500"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-800"
        >
          <Save className="h-3.5 w-3.5" />
          Save Configuration
        </button>
      </div>
    </div>
  );
}