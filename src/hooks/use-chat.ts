
"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { User, Message, ChatConversation } from '@/lib/types';



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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                // Filter out conversations where otherUser is missing (to prevent crashes)
                setConversations(convs.filter(c => c.otherUser !== undefined));
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

    const getOrCreateConversation = useCallback(async (otherUserId: string) => {
        if (!user) return null;

        const sortedIds = [user.id, otherUserId].sort();
        const conversationId = sortedIds.join('_');

        // Optimistic Upsert (Try to insert, if exists, do nothing/return it)
        const { error } = await supabase
            .from('conversations')
            .upsert({
                id: conversationId,
                participants: sortedIds,
                // Only set defaults if it's a NEW row (this is tricky with upsert, 
                // but if we ignore duplicates, it won't overwrite existing data)
                last_message: '',
                last_message_timestamp: new Date().toISOString()
            }, { onConflict: 'id', ignoreDuplicates: true });

        if (error) {
            // Error 23505 is duplicate key, but ignoreDuplicates should handle it.
            // If it still errors, it's something else.
            console.error("Error creating conversation:", JSON.stringify(error, null, 2));
            // Just return null or maybe return the ID anyway assuming it exists?
            // If error is strictly duplicate key violation not caught by ignoreDuplicates (unlikely), 
            // we should still return the ID so the chat loads.
            if (error.code !== '23505') {
                return null;
            }
        }

        return conversationId;
    }, [user]);

    const sendMessage = useCallback(async (conversationId: string, text: string) => {
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
    }, [user]);

    return {
        conversations,
        loading,
        getOrCreateConversation,
        sendMessage
    };
}

export function useMessages(conversationId: string) {
    const { user } = useAuth();
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setMessages(data.map((msg: any) => ({
                    id: msg.id,
                    senderId: msg.sender_id,
                    text: msg.text,
                    timestamp: msg.created_at,
                    author: '', // Optional: could be filled if we joined with users
                    avatar: '',
                    mediaUrl: msg.media_url,
                    mediaType: msg.media_type,
                    status: msg.status || 'sent'
                })));
            }
            setLoading(false);
        };

        fetchMessages();

        // Subscribe to ALL message events (Global Channel for robustness)
        // We filter client-side to assume reliability over server-side Postgres filters in some edge cases.
        // Subscribe to ALL message events (Global Channel for robustness)
        // Subscribe to ALL message events (Global Channel for robustness)
        // STRICT USER REQUEST implementation
        const channel = supabase
            .channel('room_' + conversationId + '_' + Date.now()) // Dynamic Channel as requested
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'direct_messages'
                // NO FILTER AS REQUESTED
            }, (payload) => {
                // LOG OBRIGATÓRIO PARA DEBUG
                console.log('🔔 EVENTO RECEBIDO:', payload);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newMsg = payload.new as any;
                const eventType = payload.eventType;

                // 1. Tratamento de UPDATE (Check Azul)
                if (eventType === 'UPDATE') {
                    // Log de Diagnóstico Profundo REQUERIDO
                    console.log("🔄 TENTANDO ATUALIZAR MSG:", newMsg.id, "STATUS:", newMsg.status);

                    setMessages((prev) => prev.map(msg =>
                        // Normalização de IDs (String vs String)
                        String(msg.id) === String(newMsg.id)
                            ? { ...msg, ...newMsg } // Merge all new fields
                            : msg
                    ));
                }

                // 2. Tratamento de INSERT (Nova Mensagem)
                if (eventType === 'INSERT') {
                    // Só adiciona se pertencer a ESTA conversa
                    const isForThisChat = newMsg.conversation_id === conversationId;

                    if (isForThisChat) {
                        setMessages((prev) => {
                            // Deduplicação com conversão para String
                            if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;

                            // Optimistic UI check
                            if (user && newMsg.sender_id === user.id) return prev;

                            return [...prev, {
                                id: newMsg.id,
                                senderId: newMsg.sender_id,
                                text: newMsg.text,
                                timestamp: newMsg.created_at,
                                author: '',
                                avatar: '',
                                mediaUrl: newMsg.media_url,
                                mediaType: newMsg.media_type,
                                status: newMsg.status || 'sent'
                            }];
                        });
                    }
                }
            })
            .subscribe((status) => {
                console.log("📡 STATUS CONEXÃO REALTIME:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, user]);

    return { messages, loading, setMessages };
}
