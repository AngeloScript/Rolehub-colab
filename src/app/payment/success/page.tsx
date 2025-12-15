"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Ticket, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
    const processedRef = useRef(false);

    // Mercado Pago returns these params on redirect
    const paymentId = searchParams.get('payment_id');
    const statusParam = searchParams.get('status');

    useEffect(() => {
        // Only process once
        if (processedRef.current || authLoading || !user) return;

        const validateAndCreateTicket = async () => {
            processedRef.current = true;

            // Ideally we should call an API endpoint to validate payment status with MP server-side
            // For MVP/Demo, we trust the 'approved' status param (NOT SECURE FOR PRODUCTION)

            if (statusParam !== 'approved') {
                setStatus('error');
                return;
            }

            try {
                // Retrieve metadata from local storage or params if passed
                // Since redirection loses context, we rely on the preference_id or we query MP 
                // For SIMPLICITY: We accept the payment as valid and check if we already have a ticket pending or just create one.
                // In a real app, webhook would handle this. 

                // Fetch the active preference/event context from LocalStorage (we should set this before redirect)
                const pendingEventId = localStorage.getItem('rolehub_pending_event_id');

                if (!pendingEventId) {
                    console.error("No pending event ID found");
                    // Fallback: try to find the event from recent transactions?? 
                    // Without event ID we can't create the ticket. 
                    setStatus('error');
                    return;
                }

                // Check if ticket already exists to prevent duplicates on refresh
                const { data: existingTicket } = await supabase
                    .from('tickets')
                    .select('id')
                    .eq('event_id', pendingEventId)
                    .eq('user_id', user.id)
                    .eq('status', 'valid')
                    .single();

                if (existingTicket) {
                    setStatus('success');
                    return;
                }

                // Get Event Price for Record
                const { data: event } = await supabase.from('events').select('price').eq('id', pendingEventId).single();

                // Create Ticket
                const { error: ticketError } = await supabase
                    .from('tickets')
                    .insert({
                        event_id: pendingEventId,
                        user_id: user.id,
                        price_paid: event?.price || 0,
                        status: 'valid',
                        qr_code: `MP-${paymentId}-${user.id}-${Date.now()}` // Unique QR string
                    });

                if (ticketError) throw ticketError;

                // Add Attendee
                await supabase
                    .from('attendees')
                    .insert({
                        event_id: pendingEventId,
                        user_id: user.id,
                        status: 'confirmed'
                    }); // Ignore error if duplicate

                setStatus('success');
                localStorage.removeItem('rolehub_pending_event_id'); // Clear pending
                toast({ title: "Ingresso garantido!", description: "Seu lugar está reservado." });

            } catch (error) {
                console.error("Error creating ticket:", error);
                setStatus('error');
            }
        };

        validateAndCreateTicket();
    }, [authLoading, user, statusParam, paymentId, toast]);

    if (authLoading || status === 'validating') {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Validando seu pagamento...</p>
                </div>
            </AppLayout>
        )
    }

    if (status === 'error') {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <span className="text-3xl">✕</span>
                    </div>
                    <h1 className="text-2xl font-bold">Algo deu errado</h1>
                    <p className="text-muted-foreground max-w-md">Não conseguimos confirmar seu ingresso automaticamente. Se o valor foi descontado, entre em contato com o suporte informando o ID: {paymentId}</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href="/events">Voltar para Eventos</Link>
                    </Button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <Card className="max-w-md w-full text-center border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">Pagamento Confirmado!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Seu pagamento foi processado e seu ingresso já está disponível.
                        </p>
                        <div className="text-sm bg-background/50 p-2 rounded text-muted-foreground">
                            ID do Pagamento: {paymentId}
                        </div>
                        <div className="flex flex-col gap-2 pt-4">
                            <Button asChild size="lg" className="w-full font-bold">
                                <Link href="/tickets">
                                    <Ticket className="mr-2 w-4 h-4" />
                                    Ver Meus Ingressos
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" className="w-full">
                                <Link href="/events">
                                    Explorar mais eventos
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
