import React, { useEffect, useState } from 'react';
import { getLiveActivity } from '../../api/calls';
import { getOnlineUsers } from '../../api/users';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Radio } from 'lucide-react';

export const LiveCalling = () => {
  const [rows, setRows] = useState([]);
  const [online, setOnline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = async () => {
    try {
      const [liveRes, onlineRes] = await Promise.all([
        getLiveActivity(),
        getOnlineUsers().catch(() => ({ data: [] })),
      ]);
      const live = liveRes.data?.data || liveRes.data || [];
      setRows(Array.isArray(live) ? live : []);
      const on = onlineRes.data?.data || onlineRes.data || [];
      setOnline(Array.isArray(on) ? on : []);
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const tick = () => {
      if (document.visibilityState === 'visible') load();
    };
    const t = setInterval(tick, 5000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Live floor
          </h1>
          <p className="text-xs text-gray-500">
            Online agents: {online.length} · Updated {updatedAt?.toLocaleTimeString() || '-'}
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold">
          Refresh
        </button>
      </div>

      <div className="bg-white border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="p-3 text-left">Agent</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Calls today</th>
              <th className="p-3 text-left">Connected</th>
              <th className="p-3 text-left">Last lead</th>
              <th className="p-3 text-left">Disposition</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId || r.id} className="border-t">
                <td className="p-3 font-semibold">{r.name || r.userName}</td>
                <td className="p-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-3">{r.callsToday ?? 0}</td>
                <td className="p-3">{r.connectedToday ?? 0}</td>
                <td className="p-3">{r.lastLead || '-'}</td>
                <td className="p-3 text-xs">{r.lastDisposition || '-'}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No live activity yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
