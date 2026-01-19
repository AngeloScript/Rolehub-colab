"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PushNotificationManager() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast({ variant: "destructive", title: "Não suportado", description: "Seu navegador não suporta notificações." });
            return;
        }

        setLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                toast({ title: "Notificações Ativadas!", description: "Você receberá alertas sobre seus eventos." });
            } else if (result === 'denied') {
                toast({ variant: "destructive", title: "Notificações Bloqueadas", description: "Ative nas configurações do navegador para receber alertas." });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (permission === 'granted') {
        return (
            <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
                <Bell className="w-4 h-4" />
                Notificações Ativas
            </Button>
        );
    }

    return (
        <Button variant="secondary" size="sm" onClick={requestPermission} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
            Ativar Notificações
        </Button>
    );
}
