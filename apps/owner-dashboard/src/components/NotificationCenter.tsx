import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Target, Users, GraduationCap, Calendar, BellRing } from 'lucide-react';
import { notificationService } from '@hr/services';
import { Notification } from '@hr/types';
import { formatTimeAgo } from '@hr/utils';
import { motion, AnimatePresence } from 'framer-motion';

const getNotifIcon = (type: string) => {
    switch (type) {
        case 'task': return Target;
        case 'training': return Users;
        case 'achievement': return GraduationCap;
        case 'reminder': return Calendar;
        default: return BellRing;
    }
};

const getNotifColor = (type: string) => {
    switch (type) {
        case 'task': return 'bg-blue-100 text-blue-600';
        case 'training': return 'bg-purple-100 text-purple-600';
        case 'achievement': return 'bg-emerald-100 text-emerald-600';
        case 'reminder': return 'bg-amber-100 text-amber-600';
        default: return 'bg-neutral-100 text-neutral-500';
    }
};

const getNavigationLink = (notif: Notification): string | null => {
    if (notif.metadata?.link) return notif.metadata.link;
    switch (notif.type) {
        case 'task': return '/';
        case 'training': return '/courses';
        default: return null;
    }
};

const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const unsub = notificationService.subscribe((data) => {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        });
        return unsub;
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await notificationService.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleDelete = async (id: string) => {
        await notificationService.delete(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
                <Bell className="h-5 w-5 text-neutral-600" />
                {unreadCount > 0 && (
                    <motion.span
                        key={unreadCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white"
                    >
                        {unreadCount > 9 ? '+9' : unreadCount}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                                <h3 className="font-bold text-neutral-900">الإشعارات</h3>
                                <span className="text-xs text-neutral-500">{unreadCount} غير مقروءة</span>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                                        <p className="text-sm text-neutral-500 italic">لا توجد إشعارات جديدة</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-50">
                                        {notifications.map((notif) => {
                                            const C = getNotifIcon(notif.type);
                                            return (
                                                <div
                                                    key={notif.id}
                                                    className={`p-4 transition-colors hover:bg-neutral-50 flex gap-3 ${!notif.isRead ? 'bg-primary-50/20' : ''}`}
                                                >
                                                    <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${getNotifColor(notif.type)}`}>
                                                        <C className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm font-semibold truncate ${!notif.isRead ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-[10px] text-neutral-400 shrink-0 mt-0.5">
                                                                {formatTimeAgo(notif.createdAt)}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{notif.message}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {!notif.isRead && (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                    تحديد كمقروء
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(notif.id)}
                                                                className="text-[10px] font-bold text-neutral-400 hover:text-red-500 flex items-center gap-1 mr-auto"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                حذف
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
