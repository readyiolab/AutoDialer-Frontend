import React, { useEffect, useState } from 'react';
import { getCompanies, createCompany, setCompanyStatus } from '../../api/companies';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Building2, Plus } from 'lucide-react';

const emptyForm = {
  name: '',
  code: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  adminName: '',
  adminPhone: '',
  adminEmail: '',
};

export const CompanyList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const res = await getCompanies({ page: nextPage, pageSize });
      const payload = res.data?.data || res.data;
      const list = payload.data || payload || [];
      setData(Array.isArray(list) ? list : []);
      setTotal(payload.total || payload.meta?.total || (Array.isArray(list) ? list.length : 0));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCompany(form);
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    await setCompanyStatus(id, status);
    await load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> Customers / Companies
          </h1>
          <p className="text-xs text-gray-500">Platform admin onboarding and account control</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-left p-3">Users / Leads</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3">{c.code}</td>
                <td className="p-3 text-xs">
                  {c.contactName || '-'}
                  <div className="text-gray-400">{c.email}</div>
                </td>
                <td className="p-3 text-xs">
                  {c._count?.users || 0} / {c._count?.leads || 0}
                </td>
                <td className="p-3">
                  <StatusBadge status={c.status || (c.isActive ? 'ACTIVE' : 'INACTIVE')} />
                </td>
                <td className="p-3 space-x-2 text-xs">
                  {c.status !== 'ACTIVE' && (
                    <button className="text-emerald-600 font-semibold" onClick={() => changeStatus(c.id, 'ACTIVE')}>
                      Activate
                    </button>
                  )}
                  {c.status === 'ACTIVE' && (
                    <button className="text-amber-600 font-semibold" onClick={() => changeStatus(c.id, 'SUSPENDED')}>
                      Suspend
                    </button>
                  )}
                  <button className="text-rose-600 font-semibold" onClick={() => changeStatus(c.id, 'INACTIVE')}>
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400 text-sm">
                  No companies yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-500">
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border rounded-xl font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border rounded-xl font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create customer company">
        <form onSubmit={submit} className="space-y-3">
          {[
            ['name', 'Company name'],
            ['code', 'Company code'],
            ['contactName', 'Contact person'],
            ['email', 'Company email'],
            ['phone', 'Phone'],
            ['address', 'Address'],
            ['adminName', 'Admin name'],
            ['adminPhone', 'Admin phone'],
            ['adminEmail', 'Admin email'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-semibold">{label}</label>
              <input
                className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={['name', 'code', 'email', 'adminName', 'adminPhone'].includes(key)}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold"
          >
            {saving ? 'Creating...' : 'Create & send invitation'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
