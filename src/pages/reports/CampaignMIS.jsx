import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCampaigns, getCampaignStats, listCampaignRounds } from '../../api/campaigns';
import { getCampaignRoundsComparison, exportReport } from '../../api/reports';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

export const CampaignMIS = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [roundCompare, setRoundCompare] = useState(null);

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
              const [sRes, rRes] = await Promise.all([
                getCampaignStats(c.id),
                listCampaignRounds(c.id).catch(() => ({ data: [] })),
              ]);
              const stats = sRes.data?.data || sRes.data;
              const rounds = rRes.data?.data || rRes.data || [];
              return { ...c, stats, rounds: Array.isArray(rounds) ? rounds : [] };
            } catch {
              return { ...c, stats: null, rounds: [] };
            }
          }),
        );
        if (!cancelled) {
          setRows(withStats);
          if (withStats[0]?.id) setSelectedId(withStats[0].id);
        }
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

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    getCampaignRoundsComparison(selectedId)
      .then((res) => {
        if (!cancelled) setRoundCompare(res.data?.data || res.data);
      })
      .catch(() => {
        if (!cancelled) setRoundCompare(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const downloadCsv = async () => {
    try {
      const res = await exportReport('campaign', {});
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaign-mis.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">Campaign MIS</h1>
          <p className="text-xs text-gray-500">
            Campaign metrics with round-wise unique leads vs total call attempts
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="px-3 py-1.5 border rounded-xl text-xs font-bold"
        >
          Export CSV
        </button>
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
                <th className="p-3 font-semibold">Rounds</th>
                <th className="p-3 font-semibold">Active round done %</th>
                <th className="p-3 font-semibold">Converted</th>
                <th className="p-3 font-semibold">Conv %</th>
                <th className="p-3 font-semibold">Calls</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const active = (c.rounds || []).find((r) => r.status === 'ACTIVE');
                return (
                  <tr
                    key={c.id}
                    className={`border-t hover:bg-slate-50/80 cursor-pointer ${
                      selectedId === c.id ? 'bg-blue-50/60' : ''
                    }`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="p-3">
                      <Link
                        to={`/campaigns/${c.id}`}
                        className="font-bold text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3">{c.stats?.totalLeads ?? c._count?.leads ?? '—'}</td>
                    <td className="p-3">{c.rounds?.length ?? 0}</td>
                    <td className="p-3">{active?.counts?.completionPct ?? '—'}%</td>
                    <td className="p-3">{c.stats?.convertedLeads ?? '—'}</td>
                    <td className="p-3">{c.stats ? `${c.stats.conversionRate ?? 0}%` : '—'}</td>
                    <td className="p-3">{c.stats?.totalCalls ?? c._count?.callRecords ?? '—'}</td>
                  </tr>
                );
              })}
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

      {roundCompare?.rounds?.length > 0 && (
        <div className="bg-white border rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-bold">
            Round comparison — {roundCompare.campaign?.name}
          </h2>
          <p className="text-[11px] text-gray-500">{roundCompare.note}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-2">Round</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Unique leads</th>
                  <th className="py-2 pr-2">Unique attempted</th>
                  <th className="py-2 pr-2">Total attempts</th>
                  <th className="py-2 pr-2">Completion</th>
                  <th className="py-2">Top dispositions</th>
                </tr>
              </thead>
              <tbody>
                {roundCompare.rounds.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-bold">R{r.roundNumber}</td>
                    <td className="py-2 pr-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 pr-2">{r.uniqueLeads}</td>
                    <td className="py-2 pr-2">{r.uniqueAttempted}</td>
                    <td className="py-2 pr-2">{r.totalCallAttempts}</td>
                    <td className="py-2 pr-2">{r.completionPct}%</td>
                    <td className="py-2">
                      {Object.entries(r.dispositions || {})
                        .slice(0, 4)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(' · ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
