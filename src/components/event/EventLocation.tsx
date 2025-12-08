"use client";

import { ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/lib/types';

const GoogleMapComponent = dynamic(() => import('@/components/GoogleMapComponent').then(mod => mod.GoogleMapComponent), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-lg" />,
});

interface EventLocationProps {
    event: Event;
}

export function EventLocation({ event }: EventLocationProps) {
    return (
        <div className="space-y-3">
            <h2 className="text-xl font-headline font-semibold text-[hsl(var(--page-primary))]">Localização</h2>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{event.location}</span>
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    Ver no mapa
                </a>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden border border-border/20">
                {typeof event.latitude === 'number' && typeof event.longitude === 'number' ? (
                    <GoogleMapComponent events={[event]} singleEvent={true} />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                        Localização não disponível
                    </div>
                )}
            </div>
        </div>
    );
}
