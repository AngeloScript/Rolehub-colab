"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useChat, useMessages } from '@/hooks/use-chat';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { User, Message } from '@/lib/types';
import Link from 'next/link';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { userData: authUser, loading: authLoading } = useAuth();
    const { getOrCreateConversation } = useChat();
    const { markConversationAsRead } = useUnreadMessages();
    const { toast } = useToast();

    // Next.js 15 / Safe params access
    const recipientId = params?.id ? String(params.id) : null;

    // States
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Messages hook
    const { messages, setMessages } = useMessages(conversationId || '');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isActive = true;

        async function loadData() {
            try {
                // FORCE Loading start
                setIsLoadingUser(true);
                console.log("1. Iniciando busca para ID:", recipientId);

                if (!authUser?.id || !recipientId) {
                    console.log("Abortando load: Auth ou Recipient ausente", { authId: authUser?.id, recipientId });
                    return;
                }

                // Fetch other user details
                const { data: userSnap, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', recipientId)
                    .single();

                if (userError) throw userError;

                // Get or create conversation
                const convId = await getOrCreateConversation(recipientId);

                if (isActive) {
                    if (userSnap) {
                        setOtherUser({
                            id: userSnap.id,
                            name: userSnap.name,
                            email: userSnap.email,
                            avatar: userSnap.avatar,
                            savedEvents: [],
                            relationshipStatus: userSnap.relationship_status,
                            bio: userSnap.bio,
                            following: userSnap.following || [],
                            followers: userSnap.followers || 0,
                            checkIns: userSnap.check_ins || 0,
                            isMock: false
                        } as User);
                    }

                    setConversationId(convId);
                    if (convId) {
                        markConversationAsRead(convId);
                    }
                    console.log("2. Dados recebidos com sucesso");
                }

            } catch (error) {
                console.error("3. ERRO CRÍTICO no Load:", error);
                if (isActive) {
                    toast({
                        variant: "destructive",
                        title: "Erro",
                        description: "Não foi possível carregar o chat."
                    });
                }
            } finally {
                if (isActive) {
                    console.log("4. Finalizando Loading (Finally)");
                    setIsLoadingUser(false); // <--- ISSO DESTRAVA A TELA
                }
            }
        }

        loadData();

        return () => {
            isActive = false;
        };
    }, [authUser, recipientId, getOrCreateConversation, markConversationAsRead, toast]);

    useEffect(() => {
        if (messages?.length > 0) {
            const timeoutId = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [messages]);

    useEffect(() => {
        if (!conversationId || !markConversationAsRead) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && document.hasFocus()) {
                markConversationAsRead(conversationId);
            }
        };

        // Mark immediately if visible
        handleVisibilityChange();

        // Listen for visibility/focus changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [conversationId, markConversationAsRead, messages]); // Re-run when new messages arrive

    const handleSendMessage = async (text: string, mediaUrl?: string, mediaType?: 'image' | 'audio' | 'video') => {
        if (!authUser?.id || !recipientId) return;

        const participants = [authUser.id, recipientId].sort();
        const deterministicConvId = participants.join('_');

        if (!text.trim() && !mediaUrl) return;

        setIsSending(true);

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            senderId: authUser.id,
            author: authUser.name || '',
            avatar: authUser.avatar || '',
            text: text,
            timestamp: new Date().toISOString(),
            status: 'sending',
            mediaUrl,
            mediaType
        };

        setMessages(prev => [...(prev || []), optimisticMessage]);

        try {
            const { error: convError } = await supabase.from('conversations').upsert({
                id: deterministicConvId,
                participants: participants,
                last_message: text || (mediaType ? '📷 Mídia' : ''),
                last_message_timestamp: new Date().toISOString()
            }, { onConflict: 'id' });

            if (convError) throw convError;

            const { error } = await supabase.from('direct_messages').insert({
                conversation_id: deterministicConvId,
                sender_id: authUser.id,
                text: text,
                media_url: mediaUrl,
                media_type: mediaType
            });

            if (error) throw error;

            if (recipientId && authUser.name) {
                const notifText = mediaType ? `📷 <strong>${authUser.name}</strong> enviou mídia.` : `<strong>${authUser.name}</strong> enviou uma mensagem.`;
                supabase.from('notifications').insert({
                    user_id: recipientId,
                    type: 'event_comment',
                    text: notifText,
                    link: `/messages/${authUser.id}`,
                    read: false,
                    sender_name: authUser.name,
                    sender_avatar: authUser.avatar || ''
                }).then(({ error }) => {
                    if (error) console.warn("Erro ao enviar notificação:", error);
                });
            }

            setMessages(prev => prev?.map(msg => msg.id === tempId ? { ...msg, status: 'sent' } : msg) || []);

            if (conversationId !== deterministicConvId) {
                setConversationId(deterministicConvId);
            }

        } catch (error: unknown) {
            console.error("ERRO CRÍTICO NO ENVIO:", error);
            setMessages(prev => prev?.filter(msg => msg.id !== tempId) || []);
            toast({
                variant: "destructive",
                title: "Não foi possível enviar",
                description: "Ocorreu um erro de conexão. Tente novamente."
            });
        } finally {
            setIsSending(false);
        }
    };

    // Safety Log
    console.log("Renderizando Chat...", {
        messagesCount: messages?.length,
        recipientId,
        hasAuth: !!authUser,
        authLoading: authLoading,
        hasOtherUser: !!otherUser,
        loadingUser: isLoadingUser
    });

    // 1. Auth Loading (Global)
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // 2. Not Authenticated
    if (!authUser) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
                <p className="text-muted-foreground">Você precisa estar logado para ver esta conversa.</p>
                <Button onClick={() => router.push('/login')}>Fazer Login</Button>
            </div>
        );
    }

    // 3. Loading Chat Data
    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // 4. Missing Data (Recipient/Other User)
    if (!recipientId || !otherUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
                <p>Usuário não encontrado ou erro ao carregar.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#e5ddd5] dark:bg-background/95 relative">
            {/* WhatsApp Doodle Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none bg-chat-pattern" />

            {/* Header */}
            <header className="flex items-center gap-3 p-3 bg-card border-b border-border/50 sticky top-0 z-10 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Link href={`/profile/${otherUser?.id}`} className="flex items-center gap-3 flex-1 overflow-hidden">
                    <Avatar className="w-10 h-10 border">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <h2 className="font-semibold text-base truncate leading-tight">{otherUser?.name || 'Usuário'}</h2>
                        <p className="text-xs text-muted-foreground truncate">Toque para ver o perfil</p>
                    </div>
                </Link>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 z-10 space-y-2">
                {messages?.length > 0 ? (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMe={msg.senderId === authUser?.id}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded-lg">
                            Nenhuma mensagem ainda. Diga olá! 👋
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="z-10 bg-card">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isSending} />
            </footer>
        </div>
    );
}
