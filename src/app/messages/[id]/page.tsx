"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useChat, useMessages } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { userData: authUser } = useAuth();
    const { getOrCreateConversation, sendMessage } = useChat();

    const otherUserId = typeof params.id === 'string' ? params.id : '';
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const { messages, setMessages } = useMessages(conversationId || '');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            if (authUser && otherUserId) {
                // Fetch other user details
                const { data: userSnap } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', otherUserId)
                    .single();

                if (userSnap) {
                    setOtherUser({
                        id: userSnap.id,
                        name: userSnap.name,
                        email: userSnap.email,
                        avatar: userSnap.avatar,
                        savedEvents: userSnap.saved_events || [],
                        relationshipStatus: userSnap.relationship_status,
                        bio: userSnap.bio,
                        following: userSnap.following || [],
                        followers: userSnap.followers || 0,
                        checkIns: userSnap.check_ins || 0,
                        isMock: false
                    });
                }

                // Get or create conversation
                const convId = await getOrCreateConversation(otherUserId);
                setConversationId(convId);
            }
        };
        initChat();
    }, [authUser, otherUserId, getOrCreateConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !conversationId || !authUser) return;

        setIsSending(true);

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            senderId: authUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
            author: authUser.name || '',
            avatar: authUser.avatar || ''
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        try {
            await sendMessage(conversationId, optimisticMessage.text);

            // Notification for the other user
            if (otherUser) {
                await supabase.from('notifications').insert({
                    user_id: otherUser.id,
                    type: 'event_comment', // Using 'event_comment' as a generic message type or we should add 'message' type to DB enum if possible, but let's stick to existing
                    // Actually, let's check types.ts. It has: 'new_follower' | 'event_comment' | 'event_saved' | 'event_reminder' | 'event_confirmation'
                    // We might need to handle this carefully. Use 'event_comment' with specific text for now to avoid DB constraints errors or add a new type.
                    // Ideally we should add 'new_message' to enum, but I can't change DB enum easily here without migration.
                    // Let's use 'event_comment' but format it as message.
                    text: `<strong>${authUser.name}</strong> te enviou uma mensagem.`,
                    link: `/messages/${authUser.id}`,
                    read: false,
                    sender_name: authUser.name || 'Alguém',
                    sender_avatar: authUser.avatar || ''
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        } finally {
            setIsSending(false);
        }
    };

    if (!authUser || !conversationId || !otherUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={otherUser.avatar} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-sm">{otherUser.name}</h2>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId === authUser.id;
                    return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                                isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                            )}>
                                <p>{msg.text}</p>
                                <p className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 border-t border-border/50 bg-background">
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-2xl mx-auto">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </footer>
        </div>
    );
}
