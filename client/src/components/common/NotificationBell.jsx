import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Package, MessageSquare, Briefcase, Award, Sparkles, ExternalLink } from 'lucide-react';
import { apiGet, apiPatch } from '../../api/client.js';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/notifications?limit=15');
      if (res && res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[NotificationBell] Could not load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s background poll
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await apiPatch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiPatch('/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    if (type?.startsWith('ORDER')) return <Package className="w-4 h-4 text-emerald-600" />;
    if (type?.startsWith('ENQUIRY')) return <MessageSquare className="w-4 h-4 text-blue-600" />;
    if (type?.startsWith('B2B')) return <Briefcase className="w-4 h-4 text-indigo-600" />;
    if (type?.startsWith('VERIFICATION')) return <Award className="w-4 h-4 text-amber-600" />;
    return <Sparkles className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-600 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                return (
                  <div
                    key={notif._id}
                    className={`p-3.5 flex items-start gap-3 transition ${
                      isUnread ? 'bg-brand-50/40 hover:bg-brand-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} truncate`}>
                          {notif.title}
                        </p>
                        {isUnread && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif._id, e)}
                            className="text-[10px] text-brand-600 hover:underline shrink-0"
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.body}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
