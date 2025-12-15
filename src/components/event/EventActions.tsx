"use client";

import { UserCheck, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShareButton } from '@/components/ShareButton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    onBuyTicket?: () => void;
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
    onBuyTicket
}: EventActionsProps) {
    const isPaid = price > 0;
    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(price);

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
                            Comprar - {formattedPrice}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Comprar Ingresso</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você será redirecionado para o pagamento de {formattedPrice}.
                                <br />
                                (Simulação: O pagamento será aprovado automaticamente em instantes)
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={onBuyTicket}>Pagar Agora</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
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
