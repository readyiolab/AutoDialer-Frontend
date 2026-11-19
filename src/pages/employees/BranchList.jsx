import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Building2, Plus } from 'lucide-react';

const emptyForm = { name: '', code: '', city: '', state: '' };

export const BranchList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/branches');
      const payload = res.data?.data || res.data;
      setRows(Array.isArray(payload) ? payload : payload.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/branches', form);
      setForm(emptyForm);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        render: (b) => (
          <div className="min-w-[160px]">
            <div className="font-semibold text-slate-900">{b.name}</div>
            {b.createdAt ? (
              <div className="text-xs text-slate-400 mt-0.5">
                Added {new Date(b.createdAt).toLocaleDateString()}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: 'code',
        label: 'Code',
        render: (b) => (
          <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            {b.code}
          </span>
        ),
      },
      {
        key: 'city',
        label: 'City',
        render: (b) => <span className="text-slate-600">{b.city || '—'}</span>,
      },
      {
        key: 'state',
        label: 'State',
        render: (b) => <span className="text-slate-600">{b.state || '—'}</span>,
      },
    ],
    [],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="crm-page">
      <PageHeader
        icon={Building2}
        title="Branches"
        subtitle="Organize teams by branch and territory"
        actions={
          <button type="button" className="crm-btn-primary" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        }
      />

      {error && (
        <div className="px-4 py-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        emptyTitle="No branches yet"
        emptySubtitle="Add a branch to assign employees by location."
      />

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setForm(emptyForm);
        }}
        title="Add Branch"
        subtitle="Create a branch for employee assignment"
        maxWidth="max-w-xl"
        footer={
          <>
            <button
              type="button"
              className="crm-btn-secondary"
              onClick={() => {
                setOpen(false);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
            <button type="submit" form="add-branch-form" className="crm-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Create branch'}
            </button>
          </>
        }
      >
        <form id="add-branch-form" onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="crm-label">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              className="crm-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Delhi HQ"
            />
          </div>
          <div>
            <label className="crm-label">
              Code <span className="text-rose-500">*</span>
            </label>
            <input
              className="crm-input"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
              placeholder="DEL01"
            />
          </div>
          <div>
            <label className="crm-label">City</label>
            <input
              className="crm-input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
            />
          </div>
          <div>
            <label className="crm-label">State</label>
            <input
              className="crm-input"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
