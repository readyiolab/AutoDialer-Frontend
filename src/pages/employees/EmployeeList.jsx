import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getUsers,
  createUser,
  updateUser,
  setUserStatus,
  resendInvitation,
  resetPassword,
} from '../../api/users';
import { getTemplates } from '../../api/communication';
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
  shareTemplateIds: [],
  panNumber: '',
  aadhaarNumber: '',
  sendInvitation: true,
};

const fillPreview = (content, shareLink) => {
  if (!content) return '';
  const link = (shareLink || '').trim();
  return content
    .replace(/\{\{\s*utm\s*\}\}/gi, link)
    .replace(/\{\s*utm\s*\}/gi, link)
    .replace(/\{\s*link\s*\}/gi, link)
    .replace(/\{\s*customerName\s*\}/gi, 'Customer');
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

const brandDefaults = (templates) =>
  templates
    .filter((t) => {
      const n = `${t.name || ''} ${t.category || ''}`.toLowerCase();
      return n.includes('lmendigo') || n.includes('instantrupiya');
    })
    .map((t) => t.id);

export const EmployeeList = () => {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [previewTemplateId, setPreviewTemplateId] = useState('');

  const inviteRoles = useMemo(
    () => roles.filter((r) => r.name !== 'SUPER_ADMIN'),
    [roles],
  );

  const selectedRole = useMemo(
    () => inviteRoles.find((r) => r.id === form.roleId) || roles.find((r) => r.id === form.roleId),
    [inviteRoles, roles, form.roleId],
  );
  const isTelecaller = selectedRole?.name === 'TELECALLER';

  const approvedTemplates = useMemo(
    () => (templates || []).filter((t) => t.isApproved !== false && t.type === 'WHATSAPP'),
    [templates],
  );

  const selectedTemplates = useMemo(
    () => approvedTemplates.filter((t) => (form.shareTemplateIds || []).includes(t.id)),
    [approvedTemplates, form.shareTemplateIds],
  );

  const previewContent = useMemo(() => {
    const tpl =
      selectedTemplates.find((t) => t.id === previewTemplateId) || selectedTemplates[0];
    if (!tpl) return '';
    return fillPreview(tpl.content, form.shareLink);
  }, [selectedTemplates, previewTemplateId, form.shareLink]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, templatesRes] = await Promise.all([
        getUsers({ page: 1, pageSize: 100, search: search || undefined }),
        api.get('/settings/roles').catch(() => ({ data: [] })),
        getTemplates('WHATSAPP').catch(() => ({ data: [] })),
      ]);
      const payload = usersRes.data?.data || usersRes.data;
      setRows(payload.data || payload || []);
      const rolePayload = rolesRes.data?.data || rolesRes.data || [];
      setRoles(Array.isArray(rolePayload) ? rolePayload : rolePayload.data || []);
      const tplPayload = templatesRes.data?.data || templatesRes.data || [];
      setTemplates(Array.isArray(tplPayload) ? tplPayload : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    const defaults = brandDefaults(
      (templates || []).filter((t) => t.isApproved !== false && t.type === 'WHATSAPP'),
    );
    setEditing(null);
    setForm({ ...emptyForm, shareTemplateIds: defaults });
    setPreviewTemplateId(defaults[0] || '');
    setOpen(true);
  };

  const openEditShare = (u) => {
    const ids = u.shareTemplateIds || [];
    setEditing(u);
    setForm({
      ...emptyForm,
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      roleId: u.role?.id || '',
      employeeId: u.employeeId || '',
      shareLink: u.shareLink || '',
      shareTemplateIds: ids.length ? ids : brandDefaults(approvedTemplates),
      panNumber: u.panNumber || '',
      aadhaarNumber: u.aadhaarNumber || '',
      sendInvitation: false,
    });
    setPreviewTemplateId(ids[0] || brandDefaults(approvedTemplates)[0] || '');
    setOpen(true);
  };

  const toggleTemplate = (id) => {
    setForm((f) => {
      const has = (f.shareTemplateIds || []).includes(id);
      const next = has
        ? f.shareTemplateIds.filter((x) => x !== id)
        : [...(f.shareTemplateIds || []), id];
      return { ...f, shareTemplateIds: next };
    });
  };

  const validateForm = () => {
    const nameErr = validatePersonName(form.name);
    const phoneErr = validateIndianMobile(form.phone);
    if (nameErr || phoneErr) return nameErr || phoneErr;
    if (!form.roleId) return 'Select a role';
    if (isTelecaller) {
      const pan = form.panNumber.trim().toUpperCase();
      const aadhaar = form.aadhaarNumber.replace(/\D/g, '');
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        return 'Enter a valid PAN (e.g. ABCDE1234F)';
      }
      if (!/^\d{12}$/.test(aadhaar)) {
        return 'Enter a valid 12-digit Aadhaar number';
      }
    }
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: normalizeIndianMobile(form.phone),
        email: form.email || undefined,
        roleId: form.roleId,
        employeeId: form.employeeId || undefined,
        shareLink: form.shareLink?.trim() || null,
        shareTemplateIds: form.shareTemplateIds || [],
        panNumber: isTelecaller ? form.panNumber.trim().toUpperCase() : undefined,
        aadhaarNumber: isTelecaller ? form.aadhaarNumber.replace(/\D/g, '') : undefined,
      };
      if (editing) {
        await updateUser(editing.id, payload);
      } else {
        await createUser({
          ...payload,
          sendInvitation: form.sendInvitation,
        });
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const shareSetupBlock = (
    <div className="sm:col-span-2 rounded-xl border border-teal-100 bg-teal-50/40 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Share setup (WhatsApp)</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Templates are the message text (shared). Paste this person&apos;s personal UTM — it fills{' '}
          <code className="bg-white px-1 rounded border">{'{link}'}</code> when they mark a lead
          Interested.
        </p>
      </div>
      <div>
        <label className="crm-label">Personal UTM / application link</label>
        <input
          className="crm-input"
          value={form.shareLink}
          onChange={(e) => setForm({ ...form, shareLink: e.target.value })}
          placeholder="https://yoursite.com/apply?utm_source=tc106"
        />
      </div>
      <div>
        <label className="crm-label">Templates this telecaller can send</label>
        {approvedTemplates.length === 0 ? (
          <p className="text-xs text-amber-700 mt-1">
            No approved WhatsApp templates yet. Create them under Calling Management → Message
            Templates first.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {approvedTemplates.map((t) => {
              const checked = (form.shareTemplateIds || []).includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer ${
                    checked
                      ? 'border-teal-300 bg-white'
                      : 'border-slate-200 bg-white/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    onChange={() => toggleTemplate(t.id)}
                  />
                  <span>
                    <span className="font-semibold text-slate-800 block">{t.name}</span>
                    <span className="text-slate-400">{t.category || t.type}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
      {selectedTemplates.length > 0 && (
        <div>
          <label className="crm-label">Live preview</label>
          <select
            className="crm-input mb-2"
            value={previewTemplateId || selectedTemplates[0]?.id || ''}
            onChange={(e) => setPreviewTemplateId(e.target.value)}
          >
            {selectedTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <pre className="text-xs whitespace-pre-wrap bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto text-slate-700">
            {previewContent || 'Add a UTM above to preview the filled message.'}
          </pre>
        </div>
      )}
    </div>
  );

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
        key: 'role',
        label: 'Role',
        render: (u) => (
          <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            {u.role?.displayName || u.role?.name || '—'}
          </span>
        ),
      },
      {
        key: 'share',
        label: 'Share setup',
        render: (u) => (
          <div className="text-xs text-slate-600 space-y-1 max-w-[240px]">
            <div>
              UTM:{' '}
              {u.shareLink ? (
                <a
                  href={u.shareLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 underline break-all"
                >
                  set
                </a>
              ) : (
                <span className="text-slate-400">not set</span>
              )}
            </div>
            <div>
              Templates:{' '}
              {(u.shareTemplateIds || []).length
                ? `${u.shareTemplateIds.length} assigned`
                : 'all approved (default)'}
            </div>
          </div>
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
          <div className="flex flex-wrap gap-2 max-w-[300px]">
            <button type="button" className="crm-chip" onClick={() => openEditShare(u)}>
              Share setup
            </button>
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
    [load, approvedTemplates],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="crm-page">
      <PageHeader
        icon={Users}
        title="Employees"
        subtitle="Create telecallers → Share setup: paste UTM + tick templates"
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
            <button type="button" onClick={openCreate} className="crm-btn-primary">
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
          setEditing(null);
          setForm(emptyForm);
        }}
        title={editing ? `Share setup — ${editing.name}` : 'Add Employee'}
        subtitle={
          editing
            ? 'Update personal UTM and which message templates they can send'
            : 'Invite a user, then set their UTM + templates in Share setup'
        }
        maxWidth="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              className="crm-btn-secondary"
              onClick={() => {
                setOpen(false);
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
            <button type="submit" form="employee-form" className="crm-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save share setup' : 'Create employee'}
            </button>
          </>
        }
      >
        <form id="employee-form" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!editing && (
            <>
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
                      onChange={(e) =>
                        setForm({ ...form, panNumber: e.target.value.toUpperCase() })
                      }
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
                        setForm({
                          ...form,
                          aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12),
                        })
                      }
                      required
                      maxLength={12}
                      inputMode="numeric"
                      placeholder="12-digit Aadhaar"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {shareSetupBlock}

          {!editing && (
            <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                checked={form.sendInvitation}
                onChange={(e) => setForm({ ...form, sendInvitation: e.target.checked })}
              />
              Send secure invitation email
            </label>
          )}
        </form>
      </Modal>
    </div>
  );
};
