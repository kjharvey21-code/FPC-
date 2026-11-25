import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Volume2,
  X,
  Radio,
} from 'lucide-react';

function formatNotificationTime(value: string): string {
  if (!value) return 'Just now';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  const diffMs = Date.now() - parsed;
  if (diffMs < 60_000) return 'Just now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationBadgeLabel(type: string, eventType?: string): string {
  if (type === 'role_assigned') return 'Role Assigned';
  if (type === 'system') return 'Admin Alert';
  switch (eventType) {
    case 'contest':
      return 'Contest';
    case 'workshop':
      return 'Workshop';
    case 'meeting':
      return 'Meeting';
    case 'coverage':
      return 'Coverage';
    case 'shoot':
    default:
      return 'Project';
  }
}

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
    sendPushNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    setSelectedNotificationEventId,
    showToast,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notificationId: string, eventId?: string) => {
    markNotificationAsRead(notificationId);
    if (eventId) {
      setSelectedNotificationEventId(eventId);
      setIsOpen(false);
    }
  };

  const handleSendTestPush = async () => {
    if (browserNotificationPermission !== 'granted') {
      const granted = await requestBrowserNotificationPermission();
      if (!granted) return;
    }
    sendPushNotification('🎉 FPC Event Alert: Live Call Sheet Ready', {
      body: 'Courtside shoot coverage slots are open for volunteer applications. Tap to inspect roles and volunteer!',
      data: { eventId: notifications[0]?.eventId || null },
    });
    showToast('Test push notification sent! Check your system notification drawer.', 'info');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer border flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-slate-900'
        }`}
        title="Event Alerts & Notification Center"
        aria-label="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center justify-center shadow-xs animate-pulse">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Drawer */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/15 backdrop-blur-2xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:top-full sm:absolute sm:right-0 sm:mt-2.5 w-auto sm:w-[380px] max-w-[calc(100vw-24px)] sm:max-w-md bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[520px] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadNotificationCount > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold border border-indigo-200">
                  {unreadNotificationCount} unread
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">All read</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsAsRead()}
                  className="px-2 py-1 rounded-lg hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllNotifications()}
                  className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Browser Push Opt-In Banner */}
          {browserNotificationPermission !== 'granted' && (
            <div className="p-3 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Radio className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                <p className="text-[11px] text-indigo-900 leading-snug truncate">
                  Get instant browser alerts when new shoots publish
                </p>
              </div>
              <button
                type="button"
                onClick={requestBrowserNotificationPermission}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors shrink-0 shadow-2xs cursor-pointer active:scale-95"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-700">All caught up!</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Whenever an officer creates a production shoot, contest, or assigns crew roles, you will receive real-time alerts right here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id, notif.eventId)}
                  className={`p-3.5 sm:p-4 transition-colors flex items-start gap-3 cursor-pointer group ${
                    notif.read ? 'hover:bg-slate-50/80' : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="pt-1.5 shrink-0">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        notif.read ? 'bg-transparent' : 'bg-indigo-600 shadow-xs'
                      }`}
                    />
                  </div>

                  {/* Event Thumbnail */}
                  {notif.bannerUrl ? (
                    <img
                      src={notif.bannerUrl}
                      alt={notif.title}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-102 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          notif.type === 'role_assigned' ? 'text-emerald-600' : 'text-indigo-600'
                        }`}
                      >
                        {getNotificationBadgeLabel(notif.type, notif.eventType)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatNotificationTime(notif.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    {/* Action link */}
                    {notif.eventId && (
                      <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-700">
                        <UserPlus className="w-3 h-3" />
                        <span>
                          {notif.type === 'role_assigned'
                            ? 'View Assigned Role'
                            : 'View & Volunteer for Role'}
                        </span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer toolbar with test push trigger */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-[10px] text-slate-400">
              FPC Instant Alert Gateway
            </span>
            <button
              type="button"
              onClick={handleSendTestPush}
              className="text-[11px] text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Volume2 className="w-3 h-3 text-slate-400" />
              <span>Test Push Alert</span>
            </button>
          </div>
          </div>
        </>
      )}
    </div>
  );
};
