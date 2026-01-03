"use client";

import { Event } from "@/lib/types";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventDrawerProps {
    event: Event | null;
    onClose: () => void;
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
    const router = useRouter();

    if (!event) return null;

    const formattedDate = event.date_time ? format(new Date(event.date_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) :
        event.date && event.time ? `${event.date} às ${event.time}` : 'Data a definir';

    return (
        <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="rounded-t-3xl p-0 overflow-hidden bg-background border-t-0 shadow-2xl pb-6">
                <div className="relative h-48 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={event.image_url || event.image || '/placeholder-event.jpg'}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <SheetTitle className="text-white text-2xl font-bold line-clamp-2">{event.title}</SheetTitle>
                        <SheetDescription className="text-gray-300 flex items-center gap-1 mt-1">
                            <MapPin size={14} /> {event.locationName || event.location || 'Localização não informada'}
                        </SheetDescription>
                    </div>
                </div>

                <div className="px-6 py-4 space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-primary" />
                            <span>{event.participants || 0} confirmados</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            className="flex-1 font-bold text-base h-12 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90"
                            onClick={() => router.push(`/events/${event.id}`)}
                        >
                            Ver Detalhes
                        </Button>
                        {event.price ? (
                            <div className="flex flex-col items-center justify-center px-4 rounded-xl bg-secondary/20 border border-border">
                                <span className="text-xs text-muted-foreground uppercase font-bold">Valor</span>
                                <span className="font-bold text-primary">R$ {event.price}</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center px-6 rounded-xl bg-green-500/10 border border-green-500/20">
                                <span className="font-bold text-green-500">Grátis</span>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
