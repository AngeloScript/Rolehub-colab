"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { useChat } from '@/hooks/use-chat';
import { Loader2, MessageCircle } from 'lucide-react';
import { ChatList } from '@/components/chat/ChatList';

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
                <main className="px-0 md:px-4 max-w-2xl mx-auto">
                    {conversations.length > 0 ? (
                        <div className="bg-card md:rounded-lg md:border md:shadow-sm overflow-hidden min-h-[500px]">
                            <ChatList conversations={conversations} />
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                            <MessageCircle className="w-12 h-12 opacity-20" />
                            <h3 className="text-lg font-semibold text-foreground">Suas conversas</h3>
                            <p className="max-w-xs text-sm">As mensagens privadas que você trocar aparecerão aqui.</p>
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
