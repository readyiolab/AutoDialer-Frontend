import React, { useEffect, useMemo, useState } from 'react';
import {
  getUsers,
  createUser,
  updateUser,
  setUserStatus,
  resendInvitation,
  resetPassword,
} from '../../api/users';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, Search, Users } from 'lucide-react';
import api from '../../api/axios';
import { normalizeIndianMobile, validateIndianMobile, validatePersonName } from '../../utils/validation';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  roleId: '',
  employeeId: '',
  dailyTarget: 100,
  shareLink: '',
  panNumber: '',
  aadhaarNumber: '',
  sendInvitation: true,
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

export const EmployeeList = () => {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);

  const inviteRoles = useMemo(
    () => roles.filter((r) => r.name !== 'SUPER_ADMIN'),
    [roles],
  );

  const selectedRole = useMemo(
    () => inviteRoles.find((r) => r.id === form.roleId) || roles.find((r) => r.id === form.roleId),
    [inviteRoles, roles, form.roleId],
  );
  const isTelecaller = selectedRole?.name === 'TELECALLER';

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        getUsers({ page: 1, pageSize: 100, search: search || undefined }),
        api.get('/settings/roles').catch(() => ({ data: [] })),
      ]);
      const payload = usersRes.data?.data || usersRes.data;
      setRows(payload.data || payload || []);
      const rolePayload = rolesRes.data?.data || rolesRes.data || [];
      setRoles(Array.isArray(rolePayload) ? rolePayload : rolePayload.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const nameErr = validatePersonName(form.name);
    const phoneErr = validateIndianMobile(form.phone);
    if (nameErr || phoneErr) {
      setError(nameErr || phoneErr);
      return;
    }
    if (!form.roleId) {
      setError('Select a role');
      return;
    }
    if (isTelecaller) {
      const pan = form.panNumber.trim().toUpperCase();
      const aadhaar = form.aadhaarNumber.replace(/\D/g, '');
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        setError('Enter a valid PAN (e.g. ABCDE1234F)');
        return;
      }
      if (!/^\d{12}$/.test(aadhaar)) {
        setError('Enter a valid 12-digit Aadhaar number');
        return;
      }
    }
    setSaving(true);
    try {
      await createUser({
        ...form,
        name: form.name.trim(),
        phone: normalizeIndianMobile(form.phone),
        employeeId: form.employeeId || undefined,
        shareLink: form.shareLink?.trim() || undefined,
        panNumber: isTelecaller ? form.panNumber.trim().toUpperCase() : undefined,
        aadhaarNumber: isTelecaller ? form.aadhaarNumber.replace(/\D/g, '') : undefined,
      });
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Create failed';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        render: (u) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center text-xs font-bold shrink-0">
              {initials(u.name)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{u.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{u.employeeId || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'Phone',
        render: (u) => <span className="tabular-nums text-slate-700">{u.phone || '—'}</span>,
      },
      {
        key: 'email',
        label: 'Email',
        render: (u) => <span className="text-slate-600">{u.email || '—'}</span>,
      },
      {
        key: 'role',
        label: 'Role',
        render: (u) => (
          <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            {u.role?.displayName || u.role?.name || '—'}
          </span>
        ),
      },
      {
        key: 'team',
        label: 'Team',
        render: (u) => <span className="text-slate-600">{u.team?.name || '—'}</span>,
      },
      {
        key: 'shareLink',
        label: 'UTM / Share link',
        render: (u) =>
          u.shareLink ? (
            <a
              href={u.shareLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-teal-700 underline break-all max-w-[220px] block"
            >
              {u.shareLink}
            </a>
          ) : (
            <span className="text-slate-400 text-xs">Not set</span>
          ),
      },
      {
        key: 'kyc',
        label: 'PAN / Aadhaar',
        render: (u) =>
          u.role?.name === 'TELECALLER' || u.panNumber || u.aadhaarNumber ? (
            <div className="text-xs text-slate-700 space-y-0.5 tabular-nums">
              <div>PAN: {u.panNumber || '—'}</div>
              <div>Aadhaar: {u.aadhaarNumber || '—'}</div>
            </div>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (u) => <StatusBadge status={u.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (u) => (
          <div className="flex flex-wrap gap-2 max-w-[280px]">
            {u.status !== 'ACTIVE' && (
              <button
                type="button"
                className="crm-chip text-emerald-700 border-emerald-200 bg-emerald-50"
                onClick={() => setUserStatus(u.id, 'ACTIVE').then(load)}
              >
                Activate
              </button>
            )}
            {u.status === 'ACTIVE' && (
              <button
                type="button"
                className="crm-chip text-amber-700 border-amber-200 bg-amber-50"
                onClick={() => setUserStatus(u.id, 'BLOCKED').then(load)}
              >
                Block
              </button>
            )}
            <button
              type="button"
              className="crm-chip"
              onClick={async () => {
                const link = prompt('Share / UTM link for WhatsApp', u.shareLink || '');
                if (link !== null) {
                  await updateUser(u.id, { shareLink: link.trim() || null });
                  await load();
                }
              }}
            >
              Set UTM link
            </button>
            <button type="button" className="crm-chip" onClick={() => resendInvitation(u.id)}>
              Resend invite
            </button>
            <button
              type="button"
              className="crm-chip"
              onClick={async () => {
                const pwd = prompt('New password (min 6)');
                if (pwd) await resetPassword(u.id, pwd);
              }}
            >
              Reset password
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="crm-page">
      <PageHeader
        icon={Users}
        title="Employees"
        subtitle="Create telecallers, invite securely, manage status"
        actions={
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="crm-input pl-9 w-56"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <button type="button" onClick={() => setOpen(true)} className="crm-btn-primary">
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </>
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
        emptyTitle="No employees yet"
        emptySubtitle="Add your first telecaller or team member to get started."
      />

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setForm(emptyForm);
        }}
        title="Add Employee"
        subtitle="Invite a new user with a secure email link"
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
            <button type="submit" form="add-employee-form" className="crm-btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create employee'}
            </button>
          </>
        }
      >
        <form id="add-employee-form" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="crm-label">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              className="crm-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="crm-label">
              Phone <span className="text-rose-500">*</span>
            </label>
            <input
              className="crm-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="10-digit mobile"
            />
          </div>
          <div>
            <label className="crm-label">Email</label>
            <input
              type="email"
              className="crm-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="crm-label">Employee ID</label>
            <input
              className="crm-input"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              placeholder="e.g. TC106"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="crm-label">Share / UTM link</label>
            <input
              className="crm-input"
              value={form.shareLink}
              onChange={(e) => setForm({ ...form, shareLink: e.target.value })}
              placeholder="https://yoursite.com/?utm_source=tc106"
            />
            <p className="text-xs text-slate-400 mt-1">
              Sent on WhatsApp when a lead is marked Interested.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="crm-label">
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              className="crm-input"
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              required
            >
              <option value="">Select role</option>
              {inviteRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName || r.name}
                </option>
              ))}
            </select>
          </div>
          {isTelecaller && (
            <>
              <div>
                <label className="crm-label">
                  PAN <span className="text-rose-500">*</span>
                </label>
                <input
                  className="crm-input uppercase"
                  value={form.panNumber}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                  placeholder="ABCDE1234F"
                />
              </div>
              <div>
                <label className="crm-label">
                  Aadhaar <span className="text-rose-500">*</span>
                </label>
                <input
                  className="crm-input"
                  value={form.aadhaarNumber}
                  onChange={(e) =>
                    setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
                  }
                  required
                  maxLength={12}
                  inputMode="numeric"
                  placeholder="12-digit Aadhaar"
                />
              </div>
            </>
          )}
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={form.sendInvitation}
              onChange={(e) => setForm({ ...form, sendInvitation: e.target.checked })}
            />
            Send secure invitation email
          </label>
        </form>
      </Modal>
    </div>
  );
};
