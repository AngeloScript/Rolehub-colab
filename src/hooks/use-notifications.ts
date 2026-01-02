import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import type { Notification, User } from '@/lib/types';
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    } as unknown as User // Cast to unknown then User to avoid strict type check for now
                }));
                setNotifications(mappedNotifications);
                setUnreadCount(mappedNotifications.filter((n) => !n.read).length);
            }
            setLoading(false);
        };

        fetchNotifications();

        // Realtime subscription
        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                try {
                    // Immediately prepend the new notification
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const newNotification = payload.new as any;

                    if (!newNotification || !newNotification.id) {
                        console.warn("Received invalid notification payload:", payload);
                        return;
                    }

                    const mappedNotification: Notification = {
                        id: newNotification.id,
                        type: newNotification.type,
                        text: newNotification.text,
                        link: newNotification.link,
                        read: newNotification.read,
                        timestamp: newNotification.created_at,
                        time: newNotification.created_at,
                        user: {
                            id: 'system',
                            name: newNotification.sender_name || 'Sistema',
                            email: '',
                            avatar: newNotification.sender_avatar || '',
                            savedEvents: [],
                            relationshipStatus: 'not_specified',
                            bio: '',
                            following: [],
                            followers: 0,
                            checkIns: 0
                        } as unknown as User
                    };

                    setNotifications(prev => [mappedNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    toast({
                        title: "Nova Notificação",
                        description: "Você recebeu uma nova atualização."
                    });
                } catch (error) {
                    console.error("Error handling realtime notification:", error);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, toast]);


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
    };
}
