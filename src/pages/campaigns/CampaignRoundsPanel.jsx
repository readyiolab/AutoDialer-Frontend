import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listCampaignRounds,
  previewNextRound,
  createNextRound,
  allocateRound,
  completeRound,
  getCampaignRoundAnalytics,
} from '../../api/campaigns';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RefreshCw, Plus, CheckCircle2 } from 'lucide-react';

const RECYCLE_OPTIONS = [
  { code: 'FOLLOW_UP_REQUIRED', label: 'Follow-up Required' },
  { code: 'CALL_BACK', label: 'Call Back Later' },
  { code: 'NO_ANSWER', label: 'No Answer' },
  { code: 'BUSY', label: 'Busy' },
  { code: 'SWITCHED_OFF', label: 'Switched Off' },
  { code: 'NOT_REACHABLE', label: 'Not Reachable' },
  { code: 'PENDING', label: 'Pending' },
  { code: 'NOT_CONTACTED', label: 'Not Contacted' },
  { code: 'CONTACTED', label: 'Contacted' },
  { code: 'INTERESTED', label: 'Interested' },
];

export const CampaignRoundsPanel = ({ campaignId, telecallers = [] }) => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [statuses, setStatuses] = useState([
    'FOLLOW_UP_REQUIRED',
    'CALL_BACK',
    'NO_ANSWER',
    'BUSY',
    'SWITCHED_OFF',
  ]);
  const [preview, setPreview] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [method, setMethod] = useState('EQUAL');
  const [busy, setBusy] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedRoundId, setSelectedRoundId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listCampaignRounds(campaignId);
      const data = res.data?.data || res.data || [];
      setRounds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rounds');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!telecallers.length) return;
    setSelectedUsers((prev) =>
      prev.length ? prev : telecallers.map((t) => t.userId || t.user?.id || t.id).filter(Boolean),
    );
  }, [telecallers]);

  const activeRound = useMemo(
    () => rounds.find((r) => r.status === 'ACTIVE') || rounds[rounds.length - 1],
    [rounds],
  );

  const toggleStatus = (code) => {
    setStatuses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const runPreview = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await previewNextRound(campaignId, { statuses });
      setPreview(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Preview failed');
    } finally {
      setBusy(false);
    }
  };

  const createRound = async () => {
    if (!preview?.eligibleCount) {
      setError('Run preview first — no eligible leads');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await createNextRound(campaignId, {
        statuses,
        clearAssignees: true,
        allocate: selectedUsers.length
          ? { method, userIds: selectedUsers }
          : undefined,
      });
      const payload = res.data?.data || res.data;
      setMessage(
        `Round ${payload.round?.roundNumber} created with ${payload.membershipCount} leads` +
          (payload.allocation
            ? ` · allocated ${payload.allocation.allocated}`
            : ''),
      );
      setWizardOpen(false);
      setPreview(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create round failed');
    } finally {
      setBusy(false);
    }
  };

  const redistribute = async (roundId) => {
    if (!selectedUsers.length) {
      setError('Select telecallers before allocate');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await allocateRound(campaignId, roundId, {
        method,
        userIds: selectedUsers,
      });
      const payload = res.data?.data || res.data;
      setMessage(`Allocated ${payload.allocated} leads in round`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Allocate failed');
    } finally {
      setBusy(false);
    }
  };

  const markComplete = async (roundId) => {
    setBusy(true);
    try {
      await completeRound(campaignId, roundId);
      setMessage('Round marked completed');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Complete failed');
    } finally {
      setBusy(false);
    }
  };

  const loadAnalytics = async (roundId) => {
    setSelectedRoundId(roundId);
    setBusy(true);
    try {
      const res = await getCampaignRoundAnalytics(campaignId, roundId);
      setAnalytics(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analytics failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white border rounded-2xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold">Calling rounds</h2>
          <p className="text-[11px] text-gray-500">
            Recycle leads by outcome into Round 2+ without duplicating customers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="px-2.5 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setWizardOpen((v) => !v)}
            className="px-2.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New round
          </button>
        </div>
      </div>

      {error && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
      {message && (
        <div className="p-2 bg-emerald-50 text-emerald-700 text-xs rounded-xl">{message}</div>
      )}

      {activeRound?.counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="border rounded-xl p-2">
            <div className="text-gray-400">Active round</div>
            <div className="font-black text-lg">R{activeRound.roundNumber}</div>
          </div>
          <div className="border rounded-xl p-2">
            <div className="text-gray-400">In round</div>
            <div className="font-black text-lg">{activeRound.counts.membership}</div>
          </div>
          <div className="border rounded-xl p-2">
            <div className="text-gray-400">Unique attempted</div>
            <div className="font-black text-lg">{activeRound.counts.attemptedUnique}</div>
          </div>
          <div className="border rounded-xl p-2">
            <div className="text-gray-400">Call attempts</div>
            <div className="font-black text-lg">{activeRound.counts.totalAttempts}</div>
          </div>
          <div className="border rounded-xl p-2">
            <div className="text-gray-400">Completion</div>
            <div className="font-black text-lg">{activeRound.counts.completionPct}%</div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-2">Round</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Members</th>
              <th className="py-2 pr-2">Unique attempted</th>
              <th className="py-2 pr-2">Attempts</th>
              <th className="py-2 pr-2">Done %</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-2 font-bold">Round {r.roundNumber}</td>
                <td className="py-2 pr-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="py-2 pr-2">{r.counts?.membership ?? '—'}</td>
                <td className="py-2 pr-2">{r.counts?.attemptedUnique ?? '—'}</td>
                <td className="py-2 pr-2">{r.counts?.totalAttempts ?? '—'}</td>
                <td className="py-2 pr-2">{r.counts?.completionPct ?? 0}%</td>
                <td className="py-2 space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => loadAnalytics(r.id)}
                    className="text-blue-600 font-bold"
                  >
                    Analytics
                  </button>
                  {r.status !== 'COMPLETED' && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => redistribute(r.id)}
                        className="text-teal-600 font-bold"
                      >
                        Allocate
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => markComplete(r.id)}
                        className="text-gray-600 font-bold inline-flex items-center gap-0.5"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!rounds.length && (
              <tr>
                <td colSpan={7} className="py-4 text-gray-400">
                  No rounds yet — upload leads to create Round 1
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {wizardOpen && (
        <div className="border rounded-2xl p-3 space-y-3 bg-slate-50/80">
          <h3 className="text-xs font-black uppercase tracking-wide">New round wizard</h3>
          <div className="flex flex-wrap gap-2">
            {RECYCLE_OPTIONS.map((opt) => (
              <label
                key={opt.code}
                className={`px-2 py-1 rounded-lg border text-[11px] cursor-pointer ${
                  statuses.includes(opt.code)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={statuses.includes(opt.code)}
                  onChange={() => toggleStatus(opt.code)}
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-bold mb-1">Distribution</div>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full border rounded-xl px-2 py-1.5 text-xs"
              >
                <option value="EQUAL">Equal</option>
                <option value="WORKLOAD">Workload-based</option>
                <option value="ROUND_ROBIN">Round robin</option>
                <option value="MANUAL">Manual (use equal + adjust later)</option>
              </select>
              <div className="mt-2 max-h-28 overflow-y-auto space-y-1">
                {telecallers.map((t) => {
                  const uid = t.userId || t.user?.id || t.id;
                  const name = t.user?.name || t.name || uid;
                  return (
                    <label key={uid} className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(uid)}
                        onChange={() =>
                          setSelectedUsers((prev) =>
                            prev.includes(uid)
                              ? prev.filter((x) => x !== uid)
                              : [...prev, uid],
                          )
                        }
                      />
                      {name}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold mb-1">Preview</div>
              {preview ? (
                <div className="text-xs space-y-1">
                  <div>
                    Eligible: <strong>{preview.eligibleCount}</strong>
                  </div>
                  <div className="text-gray-500">
                    {Object.entries(preview.statusBreakdown || {})
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ') || '—'}
                  </div>
                  <div className="max-h-24 overflow-y-auto border rounded-lg bg-white p-2">
                    {(preview.sample || []).map((l) => (
                      <div key={l.id} className="truncate">
                        {l.customerName} · {l.mobileNumber} · {l.status}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400">Run preview to see eligible leads</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !statuses.length}
              onClick={runPreview}
              className="px-3 py-1.5 border rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="button"
              disabled={busy || !preview?.eligibleCount}
              onClick={createRound}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Confirm & create
            </button>
          </div>
        </div>
      )}

      {analytics && selectedRoundId && (
        <div className="border rounded-2xl p-3 space-y-2 text-xs">
          <div className="font-bold">
            Round {analytics.round?.roundNumber} analytics
          </div>
          <p className="text-gray-500">{analytics.note}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="border rounded-lg p-2">
              Unique in round: <strong>{analytics.uniqueLeadsInRound}</strong>
            </div>
            <div className="border rounded-lg p-2">
              Unique attempted: <strong>{analytics.uniqueAttemptedLeads}</strong>
            </div>
            <div className="border rounded-lg p-2">
              Total attempts: <strong>{analytics.totalCallAttempts}</strong>
            </div>
            <div className="border rounded-lg p-2">
              Completion: <strong>{analytics.completionPct}%</strong>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="font-semibold mb-1">Lifecycle</div>
              {(analytics.lifecycleBreakdown || []).map((row) => (
                <div key={row.status} className="flex justify-between border-b py-0.5">
                  <span>{row.status}</span>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="font-semibold mb-1">Telecallers</div>
              {(analytics.telecallerPerformance || []).map((row) => (
                <div key={row.userId} className="flex justify-between border-b py-0.5 gap-2">
                  <span className="truncate">{row.name || row.userId}</span>
                  <span>
                    {row.uniqueLeadsAttempted} unique / {row.totalCallAttempts} attempts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
