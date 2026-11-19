import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AttendancePage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/attendance')
      .then((res) => {
        const payload = res.data?.data || res.data;
        setRows(Array.isArray(payload) ? payload : payload.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Attendance</h1>
      <div className="bg-white border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Login</th>
              <th className="p-3 text-left">Logout</th>
              <th className="p-3 text-left">Break (min)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.user?.name || r.userId}</td>
                <td className="p-3">{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                <td className="p-3">{r.loginTime ? new Date(r.loginTime).toLocaleTimeString() : '-'}</td>
                <td className="p-3">{r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString() : '-'}</td>
                <td className="p-3">{r.breakDuration ?? 0}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No attendance records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
