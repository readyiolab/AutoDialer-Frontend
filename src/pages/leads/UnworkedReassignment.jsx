import React, { useEffect, useMemo, useState } from 'react';
import { getUnworkedLeads, transferLeads } from '../../api/leads';
import { getUsers } from '../../api/users';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RefreshCw, UserPlus } from 'lucide-react';

const BUCKETS = [
  { id: 'ALL', label: 'All issues' },
  { id: 'NEVER_CALLED', label: 'Never called' },
  { id: 'IDLE', label: 'Idle 2+ days' },
  { id: 'OVERDUE_FOLLOWUP', label: 'Overdue follow-up' },
  { id: 'UNANSWERED_STREAK', label: '3+ unanswered' },
  { id: 'INACTIVE_ASSIGNEE', label: 'Inactive assignee' },
  { id: 'NEEDS_REVIEW', label: 'Needs review' },
];

const REASONS = [
  'UNWORKED',
  'IDLE',
  'OVERDUE_FOLLOWUP',
  'INACTIVE_ASSIGNEE',
  'UNANSWERED_STREAK',
  'MANAGER_REQUEST',
  'WORKLOAD_BALANCE',
];

export const UnworkedReassignment = () => {
  const [bucket, setBucket] = useState('ALL');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState({});
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('UNWORKED');
  const [remarks, setRemarks] = useState('');
  const [allowProtected, setAllowProtected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [leadsRes, usersRes] = await Promise.all([
        getUnworkedLeads({ bucket, page: 1, pageSize: 100 }),
        getUsers({ page: 1, pageSize: 100 }),
      ]);
      const body = leadsRes.data || {};
      const listPayload = body.data;
      setRows(Array.isArray(listPayload) ? listPayload : listPayload?.data || []);
      setMeta(body.meta || listPayload?.meta || null);
      const usersPayload = usersRes.data?.data || usersRes.data;
      const list = usersPayload.data || usersPayload || [];
      setAgents(list.filter((u) => u.status === 'ACTIVE'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load unworked leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bucket]);

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleAll = () => {
    if (selectedIds.length === rows.length) {
      setSelected({});
      return;
    }
    const next = {};
    rows.forEach((r) => {
      next[r.id] = true;
    });
    setSelected(next);
  };

  const reassign = async () => {
    if (!selectedIds.length || !toUserId) {
      setError('Select leads and a target telecaller');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await transferLeads({
        leadIds: selectedIds,
        toUserId,
        reason,
        remarks,
        allowProtectedOverride: allowProtected,
      });
      const data = res.data?.data || res.data;
      setMessage(
        `Reassigned ${data.transferred || 0}` +
          (data.skippedProtected ? ` · skipped protected ${data.skippedProtected}` : ''),
      );
      setSelected({});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Reassignment failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !rows.length) return <LoadingSpinner />;

  return (
    <div className="crm-page space-y-4">
      <PageHeader
        icon={UserPlus}
        title="Unworked & Reassignment"
        subtitle="Reclaim idle, overdue, and unanswered leads without losing history"
        actions={
          <button type="button" className="crm-chip" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {BUCKETS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`crm-chip ${bucket === b.id ? 'bg-teal-600 text-white border-teal-600' : ''}`}
            onClick={() => setBucket(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm">{error}</div>}
      {message && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm">{message}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 grid md:grid-cols-4 gap-3">
        <div>
          <label className="crm-label">Reassign to</label>
          <select className="crm-input" value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
            <option value="">Select telecaller</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.employeeId || a.phone})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="crm-label">Reason</label>
          <select className="crm-input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="crm-label">Remarks</label>
          <input className="crm-input" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={allowProtected}
              onChange={(e) => setAllowProtected(e.target.checked)}
            />
            Allow INTERESTED / CONVERTED override
          </label>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50"
            disabled={saving || !selectedIds.length || !toUserId}
            onClick={reassign}
          >
            Reassign {selectedIds.length || ''} lead(s)
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Showing {rows.length} of {meta?.total ?? rows.length} · bucket {bucket}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedIds.length === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3 text-left">Lead</th>
              <th className="p-3 text-left">Why</th>
              <th className="p-3 text-left">Assignee</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Attempts</th>
              <th className="p-3 text-left">Last contact</th>
              <th className="p-3 text-left">Next FU</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">
                  <input type="checkbox" checked={!!selected[r.id]} onChange={() => toggle(r.id)} />
                </td>
                <td className="p-3">
                  <div className="font-semibold text-slate-900">{r.customerName}</div>
                  <div className="text-xs text-slate-400">{r.mobileNumber}</div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(r.issues || []).map((issue) => (
                      <span
                        key={issue}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100"
                      >
                        {issue}
                      </span>
                    ))}
                    {!r.issues?.length ? <span className="text-xs text-slate-400">—</span> : null}
                  </div>
                </td>
                <td className="p-3">
                  <div>{r.assignedTo?.name || '—'}</div>
                  <div className="text-xs text-slate-400">{r.assignedTo?.status}</div>
                </td>
                <td className="p-3">
                  <StatusBadge status={r.status} />
                  {r.needsReview ? (
                    <span className="ml-2 text-[10px] font-bold text-amber-600">REVIEW</span>
                  ) : null}
                </td>
                <td className="p-3 tabular-nums text-xs">
                  {r.totalAttempts || 0} att · {r.connectedCalls || 0} conn
                </td>
                <td className="p-3 text-xs">
                  {r.lastContactedAt ? new Date(r.lastContactedAt).toLocaleString() : '—'}
                </td>
                <td className="p-3 text-xs">
                  {r.nextFollowUpAt ? new Date(r.nextFollowUpAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No leads in this bucket
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
