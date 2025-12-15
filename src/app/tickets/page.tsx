"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Ticket } from '@/lib/types'; // Make sure Ticket is exported from types
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Ticket as TicketIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyTicketsPage() {
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchTickets = async () => {
            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*, event:events(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formattedTickets: Ticket[] = data.map((t: any) => ({
                        id: t.id,
                        eventId: t.event_id,
                        userId: t.user_id,
                        status: t.status,
                        qrCode: t.qr_code,
                        pricePaid: t.price_paid,
                        createdAt: t.created_at,
                        event: {
                            ...t.event,
                            date: t.event.date, // Ensure format matches
                        }
                    }));
                    setTickets(formattedTickets);
                }
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [user, authLoading]);

    if (loading || authLoading) {
        return (
            <AppLayout>
                <div className="pb-24 md:pb-4 space-y-4 px-4 max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </AppLayout>
        )
    }

    if (!user) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                    <TicketIcon className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Faça login para ver seus ingressos</h2>
                    <Button asChild>
                        <Link href="/login">Entrar</Link>
                    </Button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="pb-24 md:pb-4">
                <PageHeader title="Meus Ingressos" subtitle="Seus passes para os melhores rolês" />

                <main className="px-4 max-w-4xl mx-auto">
                    {tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <TicketIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold">Nenhum ingresso encontrado</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                                Você ainda não comprou ingressos para nenhum evento. Explore os rolês disponíveis!
                            </p>
                            <Button asChild>
                                <Link href="/events">Explorar Eventos</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tickets.map((ticket) => (
                                <Card key={ticket.id} className="overflow-hidden bg-card/50 border-border/50 hover:border-border transition-colors">
                                    <CardHeader className="p-0">
                                        {ticket.event?.image_url && (
                                            <div className="h-32 w-full overflow-hidden relative">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={ticket.event.image || ticket.event.image_url}
                                                    alt={ticket.event?.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-3 left-4 right-4 z-20">
                                                    <h3 className="text-lg font-bold text-white truncate">{ticket.event?.title}</h3>
                                                </div>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                                        <div className="bg-white p-3 rounded-lg flex-shrink-0">
                                            <QRCodeSVG
                                                value={ticket.qrCode || ticket.id}
                                                size={120}
                                                level="M"
                                            />
                                        </div>
                                        <div className="space-y-3 flex-grow text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {ticket.event?.date ? format(new Date(ticket.event.date), "PPP 'às' HH:mm", { locale: ptBR }) : 'Data a definir'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate max-w-[200px]">{ticket.event?.locationName || ticket.event?.location_name || ticket.event?.location}</span>
                                            </div>
                                            <div className="pt-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'valid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    ticket.status === 'used' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {ticket.status === 'valid' ? 'Válido' : ticket.status === 'used' ? 'Utilizado' : 'Cancelado'}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/30 p-4 text-xs text-muted-foreground text-center justify-center">
                                        ID: {ticket.id.slice(0, 8)} • Apresente este QR Code na entrada
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
