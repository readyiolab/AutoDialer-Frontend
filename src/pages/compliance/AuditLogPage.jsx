import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AuditLogPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/audit')
      .then((res) => {
        const payload = res.data?.data || res.data;
        setRows(payload.data || payload || []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Audit trail</h1>
      <div className="bg-white border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th className="p-3 text-left">When</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Entity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-3">{r.user?.name || '-'}</td>
                <td className="p-3 font-semibold">{r.action}</td>
                <td className="p-3">
                  {r.entity} {r.entityId ? `(${r.entityId.slice(0, 8)})` : ''}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No audit entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
