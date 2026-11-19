import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getLeads } from '../../api/leads';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

export const LeadList = () => {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [assignedToId, setAssignedToId] = useState(searchParams.get('assignedToId') || '');
  const [campaignId, setCampaignId] = useState(searchParams.get('campaignId') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLeads({
        page: 1,
        pageSize: 50,
        search: search || undefined,
        status: status || undefined,
        assignedToId: assignedToId || undefined,
        campaignId: campaignId || undefined,
      });
      const payload = res.data?.data || res.data;
      setRows(payload.data || []);
      setTotal(payload.total || payload.meta?.total || 0);
      setError('');
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
    load();
  }, [status, assignedToId, campaignId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black">Lead Master</h1>
          <p className="text-xs text-gray-500">
            {total} leads{campaignId ? ' · filtered by campaign' : ''}
          </p>
        </div>
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
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
      {loading ? (
        <LoadingSpinner />
      ) : (
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
      )}
    </div>
  );
};
