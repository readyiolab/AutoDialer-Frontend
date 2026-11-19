import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/reports';
import { getCampaigns } from '../api/campaigns';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { PhoneCall, Users, Database, Target, Upload, Clock, Megaphone } from 'lucide-react';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getCampaigns().catch(() => ({ data: [] })),
    ])
      .then(([dashRes, campRes]) => {
        setData(dashRes.data?.data || dashRes.data);
        const payload = campRes.data?.data || campRes.data;
        const list = payload.data || payload || [];
        setCampaigns(Array.isArray(list) ? list.slice(0, 6) : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load dashboard');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error}</div>;
  if (!data) return null;

  const goLeads = (params) => {
    const qs = new URLSearchParams(params).toString();
    navigate(`/leads${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black">Operations Dashboard</h1>
          <p className="text-xs text-gray-500">Click any KPI to open the matching records</p>
        </div>
        <div className="flex gap-2">
          <Link to="/campaigns" className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
            <Megaphone className="w-3.5 h-3.5" /> Campaigns
          </Link>
          <Link to="/leads/upload" className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Import leads
          </Link>
          <Link to="/leads/unworked" className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
            Unworked
          </Link>
          <Link to="/live-calling" className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5" /> Live floor
          </Link>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">Campaigns</h2>
            <Link to="/campaigns" className="text-xs font-bold text-blue-600">
              View all
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                to={`/campaigns/${c.id}`}
                className="bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm truncate">{c.name}</h3>
                  <StatusBadge status={c.status} />
                </div>
                {c._count && (
                  <p className="text-xs text-gray-500 mt-2">
                    {c._count.leads ?? 0} leads · {c._count.assignments ?? 0} telecallers
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total leads" value={data.totalLeads} icon={Database} onClick={() => goLeads({})} />
        <StatCard
          title="Unassigned"
          value={data.unassignedLeads}
          icon={Database}
          color="amber"
          onClick={() => goLeads({ assignedToId: 'null' })}
        />
        <StatCard
          title="Assigned"
          value={data.assignedLeads}
          icon={Target}
          onClick={() => goLeads({ status: 'ASSIGNED' })}
        />
        <StatCard
          title="Converted"
          value={data.convertedLeads}
          icon={Target}
          color="green"
          onClick={() => goLeads({ status: 'CONVERTED' })}
        />
        <StatCard
          title="Active telecallers"
          value={data.activeTelecallers}
          icon={Users}
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title="Online now"
          value={data.onlineTelecallers}
          icon={Users}
          onClick={() => navigate('/live-calling')}
        />
        <StatCard
          title="Calls today"
          value={data.todayCalls}
          icon={PhoneCall}
          onClick={() => navigate('/reports/employee')}
        />
        <StatCard
          title="Connected today"
          value={data.todayConnected}
          icon={PhoneCall}
          color="green"
          onClick={() => navigate('/reports/telecaller-overview')}
        />
        <StatCard title="Missed today" value={data.missedCalls || data.todayMissed} icon={PhoneCall} color="rose" />
        <StatCard title="Avg duration" value={data.avgCallDurationFormatted} icon={PhoneCall} />
        <StatCard
          title="Follow-ups due"
          value={data.followUpsDue ?? data.pendingCallbacks}
          icon={Clock}
          color="amber"
          onClick={() => navigate('/callbacks/today')}
        />
        <StatCard
          title="Conversion %"
          value={`${data.conversionPercentage ?? 0}%`}
          icon={Target}
          onClick={() => goLeads({ status: 'CONVERTED' })}
        />
      </div>
    </div>
  );
};
