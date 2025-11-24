"use client";

import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Heart, MessageSquare, BellOff, Loader2, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { type Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'event_comment':
            return <MessageSquare className="w-5 h-5 text-secondary" />;
        case 'event_saved':
            return <Heart className="w-5 h-5 text-primary" />;
        case 'new_follower':
            return <Heart className="w-5 h-5 text-red-500 fill-current" />;
        case 'event_confirmation':
            return <Zap className="w-5 h-5 text-yellow-500" />;
        default:
            return <Zap className="w-5 h-5 text-yellow-500" />;
    }
}

const formatNotificationTime = (notif: Notification) => {
    if (notif.timestamp) {
        try {
            return formatDistanceToNow(parseISO(notif.timestamp), { addSuffix: true, locale: ptBR });
        } catch (e) {
            return notif.time;
        }
    }
    return notif.time;
}

export default function NotificationsPage() {
    const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
    const router = useRouter();

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="pb-24 md:pb-4 flex items-center justify-center h-[80vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="pb-24 md:pb-4">
                <PageHeader title="Notificações" subtitle="Fique por dentro de tudo" />
                <main className="px-4 max-w-2xl mx-auto">
                    {notifications.length > 0 && (
                        <div className="flex justify-end mb-4">
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-primary">
                                <CheckCheck className="w-4 h-4 mr-1" />
                                Marcar todas como lidas
                            </Button>
                        </div>
                    )}

                    {notifications.length > 0 ? (
                        <div className="space-y-2">
                            {notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "flex items-start gap-4 p-3 rounded-lg transition-colors cursor-pointer",
                                        !notif.read ? 'bg-card/80 border-l-4 border-primary' : 'bg-transparent hover:bg-card/50',
                                    )}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="mt-1">
                                        <NotificationIcon type={notif.type} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            {notif.user && (
                                                <Avatar className="w-6 h-6">
                                                    <AvatarImage src={notif.user.avatar} />
                                                    <AvatarFallback>{notif.user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: notif.text }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{formatNotificationTime(notif)}</p>
                                    </div>
                                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                            <BellOff className="w-12 h-12" />
                            <h3 className="text-lg font-semibold text-foreground">Nenhuma notificação por aqui</h3>
                            <p className="max-w-xs">Quando algo importante acontecer no app, avisaremos você.</p>
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
