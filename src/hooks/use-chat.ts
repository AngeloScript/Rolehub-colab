"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { User, Message } from '@/lib/types';

export type ChatConversation = {
    id: string;
    participants: string[];
    lastMessage: string;
    lastMessageTimestamp: any; // Firestore Timestamp
    unread: boolean; // This would need more complex logic in real app
    otherUser?: User; // Enriched data
};

export function useChat() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch conversations
    // Fetch conversations
    useEffect(() => {
        if (!user) {
            setConversations([]);
            setLoading(false);
            return;
        }

        const fetchConversations = async () => {
            // Supabase doesn't support array-contains for multiple values easily in one go for "participants containing user.id"
            // But we can use the @> operator for array containment
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .contains('participants', [user.id])
                .order('last_message_timestamp', { ascending: false });

            if (error) {
                console.error("Error fetching conversations:", error);
                setLoading(false);
                return;
            }

            // If no error and data exists (even if empty array), process it
            if (data !== null) {
                const convs = await Promise.all(data.map(async (conv: any) => {
                    const otherUserId = conv.participants.find((p: string) => p !== user.id);
                    let otherUser: User | undefined;

                    if (otherUserId) {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', otherUserId)
                            .single();

                        if (userData) {
                            otherUser = {
                                id: userData.id,
                                name: userData.name,
                                email: userData.email,
                                avatar: userData.avatar,
                                savedEvents: userData.saved_events || [],
                                relationshipStatus: userData.relationship_status,
                                bio: userData.bio,
                                following: userData.following || [],
                                followers: userData.followers || 0,
                                checkIns: userData.check_ins || 0,
                                isMock: false
                            };
                        }
                    }

                    return {
                        id: conv.id,
                        participants: conv.participants,
                        lastMessage: conv.last_message,
                        lastMessageTimestamp: conv.last_message_timestamp,
                        unread: false, // Logic for unread needs a separate tracking table or column
                        otherUser
                    } as ChatConversation;
                }));
                setConversations(convs);
            }
            setLoading(false);
        };

        fetchConversations();

        // Realtime subscription for conversations
        const channel = supabase
            .channel(`conversations:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participants=cs.{${user.id}}` // Filter where participants array contains user.id
            }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const getOrCreateConversation = async (otherUserId: string) => {
        if (!user) return null;

        const sortedIds = [user.id, otherUserId].sort();
        const conversationId = sortedIds.join('_');

        // Check if conversation exists
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conversationId)
            .single();

        if (!existingConv) {
            const { error } = await supabase
                .from('conversations')
                .insert({
                    id: conversationId,
                    participants: sortedIds,
                    last_message: '',
                    last_message_timestamp: new Date().toISOString()
                });

            if (error) {
                console.error("Error creating conversation:", error);
                return null;
            }
        }
        return conversationId;
    };

    const sendMessage = async (conversationId: string, text: string) => {
        if (!user || !text.trim()) return;

        const { error: msgError } = await supabase
            .from('direct_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                text
            });

        if (msgError) {
            console.error("Error sending message:", msgError);
            return;
        }

        await supabase
            .from('conversations')
            .update({
                last_message: text,
                last_message_timestamp: new Date().toISOString()
            })
            .eq('id', conversationId);
    };

    return {
        conversations,
        loading,
        getOrCreateConversation,
        sendMessage
    };
}

export function useMessages(conversationId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!conversationId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('direct_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching messages:", error);
            } else if (data) {
                setMessages(data.map((msg: any) => ({
                    id: msg.id,
                    senderId: msg.sender_id,
                    text: msg.text,
                    timestamp: msg.created_at,
                    author: '', // Not stored in msg, fetched separately if needed
                    avatar: ''
                })));
            }
            setLoading(false);
        };

        fetchMessages();

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                const newMsg = payload.new as any;
                setMessages(prev => [...prev, {
                    id: newMsg.id,
                    senderId: newMsg.sender_id,
                    text: newMsg.text,
                    timestamp: newMsg.created_at,
                    author: '',
                    avatar: ''
                }]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    return { messages, loading };
}
