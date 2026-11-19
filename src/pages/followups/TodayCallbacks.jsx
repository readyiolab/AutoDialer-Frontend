import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TodayCallbacks = () => {
  const location = useLocation();
  const type = location.pathname.includes('overdue') ? 'overdue' : 'today';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/followups', { params: { type } })
      .then((res) => {
        const payload = res.data?.data || res.data;
        setRows(payload.data || payload || []);
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load callbacks'))
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black">{type === 'overdue' ? 'Overdue Callbacks' : "Today's Callbacks"}</h1>
        <p className="text-xs text-slate-500">{rows.length} record(s)</p>
      </div>
      <div className="bg-white border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th className="p-3 text-left">Lead</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Agent</th>
              <th className="p-3 text-left">Scheduled</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t ${type === 'overdue' ? 'bg-rose-50/40' : ''}`}>
                <td className="p-3 font-medium">{r.lead?.customerName || r.leadId}</td>
                <td className="p-3 tabular-nums">{r.lead?.mobileNumber || '—'}</td>
                <td className="p-3">{r.user?.name || '-'}</td>
                <td className="p-3 text-xs">{new Date(r.scheduledDate).toLocaleString()}</td>
                <td className="p-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No {type === 'overdue' ? 'overdue' : 'today'} callbacks
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
