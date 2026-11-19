import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEmployeeMIS, exportReport } from '../../api/reports';
import { getCampaigns } from '../../api/campaigns';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { BarChart3 } from 'lucide-react';

const METRIC_LINKS = [
  { key: 'totalAssigned', label: 'Assigned', bucket: null },
  { key: 'totalContacted', label: 'Contacted', bucket: null },
  { key: 'pendingLeads', label: 'Pending', bucket: 'pending' },
  { key: 'followUps', label: 'Follow-ups', bucket: 'followUp' },
  { key: 'interestedLeads', label: 'Interested', bucket: 'interested' },
  { key: 'notInterestedLeads', label: 'Not Interested', bucket: 'notInterested' },
  { key: 'convertedLeads', label: 'Converted', bucket: 'converted' },
  { key: 'rejectedLeads', label: 'Rejected', bucket: 'rejected' },
];

export const EmployeeMIS = () => {
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        const payload = res.data?.data || res.data;
        setCampaigns(payload.data || payload || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    getEmployeeMIS(campaignId ? { campaignId } : undefined)
      .then((res) => {
        const payload = res.data?.data || res.data;
        const list = payload.employees || (Array.isArray(payload) ? payload : []);
        setEmployees(list);
        setSummary(payload.summary || null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="px-4 py-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">
        {error}
      </div>
    );
  }

  const kpis = summary
    ? [
        ['Employees', summary.employeeCount],
        ['Assigned', summary.totalAssigned],
        ['Contacted', summary.totalContacted],
        ['Pending', summary.pending],
        ['Follow-ups', summary.followUps],
        ['Interested', summary.interested],
        ['Converted', summary.converted],
      ]
    : [];

  return (
    <div className="crm-page">
      <PageHeader
        icon={BarChart3}
        title="Employee Productivity MIS"
        subtitle="Campaign-wise and overall telecaller productivity. Click any name or count to drill down."
        actions={
          <>
            <select
              className="crm-btn-secondary"
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
            <Link to="/reports/telecaller-overview" className="crm-btn-secondary">
              Lead overview
            </Link>
            <button
              type="button"
              className="crm-btn-primary"
              onClick={async () => {
                const res = await exportReport('employee');
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'employee-mis.csv';
                a.click();
              }}
            >
              Export CSV
            </button>
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          {kpis.map(([label, value]) => (
            <div key={label} className="crm-kpi">
              <div className="text-xs font-semibold text-slate-500 tracking-wide">{label}</div>
              <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{value ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:hidden">
        {employees.map((r) => {
          const id = r.id || r.userId;
          return (
            <Link
              key={id}
              to={`/reports/employee/${id}`}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm block"
            >
              <div className="font-semibold text-slate-900">{r.name}</div>
              <div className="text-xs text-slate-400 mt-1">
                {[r.employeeId, r.team || r.branch].filter(Boolean).join(' · ')}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-3">
                  <div className="text-lg font-bold text-slate-900">{r.totalAssigned ?? 0}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Assigned</div>
                </div>
                <div className="rounded-xl bg-purple-50 border border-purple-100 px-2 py-3">
                  <div className="text-lg font-bold text-purple-700">{r.convertedLeads ?? 0}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Converted</div>
                </div>
                <div className="rounded-xl bg-teal-50 border border-teal-100 px-2 py-3">
                  <div className="text-lg font-bold text-teal-700">{r.overallProductivity ?? 0}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Score</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/90 sticky top-0">
              <tr>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 min-w-[200px]">
                  Employee
                </th>
                {METRIC_LINKS.map((m) => (
                  <th
                    key={m.key}
                    className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                  >
                    {m.label}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Conv %
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Productivity
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((r) => {
                const id = r.id || r.userId;
                return (
                  <tr key={id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        to={`/reports/employee/${id}`}
                        className="font-semibold text-teal-700 hover:underline"
                      >
                        {r.name}
                      </Link>
                      <div className="text-xs text-slate-400 mt-1">
                        {[r.employeeId, r.team || r.branch].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    {METRIC_LINKS.map((m) => (
                      <td key={m.key} className="px-4 py-4 text-right tabular-nums">
                        <Link
                          to={`/reports/employee/${id}${m.bucket ? `?bucket=${m.bucket}` : ''}`}
                          className="font-semibold text-slate-800 hover:text-teal-700"
                        >
                          {r[m.key] ?? 0}
                        </Link>
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right font-semibold tabular-nums text-slate-800">
                      {r.conversionRateLabel || `${r.conversionRate ?? 0}%`}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex min-w-[3.25rem] justify-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
                        {r.overallProductivity ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!employees.length && (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center text-slate-400">
                    No productivity data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
