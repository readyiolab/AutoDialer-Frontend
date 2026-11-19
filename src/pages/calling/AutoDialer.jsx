import React, { useEffect, useRef, useState } from 'react';
import {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  dialerEvent,
} from '../../api/dialer';
import { getCampaigns } from '../../api/campaigns';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Phone, Pause, Play, SkipForward, Square, PhoneOff } from 'lucide-react';

const DISPOSITIONS = [
  'INTERESTED',
  'NOT_INTERESTED',
  'CALL_BACK',
  'BUSY',
  'NOT_PICKED',
  'SWITCHED_OFF',
  'WRONG_NUMBER',
  'DND',
];

export const AutoDialer = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('');
  const [mode, setMode] = useState('PROGRESSIVE');
  const [session, setSession] = useState(null);
  const [lead, setLead] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [onCall, setOnCall] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [disposition, setDisposition] = useState('NOT_PICKED');
  const [remarks, setRemarks] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const autoOpened = useRef(false);

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        const payload = res.data?.data || res.data;
        setCampaigns(payload.data || payload || []);
      })
      .catch(() => {});
  }, []);

  const openTel = (tel) => {
    if (tel) window.location.href = tel;
  };

  const start = async () => {
    setError('');
    try {
      const res = await startSession({
        campaignId: campaignId || undefined,
        mode,
      });
      const payload = res.data?.data || res.data;
      setSession(payload.session);
      setLead(payload.lead);
      setPendingCount(payload.pendingCount || 0);
      autoOpened.current = false;
      if (mode === 'PROGRESSIVE' || mode === 'POWER') {
        if (payload.tel) {
          await dialerEvent(payload.session.id, { type: 'started', leadId: payload.lead?.id });
          setOnCall(true);
          setStartedAt(Date.now());
          openTel(payload.tel);
          autoOpened.current = true;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start dialer');
    }
  };

  const confirmDial = async () => {
    if (!session || !lead) return;
    const res = await dialerEvent(session.id, { type: 'started', leadId: lead.id });
    const payload = res.data?.data || res.data;
    setOnCall(true);
    setStartedAt(Date.now());
    openTel(payload.tel || `tel:${lead.mobileNumber}`);
  };

  const endCall = async (advance = true) => {
    if (!session) return;
    const duration = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const res = await dialerEvent(session.id, {
      type: 'ended',
      leadId: lead?.id,
      duration,
      disposition: advance ? disposition : undefined,
      remarks,
      followUpDate: disposition === 'CALL_BACK' ? followUpDate : undefined,
    });
    const payload = res.data?.data || res.data;
    setOnCall(false);
    setStartedAt(null);
    setRemarks('');
    setMessage('Call saved');
    if (payload.autoAdvance && payload.lead) {
      setLead(payload.lead);
      setPendingCount(payload.pendingCount || 0);
      if (payload.tel) {
        await dialerEvent(session.id, { type: 'started', leadId: payload.lead.id });
        setOnCall(true);
        setStartedAt(Date.now());
        openTel(payload.tel);
      }
    } else {
      setLead(payload.lead || null);
      setPendingCount(payload.pendingCount || 0);
    }
  };

  const skip = async () => {
    if (!session) return;
    const res = await dialerEvent(session.id, { type: 'skip', leadId: lead?.id });
    const payload = res.data?.data || res.data;
    setLead(payload.lead);
    setPendingCount(payload.pendingCount || 0);
    setOnCall(false);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-black flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" /> Autodialer
        </h1>
        <p className="text-xs text-gray-500">
          Progressive phone dialing — ends a call and opens the next number automatically
        </p>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
      {message && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl">{message}</div>}

      {!session && (
        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold">Campaign</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">All assigned leads</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Dial mode</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="MANUAL">Manual</option>
              <option value="PREVIEW">Preview</option>
              <option value="PROGRESSIVE">Progressive</option>
              <option value="POWER">Power</option>
            </select>
          </div>
          <button onClick={start} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">
            Start dialing
          </button>
        </div>
      )}

      {session && (
        <div className="bg-white border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Mode: <strong>{session.mode}</strong> · Status: <StatusBadge status={session.status} />
            </span>
            <span>{pendingCount} remaining</span>
          </div>

          {lead ? (
            <div className="p-4 rounded-xl bg-slate-50 border">
              <div className="text-lg font-black">{lead.customerName}</div>
              <div className="text-2xl font-mono text-blue-700 mt-1">{lead.mobileNumber}</div>
              <div className="text-xs text-gray-500 mt-2">
                {lead.city || '-'} · {lead.campaign?.name || 'No campaign'} · attempts {lead.totalAttempts || 0}
              </div>
              <div className="mt-2">
                <StatusBadge status={lead.status} />
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 text-sm">No eligible leads in queue</div>
          )}

          <div className="flex flex-wrap gap-2">
            {!onCall && lead && (mode === 'PREVIEW' || mode === 'MANUAL') && (
              <button onClick={confirmDial} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                <Phone className="w-4 h-4" /> Dial
              </button>
            )}
            {onCall && (
              <button onClick={() => endCall(true)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                <PhoneOff className="w-4 h-4" /> End call & next
              </button>
            )}
            <button onClick={skip} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold flex items-center gap-2">
              <SkipForward className="w-4 h-4" /> Skip
            </button>
            {session.status === 'RUNNING' ? (
              <button
                onClick={async () => {
                  const res = await pauseSession(session.id);
                  setSession((res.data?.data || res.data));
                }}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                onClick={async () => {
                  const res = await resumeSession(session.id);
                  const payload = res.data?.data || res.data;
                  setSession(payload.session || payload);
                  setLead(payload.lead);
                }}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Resume
              </button>
            )}
            <button
              onClick={async () => {
                await endSession(session.id);
                setSession(null);
                setLead(null);
                setOnCall(false);
              }}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">Disposition</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
              >
                {DISPOSITIONS.map((d) => (
                  <option key={d} value={d}>
                    {d.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            {disposition === 'CALL_BACK' && (
              <div>
                <label className="text-xs font-semibold">Callback date</label>
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold">Notes</label>
              <textarea
                className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
