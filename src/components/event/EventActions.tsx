import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EventLot } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/components/ShareButton";

interface EventActionsProps {
    eventId: string;
    eventTitle: string;
    eventDescription?: string;
    isGoing: boolean;
    isConfirming: boolean;
    isSaved: boolean;
    isSaving: boolean;
    onToggleGoing: () => void;
    onToggleSave: () => void;
    price?: number;
    currency?: string;
    onBuyTicket?: (lotId?: string, price?: number, lotName?: string) => void;
    requestStatus?: 'idle' | 'pending' | 'confirmed' | 'rejected' | null;
}

export function EventActions({
    eventId,
    eventTitle,
    eventDescription,
    isGoing,
    isConfirming,
    isSaved,
    isSaving,
    onToggleGoing,
    onToggleSave,
    price = 0,
    currency = 'BRL',
    onBuyTicket,
    requestStatus
}: EventActionsProps) {
    const isPaid = price > 0;
    const [lots, setLots] = useState<EventLot[]>([]);
    const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
    const [loadingLots, setLoadingLots] = useState(false);

    useEffect(() => {
        if (isPaid) {
            setLoadingLots(true);
            const fetchLots = async () => {
                const { data } = await supabase
                    .from('event_lots')
                    .select('*')
                    .eq('event_id', eventId)
                    .eq('active', true)
                    .order('price', { ascending: true }); // Order by price

                if (data) {
                    // Data from DB matches EventLot type perfectly since we use snake_case in DB and Type
                    // Just casting or direct assignment if types match (Supabase types might differ slightly, so let's map safely)
                    const mappedLots: EventLot[] = data.map(l => ({
                        id: l.id,
                        event_id: l.event_id,
                        name: l.name,
                        price: l.price,
                        quantity: l.quantity,
                        start_date: l.start_date,
                        active: l.active,
                        end_date: l.end_date
                    }));
                    setLots(mappedLots);
                    if (mappedLots.length > 0) setSelectedLotId(mappedLots[0].id);
                }
                setLoadingLots(false);
            };
            fetchLots();
        }
    }, [eventId, isPaid]);

    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(price);

    const handleBuyClick = () => {
        if (!onBuyTicket) return;

        if (lots.length > 0 && selectedLotId) {
            const selectedLot = lots.find(l => l.id === selectedLotId);
            if (selectedLot) {
                onBuyTicket(selectedLot.id, selectedLot.price, selectedLot.name);
            }
        } else {
            // Fallback for single price legacy events
            onBuyTicket(undefined, price, 'Ingresso Geral');
        }
    };

    const hasLots = lots.length > 0;
    const selectedLot = lots.find(l => l.id === selectedLotId);
    const currentPriceDisplay = hasLots && selectedLot
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(selectedLot.price)
        : formattedPrice;

    const renderMainButton = () => {
        if (isPaid && !isGoing) {
            return (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="default"
                            size="lg"
                            className="flex-1 font-bold"
                            style={{ '--primary': 'var(--page-primary)' } as React.CSSProperties}
                            disabled={isConfirming}
                        >
                            {isConfirming ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UserCheck className="w-5 h-5 mr-2" />}
                            {hasLots ? 'Comprar Ingresso' : `Comprar - ${formattedPrice}`}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Comprar Ingresso</AlertDialogTitle>
                            <AlertDialogDescription>
                                {hasLots ? (
                                    <div className="py-4 space-y-4">
                                        <p className="font-semibold text-foreground">Selecione uma opção:</p>
                                        <RadioGroup value={selectedLotId || ''} onValueChange={setSelectedLotId} className="space-y-3">
                                            {lots.map(lot => (
                                                <div key={lot.id} className={cn(
                                                    "flex items-center justify-between space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors",
                                                    selectedLotId === lot.id ? "border-primary bg-accent/20" : "border-border"
                                                )}
                                                    onClick={() => setSelectedLotId(lot.id)}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value={lot.id} id={lot.id} />
                                                        <div className="grid gap-1.5 leading-none">
                                                            <Label htmlFor={lot.id} className="font-bold cursor-pointer">
                                                                {lot.name}
                                                            </Label>
                                                            <span className="text-xs text-muted-foreground">
                                                                {lot.quantity > 0 ? `${lot.quantity} disponíveis` : 'Esgotado'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-lg">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(lot.price)}
                                                    </div>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                ) : (
                                    <p>Você será redirecionado para o pagamento de {formattedPrice}.</p>
                                )}
                                <div className="text-xs text-muted-foreground mt-2">
                                    (Simulação: O pagamento será aprovado automaticamente em instantes)
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBuyClick} disabled={hasLots && !selectedLotId}>
                                {hasLots ? `Pagar ${currentPriceDisplay}` : 'Pagar Agora'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        }

        // Private Event - Pending Request
        if (requestStatus === 'pending') {
            return (
                <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1 cursor-default text-muted-foreground bg-muted"
                    disabled
                >
                    <UserCheck className="w-5 h-5 mr-2" />
                    Solicitado
                </Button>
            );
        }

        return (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant={isGoing ? 'default' : 'outline'}
                        size="lg"
                        className="flex-1"
                        style={{ '--primary': 'var(--page-primary)' } as React.CSSProperties}
                        disabled={isConfirming}
                    >
                        {isConfirming ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UserCheck className="w-5 h-5 mr-2" />}
                        {isGoing ? 'Ingresso Garantido' : 'Eu Vou!'}
                    </Button>
                </AlertDialogTrigger>
                {isGoing ? (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{isPaid ? 'Ver Ingresso ou Cancelar?' : 'Cancelar presença?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {isPaid
                                    ? "Você já possui um ingresso para este evento. Para reembolso, entre em contato com o suporte."
                                    : "Você tem certeza que não quer mais ir ao evento?"}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            {!isPaid && <AlertDialogAction onClick={onToggleGoing}>Cancelar Presença</AlertDialogAction>}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                ) : (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar presença?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Ao confirmar você poderá participar do chat do rolê e seu perfil ficará visível para outros participantes.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={onToggleGoing}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                )}
            </AlertDialog>
        );
    };

    if (loadingLots && isPaid) {
        return <div className="w-full h-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="flex items-center gap-2 w-full md:w-auto">
            {renderMainButton()}

            <Button
                variant="outline"
                size="icon"
                className={cn('transition-all duration-300 w-12', isSaved ? 'border-[hsl(var(--page-primary))] text-[hsl(var(--page-primary))] bg-[hsl(var(--page-primary)/0.1)]' : 'text-muted-foreground')}
                onClick={onToggleSave}
                disabled={isSaving}
                aria-label={isSaved ? "Remover dos salvos" : "Salvar evento"}
            >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={cn('w-5 h-5', isSaved && 'fill-[hsl(var(--page-primary))]')} />}
            </Button>

            <ShareButton
                eventId={eventId}
                eventTitle={eventTitle}
                eventDescription={eventDescription}
            />
        </div>
    );
}
