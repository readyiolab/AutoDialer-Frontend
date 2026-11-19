import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  listDevices,
  getDeviceHistory,
  blockDevice,
  revokeDevice,
  resetDevice,
  authorizeReplacement,
  revokeAllSessions,
} from '../../api/devices';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Smartphone, ShieldOff, RotateCcw, Ban, History } from 'lucide-react';

const fmt = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};

export const EmployeeDeviceManagement = () => {
  const [params] = useSearchParams();
  const filterUserId = params.get('userId') || '';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [history, setHistory] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDevices(filterUserId ? { userId: filterUserId } : undefined);
      const payload = res.data?.data || res.data || [];
      setRows(Array.isArray(payload) ? payload : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterUserId]);

  const act = async (id, fn) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId('');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        render: (r) => (
          <div>
            <div className="font-medium text-slate-900">{r.user?.name || '—'}</div>
            <div className="text-xs text-slate-500">{r.user?.email || r.user?.phone || '—'}</div>
          </div>
        ),
      },
      {
        key: 'device',
        label: 'Device',
        render: (r) => (
          <div>
            <div className="text-sm text-slate-800">{r.model || 'Unknown model'}</div>
            <div className="text-xs text-slate-500 font-mono truncate max-w-[180px]">{r.deviceId}</div>
          </div>
        ),
      },
      {
        key: 'os',
        label: 'Android / App',
        render: (r) => (
          <div className="text-sm">
            <div>Android {r.androidVersion || '—'}</div>
            <div className="text-xs text-slate-500">App {r.appVersion || '—'}</div>
          </div>
        ),
      },
      {
        key: 'registered',
        label: 'Registered',
        render: (r) => <span className="text-sm">{fmt(r.registeredAt)}</span>,
      },
      {
        key: 'lastActive',
        label: 'Last active',
        render: (r) => <span className="text-sm">{fmt(r.lastActiveAt || r.lastAuthAt)}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <div className="space-y-1">
            <StatusBadge status={r.status} />
            {Array.isArray(r.riskFlags) && r.riskFlags.length > 0 && (
              <div className="text-[10px] text-amber-700">Risk: {r.riskFlags.join(', ')}</div>
            )}
            <div className="text-[10px] text-slate-500">Account: {r.user?.status || '—'}</div>
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (r) => (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              disabled={busyId === r.id}
              className="px-2 py-1 text-xs rounded border border-slate-200 hover:bg-slate-50"
              onClick={() =>
                act(r.id, async () => {
                  const res = await getDeviceHistory(r.id);
                  setHistory(res.data?.data || res.data);
                })
              }
              title="History"
            >
              <History className="inline w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={busyId === r.id || r.status === 'BLOCKED'}
              className="px-2 py-1 text-xs rounded border border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={() => act(r.id, () => blockDevice(r.id))}
            >
              <Ban className="inline w-3.5 h-3.5 mr-0.5" />
              Block
            </button>
            <button
              type="button"
              disabled={busyId === r.id || r.status !== 'ACTIVE'}
              className="px-2 py-1 text-xs rounded border border-amber-200 text-amber-800 hover:bg-amber-50"
              onClick={() => act(r.id, () => revokeDevice(r.id))}
            >
              <ShieldOff className="inline w-3.5 h-3.5 mr-0.5" />
              Revoke
            </button>
            <button
              type="button"
              disabled={busyId === r.id}
              className="px-2 py-1 text-xs rounded border border-lime-300 text-slate-800 hover:bg-lime-50"
              onClick={() => act(r.id, () => resetDevice(r.id))}
            >
              <RotateCcw className="inline w-3.5 h-3.5 mr-0.5" />
              Reset
            </button>
            <button
              type="button"
              disabled={busyId === r.id || !r.userId}
              className="px-2 py-1 text-xs rounded border border-slate-200 hover:bg-slate-50"
              onClick={() =>
                act(r.id, async () => {
                  await authorizeReplacement(r.userId);
                  await revokeAllSessions(r.userId);
                })
              }
            >
              Replace
            </button>
          </div>
        ),
      },
    ],
    [busyId],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employee Device Management"
        subtitle="One telecaller account = one authorized Android device. Reset/replace when a phone changes."
        icon={Smartphone}
      />

      {filterUserId ? (
        <div className="text-sm text-slate-600">
          Filtered by employee.{' '}
          <Link to="/employees/devices" className="text-lime-700 underline">
            Show all
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable columns={columns} rows={rows} emptyTitle="No registered devices yet." />
      )}

      <Modal
        isOpen={!!history}
        onClose={() => setHistory(null)}
        title="Device history"
        maxWidth="max-w-2xl"
      >
        {history ? (
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            <div className="text-sm text-slate-600">
              {history.device?.user?.name} · {history.device?.model} · {history.device?.deviceId}
            </div>
            <ul className="space-y-2">
              {(history.logs || []).map((log) => (
                <li key={log.id} className="rounded border border-slate-100 p-2 text-sm">
                  <div className="font-medium">{log.action}</div>
                  <div className="text-xs text-slate-500">{fmt(log.createdAt)}</div>
                </li>
              ))}
              {(history.logs || []).length === 0 ? (
                <li className="text-sm text-slate-500">No audit events.</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
