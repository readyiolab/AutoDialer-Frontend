import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getEmployeeLeads } from '../../api/reports';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';

const BUCKETS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'followUp', label: 'Follow-up' },
  { value: 'interested', label: 'Interested' },
  { value: 'notInterested', label: 'Not Interested' },
  { value: 'converted', label: 'Converted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'invalid', label: 'Invalid' },
];

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

export const EmployeeLeadDetail = () => {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [bucket, setBucket] = useState(searchParams.get('bucket') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const res = await getEmployeeLeads(userId, {
        page: nextPage,
        pageSize: 50,
        search: search || undefined,
        bucket: bucket || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPayload(res.data?.data || res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    setPage(1);
    const params = {};
    if (bucket) params.bucket = bucket;
    if (search) params.search = search;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, bucket]);

  const employee = payload?.employee;
  const chips = payload?.chips;
  const rows = payload?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link to="/reports/employee" className="hover:text-teal-700">
              Productivity MIS
            </Link>
            <span>/</span>
            <Link to="/reports/telecaller-overview" className="hover:text-teal-700">
              Overview
            </Link>
          </div>
          <h1 className="text-xl font-black text-slate-900">
            {employee?.name || 'Employee leads'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {[employee?.employeeId, employee?.team?.name, employee?.branch?.name]
              .filter(Boolean)
              .join(' · ') || 'Assigned lead activity'}
          </p>
        </div>
      </div>

      {chips && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            ['Total', chips.total, ''],
            ['Pending', chips.pending, 'pending'],
            ['Follow-up', chips.followUp, 'followUp'],
            ['Interested', chips.interested, 'interested'],
            ['Converted', chips.converted, 'converted'],
            ['Rejected', chips.rejected, 'rejected'],
            ['Not Interested', chips.notInterested, 'notInterested'],
          ].map(([label, value, b]) => (
            <button
              key={label}
              type="button"
              onClick={() => setBucket(b)}
              className={`text-left bg-white border rounded-2xl p-4 shadow-sm transition ${
                bucket === b ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-slate-500">{label}</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{value ?? 0}</div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            placeholder="Search name / mobile / email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1)}
          />
          <select
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
          >
            {BUCKETS.map((b) => (
              <option key={b.value || 'all'} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <button
            onClick={() => {
              setPage(1);
              load(1);
            }}
            className="px-3 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold"
          >
            Apply filters
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Lead Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Assigned</th>
                  <th className="px-4 py-3 text-left font-semibold">Last Contact</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Follow-up</th>
                  <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                  <th className="px-4 py-3 text-right font-semibold">Attempts</th>
                  <th className="px-4 py-3 text-left font-semibold">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-semibold text-teal-700 hover:underline"
                      >
                        {lead.customerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{lead.mobileNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{lead.email || '—'}</td>
                    <td className="px-4 py-3">{formatDate(lead.assignedDate)}</td>
                    <td className="px-4 py-3">{formatDate(lead.lastContactDate)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3">{formatDate(lead.followUpDate)}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-slate-600" title={lead.remarks || ''}>
                      {lead.remarks || '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {lead.totalAttempts ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          lead.isConverted ? 'text-purple-700' : 'text-slate-500'
                        }`}
                      >
                        {lead.conversionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      No leads match these filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {payload?.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
              <span className="text-slate-500">
                Page {payload.page} of {payload.totalPages} · {payload.total} leads
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    load(p);
                  }}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= payload.totalPages}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    load(p);
                  }}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
