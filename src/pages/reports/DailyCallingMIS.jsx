import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDailyCallingMIS, exportReport } from '../../api/reports';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const DailyCallingMIS = () => {
  const location = useLocation();
  const pageTitle = useMemo(() => {
    if (location.pathname.includes('/call-history')) return 'Call History';
    if (location.pathname.includes('/followup-mis')) return 'Follow-up MIS';
    if (location.pathname.includes('/reports/branch')) return 'Branch MIS';
    return 'Daily Calling MIS';
  }, [location.pathname]);

  const [data, setData] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDailyCallingMIS({ dateFrom: dateFrom || undefined });
      setData(res.data?.data || res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load MIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const download = async () => {
    const res = await exportReport('daily-calling', { dateFrom: dateFrom || undefined });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily-calling.csv';
    a.click();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-xl font-black">{pageTitle}</h1>
        <div className="flex gap-2">
          <input
            type="date"
            className="border rounded-xl px-3 py-2 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <button onClick={load} className="px-3 py-2 bg-gray-100 rounded-xl text-sm font-bold">
            Apply
          </button>
          <button onClick={download} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
            Export CSV
          </button>
        </div>
      </div>
      <pre className="bg-white border rounded-2xl p-4 text-xs overflow-auto max-h-[70vh]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
