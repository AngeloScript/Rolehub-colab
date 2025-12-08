"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/hooks/use-chat';
import { Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MessagesPage() {
    const { conversations, loading } = useChat();

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-[80vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="pb-24 md:pb-4">
                <PageHeader title="Mensagens" subtitle="Suas conversas privadas" />
                <main className="px-4 max-w-2xl mx-auto">
                    {conversations.length > 0 ? (
                        <div className="space-y-2">
                            {conversations.map((conv) => (
                                <Link
                                    key={conv.id}
                                    href={`/messages/${conv.otherUser?.id || conv.id}`} // Use otherUser ID for cleaner URL if possible, or conv ID
                                    className="block"
                                >
                                    <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-border/50">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={conv.otherUser?.avatar} />
                                            <AvatarFallback>{conv.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-semibold truncate">{conv.otherUser?.name || 'Usuário desconhecido'}</h3>
                                                {conv.lastMessageTimestamp && (
                                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                                        {formatDistanceToNow(new Date(conv.lastMessageTimestamp), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {conv.lastMessage || 'Inicie a conversa...'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                            <MessageCircle className="w-12 h-12" />
                            <h3 className="text-lg font-semibold text-foreground">Nenhuma mensagem ainda</h3>
                            <p className="max-w-xs">Suas conversas privadas aparecerão aqui.</p>
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
