import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getDuplicates, getLeads } from '../../api/leads';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

export const LeadList = () => {
  const location = useLocation();
  const isDuplicates = location.pathname.includes('/duplicates');
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [dupRows, setDupRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [assignedToId, setAssignedToId] = useState(searchParams.get('assignedToId') || '');
  const [campaignId, setCampaignId] = useState(searchParams.get('campaignId') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      if (isDuplicates) {
        const res = await getDuplicates();
        const payload = res.data?.data || res.data || [];
        const list = Array.isArray(payload) ? payload : [];
        setDupRows(list);
        setTotal(list.length);
        setRows([]);
        setError('');
      } else {
        const res = await getLeads({
          page,
          pageSize,
          search: search || undefined,
          status: status || undefined,
          assignedToId: assignedToId || undefined,
          campaignId: campaignId || undefined,
        });
        const payload = res.data?.data || res.data;
        setRows(payload.data || []);
        setTotal(payload.total || payload.meta?.total || 0);
        setDupRows([]);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatus(searchParams.get('status') || '');
    setAssignedToId(searchParams.get('assignedToId') || '');
    setCampaignId(searchParams.get('campaignId') || '');
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [status, assignedToId, campaignId, isDuplicates]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, assignedToId, campaignId, page, isDuplicates]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black">{isDuplicates ? 'Duplicate leads' : 'Lead Master'}</h1>
          <p className="text-xs text-gray-500">
            {isDuplicates
              ? `${total} mobile numbers with more than one lead`
              : `${total} leads${campaignId ? ' · filtered by campaign' : ''}`}
          </p>
        </div>
        {!isDuplicates && (
          <div className="flex gap-2">
            <input
              className="px-3 py-2 border rounded-xl text-sm"
              placeholder="Search name/mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <select
              className="px-3 py-2 border rounded-xl text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {['NEW', 'ASSIGNED', 'CONTACTED', 'INTERESTED', 'CALL_BACK', 'CONVERTED', 'DND'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button onClick={load} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
              Filter
            </button>
          </div>
        )}
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
      {loading ? (
        <LoadingSpinner />
      ) : isDuplicates ? (
        <div className="bg-white border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Count</th>
              </tr>
            </thead>
            <tbody>
              {dupRows.map((d) => (
                <tr key={String(d.mobileNumber)} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono">{d.mobileNumber}</td>
                  <td className="p-3 font-bold">{Number(d.count)}</td>
                </tr>
              ))}
              {!dupRows.length && (
                <tr>
                  <td colSpan={2} className="p-4 text-gray-400 text-center">
                    No duplicate mobile numbers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="bg-white border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Assigned</th>
                  <th className="p-3 text-left">Campaign</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <Link to={`/leads/${l.id}`} className="font-semibold text-blue-700">
                        {l.customerName}
                      </Link>
                    </td>
                    <td className="p-3 font-mono">{l.mobileNumber}</td>
                    <td className="p-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="p-3">{l.assignedTo?.name || '-'}</td>
                    <td className="p-3">{l.campaign?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > pageSize && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-gray-500">
                Page {page} of {totalPages} · {total} total
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
        </>
      )}
    </div>
  );
};
