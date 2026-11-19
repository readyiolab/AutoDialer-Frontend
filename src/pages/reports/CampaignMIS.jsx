import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCampaigns, getCampaignStats } from '../../api/campaigns';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

export const CampaignMIS = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getCampaigns();
        const payload = res.data?.data || res.data;
        const campaigns = payload.data || payload || [];
        const withStats = await Promise.all(
          campaigns.map(async (c) => {
            try {
              const sRes = await getCampaignStats(c.id);
              const stats = sRes.data?.data || sRes.data;
              return { ...c, stats };
            } catch {
              return { ...c, stats: null };
            }
          }),
        );
        if (!cancelled) setRows(withStats);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load campaign MIS');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black">Campaign MIS</h1>
        <p className="text-xs text-gray-500">Lead and conversion metrics by campaign</p>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500">
                <th className="p-3 font-semibold">Campaign</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Leads</th>
                <th className="p-3 font-semibold">Unassigned</th>
                <th className="p-3 font-semibold">Telecallers</th>
                <th className="p-3 font-semibold">Converted</th>
                <th className="p-3 font-semibold">Conv %</th>
                <th className="p-3 font-semibold">Calls</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t hover:bg-slate-50/80">
                  <td className="p-3">
                    <Link to={`/campaigns/${c.id}`} className="font-bold text-blue-600 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3">{c.stats?.totalLeads ?? c._count?.leads ?? '—'}</td>
                  <td className="p-3">{c.stats?.unassignedLeads ?? '—'}</td>
                  <td className="p-3">{c.stats?.totalTelecallers ?? c._count?.assignments ?? '—'}</td>
                  <td className="p-3">{c.stats?.convertedLeads ?? '—'}</td>
                  <td className="p-3">{c.stats ? `${c.stats.conversionRate ?? 0}%` : '—'}</td>
                  <td className="p-3">{c.stats?.totalCalls ?? c._count?.callRecords ?? '—'}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-gray-400">
                    No campaigns yet
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
