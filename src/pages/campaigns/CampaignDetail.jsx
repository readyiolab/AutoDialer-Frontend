import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getCampaign,
  getCampaignStats,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
  assignUsers,
  removeUsers,
} from '../../api/campaigns';
import { getUsers } from '../../api/users';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import {
  ArrowLeft,
  Upload,
  Users,
  Pause,
  Play,
  Save,
  Database,
  Target,
  PhoneCall,
  UserMinus,
  UserPlus,
  ArrowRightLeft,
} from 'lucide-react';
import { CampaignRoundsPanel } from './CampaignRoundsPanel';

export const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [edit, setEdit] = useState({ name: '', description: '', status: 'ACTIVE' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, sRes, uRes] = await Promise.all([
        getCampaign(id),
        getCampaignStats(id),
        getUsers({ pageSize: 100, status: 'ACTIVE' }).catch(() => ({ data: { data: [] } })),
      ]);
      const camp = cRes.data?.data || cRes.data;
      const st = sRes.data?.data || sRes.data;
      setCampaign(camp);
      setStats(st);
      setEdit({
        name: camp.name || '',
        description: camp.description || '',
        status: camp.status || 'ACTIVE',
      });
      const usersPayload = uRes.data?.data || uRes.data;
      const users = usersPayload.data || usersPayload || [];
      setAllUsers(
        users.filter((u) => {
          const role = String(u.role?.name || u.roleName || '').toUpperCase();
          return role === 'TELECALLER' || role.includes('TELE');
        }),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const assignedIds = useMemo(
    () => new Set((campaign?.assignments || []).map((a) => a.userId || a.user?.id)),
    [campaign],
  );

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !assignedIds.has(u.id)),
    [allUsers, assignedIds],
  );

  const leadsHref = (extra = {}) => {
    const qs = new URLSearchParams({ campaignId: id, ...extra });
    return `/leads?${qs.toString()}`;
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateCampaign(id, {
        name: edit.name,
        description: edit.description || null,
        status: edit.status,
      });
      setMessage('Campaign updated');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const togglePause = async () => {
    setSaving(true);
    setError('');
    try {
      if (campaign?.status === 'ACTIVE') await pauseCampaign(id);
      else await resumeCampaign(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Status change failed');
    } finally {
      setSaving(false);
    }
  };

  const addTelecallers = async () => {
    if (!selectedToAdd.length) return;
    const addedCount = selectedToAdd.length;
    setSaving(true);
    setError('');
    try {
      await assignUsers(id, selectedToAdd);
      setSelectedToAdd([]);
      setMessage(
        `Added ${addedCount} telecaller(s). To share existing leads with them, use Transfer leads.`,
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Assign failed');
    } finally {
      setSaving(false);
    }
  };

  const removeTelecaller = async (userId) => {
    setSaving(true);
    setError('');
    try {
      await removeUsers(id, [userId]);
      setMessage('Telecaller removed');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Remove failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleAdd = (userId) => {
    setSelectedToAdd((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId],
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!campaign) {
    return (
      <div className="space-y-3">
        <Link to="/campaigns" className="text-sm font-bold text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || 'Campaign not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/campaigns" className="text-xs font-bold text-blue-600 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Campaigns
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{campaign.description || 'No description'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/leads/upload?campaignId=${id}`}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" /> Upload leads
          </Link>
          <Link
            to={`/leads/allocate?campaignId=${id}`}
            className="px-3 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" /> Allocate
          </Link>
          <Link
            to={`/leads/transfer?campaignId=${id}`}
            className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer leads
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={togglePause}
            className="px-3 py-2 bg-white border rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50"
          >
            {campaign.status === 'ACTIVE' ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume
              </>
            )}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex flex-wrap items-center justify-between gap-2">
          <span>{message}</span>
          {String(message).includes('Transfer leads') && (
            <Link
              to={`/leads/transfer?campaignId=${id}`}
              className="font-bold underline inline-flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Open transfer
            </Link>
          )}
        </div>
      )}

      <CampaignRoundsPanel
        campaignId={id}
        telecallers={campaign.assignments || []}
      />

      {stats && (
        <div>
          <h2 className="text-sm font-bold mb-3">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to={leadsHref()}>
              <StatCard title="Total leads" value={stats.totalLeads} icon={Database} />
            </Link>
            <Link to={leadsHref({ assignedToId: 'null' })}>
              <StatCard title="Unassigned" value={stats.unassignedLeads} icon={Database} color="amber" />
            </Link>
            <Link to={leadsHref({ status: 'ASSIGNED' })}>
              <StatCard title="Assigned" value={stats.assignedLeads} icon={Target} />
            </Link>
            <Link to={leadsHref({ status: 'CONTACTED' })}>
              <StatCard title="Contacted" value={stats.contactedLeads} icon={PhoneCall} color="indigo" />
            </Link>
            <Link to={leadsHref({ status: 'INTERESTED' })}>
              <StatCard title="Interested" value={stats.interestedLeads} icon={Target} color="green" />
            </Link>
            <Link to={leadsHref({ status: 'CONVERTED' })}>
              <StatCard title="Converted" value={stats.convertedLeads} icon={Target} color="indigo" />
            </Link>
            <StatCard title="Telecallers" value={stats.totalTelecallers} icon={Users} />
            <StatCard
              title="Conversion %"
              value={`${stats.conversionRate ?? 0}%`}
              icon={Target}
              color="green"
            />
            <StatCard title="Total calls" value={stats.totalCalls} icon={PhoneCall} />
            <StatCard title="Connected" value={stats.connectedCalls} icon={PhoneCall} color="green" />
            <StatCard title="Pending" value={stats.pendingLeads} icon={Database} color="amber" />
            <StatCard title="Follow-ups due" value={stats.followUpsDue} icon={PhoneCall} color="amber" />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Users className="w-4 h-4" /> Telecallers ({campaign.assignments?.length || 0})
          </h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {(campaign.assignments || []).map((a) => {
              const u = a.user || {};
              const uid = a.userId || u.id;
              return (
                <div
                  key={a.id || uid}
                  className="flex items-center justify-between gap-2 text-xs border rounded-xl px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.name || 'User'}</div>
                    <div className="text-gray-400">
                      {u.employeeId || u.phone || ''} · assigned {a.leadsAssigned ?? 0} · done{' '}
                      {a.leadsCompleted ?? 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/leads/transfer?campaignId=${id}&fromUserId=${uid}`}
                      className="text-indigo-600 font-bold flex items-center gap-1"
                      title="Move some leads from this telecaller"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Move
                    </Link>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeTelecaller(uid)}
                      className="text-rose-600 font-bold flex items-center gap-1 disabled:opacity-50"
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
            {!campaign.assignments?.length && (
              <p className="text-xs text-gray-400">No telecallers assigned yet</p>
            )}
          </div>

          <div className="border-t pt-3 space-y-2">
            <h3 className="text-xs font-bold flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" /> Add telecallers
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {availableUsers.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-xs border rounded-lg px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={selectedToAdd.includes(u.id)}
                    onChange={() => toggleAdd(u.id)}
                  />
                  <span>
                    {u.name} <span className="text-gray-400">{u.employeeId}</span>
                  </span>
                </label>
              ))}
              {!availableUsers.length && (
                <p className="text-xs text-gray-400">No more active telecallers to add</p>
              )}
            </div>
            <button
              type="button"
              disabled={saving || !selectedToAdd.length}
              onClick={addTelecallers}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Assign selected ({selectedToAdd.length})
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-bold">Actions / edit</h2>
          <form onSubmit={saveDetails} className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Name</label>
              <input
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Description</label>
              <textarea
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                rows={3}
                value={edit.description}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Status</label>
              <select
                className="w-full mt-1 border rounded-xl px-3 py-2 text-sm"
                value={edit.status}
                onChange={(e) => setEdit({ ...edit, status: e.target.value })}
              >
                {['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Dial mode: {campaign.dialMode || '—'}</div>
              <div>Allocation: {campaign.allocationMethod || '—'}</div>
              <div>
                Hours: {campaign.callingHoursStart || '—'}-{campaign.callingHoursEnd || '—'} · Max
                attempts {campaign.maxAttemptsPerLead}
              </div>
              <div>
                Leads: {campaign._count?.leads ?? '—'} · Calls: {campaign._count?.callRecords ?? '—'}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
