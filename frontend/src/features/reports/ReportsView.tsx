import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import type { InspectionRecord } from '../../types/diagnostics';

interface ReportsViewProps {
  inspections: InspectionRecord[];
}

export function ReportsView({ inspections }: ReportsViewProps) {
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState<'all' | 'metal-cutter' | 'industrial-pump'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'anomaly'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'Approved' | 'Pending Review' | 'Flagged'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inspections.filter((item) => {
      const matchesQuery =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.machineId.toLowerCase().includes(q) ||
        item.filename.toLowerCase().includes(q) ||
        item.operator.toLowerCase().includes(q);
      const matchesProfile = profileFilter === 'all' || item.machineProfile === profileFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'healthy' ? !item.isAnomaly : item.isAnomaly);
      const matchesReview = reviewFilter === 'all' || item.reviewStatus === reviewFilter;
      return matchesQuery && matchesProfile && matchesStatus && matchesReview;
    });
  }, [inspections, search, profileFilter, statusFilter, reviewFilter]);

  const handleExportCsv = () => {
    const headers = [
      'InspectionID',
      'Timestamp',
      'Profile',
      'MachineID',
      'Filename',
      'Classification',
      'HealthScore',
      'Confidence',
      'ReviewStatus',
      'Operator',
    ];
    const rows = filtered.map((r) => [
      r.id,
      `"${r.timestamp}"`,
      r.machineProfile,
      r.machineId,
      r.filename,
      r.resultStatus,
      r.healthScore !== undefined ? `${r.healthScore}%` : 'N/A',
      `${r.confidence}%`,
      r.reviewStatus,
      `"${r.operator}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factory_ear_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search run ID, asset, .wav file, or operator..."
              className="w-full rounded-md border border-zinc-300 py-2 pl-9 pr-3 text-xs text-zinc-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV ({filtered.length})
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value as typeof profileFilter)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-teal-700 focus:outline-none"
          >
            <option value="all">All Machine Profiles</option>
            <option value="metal-cutter">CNC Metal Cutter (Phase 2)</option>
            <option value="industrial-pump">Industrial Pump (Phase 1)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-teal-700 focus:outline-none"
          >
            <option value="all">All Outcomes</option>
            <option value="healthy">Nominal / Healthy</option>
            <option value="anomaly">Anomalies &amp; Wear Alerts</option>
          </select>

          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as typeof reviewFilter)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-teal-700 focus:outline-none"
          >
            <option value="all">All Review States</option>
            <option value="Approved">Approved</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Audio File</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Conf.</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3 font-mono font-medium text-zinc-900">{row.id}</td>
                  <td className="px-4 py-3 font-mono text-zinc-500">{row.timestamp}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{row.machineId}</td>
                  <td className="px-4 py-3 font-mono text-zinc-600">{row.filename}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 font-mono tabular-nums text-zinc-700">
                    {row.healthScore !== undefined ? `${row.healthScore.toFixed(1)}%` : '--'}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-zinc-700">
                    {row.confidence.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                      {row.reviewStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{row.operator}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-xs text-zinc-500">
                    No inspection records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}