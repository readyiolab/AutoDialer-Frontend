import React, { useEffect, useState } from 'react';
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
          <div>Assigned: <strong>{lead.assignedTo?.name || '-'}</strong></div>
          <div>Campaign: <strong>{lead.campaign?.name || '-'}</strong></div>
          <div>Attempts: <strong>{lead.totalAttempts}</strong></div>
          <div>
            PAN: <strong className="font-mono">{lead.panNumber || '—'}</strong>
          </div>
          <div>
            Aadhaar: <strong className="font-mono">{lead.aadhaarNumber || '—'}</strong>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-2">Call history</h3>
        <div className="space-y-2 text-xs">
          {(lead.callRecords || []).map((c) => (
            <div key={c.id} className="border-b py-2 flex justify-between">
              <span>
                {c.user?.name} · {c.disposition || c.rawCallState || '-'}
              </span>
              <span>{new Date(c.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {!lead.callRecords?.length && <div className="text-gray-400">No calls yet</div>}
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-2">Status history</h3>
        <div className="space-y-2 text-xs">
          {(lead.statusHistory || []).map((h) => (
            <div key={h.id} className="border-b py-2">
              {h.fromStatus || '—'} → {h.toStatus} by {h.changedBy?.name} ·{' '}
              {new Date(h.createdAt).toLocaleString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
