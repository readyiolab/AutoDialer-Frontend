import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTelecallerLeadOverview } from '../../api/reports';
import { getCampaigns } from '../../api/campaigns';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { Users } from 'lucide-react';

const COLUMNS = [
  { key: 'assignedLeads', label: 'Assigned', bucket: null },
  { key: 'completed', label: 'Completed', bucket: null },
  { key: 'remaining', label: 'Remaining', bucket: 'pending' },
  { key: 'interested', label: 'Interested', bucket: 'interested' },
  { key: 'notInterested', label: 'Not Interested', bucket: 'notInterested' },
  { key: 'followUp', label: 'Follow-ups', bucket: 'followUp' },
  { key: 'noAnswer', label: 'No Answer', bucket: 'contacted' },
  { key: 'totalAttempts', label: 'Total Attempts', bucket: null },
  { key: 'progress', label: 'Progress', bucket: null },
  { key: 'currentActivity', label: 'Current Activity', bucket: null },
];

const cellValue = (row, key) => {
  if (key === 'progress') return `${row.completed ?? 0} / ${row.assignedLeads ?? 0}`;
  if (key === 'currentActivity') {
    const activity = row.currentActivity;
    return activity ? `${activity.status}${activity.campaignName ? ` · ${activity.campaignName}` : ''}` : 'Offline';
  }
  return row[key] ?? 0;
};

export const TelecallerLeadOverview = () => {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getTelecallerLeadOverview({
        campaignId: campaignId || undefined,
      });
      const payload = res.data?.data || res.data;
      setRows(payload.employees || []);
      setTotals(payload.totals || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load overview');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        const payload = res.data?.data || res.data;
        setCampaigns(payload.data || payload || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const refreshTimer = setInterval(() => load({ silent: true }), 15000);
    return () => clearInterval(refreshTimer);
  }, [campaignId]);

  return (
    <div className="crm-page">
      <PageHeader
        icon={Users}
        title="Telecaller Lead Overview"
        subtitle="Assigned lead counts by status for each telecaller"
        actions={
          <>
            <select
              className="crm-input w-48"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">All campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={load} className="crm-btn-secondary">
              Refresh
            </button>
            <Link to="/reports/employee" className="crm-btn-primary">
              Productivity MIS
            </Link>
          </>
        }
      />

      {error && (
        <div className="px-4 py-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {totals && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {COLUMNS.filter((col) => !['progress', 'currentActivity'].includes(col.key)).map((col) => (
                <div key={col.key} className="crm-kpi">
                  <div className="text-xs font-semibold text-slate-500">{col.label}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {totals[col.key] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Telecaller
                    </th>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.userId} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <Link
                          to={`/reports/employee/${r.userId}`}
                          className="font-semibold text-teal-700 hover:underline"
                        >
                          {r.name}
                        </Link>
                        {r.employeeId && (
                          <div className="text-xs text-slate-400 mt-1">{r.employeeId}</div>
                        )}
                      </td>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={`px-4 py-4 tabular-nums ${col.key === 'currentActivity' ? 'text-left' : 'text-right'}`}>
                          {col.bucket ? (
                            <Link
                              to={`/reports/employee/${r.userId}?bucket=${col.bucket}`}
                              className="font-semibold text-slate-800 hover:text-teal-700"
                            >
                              {cellValue(r, col.key)}
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-800">{cellValue(r, col.key)}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td
                        colSpan={COLUMNS.length + 1}
                        className="px-5 py-16 text-center text-slate-400"
                      >
                        No telecaller lead data yet. Upload and allocate leads first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
