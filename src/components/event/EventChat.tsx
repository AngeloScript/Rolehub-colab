"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle as MessageCircleSolid, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import type { Message } from '@/lib/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventChatProps {
    eventId: string;
    isGoing: boolean;
}

const formatRelativeTime = (isoString: string) => {
    try {
        const date = parseISO(isoString);
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
        return "agora mesmo";
    }
};

const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
        }
        return part;
    });
};

export function EventChat({ eventId, isGoing }: EventChatProps) {
    const { user: authUser, loading: authLoading } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!isGoing || !eventId || authLoading || !authUser) return;

        const fetchMessages = async () => {
            const { error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching chat:", error);
            } else {
                // Map to Message type
                // Note: We need user details. For now, let's assume we fetch them or they are in the message (denormalized in migration plan? No, I created normalized table).
                // Wait, I didn't add user_name/avatar to chat_messages table in the migration script!
                // I only added user_id.
                // I need to join with users table.

                // Let's refetch with join
                const { data: dataWithUsers, error: joinError } = await supabase
                    .from('chat_messages')
                    .select('*, user:users!user_id(*)')
                    .eq('event_id', eventId)
                    .order('created_at', { ascending: true });

                if (joinError) {
                    console.error("Error fetching chat with users:", joinError);
                } else if (dataWithUsers) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const msgs = dataWithUsers.map((msg: any) => ({
                        id: msg.id,
                        senderId: msg.user_id,
                        author: msg.user?.name || 'Usuário',
                        avatar: msg.user?.avatar,
                        text: msg.text,
                        timestamp: msg.created_at
                    }));
                    setMessages(msgs);
                }
            }
        };

        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel(`chat:${eventId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `event_id=eq.${eventId}`
            }, async (payload) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newMessages = (payload.new as any);
                // We need to fetch user details for the new message
                const { data: userData } = await supabase.from('users').select('name, avatar').eq('id', newMessages.user_id).single();

                setMessages(prev => [...prev, {
                    id: newMessages.id,
                    senderId: newMessages.user_id,
                    author: userData?.name || 'Usuário',
                    avatar: userData?.avatar,
                    text: newMessages.text,
                    timestamp: newMessages.created_at
                }]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, isGoing, authUser, authLoading]);

    const handleSendMessage = async () => {
        if (newMessage.trim() && authUser && isGoing) {
            setIsSending(true);
            try {
                const { error } = await supabase
                    .from('chat_messages')
                    .insert({
                        event_id: eventId,
                        user_id: authUser.id,
                        text: newMessage
                    });

                if (error) throw error;
                setNewMessage('');
            } catch (_error) {
                console.error("Error sending message:", _error);
            } finally {
                setIsSending(false);
            }
        }
    };

    if (!isGoing) {
        return (
            <div className="text-center p-8 bg-card/50 rounded-lg flex flex-col items-center gap-4">
                <MessageCircleSolid className="w-12 h-12 text-muted-foreground" />
                <h2 className="text-xl font-bold">Junte-se ao Chat do Rolê!</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                    Confirme sua presença no botão &quot;Eu Vou!&quot; para conversar com outros participantes em tempo real.
                </p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-card/50 rounded-lg">
                    <PartyPopper className="w-12 h-12 text-muted-foreground" />
                    <h2 className="text-xl font-bold mt-4">O chat está começando!</h2>
                    <p className="text-muted-foreground">Faça login para participar do chat.</p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <Textarea
                        placeholder="Sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-card/50 flex-grow"
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                        disabled={isSending}
                        rows={1}
                        autoFocus
                    />
                    <Button onClick={handleSendMessage} size="icon" disabled={isSending} className="flex-shrink-0 h-10 w-10" style={{ '--primary': 'var(--page-primary)' } as React.CSSProperties}>
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[60vh]">
            <div ref={scrollAreaRef} className="flex-grow overflow-y-auto space-y-4 pr-2">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", String(msg.senderId) === String(authUser?.id) ? "justify-end" : "justify-start")}>
                        {String(msg.senderId) !== String(authUser?.id) && (
                            <UserProfileDialog userId={msg.senderId}>
                                <Avatar className="w-8 h-8 cursor-pointer">
                                    <AvatarImage src={msg.avatar} alt={msg.author} />
                                    <AvatarFallback>{msg.author?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </UserProfileDialog>
                        )}
                        <div className={cn("max-w-xs md:max-w-md p-3 rounded-2xl", msg.senderId === authUser?.id ? "bg-primary text-primary-foreground rounded-br-lg" : "bg-muted rounded-bl-lg")}>
                            <p className="text-sm">{linkify(msg.text)}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">{formatRelativeTime(msg.timestamp)}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
                <Textarea
                    placeholder="Sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-card/50 flex-grow"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    disabled={isSending}
                    rows={1}
                />
                <Button onClick={handleSendMessage} size="icon" disabled={isSending} className="flex-shrink-0 h-10 w-10" style={{ '--primary': 'var(--page-primary)' } as React.CSSProperties}>
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
            </div>
        </div>
    );
}
