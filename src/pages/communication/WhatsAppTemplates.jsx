import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  MessageSquare,
  CheckCircle,
  Copy,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { createTemplate, getTemplates, updateTemplate } from '../../api/communication';

const LMENDIGO_CONTENT = [
  'Hello! Welcome to Lmendigo.',
  '',
  'To apply for a short-term loan, please complete your fresh application using the link below and keep these documents ready:',
  '',
  '1. PAN Card',
  '2. Aadhaar Card',
  '3. Latest 6 Months Bank Statement',
  '4. Last 2 Months Salary Slips',
  '',
  'Apply Now: {link}',
  '',
  'Our team will verify your application and guide you through the next steps.',
].join('\n');

const INSTANT_RUPIYA_CONTENT = [
  'Hello! Welcome to InstantRupiya.',
  '',
  'To apply for a short-term loan, please complete your fresh application using the link below and keep these documents ready:',
  '',
  '1. PAN Card',
  '2. Aadhaar Card',
  '3. Latest 6 Months Bank Statement',
  '4. Last 2 Months Salary Slips',
  '',
  'Apply Now: {link}',
  '',
  'Our team will verify your application and guide you through the next steps.',
].join('\n');

const emptyForm = {
  name: '',
  type: 'WHATSAPP',
  category: '',
  language: 'en',
  content: '',
  isApproved: true,
};

export const WhatsAppTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTemplates();
      const payload = res.data?.data || res.data || [];
      setTemplates(Array.isArray(payload) ? payload : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (tpl) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name || '',
      type: tpl.type || 'WHATSAPP',
      category: tpl.category || '',
      language: tpl.language || 'en',
      content: tpl.content || '',
      isApproved: tpl.isApproved !== false,
    });
    setOpen(true);
  };

  const applyBrand = (brand) => {
    if (brand === 'Lmendigo') {
      setForm((f) => ({
        ...f,
        name: f.name || 'Lmendigo',
        category: f.category || 'Lmendigo',
        type: 'WHATSAPP',
        content: LMENDIGO_CONTENT,
        isApproved: true,
      }));
      return;
    }
    setForm((f) => ({
      ...f,
      name: f.name || 'InstantRupiya',
      category: f.category || 'InstantRupiya',
      type: 'WHATSAPP',
      content: INSTANT_RUPIYA_CONTENT,
      isApproved: true,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) {
      setError('Name and message content are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        category: form.category.trim() || null,
        language: form.language || 'en',
        content: form.content,
        variables: ['customerName', 'link'],
        isApproved: !!form.isApproved,
      };
      if (editingId) {
        await updateTemplate(editingId, payload);
      } else {
        await createTemplate(payload);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const toggleApproved = async (tpl) => {
    try {
      await updateTemplate(tpl.id, { isApproved: !tpl.isApproved });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update template');
    }
  };

  const copyContent = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Message Templates</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            WhatsApp / SMS templates for Interested leads. Put{' '}
            <code className="bg-gray-100 px-1 rounded">{'{link}'}</code> where the
            telecaller UTM URL should appear.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : templates.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">
          No templates yet. Create Lmendigo / InstantRupiya share messages for telecallers.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md truncate">
                    {tpl.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                      tpl.isApproved
                        ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    {tpl.isApproved ? 'Approved' : 'Draft'}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 mb-3">
                  {tpl.type} • Category:{' '}
                  <span className="text-gray-700 font-semibold">
                    {tpl.category || '—'}
                  </span>
                </p>

                <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl text-xs text-gray-700 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                  {tpl.content}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => openEdit(tpl)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => copyContent(tpl.content)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => toggleApproved(tpl)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {tpl.isApproved ? 'Unapprove' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit template' : 'New message template'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyBrand('Lmendigo')}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
            >
              Prefill Lmendigo
            </button>
            <button
              type="button"
              onClick={() => applyBrand('InstantRupiya')}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-100"
            >
              Prefill InstantRupiya
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3"
                placeholder="Lmendigo"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category / brand
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3"
                placeholder="Lmendigo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 pb-2">
                <input
                  type="checkbox"
                  checked={form.isApproved}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isApproved: e.target.checked }))
                  }
                />
                Approved for telecallers
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Message content
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={12}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3 font-mono"
              placeholder="Apply Now: {link}"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1 flex items-start gap-1">
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
              Placeholders: {'{link}'} / {'{utm}'} = telecaller UTM, {'{customerName}'} = lead
              name.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
