import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLead } from '../../api/leads';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

export const LeadDetail = () => {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getLead(id)
      .then((res) => setLead(res.data?.data || res.data))
      .catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id]);

  const timelineByRound = useMemo(() => {
    if (!lead) return [];
    const rounds = (lead.roundMemberships || []).map((m) => ({
      roundId: m.roundId || m.round?.id,
      roundNumber: m.round?.roundNumber ?? 0,
      membership: m,
      events: [],
    }));
    const byId = new Map(rounds.map((r) => [r.roundId, r]));
    const orphan = { roundId: null, roundNumber: 0, membership: null, events: [] };

    const push = (roundId, event) => {
      const bucket = (roundId && byId.get(roundId)) || orphan;
      bucket.events.push(event);
    };

    for (const a of lead.assignmentHistory || []) {
      push(a.roundId, {
        at: a.createdAt,
        kind: 'assignment',
        text: `Assigned to ${a.toUser?.name || '—'} (${a.source || 'MANUAL'})`,
      });
    }
    for (const c of lead.callRecords || []) {
      push(c.roundId, {
        at: c.createdAt,
        kind: 'call',
        text: `Attempt ${c.attemptNumber}: ${c.disposition || c.rawCallState || 'in progress'} · ${c.user?.name || ''}${c.remarks ? ` — ${c.remarks}` : ''}`,
      });
    }
    for (const h of lead.statusHistory || []) {
      push(h.roundId, {
        at: h.createdAt,
        kind: 'status',
        text: `${h.fromStatus || '—'} → ${h.toStatus} by ${h.changedBy?.name || '—'}`,
      });
    }
    for (const f of lead.followUps || []) {
      push(f.roundId, {
        at: f.createdAt || f.scheduledDate,
        kind: 'followup',
        text: `Follow-up ${f.status} on ${new Date(f.scheduledDate).toLocaleString()}${f.remarks ? ` — ${f.remarks}` : ''}`,
      });
    }

    const sorted = [...rounds, ...(orphan.events.length ? [orphan] : [])].map((r) => ({
      ...r,
      events: r.events.sort((a, b) => new Date(a.at) - new Date(b.at)),
    }));
    return sorted.sort((a, b) => a.roundNumber - b.roundNumber);
  }, [lead]);

  if (error) return <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error}</div>;
  if (!lead) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <Link to="/leads" className="text-xs text-blue-600 font-semibold">
        ← Back to leads
      </Link>
      <div className="bg-white border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black">{lead.customerName}</h1>
            <div className="text-lg font-mono text-blue-700 mt-1">{lead.mobileNumber}</div>
            <div className="text-xs text-gray-500 mt-2">
              {lead.city || '-'} · {lead.email || 'no email'}
            </div>
          </div>
          <StatusBadge status={lead.status} />
        </div>
        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div>
            Assigned: <strong>{lead.assignedTo?.name || '-'}</strong>
          </div>
          <div>
            Campaign: <strong>{lead.campaign?.name || '-'}</strong>
          </div>
          <div>
            Current round:{' '}
            <strong>
              {lead.currentRound ? `Round ${lead.currentRound.roundNumber}` : '—'}
            </strong>
          </div>
          <div>
            Lifetime attempts: <strong>{lead.totalAttempts}</strong>
          </div>
          <div>
            PAN: <strong className="font-mono">{lead.panNumber || '—'}</strong>
          </div>
          <div>
            Aadhaar: <strong className="font-mono">{lead.aadhaarNumber || '—'}</strong>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-4">
        <h3 className="font-bold text-sm">Activity timeline by round</h3>
        {timelineByRound.map((r) => (
          <div key={r.roundId || 'none'} className="border rounded-xl p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs font-black">
                {r.roundNumber ? `Round ${r.roundNumber}` : 'Unscoped history'}
              </div>
              {r.membership && (
                <div className="text-[11px] text-gray-500">
                  Entered as {r.membership.statusAtEntry} · attempts in round{' '}
                  {r.membership.roundAttemptCount}
                  {r.membership.assignedTo?.name
                    ? ` · ${r.membership.assignedTo.name}`
                    : ''}
                </div>
              )}
            </div>
            <div className="space-y-2 text-xs">
              {r.events.map((ev, idx) => (
                <div key={`${ev.kind}-${idx}-${ev.at}`} className="border-b py-1.5 flex justify-between gap-3">
                  <span>{ev.text}</span>
                  <span className="text-gray-400 whitespace-nowrap">
                    {ev.at ? new Date(ev.at).toLocaleString() : ''}
                  </span>
                </div>
              ))}
              {!r.events.length && <div className="text-gray-400">No events</div>}
            </div>
          </div>
        ))}
        {!timelineByRound.length && (
          <div className="text-xs text-gray-400">No activity yet</div>
        )}
      </div>
    </div>
  );
};
