import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/roles');
      const payload = res.data?.data || res.data;
      setRoles(Array.isArray(payload) ? payload : payload.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (role) => {
    const raw = prompt('Permissions JSON array', JSON.stringify(role.permissions || []));
    if (!raw) return;
    try {
      const permissions = JSON.parse(raw);
      await api.patch(`/settings/roles/${role.id}/permissions`, { permissions });
      setMessage('Saved');
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Roles & Permissions</h1>
      {message && <div className="text-xs text-blue-700">{message}</div>}
      <div className="space-y-3">
        {roles.map((r) => (
          <div key={r.id} className="bg-white border rounded-2xl p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-bold">{r.displayName || r.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {(Array.isArray(r.permissions) ? r.permissions : []).join(', ') || 'No permissions'}
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600" onClick={() => save(r)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
