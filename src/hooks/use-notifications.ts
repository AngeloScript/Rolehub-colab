import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            setUnreadCount(0);
            return;
        }

        const fetchNotifications = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching notifications:", error);
                setLoading(false);
                return;
            }

            if (data) {
                const mappedNotifications: Notification[] = data.map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    text: n.text,
                    link: n.link,
                    read: n.read,
                    timestamp: n.created_at,
                    time: n.created_at, // You might want to format this
                    user: {
                        id: 'system', // Placeholder
                        name: n.sender_name,
                        email: '',
                        avatar: n.sender_avatar,
                        savedEvents: [],
                        relationshipStatus: 'not_specified',
                        bio: '',
                        following: [],
                        followers: 0,
                        checkIns: 0
                    } as any // Cast to any to avoid strict User type check for now, or update Notification type
                }));
                setNotifications(mappedNotifications);
                setUnreadCount(mappedNotifications.filter((n: any) => !n.read).length);
            }
            setLoading(false);
        };

        fetchNotifications();

        // Realtime subscription
        const channel = supabase
            .channel(`notifications:${user.id} `)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id = eq.${user.id} `
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        // Listen for foreground messages (FCM specific, keeping as no Supabase alternative provided)
        // Removed FCM listener as firebase-messaging is deleted.

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, toast]);

    // This function is for FCM token management, keeping it as no Supabase equivalent was provided.
    const requestPermission = async () => {
        // Removed FCM permission request
    };

    const markAsRead = async (notificationId: string) => {
        if (!user) return;
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };


    return {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        unreadCount,
        requestPermission
    };
}
