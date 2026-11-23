import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { allocateLeads, getLeads, previewAllocate, transferLeads } from '../../api/leads';
import { createUser, getUsers } from '../../api/users';
import { assignUsers, getAllocationReadiness, getCampaign, getCampaigns } from '../../api/campaigns';
import { getTeams } from '../../api/teams';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';
import { UserPlus, Users } from 'lucide-react';
import {
  normalizeIndianMobile,
  passwordStrengthHint,
  validateIndianMobile,
  validatePassword,
  validatePersonName,
} from '../../utils/validation';

const SIMPLE_METHODS = ['EQUAL', 'ROUND_ROBIN', 'MANUAL'];
const ADVANCED_METHODS = [
  'CAPACITY_BASED',
  'PERFORMANCE',
  'AVAILABILITY',
  'WORKLOAD',
  'PRIORITY_BASED',
  'TEAM',
  'HYBRID',
];

const emptyTelecallerForm = {
  name: '',
  phone: '',
  password: '',
};

const isTelecallerRole = (u) => {
  const role = String(u.role?.name || u.roleName || '').toUpperCase();
  return role === 'TELECALLER' || role.includes('TELE');
};

export const LeadAllocation = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isTransfer = location.pathname.includes('transfer');
  const [campaigns, setCampaigns] = useState([]);
  const [allTelecallers, setAllTelecallers] = useState([]);
  const [campaignTeam, setCampaignTeam] = useState([]);
  const [teams, setTeams] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [campaignId, setCampaignId] = useState(searchParams.get('campaignId') || '');
  const [teamId, setTeamId] = useState('');
  const [method, setMethod] = useState('EQUAL');
  const [maxPerUser, setMaxPerUser] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [toUserId, setToUserId] = useState('');
  const [fromUserId, setFromUserId] = useState(searchParams.get('fromUserId') || '');
  const [transferCount, setTransferCount] = useState('');
  const [transferLeadsList, setTransferLeadsList] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  /** Blank = all unassigned. Number = how many to distribute (backend limit). */
  const [allocateCount, setAllocateCount] = useState('');
  const [showLeadPicker, setShowLeadPicker] = useState(false);
  const [targetCounts, setTargetCounts] = useState({});
  const [countsManual, setCountsManual] = useState(false);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const [telecallerRoleId, setTelecallerRoleId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyTelecallerForm);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', phone: '', password: '' });
  const [touched, setTouched] = useState({ name: false, phone: false, password: false });

  const selectableUsers = useMemo(() => {
    if (campaignId && campaignTeam.length) return campaignTeam;
    if (campaignId) return [];
    return allTelecallers;
  }, [campaignId, campaignTeam, allTelecallers]);

  const companyOnlyTelecallers = useMemo(() => {
    if (!campaignId) return [];
    const onTeam = new Set(campaignTeam.map((u) => u.id));
    return allTelecallers.filter((u) => !onTeam.has(u.id));
  }, [campaignId, campaignTeam, allTelecallers]);

  const transferTeam = useMemo(() => {
    if (campaignId && campaignTeam.length) return campaignTeam;
    return allTelecallers;
  }, [campaignId, campaignTeam, allTelecallers]);

  const extractTotal = (payload, fallbackLen) => {
    const n = payload?.total ?? payload?.meta?.total ?? payload?.totalCount;
    const parsed = Number(n);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    return fallbackLen;
  };

  const load = async () => {
    setError('');
    const leadQuery = isTransfer
      ? {
          pageSize: 100,
          campaignId: campaignId || undefined,
          assignedToId: fromUserId || undefined,
        }
      : {
          pageSize: 100,
          assignedToId: 'null',
          campaignId: campaignId || undefined,
        };

    let usersFailed = false;
    let leadsFailed = false;

    const [cRes, uRes, lRes, tRes, rolesRes] = await Promise.all([
      getCampaigns().catch(() => ({ data: [] })),
      getUsers({ pageSize: 100, status: 'ACTIVE' }).catch(() => {
        usersFailed = true;
        return { data: { data: [] } };
      }),
      getLeads(leadQuery).catch(() => {
        leadsFailed = true;
        return { data: { data: [], meta: { total: 0 } } };
      }),
      getTeams().catch(() => ({ data: [] })),
      api.get('/settings/roles').catch(() => ({ data: [] })),
    ]);

    if (usersFailed) {
      setError('Could not load telecallers. Refresh and try again.');
    } else if (leadsFailed) {
      setError('Could not load leads for this campaign. Refresh and try again.');
    }

    const campaignsPayload = cRes.data?.data || cRes.data;
    setCampaigns(campaignsPayload.data || campaignsPayload || []);

    const usersPayload = uRes.data?.data || uRes.data;
    const allUsers = usersPayload.data || usersPayload || [];
    const telecallers = allUsers.filter(isTelecallerRole);
    setAllTelecallers(telecallers);

    const leadsPayload = lRes.data?.data || lRes.data;
    const leads = leadsPayload.data || leadsPayload || [];
    if (isTransfer) {
      const assigned = leads.filter((l) => l.assignedToId);
      const filtered = fromUserId
        ? assigned.filter((l) => l.assignedToId === fromUserId)
        : assigned;
      setTransferLeadsList(filtered);
      setUnassigned([]);
      setUnassignedTotal(0);
    } else {
      const list = leads.filter((l) => !l.assignedToId);
      setUnassigned(list);
      setUnassignedTotal(extractTotal(leadsPayload, list.length));
      setTransferLeadsList([]);
    }

    const teamsPayload = tRes.data?.data || tRes.data;
    const teamsList = Array.isArray(teamsPayload)
      ? teamsPayload
      : teamsPayload?.data || [];
    setTeams(Array.isArray(teamsList) ? teamsList : []);

    const rolesPayload = rolesRes.data?.data || rolesRes.data;
    const roles = Array.isArray(rolesPayload) ? rolesPayload : rolesPayload?.data || [];
    const teleRole = roles.find((r) => String(r.name || '').toUpperCase() === 'TELECALLER');
    if (teleRole?.id) setTelecallerRoleId(teleRole.id);

    if (campaignId) {
      try {
        const [campRes, readyRes] = await Promise.all([
          getCampaign(campaignId),
          isTransfer
            ? Promise.resolve(null)
            : getAllocationReadiness(campaignId).catch(() => null),
        ]);
        const camp = campRes.data?.data || campRes.data;
        const assignments = camp?.assignments || [];
        const team = assignments
          .map((a) => a.user || a)
          .filter((u) => u?.id)
          .map((u) => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            employeeId: u.employeeId,
            role: u.role || { name: 'TELECALLER' },
          }));
        setCampaignTeam(team);
        if (!isTransfer) {
          const ready = readyRes?.data?.data || readyRes?.data || null;
          setReadiness(ready);
          if (ready && typeof ready.unassignedCount === 'number') {
            setUnassignedTotal(ready.unassignedCount);
          }
        } else {
          setReadiness(null);
        }
      } catch (err) {
        setCampaignTeam([]);
        setReadiness(null);
        setError(err.response?.data?.message || 'Could not load campaign telecallers');
      }
    } else {
      setCampaignTeam([]);
      setReadiness(null);
    }
  };

  useEffect(() => {
    load().catch((err) => {
      setError(err.response?.data?.message || err.message || 'Failed to load allocation data');
    });
    setSelectedUsers([]);
    setSelectedLeads([]);
    setAllocateCount('');
    setShowLeadPicker(false);
    setPreview(null);
    setCountsManual(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, isTransfer, fromUserId]);

  const poolTotal =
    readiness?.unassignedCount != null
      ? Number(readiness.unassignedCount)
      : unassignedTotal || unassigned.length;
  const canAllocate = isTransfer
    ? true
    : readiness
      ? Boolean(readiness.canAllocate)
      : Boolean(campaignId && (campaignTeam.length || selectedUsers.length) && poolTotal > 0);
  const parsedAllocateCount = Number(allocateCount);
  const hasAllocateCount =
    !isTransfer &&
    allocateCount !== '' &&
    Number.isFinite(parsedAllocateCount) &&
    parsedAllocateCount > 0;
  /** Specific lead checkboxes override count/all */
  const usingLeadPick = !isTransfer && selectedLeads.length > 0;
  const allocatingByPool = !isTransfer && !usingLeadPick;
  const distributeTotal = usingLeadPick
    ? selectedLeads.length
    : hasAllocateCount
      ? Math.min(Math.floor(parsedAllocateCount), poolTotal || Math.floor(parsedAllocateCount))
      : poolTotal;

  const leadPool = useMemo(
    () => (selectedLeads.length ? unassigned.filter((l) => selectedLeads.includes(l.id)) : unassigned),
    [selectedLeads, unassigned],
  );

  const quickCountOptions = useMemo(() => {
    const total = poolTotal;
    if (!total) return [];
    const opts = [
      { label: 'All', value: '' },
      { label: '25', value: '25' },
      { label: '50', value: '50' },
      { label: '100', value: '100' },
    ];
    if (total > 100) opts.push({ label: '150', value: '150' });
    if (total > 150) opts.push({ label: '200', value: '200' });
    const half = Math.floor(total / 2);
    if (half >= 10 && !opts.some((o) => o.value === String(half))) {
      opts.push({ label: `Half (${half})`, value: String(half) });
    }
    return opts.filter((o) => o.value === '' || Number(o.value) <= total);
  }, [poolTotal]);

  const selectAllShownLeads = () => {
    setSelectedLeads(unassigned.map((l) => l.id));
    setAllocateCount('');
    setCountsManual(false);
    setPreview(null);
  };

  const clearLeadSelection = () => {
    setSelectedLeads([]);
    setCountsManual(false);
    setPreview(null);
  };

  const selectFirstNShown = (n) => {
    const take = Math.max(0, Math.min(Number(n) || 0, unassigned.length));
    setSelectedLeads(unassigned.slice(0, take).map((l) => l.id));
    setAllocateCount('');
    setCountsManual(false);
    setPreview(null);
  };

  const applyAllocateCount = (value) => {
    setAllocateCount(value);
    setSelectedLeads([]);
    setCountsManual(false);
    setPreview(null);
  };

  const equalSplitHint = useMemo(() => {
    if (!selectedUsers.length || !distributeTotal) return null;
    const base = Math.floor(distributeTotal / selectedUsers.length);
    const rem = distributeTotal % selectedUsers.length;
    return { base, rem, total: distributeTotal };
  }, [selectedUsers, distributeTotal]);

  const toggleUser = (id) => {
    setSelectedUsers((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return next;
    });
    setPreview(null);
    setCountsManual(false);
  };

  /** Check = assign to campaign (if needed) + select for distribute */
  const toggleCompanyTelecaller = async (userId) => {
    if (selectedUsers.includes(userId)) {
      toggleUser(userId);
      return;
    }
    if (campaignId && !campaignTeam.some((u) => u.id === userId)) {
      await addExistingToCampaign(userId);
      return;
    }
    toggleUser(userId);
  };

  useEffect(() => {
    // Per-user count editors only when picking specific leads from the list.
    // Pool modes (all / how-many) omit targetCounts so EQUAL uses backend limit/pool.
    if (!selectedUsers.length || allocatingByPool || !distributeTotal) {
      if (!countsManual) setTargetCounts({});
      return;
    }
    if (countsManual) return;
    const base = Math.floor(distributeTotal / selectedUsers.length);
    const rem = distributeTotal % selectedUsers.length;
    const next = {};
    selectedUsers.forEach((id, idx) => {
      next[id] = base + (idx < rem ? 1 : 0);
    });
    setTargetCounts(next);
  }, [selectedUsers, distributeTotal, allocatingByPool, countsManual]);

  const countsSum = Object.values(targetCounts).reduce((s, n) => s + Number(n || 0), 0);

  const buildPayload = () => {
    const sendTargetCounts =
      selectedUsers.length > 0 &&
      usingLeadPick &&
      countsSum > 0 &&
      countsSum === distributeTotal;

    return {
      method,
      campaignId: campaignId || undefined,
      teamId: teamId || undefined,
      userIds: selectedUsers.length ? selectedUsers : undefined,
      leadIds: usingLeadPick ? selectedLeads : undefined,
      limit: allocatingByPool && hasAllocateCount ? distributeTotal : undefined,
      onlyUnassigned: true,
      maxPerUser: maxPerUser ? Number(maxPerUser) : undefined,
      excludeOnBreak: true,
      targetCounts: sendTargetCounts ? targetCounts : undefined,
    };
  };

  const blockerCta = (code) => {
    if (code === 'NO_TELECALLERS' || code === 'CAMPAIGN_PAUSED') {
      return { to: `/campaigns/${campaignId}`, label: 'Open campaign' };
    }
    if (code === 'NO_UNASSIGNED') {
      return { to: `/campaigns/${campaignId}`, label: 'Upload leads on campaign' };
    }
    return null;
  };

  const assertCanDistribute = () => {
    if (!campaignId) {
      setError('Select a campaign first');
      return false;
    }
    if (readiness && !readiness.canAllocate) {
      const first = readiness.blockers?.[0];
      setError(first?.message || 'Cannot allocate yet — fix the blockers below');
      return false;
    }
    if (!selectedUsers.length && !campaignTeam.length) {
      setError('No telecallers on this campaign. Open the campaign and assign telecallers first.');
      return false;
    }
    return true;
  };

  const runPreview = async () => {
    if (!assertCanDistribute()) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (usingLeadPick && selectedUsers.length && countsSum !== distributeTotal) {
        throw new Error(
          `Adjusted counts (${countsSum}) must equal selected leads (${distributeTotal})`,
        );
      }
      const res = await previewAllocate(buildPayload());
      const payload = res.data?.data || res.data;
      setPreview(payload);
      setMessage(`Preview ready: ${payload.plannedTotal} of ${payload.totalLeads} leads`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const resetDistributeForm = () => {
    setSelectedLeads([]);
    setAllocateCount('');
    setShowLeadPicker(false);
    setTargetCounts({});
    setCountsManual(false);
    setPreview(null);
    setSelectedUsers([]);
  };

  const runAllocate = async () => {
    if (!assertCanDistribute()) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (usingLeadPick && selectedUsers.length && countsSum !== distributeTotal) {
        throw new Error(
          `Adjusted counts (${countsSum}) must equal selected leads (${distributeTotal})`,
        );
      }
      const planned = distributeTotal;
      const beforeTotal = poolTotal;
      const res = await allocateLeads(buildPayload());
      const payload = res.data?.data || res.data;
      const allocated = Number(payload.allocated || 0);
      const remaining =
        payload.remainingUnassigned != null
          ? Number(payload.remainingUnassigned)
          : Math.max(0, beforeTotal - allocated);
      resetDistributeForm();
      await load();
      if (allocated > 0) {
        setMessage(
          `Successfully allocated ${allocated} lead${allocated === 1 ? '' : 's'}. ${remaining} unassigned left. Form cleared for the next batch.`,
        );
      } else {
        const reason = payload.reasonCode || payload.message;
        const skipped = payload.skipped;
        const skipNote = skipped
          ? ` (skipped: ${skipped.onBreak || 0} on break, ${skipped.atCap || 0} at cap)`
          : '';
        setError(
          reason
            ? `${reason}${skipNote}`
            : `No leads were allocated (planned ${planned}). Check telecallers and remaining unassigned.${skipNote}`,
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  const runTransfer = async () => {
    const countNum = Number(transferCount);
    const useCount = !selectedLeads.length && fromUserId && countNum > 0;
    if (!toUserId) {
      setError('Select destination telecaller');
      return;
    }
    if (!selectedLeads.length && !useCount) {
      setError('Select leads, or set From telecaller and a count to move');
      return;
    }
    if (fromUserId && toUserId === fromUserId) {
      setError('Source and destination telecallers must be different');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await transferLeads({
        leadIds: selectedLeads.length ? selectedLeads : undefined,
        toUserId,
        fromUserId: fromUserId || undefined,
        campaignId: campaignId || undefined,
        count: useCount ? countNum : undefined,
      });
      const payload = res.data?.data || res.data;
      const skipped = payload.skippedProtected
        ? ` (${payload.skippedProtected} protected skipped)`
        : '';
      setMessage(`Transferred ${payload.transferred || 0} leads${skipped}`);
      setSelectedLeads([]);
      setTransferCount('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const validateAddForm = (form = addForm) => {
    const next = {
      name: validatePersonName(form.name),
      phone: validateIndianMobile(form.phone),
      password: validatePassword(form.password, { minLength: 8 }),
    };
    setFieldErrors(next);
    return next;
  };

  const addFormValid = useMemo(() => {
    const nameOk = !validatePersonName(addForm.name);
    const phoneOk = !validateIndianMobile(addForm.phone);
    const passOk = !validatePassword(addForm.password, { minLength: 8 });
    return nameOk && phoneOk && passOk && !!telecallerRoleId;
  }, [addForm, telecallerRoleId]);

  const openAddTelecaller = () => {
    setAddError('');
    setFieldErrors({ name: '', phone: '', password: '' });
    setTouched({ name: false, phone: false, password: false });
    setAddForm(emptyTelecallerForm);
    setAddOpen(true);
  };

  const onAddFieldBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validateAddForm();
  };

  const submitAddTelecaller = async (e) => {
    e.preventDefault();
    setAddError('');
    setTouched({ name: true, phone: true, password: true });
    const errs = validateAddForm();
    if (errs.name || errs.phone || errs.password) return;

    if (!telecallerRoleId) {
      setAddError('Telecaller role not found. Create roles in Settings first.');
      return;
    }

    const name = addForm.name.trim();
    const phone = normalizeIndianMobile(addForm.phone);
    const password = addForm.password;

    setAddSaving(true);
    try {
      const res = await createUser({
        name,
        phone,
        password,
        roleId: telecallerRoleId,
        sendInvitation: false,
        dailyTarget: 100,
      });
      const created = res.data?.data || res.data;
      const newId = created?.id || created?.user?.id;
      if (!newId) throw new Error('User created but id missing');

      if (campaignId) {
        await assignUsers(campaignId, [newId]);
      }

      setAddOpen(false);
      setAddForm(emptyTelecallerForm);
      setMessage(
        campaignId
          ? `${name} added and assigned to this campaign`
          : `${name} added — select a campaign to assign them`,
      );
      await load();
      setSelectedUsers((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
      setPreview(null);
    } catch (err) {
      const apiMsg = err.response?.data?.message || err.message || 'Could not create telecaller';
      const msg = Array.isArray(apiMsg) ? apiMsg.join(', ') : String(apiMsg);
      if (/mobile|phone|already registered|already exists/i.test(msg)) {
        setFieldErrors((f) => ({ ...f, phone: msg }));
        setTouched((t) => ({ ...t, phone: true }));
      } else {
        setAddError(msg);
      }
    } finally {
      setAddSaving(false);
    }
  };

  const addExistingToCampaign = async (userId) => {
    if (!campaignId) {
      setError('Select a campaign first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await assignUsers(campaignId, [userId]);
      await load();
      setSelectedUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      setMessage('Telecaller added to this campaign');
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add to campaign');
    } finally {
      setLoading(false);
    }
  };

  const methodOptions = showMoreOptions
    ? [...SIMPLE_METHODS, ...ADVANCED_METHODS]
    : SIMPLE_METHODS;

  return (
    <div className={`space-y-4 ${!isTransfer ? 'pb-28' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">
            {isTransfer ? 'Lead Transfer' : 'Lead Allocation'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTransfer
              ? 'Reassign leads between telecallers'
              : 'Pick a campaign, add telecallers if needed, then share leads equally'}
          </p>
        </div>
        {!isTransfer && (
          <Link
            to="/reports/telecaller-overview"
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
          >
            View telecaller overview
          </Link>
        )}
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex flex-wrap gap-3 items-center justify-between">
          <span>{message}</span>
          {!isTransfer && message.startsWith('Successfully allocated') && campaignId && (
            <Link to={`/campaigns/${campaignId}`} className="font-bold underline">
              View campaign
            </Link>
          )}
        </div>
      )}

      {!isTransfer && readiness?.blockers?.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-2">
          <p className="font-bold">Cannot allocate yet</p>
          {readiness.blockers.map((b) => {
            const cta = blockerCta(b.code);
            return (
              <div key={b.code} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.message}</p>
                  {b.action && <p className="text-amber-800/80 mt-0.5">{b.action}</p>}
                </div>
                {cta && (
                  <Link
                    to={cta.to}
                    className="shrink-0 px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold"
                  >
                    {cta.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isTransfer && campaignId && readiness && (
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Unassigned: <strong>{poolTotal}</strong>
          </span>
          <span>
            Telecallers: <strong>{readiness.telecallerCount ?? 0}</strong>
          </span>
          {readiness.onBreakCount > 0 && (
            <span>
              On break: <strong>{readiness.onBreakCount}</strong>
            </span>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 grid md:grid-cols-2 gap-3 shadow-sm">
        <div>
          <label className="text-xs font-semibold">
            Campaign {!isTransfer ? '(required for easy distribute)' : ''}
          </label>
          <select
            className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
          >
            <option value="">{isTransfer ? 'All' : 'Select campaign'}</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!isTransfer && campaignId && !selectedUsers.length && campaignTeam.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-1">
              No one checked — Allocate will use the full campaign team
            </p>
          )}
        </div>
        {!isTransfer && (
          <>
            <div>
              <label className="text-xs font-semibold">How to share</label>
              <select
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {methodOptions.map((m) => (
                  <option key={m} value={m}>
                    {m === 'EQUAL' ? 'Equal (recommended)' : m === 'ROUND_ROBIN' ? 'Round robin' : m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="mt-1 text-[11px] font-semibold text-teal-700"
                onClick={() => setShowMoreOptions((v) => !v)}
              >
                {showMoreOptions ? 'Hide more options' : 'More options'}
              </button>
            </div>
            {showMoreOptions && (
              <>
                <div>
                  <label className="text-xs font-semibold">Team filter</label>
                  <select
                    className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                  >
                    <option value="">None</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold">Max leads per agent</label>
                  <input
                    className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                    value={maxPerUser}
                    onChange={(e) => setMaxPerUser(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </>
            )}
          </>
        )}
        {isTransfer && (
          <>
            <div>
              <label className="text-xs font-semibold">From telecaller</label>
              <select
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                value={fromUserId}
                onChange={(e) => {
                  setFromUserId(e.target.value);
                  setSelectedLeads([]);
                }}
              >
                <option value="">Any / select for count move</option>
                {transferTeam.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Transfer to</label>
              <select
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
              >
                <option value="">Select telecaller</option>
                {transferTeam
                  .filter((u) => u.id !== fromUserId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              {campaignId && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Only campaign telecallers are listed when a campaign is selected
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold">Move count (optional)</label>
              <input
                type="number"
                min={1}
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                value={transferCount}
                onChange={(e) => setTransferCount(e.target.value)}
                placeholder="e.g. 25 — oldest pending from source"
                disabled={!fromUserId}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Use count instead of selecting leads below. Requires From telecaller.
              </p>
            </div>
          </>
        )}
      </div>

      {!isTransfer && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              Telecallers for this campaign
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {equalSplitHint && (
                <p className="text-xs text-slate-500">
                  Equal split of {equalSplitHint.total} → ~{equalSplitHint.base}
                  {equalSplitHint.rem ? ` (+${equalSplitHint.rem})` : ''} each
                </p>
              )}
              <button
                type="button"
                onClick={openAddTelecaller}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add telecaller
              </button>
            </div>
          </div>

          {selectableUsers.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {selectableUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center justify-between gap-2 text-xs border border-slate-200 rounded-xl p-3"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />
                    <span className="min-w-0">
                      <span className="font-semibold block truncate">{u.name}</span>
                      <span className="text-slate-400">{u.phone || u.employeeId}</span>
                    </span>
                  </span>
                  {selectedUsers.includes(u.id) && !allocatingByPool && (
                    <input
                      type="number"
                      min={0}
                      className="w-16 border rounded-lg px-2 py-1 text-right shrink-0"
                      value={targetCounts[u.id] ?? 0}
                      onChange={(e) => {
                        setCountsManual(true);
                        setTargetCounts((prev) => ({
                          ...prev,
                          [u.id]: Number(e.target.value || 0),
                        }));
                      }}
                    />
                  )}
                </label>
              ))}
            </div>
          ) : campaignId && companyOnlyTelecallers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                No one on this campaign yet. Check a telecaller to assign them and include them in
                the distribute list.
                {campaignId ? (
                  <>
                    {' '}
                    <Link to={`/campaigns/${campaignId}`} className="font-semibold text-teal-700 underline">
                      Edit full roster
                    </Link>
                  </>
                ) : null}
              </p>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {companyOnlyTelecallers.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 text-xs border border-teal-200 bg-teal-50/40 rounded-xl p-3"
                  >
                    <input
                      type="checkbox"
                      disabled={loading}
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleCompanyTelecaller(u.id)}
                    />
                    <span className="min-w-0">
                      <span className="font-semibold block truncate">{u.name}</span>
                      <span className="text-slate-400">{u.phone || u.employeeId}</span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={openAddTelecaller}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-teal-600 text-teal-700 rounded-xl text-xs font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create new telecaller
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/50 px-4 py-6 text-center space-y-3">
              <div className="mx-auto w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {campaignId
                    ? 'No telecallers for this campaign yet'
                    : 'No telecallers found'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add someone here, then share the leads. They can sign in on the Android app with
                  the mobile and password you set.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddTelecaller}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold"
              >
                <UserPlus className="w-4 h-4" />
                Add telecaller
              </button>
            </div>
          )}

          {campaignId && campaignTeam.length > 0 && companyOnlyTelecallers.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-600">
                Other telecallers in company — add to this campaign
              </p>
              <div className="grid md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {companyOnlyTelecallers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 text-xs border border-slate-100 rounded-xl px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold block truncate">{u.name}</span>
                      <span className="text-slate-400">{u.phone}</span>
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => addExistingToCampaign(u.id)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold disabled:opacity-50"
                    >
                      Add to campaign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedUsers.length > 0 && !allocatingByPool && (
            <p
              className={`text-xs font-semibold ${
                countsSum === distributeTotal ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              Count sum {countsSum} / {distributeTotal} selected leads
            </p>
          )}
          {selectedUsers.length > 0 && allocatingByPool && (
            <p className="text-xs font-semibold text-emerald-600">
              Will distribute {distributeTotal} lead{distributeTotal === 1 ? '' : 's'}
              {hasAllocateCount ? ` (of ${poolTotal} unassigned)` : ' (all unassigned)'} equally among
              checked telecallers
            </p>
          )}
        </div>
      )}

      {!isTransfer && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="text-xs font-semibold">How many leads to distribute</label>
              <input
                type="number"
                min={1}
                max={poolTotal || undefined}
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                value={allocateCount}
                placeholder={poolTotal ? `All ${poolTotal}` : 'All'}
                onChange={(e) => applyAllocateCount(e.target.value)}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave blank for all {poolTotal || 0} unassigned. No need to tick leads one-by-one.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-teal-700">{distributeTotal}</p>
              <p className="text-[11px] text-slate-500">planned this run</p>
            </div>
          </div>
          {quickCountOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickCountOptions.map((opt) => {
                const active =
                  opt.value === ''
                    ? allocateCount === '' && !usingLeadPick
                    : allocateCount === opt.value && !usingLeadPick;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => applyAllocateCount(opt.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
          {usingLeadPick && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              Using {selectedLeads.length} specifically checked lead(s) — clears the how-many field
              when you change count chips.
            </p>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold">
            {isTransfer
              ? `Assigned leads (${transferLeadsList.length})${
                  fromUserId ? ' · filtered by From' : ''
                }`
              : `Unassigned leads (${poolTotal})${
                  unassigned.length < poolTotal
                    ? ` · list shows ${unassigned.length}`
                    : ''
                }`}
          </h3>
          {!isTransfer && (
            <button
              type="button"
              className="text-[11px] font-bold text-teal-700"
              onClick={() => setShowLeadPicker((v) => !v)}
            >
              {showLeadPicker ? 'Hide lead list' : 'Pick specific leads (optional)'}
            </button>
          )}
        </div>

        {!isTransfer && showLeadPicker && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              type="button"
              onClick={selectAllShownLeads}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white"
            >
              Select all shown ({unassigned.length})
            </button>
            <button
              type="button"
              onClick={() => selectFirstNShown(hasAllocateCount ? distributeTotal : 50)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white"
            >
              Select first {hasAllocateCount ? distributeTotal : Math.min(50, unassigned.length)} shown
            </button>
            <button
              type="button"
              onClick={clearLeadSelection}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white"
            >
              Clear selection
            </button>
          </div>
        )}

        {(isTransfer || showLeadPicker) && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {(isTransfer ? transferLeadsList : unassigned).map((l) => (
              <label
                key={l.id}
                className="flex items-center gap-2 text-xs border-b border-slate-100 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(l.id)}
                  onChange={() => {
                    setCountsManual(false);
                    setAllocateCount('');
                    setSelectedLeads((prev) =>
                      prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id],
                    );
                  }}
                />
                <span className="min-w-0 truncate">
                  {l.customerName} · {l.mobileNumber}
                  {isTransfer && l.assignedTo?.name ? (
                    <span className="text-slate-400"> · {l.assignedTo.name}</span>
                  ) : null}
                  {isTransfer && l.status ? (
                    <span className="text-slate-400"> · {l.status}</span>
                  ) : null}
                </span>
              </label>
            ))}
            {isTransfer && !transferLeadsList.length && (
              <p className="text-xs text-slate-400 py-2">
                {fromUserId
                  ? 'No assigned leads for this telecaller in scope'
                  : 'Select a campaign / From telecaller, or no assigned leads found'}
              </p>
            )}
          </div>
        )}

        {!isTransfer && !showLeadPicker && (
          <p className="text-xs text-slate-500">
            List hidden — use <strong>How many leads</strong> above (e.g. All {poolTotal || 0}, 50,
            100). Open the list only if you need exact names.
          </p>
        )}

        <p className="text-[11px] text-slate-400 mt-2">
          {isTransfer
            ? selectedLeads.length
              ? `${selectedLeads.length} selected for transfer (overrides count)`
              : 'Leave unchecked and use Move count, or select specific leads'
            : usingLeadPick
              ? `${selectedLeads.length} specific lead(s) selected`
              : `Will allocate ${distributeTotal} of ${poolTotal} unassigned (no per-lead ticking needed)`}
        </p>
      </div>

      {preview?.distribution && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold mb-2">Preview distribution</h3>
          <div className="grid md:grid-cols-3 gap-2">
            {preview.distribution.map((d) => (
              <div key={d.userId} className="border border-slate-100 rounded-xl p-3 text-xs">
                <div className="font-semibold">{d.name}</div>
                <div className="text-2xl font-black text-teal-700 mt-1">{d.plannedCount}</div>
                <div className="text-slate-400">open now: {d.openLeads}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isTransfer ? (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={
              loading ||
              !toUserId ||
              (!selectedLeads.length && !(fromUserId && Number(transferCount) > 0))
            }
            onClick={runTransfer}
            className="px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {loading
              ? 'Working...'
              : selectedLeads.length
                ? `Transfer selected (${selectedLeads.length})`
                : `Move ${transferCount || 'N'} leads`}
          </button>
          {campaignId && (
            <Link
              to={`/campaigns/${campaignId}`}
              className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-bold"
            >
              Back to campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] lg:left-[260px]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 hidden sm:block">
              {readiness?.blockers?.[0]?.message
                ? readiness.blockers[0].message
                : campaignTeam.length || selectedUsers.length || companyOnlyTelecallers.length
                  ? `${Math.max(selectableUsers.length, selectedUsers.length)} telecaller(s) · ${distributeTotal} leads ready`
                  : 'Assign telecallers on the campaign, then preview and allocate'}
            </p>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={openAddTelecaller}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 border-2 border-teal-600 text-teal-700 rounded-xl text-sm font-bold bg-teal-50"
              >
                <UserPlus className="w-4 h-4" />
                Add telecaller
              </button>
              <button
                type="button"
                disabled={loading || !campaignId || !canAllocate}
                onClick={runPreview}
                className="flex-1 sm:flex-none px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-50 bg-white"
              >
                Preview split
              </button>
              <button
                type="button"
                disabled={loading || !campaignId || !canAllocate}
                onClick={runAllocate}
                className="flex-1 sm:flex-none px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 shadow-md shadow-teal-600/20"
              >
                {loading ? 'Working...' : 'Allocate leads'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={addOpen}
        onClose={() => !addSaving && setAddOpen(false)}
        title="Add telecaller"
        subtitle={
          campaignId
            ? 'Created for Android login and assigned to the selected campaign'
            : 'Created for Android login — select a campaign to assign them'
        }
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={addSaving}
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 rounded-xl border text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="quick-add-telecaller"
              disabled={addSaving || !addFormValid}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-bold disabled:opacity-50"
            >
              {addSaving ? 'Saving…' : 'Save & continue'}
            </button>
          </div>
        }
      >
        <form id="quick-add-telecaller" onSubmit={submitAddTelecaller} className="space-y-3 p-1" noValidate>
          {addError && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium">
              {addError}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-sm ${
                touched.name && fieldErrors.name ? 'border-rose-400' : 'border-slate-200'
              }`}
              value={addForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setAddForm((f) => ({ ...f, name }));
                if (touched.name) {
                  setFieldErrors((fe) => ({ ...fe, name: validatePersonName(name) }));
                }
              }}
              onBlur={() => onAddFieldBlur('name')}
              placeholder="Telecaller name"
              autoComplete="name"
            />
            {touched.name && fieldErrors.name && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold">
              Mobile number <span className="text-rose-500">*</span>
            </label>
            <input
              className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-sm ${
                touched.phone && fieldErrors.phone ? 'border-rose-400' : 'border-slate-200'
              }`}
              value={addForm.phone}
              onChange={(e) => {
                const phone = e.target.value;
                setAddForm((f) => ({ ...f, phone }));
                if (touched.phone) {
                  setFieldErrors((fe) => ({ ...fe, phone: validateIndianMobile(phone) }));
                }
              }}
              onBlur={() => onAddFieldBlur('phone')}
              placeholder="10-digit mobile (starts with 6–9)"
              inputMode="numeric"
              autoComplete="tel"
            />
            {touched.phone && fieldErrors.phone && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.phone}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold">
              Password (Android login) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-sm ${
                touched.password && fieldErrors.password ? 'border-rose-400' : 'border-slate-200'
              }`}
              value={addForm.password}
              onChange={(e) => {
                const password = e.target.value;
                setAddForm((f) => ({ ...f, password }));
                if (touched.password) {
                  setFieldErrors((fe) => ({
                    ...fe,
                    password: validatePassword(password, { minLength: 8 }),
                  }));
                }
              }}
              onBlur={() => onAddFieldBlur('password')}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            {touched.password && fieldErrors.password ? (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.password}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                {passwordStrengthHint(addForm.password) ||
                  'Share this mobile + password with the telecaller for the Android app.'}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};
