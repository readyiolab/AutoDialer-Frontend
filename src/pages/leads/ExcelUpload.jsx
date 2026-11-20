import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  importExcel,
  confirmImport,
  cancelImport,
  getImportStatus,
  getImportHistory,
} from '../../api/leads';
import { getCampaigns } from '../../api/campaigns';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Upload, CheckCircle2 } from 'lucide-react';

const FIELDS = [
  'customerName',
  'mobileNumber',
  'email',
  'panNumber',
  'aadhaarNumber',
  'city',
  'state',
  'address',
  'loanAmount',
  'product',
  'employer',
];

export const ExcelUpload = () => {
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState(searchParams.get('campaignId') || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importId, setImportId] = useState(null);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fromQuery = searchParams.get('campaignId');
    if (fromQuery) setCampaignId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        const payload = res.data?.data || res.data;
        setCampaigns(payload.data || payload || []);
      })
      .catch(() => {});
    getImportHistory()
      .then((res) => {
        const payload = res.data?.data || res.data;
        setHistory(Array.isArray(payload) ? payload : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!importId || !status || status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
      return undefined;
    }
    const t = setInterval(async () => {
      const res = await getImportStatus(importId);
      const payload = res.data?.data || res.data;
      setStatus(payload);
    }, 2000);
    return () => clearInterval(t);
  }, [importId, status?.status]);

  const upload = async () => {
    if (!file || !campaignId) {
      setError('Select a campaign before uploading');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('campaignId', campaignId);
      if (Object.keys(mapping).length) fd.append('columnMapping', JSON.stringify(mapping));
      const res = await importExcel(fd);
      const payload = res.data?.data || res.data;
      setPreview(payload);
      setImportId(payload.importHistoryId || null);
      setMapping(payload.suggestedMapping || mapping);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const mappingReady = Boolean(mapping.customerName && mapping.mobileNumber);

  const uploadWithMapping = async () => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('campaignId', campaignId);
    fd.append('columnMapping', JSON.stringify(mapping));
    const res = await importExcel(fd);
    const payload = res.data?.data || res.data;
    setPreview(payload);
    setImportId(payload.importHistoryId || null);
    if (payload.suggestedMapping) {
      setMapping((prev) => ({ ...prev, ...payload.suggestedMapping }));
    }
    return payload;
  };

  const confirm = async () => {
    setError('');
    if (!campaignId) {
      setError('Select a campaign before confirming');
      return;
    }
    if (!mappingReady) {
      setError('Map customerName and mobileNumber (e.g. Name + Contact No.) before confirming');
      return;
    }

    setLoading(true);
    try {
      let id = importId;
      if (!id) {
        if (!file) {
          setError('Upload the file again, map columns, then confirm');
          return;
        }
        const staged = await uploadWithMapping();
        id = staged.importHistoryId || null;
        if (!id) {
          if (staged.needsMapping) {
            setError('Column mapping is still incomplete. Map Name and Contact No., then confirm again.');
          } else {
            setError('Could not stage import. Try Upload & preview again, then Confirm.');
          }
          return;
        }
      }

      const res = await confirmImport(id, mapping);
      const payload = res.data?.data || res.data;
      const finalId = payload.importHistoryId || id;
      if (payload.importHistoryId) setImportId(payload.importHistoryId);
      const st = await getImportStatus(finalId);
      setStatus(st.data?.data || st.data);
      const hist = await getImportHistory().catch(() => null);
      if (hist) {
        const hPayload = hist.data?.data || hist.data;
        setHistory(Array.isArray(hPayload) ? hPayload : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Confirm failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" /> Excel / CSV Lead Import
        </h1>
        <p className="text-xs text-gray-500">Validate, map columns, then commit via background job</p>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold">Campaign (required)</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              required
            >
              <option value="">Select campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">File (.xlsx / .csv)</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="w-full mt-1 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <button
          onClick={upload}
          disabled={!file || !campaignId || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Upload & preview'}
        </button>
      </div>

      {preview && (
        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-xl">Total: <strong>{preview.total}</strong></div>
            <div className="p-3 bg-emerald-50 rounded-xl">Valid: <strong>{preview.validCount}</strong></div>
            <div className="p-3 bg-amber-50 rounded-xl">Duplicates: <strong>{preview.duplicateCount}</strong></div>
            <div className="p-3 bg-rose-50 rounded-xl">Rejected: <strong>{preview.rejectedCount}</strong></div>
          </div>

          {(preview.needsMapping || preview.headers) && (
            <div>
              <h3 className="text-sm font-bold mb-2">Column mapping</h3>
              {preview.needsMapping && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5 mb-2">
                  Map <strong>customerName</strong> (e.g. Name) and <strong>mobileNumber</strong> (e.g. Contact No.),
                  then click Confirm import.
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-2">
                {FIELDS.map((field) => (
                  <div key={field} className="flex items-center gap-2 text-xs">
                    <span className="w-32 font-semibold">{field}</span>
                    <select
                      className="flex-1 border rounded-lg px-2 py-1"
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                    >
                      <option value="">—</option>
                      {(preview.headers || []).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.preview?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Mobile</th>
                    <th className="p-2 text-left">City</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.customerName}</td>
                      <td className="p-2">{r.mobileNumber}</td>
                      <td className="p-2">{r.city || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={loading || !mappingReady || !campaignId || (!importId && !file)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Confirming…' : 'Confirm import'}
            </button>
            {importId && (
              <button
                type="button"
                disabled={loading}
                onClick={() => cancelImport(importId)}
                className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {status && (
        <div className="bg-white border rounded-2xl p-4 text-sm space-y-3">
          <div className="font-bold">Import status: {status.status}</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${status.progress || 0}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Imported {status.importedRecords}/{status.totalRecords}
          </div>
          {status.status === 'COMPLETED' && campaignId && (
            <Link
              to={`/leads/allocate?campaignId=${campaignId}`}
              className="inline-flex px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold"
            >
              Allocate these leads
            </Link>
          )}
        </div>
      )}

      <div className="bg-white border rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-2">Import history</h3>
        {loading && !history.length ? <LoadingSpinner /> : null}
        <div className="space-y-2 text-xs">
          {history.slice(0, 10).map((h) => (
            <div key={h.id} className="flex justify-between border-b py-2">
              <span>
                {h.fileName} · {h.status}
              </span>
              <span>
                {h.importedRecords}/{h.totalRecords}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
