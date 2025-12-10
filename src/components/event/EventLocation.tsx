"use client";

import { ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/lib/types';

const MapComponent = dynamic(() => import('@/components/MapComponent').then(mod => mod.MapComponent), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-lg" />,
});

interface EventLocationProps {
    event: Event;
}

export function EventLocation({ event }: EventLocationProps) {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        typeof event.latitude === 'number' && typeof event.longitude === 'number'
            ? { lat: event.latitude, lng: event.longitude }
            : null
    );
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    useEffect(() => {
        // If we already have coords (from props or previous fetch), don't fetch again unless event changes and props are invalid
        const hasValidProps = typeof event.latitude === 'number' && typeof event.longitude === 'number';

        if (hasValidProps) {
            setCoords({ lat: event.latitude, lng: event.longitude });
            return;
        }

        if (!hasValidProps && event.location) {
            setIsLoadingLocation(true);
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(event.location)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                    }
                })
                .catch(err => console.error("Geocoding error", err))
                .finally(() => setIsLoadingLocation(false));
        }
    }, [event.latitude, event.longitude, event.location]);

    const eventWithCoords = coords ? { ...event, latitude: coords.lat, longitude: coords.lng } : event;

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
                {coords ? (
                    <MapComponent events={[eventWithCoords]} singleEvent={true} />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                        {isLoadingLocation ? (
                            <div className="flex flex-col items-center gap-2">
                                <Skeleton className="w-8 h-8 rounded-full animate-spin border-2 border-primary border-t-transparent" />
                                <span>Buscando localização...</span>
                            </div>
                        ) : (
                            "Localização não disponível"
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
