import React, { useEffect, useState } from 'react';
import { Bell, Search, PhoneCall, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getNotifications, markAllNotificationsRead } from '../../api/notifications';

export const Header = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications({ page: 1, pageSize: 10 });
      const payload = res.data?.data || res.data;
      setNotifications(payload.data || []);
      setUnread(payload.meta?.unread || 0);
    } catch {
      /* optional */
    }
  };

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by customer name, mobile, loan ID..."
            className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <Link
          to="/live-calling"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs font-semibold"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Live Floor</span>
        </Link>

        <div className="relative">
          <button
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Notifications"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-xl z-50 p-2">
              <div className="flex justify-between items-center px-2 py-1">
                <span className="text-xs font-bold">Notifications</span>
                <button
                  className="text-[10px] text-blue-600 font-semibold"
                  onClick={async () => {
                    await markAllNotificationsRead();
                    await loadNotifications();
                  }}
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-2 py-2 border-b text-xs ${n.isRead ? 'opacity-60' : ''}`}>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-gray-500">{n.body}</div>
                  </div>
                ))}
                {!notifications.length && (
                  <div className="p-3 text-center text-gray-400 text-xs">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.roleName || 'Super Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
