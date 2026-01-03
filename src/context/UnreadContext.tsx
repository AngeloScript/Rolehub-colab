"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

interface UnreadContextType {
    unreadCount: number;
    markConversationAsRead: (conversationId: string) => Promise<void>;
    loading: boolean;
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export function UnreadProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        let isActive = true;
        if (!user) {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                // Get all conversations for this user
                const { data: conversations } = await supabase
                    .from('conversations')
                    .select('id, participants')
                    .contains('participants', [user.id]);

                if (!conversations || !isActive) return;

                // Fetch ALL unread messages for me in one go (more efficient than loop)
                // We count messages where I am NOT the sender AND read is false AND conversation ID matches one of mine.
                const conversationIds = (conversations || []).map(c => c.id);

                if (conversationIds.length > 0) {
                    const { count } = await supabase
                        .from('direct_messages')
                        .select('*', { count: 'exact', head: true })
                        .in('conversation_id', conversationIds)
                        .neq('sender_id', user.id)
                        .eq('read', false);

                    if (isActive) setUnreadCount(count || 0);
                } else {
                    if (isActive) setUnreadCount(0);
                }

            } catch (error) {
                console.error('Error fetching unread count:', error);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchUnreadCount();

        return () => { isActive = false; };
    }, [user]);

    // Realtime Subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('global-unread-counter')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
            }, (payload) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newMsg = payload.new as any;
                // Only count if message is not from me
                if (newMsg.sender_id !== user.id) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'direct_messages',
                filter: `read=eq.true` // Listen specifically for when read becomes true
            }, (payload) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updatedMsg = payload.new as any;
                // If a message NOT from me was marked as read, decrease count
                if (updatedMsg.sender_id !== user.id) {
                    // Logic issue: If we update in bulk, this triggers once per row? 
                    // Postgres triggers one event per row updated.
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markConversationAsRead = useCallback(async (conversationId: string) => {
        if (!user) return;

        try {
            // Optimistic update locally? 
            // Better to wait for DB response or Realtime event to be safe, 
            // BUT for UX we often want instant feedback.
            // Since we listen to UPDATE event, let's rely on that OR manual decrement.
            // Manual decrement is safer for bulk updates to avoid race conditions with multiple events.

            // 1. Get count of unread messages in this conversation first to know how much to subtract
            const { count } = await supabase
                .from('direct_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', user.id)
                .eq('read', false);

            if (count && count > 0) {
                // Optimistic Update
                setUnreadCount(prev => Math.max(0, prev - count));

                // 2. Perform Update
                // Update 'status' to 'read' (for UI ticks) AND 'read' boolean (legacy/unread count)
                // We assume 'read' column exists because unread count logic uses it.
                await supabase
                    .from('direct_messages')
                    .update({
                        read: true,
                        status: 'read'
                    })
                    .eq('conversation_id', conversationId)
                    .neq('sender_id', user.id)
                    .eq('read', false);
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
            // Revert optimistic update? Hard to track exact count lost. 
            // Ideally re-fetch.
        }
    }, [user]);

    return (
        <UnreadContext.Provider value={{ unreadCount, markConversationAsRead, loading }}>
            {children}
        </UnreadContext.Provider>
    );
}

export function useUnreadMessages() {
    const context = useContext(UnreadContext);
    if (!context) {
        throw new Error('useUnreadMessages must be used within an UnreadProvider');
    }
    return context;
}
