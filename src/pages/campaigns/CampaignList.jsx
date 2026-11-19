import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCampaigns,
  createCampaign,
  pauseCampaign,
  resumeCampaign,
} from '../../api/campaigns';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Plus } from 'lucide-react';

export const CampaignList = () => {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    dialMode: 'PROGRESSIVE',
    allocationMethod: 'EQUAL',
    maxAttemptsPerLead: 5,
    callingHoursStart: '09:00',
    callingHoursEnd: '18:00',
    retryInterval: 30,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCampaigns();
      const payload = res.data?.data || res.data;
      setRows(payload.data || payload || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await createCampaign({ ...form, status: 'ACTIVE' });
    setOpen(false);
    await load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black">Campaign Management</h1>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((c) => (
          <div key={c.id} className="bg-white border rounded-2xl p-4">
            <div className="flex justify-between gap-2">
              <Link to={`/campaigns/${c.id}`} className="font-bold text-blue-700 hover:underline">
                {c.name}
              </Link>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{c.description || 'No description'}</p>
            <div className="text-xs mt-3 space-y-1">
              <div>Dial mode: {c.dialMode || 'PROGRESSIVE'}</div>
              <div>Allocation: {c.allocationMethod || 'EQUAL'}</div>
              <div>
                Hours: {c.callingHoursStart}-{c.callingHoursEnd} · Max attempts {c.maxAttemptsPerLead}
              </div>
              {c._count && (
                <div className="pt-1 text-slate-600 font-semibold">
                  Leads: {c._count.leads ?? 0} · Telecallers: {c._count.assignments ?? 0}
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-3 items-center">
              <Link to={`/campaigns/${c.id}`} className="text-xs font-bold text-blue-600">
                Open
              </Link>
              {c.status === 'ACTIVE' ? (
                <button
                  className="text-xs font-bold text-amber-700"
                  onClick={() => pauseCampaign(c.id).then(load)}
                >
                  Pause
                </button>
              ) : (
                <button
                  className="text-xs font-bold text-emerald-700"
                  onClick={() => resumeCampaign(c.id).then(load)}
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ))}
        {!rows.length && (
          <p className="text-xs text-gray-400 col-span-full">No campaigns yet — create one to start</p>
        )}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create campaign">
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            className="w-full border rounded-xl px-3 py-2 text-sm"
            value={form.dialMode}
            onChange={(e) => setForm({ ...form, dialMode: e.target.value })}
          >
            {['MANUAL', 'PREVIEW', 'PROGRESSIVE', 'POWER'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="w-full border rounded-xl px-3 py-2 text-sm"
            value={form.allocationMethod}
            onChange={(e) => setForm({ ...form, allocationMethod: e.target.value })}
          >
            {['EQUAL', 'ROUND_ROBIN', 'PERFORMANCE', 'WORKLOAD', 'PRIORITY_BASED', 'HYBRID'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">
            Create
          </button>
        </form>
      </Modal>
    </div>
  );
};
