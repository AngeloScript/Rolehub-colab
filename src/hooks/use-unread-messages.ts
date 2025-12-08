"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useUnreadMessages() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                // Get all conversations for this user
                const { data: conversations } = await supabase
                    .from('conversations')
                    .select('id, participants')
                    .contains('participants', [user.id]);

                if (!conversations) return;

                let totalUnread = 0;

                // For each conversation, count unread messages
                for (const conv of conversations) {
                    const { count } = await supabase
                        .from('direct_messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .neq('sender_id', user.id)
                        .eq('read', false);

                    totalUnread += count || 0;
                }

                setUnreadCount(totalUnread);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();

        // Subscribe to new messages
        const channel = supabase
            .channel('unread-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
            }, (payload) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newMsg = payload.new as any;
                // Only count if message is not from current user
                if (newMsg.sender_id !== user.id) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markConversationAsRead = async (conversationId: string) => {
        if (!user) return;

        try {
            // Mark all messages in this conversation as read
            const { data: messages } = await supabase
                .from('direct_messages')
                .select('id')
                .eq('conversation_id', conversationId)
                .neq('sender_id', user.id)
                .eq('read', false);

            if (messages && messages.length > 0) {
                await supabase
                    .from('direct_messages')
                    .update({ read: true })
                    .eq('conversation_id', conversationId)
                    .neq('sender_id', user.id);

                setUnreadCount(prev => Math.max(0, prev - messages.length));
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    return { unreadCount, markConversationAsRead };
}
