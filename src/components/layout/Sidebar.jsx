import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  PhoneCall,
  Clock,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  LogOut,
  Radio,
  X,
  Megaphone,
  Upload,
  Share2,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = ({ onCloseMobile }) => {
  const { user, logout, hasPermission } = useAuth();
  const [openSections, setOpenSections] = useState({
    employees: false,
    leads: false,
    calling: false,
    followups: false,
    reports: false,
    compliance: false,
    settings: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const can = (perm) => !perm || hasPermission(perm);

  const handleNav = () => {
    onCloseMobile?.();
  };

  const menuGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/dashboard',
    },
    {
      id: 'campaigns',
      label: 'Campaign Management',
      icon: Megaphone,
      to: '/campaigns',
      permission: 'manage_campaigns',
    },
    {
      id: 'lead-upload',
      label: 'Lead Upload',
      icon: Upload,
      to: '/leads/upload',
      permission: 'import_leads',
    },
    {
      id: 'lead-distribution',
      label: 'Lead Distribution',
      icon: Share2,
      to: '/leads/allocate',
      permission: 'allocate_leads',
    },
    {
      id: 'telecaller-mgmt',
      label: 'Telecaller Management',
      icon: Users,
      to: '/employees',
      permission: 'manage_users',
    },
    {
      id: 'employee-mis',
      label: 'Employee Productivity MIS',
      icon: BarChart3,
      to: '/reports/employee',
      permission: 'view_mis',
    },
    {
      id: 'followups',
      label: 'Follow-up Management',
      icon: Clock,
      items: [
        { label: "Today's Callbacks", to: '/callbacks/today' },
        {
          label: 'Overdue Callbacks',
          to: '/callbacks/overdue',
          badge: { text: '!', tone: 'orange' },
        },
        { label: 'Follow-up MIS', to: '/followup-mis' },
      ],
    },
    {
      id: 'live-monitor',
      label: 'Auto Dialer Monitoring',
      icon: Activity,
      to: '/live-calling',
      permission: ['monitor_live', 'view_mis'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      items: [
        { label: 'Daily Calling MIS', to: '/reports/daily' },
        { label: 'Employee MIS', to: '/reports/employee' },
        { label: 'Telecaller Lead Overview', to: '/reports/telecaller-overview' },
        { label: 'Campaign MIS', to: '/reports/campaign' },
        { label: 'Branch MIS', to: '/reports/branch' },
        { label: 'Productivity Analytics', to: '/reports/analytics' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      items: [
        { label: 'Roles & Permissions', to: '/settings/roles' },
        { label: 'Calling Rules', to: '/settings/calling-rules' },
        { label: 'Automation Rules', to: '/settings/automation', permission: 'manage_settings' },
        { label: 'Notification Settings', to: '/settings/notifications' },
      ],
    },
    ...(can('manage_companies')
      ? [
          {
            id: 'companies',
            label: 'Customers',
            icon: Users,
            to: '/companies',
            permission: 'manage_companies',
          },
        ]
      : []),
    {
      id: 'employees',
      label: 'Employee Management',
      icon: Users,
      permission: 'manage_users',
      items: [
        { label: 'Employee Master', to: '/employees', permission: 'manage_users' },
        { label: 'Employee Devices', to: '/employees/devices', permission: 'manage_users' },
        { label: 'Branch / Team Master', to: '/branches', permission: 'manage_users' },
        { label: 'Attendance', to: '/attendance', permission: 'manage_users' },
        { label: 'Employee Performance', to: '/employee-performance', permission: 'view_mis' },
      ],
    },
    {
      id: 'leads',
      label: 'Lead Management',
      icon: Database,
      permission: 'manage_leads',
      items: [
        { label: 'Lead Master', to: '/leads', permission: ['manage_leads', 'call_assigned_leads'] },
        { label: 'Excel Upload', to: '/leads/upload', permission: 'import_leads' },
        { label: 'Lead Allocation', to: '/leads/allocate', permission: 'allocate_leads' },
        { label: 'Lead Transfer', to: '/leads/transfer', permission: 'allocate_leads' },
        {
          label: 'Unworked & Reassignment',
          to: '/leads/unworked',
          permission: 'allocate_leads',
        },
        { label: 'Duplicate Records', to: '/leads/duplicates', permission: 'manage_leads' },
      ],
    },
    {
      id: 'calling',
      label: 'Calling Management',
      icon: PhoneCall,
      items: [
        {
          label: 'Live Calling Monitor',
          to: '/live-calling',
          permission: ['monitor_live', 'view_mis'],
          badge: { text: 'Live', tone: 'mint' },
        },
        { label: 'Android telecaller app', to: '/autodialer', permission: 'monitor_live' },
        { label: 'Call History', to: '/call-history', permission: ['view_mis', 'call_assigned_leads'] },
        { label: 'Disposition Master', to: '/dispositions', permission: 'manage_settings' },
        { label: 'Retry Configuration', to: '/retry-config', permission: 'manage_settings' },
        { label: 'Message Templates', to: '/message-templates', permission: 'manage_settings' },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance & Audit',
      icon: ShieldCheck,
      items: [
        { label: 'Consent Management', to: '/compliance/consent' },
        { label: 'DND Management', to: '/compliance/dnd' },
        { label: 'Access Logs', to: '/compliance/access-logs' },
        { label: 'Audit Trail', to: '/compliance/audit' },
      ],
    },
  ];

  const badgeClass = (tone) =>
    tone === 'orange'
      ? 'bg-orange-100 text-orange-600'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <aside className="w-[260px] h-screen flex flex-col select-none bg-[#F5F5F5] text-neutral-700 border-r border-neutral-200/80">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white shadow-sm shrink-0 ring-1 ring-black/10">
            <Radio className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-neutral-900 text-[15px] tracking-tight truncate">
              AutoDial <span className="text-neutral-500 font-medium">Pro</span>
            </h1>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-2 -mr-1 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-white/80 transition-colors"
            title="Close Menu"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
        <div className="space-y-1">
          {menuGroups
            .filter((group) => can(group.permission) || group.items?.some((i) => can(i.permission)))
            .map((group) => {
              const Icon = group.icon;

              if (group.to) {
                if (!can(group.permission)) return null;
                return (
                  <NavLink
                    key={group.id}
                    to={group.to}
                    onClick={handleNav}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-3 min-h-10 rounded-xl text-[13px] font-medium transition-all',
                        isActive
                          ? 'bg-white text-neutral-900 shadow-sm font-semibold'
                          : 'text-neutral-600 hover:bg-white/70 hover:text-neutral-900',
                      ].join(' ')
                    }
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0 stroke-[1.75]" />
                    <span className="truncate">{group.label}</span>
                  </NavLink>
                );
              }

              const isOpen = openSections[group.id];
              const visibleItems = (group.items || []).filter((item) => can(item.permission));
              if (!visibleItems.length) return null;

              return (
                <div key={group.id} className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => toggleSection(group.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 min-h-10 rounded-xl text-[13px] font-medium text-neutral-700 hover:bg-white/70 hover:text-neutral-900 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-[18px] h-[18px] shrink-0 stroke-[1.75] text-neutral-600" />
                      <span className="truncate text-left">{group.label}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="relative mt-0.5 ml-[22px] pl-4">
                      <span
                        aria-hidden
                        className="absolute left-0 top-1 bottom-1 w-px bg-neutral-300"
                      />

                      <ul className="space-y-0.5">
                        {visibleItems.map((item) => (
                          <li key={`${group.id}-${item.to}`} className="relative">
                            <span
                              aria-hidden
                              className="absolute -left-4 top-1/2 w-3 h-px bg-neutral-300"
                            />
                            <NavLink
                              to={item.to}
                              onClick={handleNav}
                              className={({ isActive }) =>
                                [
                                  'flex items-center justify-between gap-2 pl-3 pr-2.5 min-h-9 rounded-xl text-[13px] transition-all',
                                  isActive
                                    ? 'bg-white text-neutral-900 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                                    : 'text-neutral-500 hover:text-neutral-800',
                                ].join(' ')
                              }
                            >
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span
                                  className={`shrink-0 text-[10px] font-semibold leading-none px-1.5 py-1 rounded-full ${badgeClass(
                                    item.badge.tone,
                                  )}`}
                                >
                                  {item.badge.text}
                                </span>
                              )}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-3 py-3 border-t border-neutral-200/90">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white text-neutral-800 flex items-center justify-center text-xs font-bold shadow-sm border border-neutral-200 shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-900 truncate leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-neutral-500 truncate leading-tight mt-0.5">
                {user?.roleName || user?.role || 'User'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Logout"
            aria-label="Logout"
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-white transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
