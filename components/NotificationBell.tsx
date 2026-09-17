import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import type { Notification } from '../types';
import { getNotifications, markAllNotificationsRead, markNotificationRead, subscribeToNotifications } from '../services/db';

const timeAgo = (isoDate: string): string => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Real-time (Supabase Realtime, not browser push) in-app notification
 * center for both worker and employer accounts. See
 * services/db.ts's subscribeToNotifications and
 * supabase/migrations/0009_notifications.sql for the delivery mechanism.
 */
const NotificationBell: React.FC<{ userId: string }> = ({ userId }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        getNotifications(userId).then((list) => { if (!cancelled) setNotifications(list); });

        const unsubscribe = subscribeToNotifications(userId, (n) => {
            setNotifications((prev) => [n, ...prev]);
        });

        return () => { cancelled = true; unsubscribe(); };
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const handleOpenNotification = useCallback(async (n: Notification) => {
        setIsOpen(false);
        if (!n.is_read) {
            setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
            markNotificationRead(n.id);
        }
        if (n.link) navigate(n.link);
    }, [navigate]);

    const handleMarkAllRead = useCallback(async () => {
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
        await markAllNotificationsRead(userId);
    }, [userId]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                aria-expanded={isOpen}
                className="relative p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-90 hover:border-cyan-500 transition-all cursor-pointer shadow-sm"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold font-mono flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[26rem] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                        <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold">Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 px-4">No notifications yet.</p>
                    ) : (
                        <ul>
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <button
                                        onClick={() => handleOpenNotification(n)}
                                        className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex gap-2.5 ${!n.is_read ? 'bg-cyan-50/60 dark:bg-cyan-950/20' : ''}`}
                                    >
                                        <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-cyan-500' : 'bg-transparent'}`} />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{n.title}</span>
                                            <span className="block text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{n.body}</span>
                                            <span className="block text-[10px] font-mono text-slate-400 mt-1">{timeAgo(n.created_at)}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
