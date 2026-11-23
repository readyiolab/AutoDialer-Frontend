import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAutomationRules, updateAutomationRule, runAutomation } from '../../api/automation';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Settings2, Play } from 'lucide-react';

export const AutomationRules = () => {
  const location = useLocation();
  const pageMeta = useMemo(() => {
    if (location.pathname.includes('/notifications')) {
      return {
        title: 'Notification Settings',
        subtitle: 'Alert rules for follow-ups, idle leads, and inactive assignees',
      };
    }
    return {
      title: 'Automation rules',
      subtitle: 'Follow-up overdue, idle leads, unanswered streaks, inactive assignees',
    };
  }, [location.pathname]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAutomationRules();
      const payload = res.data?.data || res.data;
      setRows(Array.isArray(payload) ? payload : payload.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (rule) => {
    await updateAutomationRule(rule.id, { isActive: !rule.isActive });
    await load();
  };

  const runNow = async () => {
    setMessage('');
    try {
      const res = await runAutomation();
      const data = res.data?.data || res.data;
      setMessage(`Automation ran: ${JSON.stringify(data)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Run failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="crm-page space-y-4">
      <PageHeader
        icon={Settings2}
        title={pageMeta.title}
        subtitle={pageMeta.subtitle}
        actions={
          <button type="button" className="crm-chip" onClick={runNow}>
            <Play className="w-3.5 h-3.5" /> Run now
          </button>
        }
      />
      {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm">{error}</div>}
      {message && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm break-all">{message}</div>}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3 text-left">Rule</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.description}</div>
                </td>
                <td className="p-3 text-xs font-mono">{r.code}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className={`crm-chip ${r.isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}
                    onClick={() => toggle(r)}
                  >
                    {r.isActive ? 'On' : 'Off'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
