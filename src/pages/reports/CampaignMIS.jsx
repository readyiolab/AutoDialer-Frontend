import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCampaigns, getCampaignStats, listCampaignRounds } from '../../api/campaigns';
import { getCampaignRoundsComparison, exportReport } from '../../api/reports';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

const PAGE_SIZE = 10;

export const CampaignMIS = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [statsById, setStatsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [roundCompare, setRoundCompare] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getCampaigns();
        const payload = res.data?.data || res.data;
        const list = payload.data || payload || [];
        const campaignsList = Array.isArray(list) ? list : [];
        if (!cancelled) {
          setCampaigns(campaignsList);
          if (campaignsList[0]?.id) setSelectedId(campaignsList[0].id);
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
    if (!campaigns.length) return;
    let cancelled = false;
    const start = (page - 1) * PAGE_SIZE;
    const visible = campaigns.slice(start, start + PAGE_SIZE);
    const needIds = visible.map((c) => c.id).filter((id) => !statsById[id]);
    if (!needIds.length) return;

    (async () => {
      const entries = await Promise.all(
        needIds.map(async (id) => {
          try {
            const [sRes, rRes] = await Promise.all([
              getCampaignStats(id),
              listCampaignRounds(id).catch(() => ({ data: [] })),
            ]);
            const stats = sRes.data?.data || sRes.data;
            const rounds = rRes.data?.data || rRes.data || [];
            return [id, { stats, rounds: Array.isArray(rounds) ? rounds : [] }];
          } catch {
            return [id, { stats: {}, rounds: [] }];
          }
        }),
      );
      if (cancelled) return;
      setStatsById((prev) => {
        const next = { ...prev };
        entries.forEach(([id, val]) => {
          next[id] = val;
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, campaigns]);

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

  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const pageRows = campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              {pageRows.map((c) => {
                const extra = statsById[c.id] || {};
                const rounds = extra.rounds || [];
                const stats = extra.stats;
                const active = rounds.find((r) => r.status === 'ACTIVE');
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
                    <td className="p-3">{stats?.totalLeads ?? c._count?.leads ?? '—'}</td>
                    <td className="p-3">{rounds.length || '—'}</td>
                    <td className="p-3">{active?.counts?.completionPct ?? '—'}%</td>
                    <td className="p-3">{stats?.convertedLeads ?? '—'}</td>
                    <td className="p-3">{stats ? `${stats.conversionRate ?? 0}%` : '—'}</td>
                    <td className="p-3">{stats?.totalCalls ?? c._count?.callRecords ?? '—'}</td>
                  </tr>
                );
              })}
              {!campaigns.length && (
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

      {campaigns.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-500">
            Page {page} of {totalPages} · {campaigns.length} campaigns
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border rounded-xl font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border rounded-xl font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
