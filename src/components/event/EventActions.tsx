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
}: EventActionsProps) {
    return (
        <div className="flex items-center gap-2 w-full md:w-auto">
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
                        {isGoing ? 'Confirmado' : 'Eu Vou!'}
                    </Button>
                </AlertDialogTrigger>
                {isGoing ? (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar presença?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você tem certeza que não quer mais ir ao evento?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Ficar</AlertDialogCancel>
                            <AlertDialogAction onClick={onToggleGoing}>Cancelar Presença</AlertDialogAction>
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
