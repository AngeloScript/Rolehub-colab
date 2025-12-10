"use client";

import 'mapbox-gl/dist/mapbox-gl.css';
import { type Event } from '@/lib/types';
import { useEffect, useRef, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Map, { Marker, Popup, NavigationControl, MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import { Button } from './ui/button';
import { MAPBOX_TOKEN } from '@/lib/mapbox-config';

interface InteractiveMapProps {
    events: Event[];
    zoom?: number;
    className?: string;
    singleEvent?: boolean;
}

export function InteractiveMap({ events, zoom = 13, className, singleEvent = false }: InteractiveMapProps) {
    const mapRef = useRef<MapRef>(null);
    const router = useRouter();
    const [popupInfo, setPopupInfo] = useState<Event | null>(null);

    const defaultCenter = useMemo(() => ({ lat: -23.5505, lng: -46.6333 }), []); // São Paulo

    const validEvents = useMemo(() =>
        events.filter(e => typeof e.latitude === 'number' && typeof e.longitude === 'number'),
        [events]);

    const initialViewState = useMemo(() => {
        if (singleEvent && validEvents.length > 0) {
            return {
                longitude: validEvents[0].longitude!,
                latitude: validEvents[0].latitude!,
                zoom: 15
            };
        }
        return {
            longitude: defaultCenter.lng,
            latitude: defaultCenter.lat,
            zoom: zoom
        };
    }, [singleEvent, validEvents, defaultCenter, zoom]);

    // Update view when events change
    useEffect(() => {
        if (!mapRef.current) return;

        if (validEvents.length > 0) {
            if (!singleEvent) {
                const bounds = new mapboxgl.LngLatBounds();
                validEvents.forEach(e => bounds.extend([e.longitude!, e.latitude!]));

                mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
            } else {
                mapRef.current.flyTo({ center: [validEvents[0].longitude!, validEvents[0].latitude!], zoom: 15 });
            }
        }
    }, [validEvents, singleEvent]);

    return (
        <div className={cn("w-full h-full relative rounded-lg overflow-hidden", className)}>
            <Map
                ref={mapRef}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                scrollZoom={!singleEvent}
                dragPan={!singleEvent}
                doubleClickZoom={!singleEvent}
                touchZoomRotate={!singleEvent}
                boxZoom={!singleEvent}
                dragRotate={!singleEvent}
                keyboard={!singleEvent}
                reuseMaps
            >
                {!singleEvent && <NavigationControl position="bottom-right" />}

                {validEvents.map((event) => {
                    const primaryColor = event.primaryColor ? `hsl(${event.primaryColor})` : 'hsl(var(--primary))';

                    return (
                        <Marker
                            key={event.id}
                            longitude={event.longitude!}
                            latitude={event.latitude!}
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                if (!singleEvent) {
                                    setPopupInfo(event);
                                }
                            }}
                        >
                            <div className="relative cursor-pointer transition-transform hover:scale-110">
                                <MapPin size={40} className="text-background drop-shadow-lg" fill="hsl(var(--background))" strokeWidth={1} />
                                <MapPin size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%]" style={{ color: primaryColor }} fill={primaryColor} strokeWidth={1.5} stroke="hsl(var(--background))" />
                            </div>
                        </Marker>
                    );
                })}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.longitude!}
                        latitude={popupInfo.latitude!}
                        onClose={() => setPopupInfo(null)}
                        className="text-foreground"
                        closeButton={false}
                    >
                        <div className="w-48 p-2 m-0 font-sans">
                            <h3 className="font-bold text-base mb-1 text-black">{popupInfo.title}</h3>
                            <p className="text-xs text-muted-foreground mb-2 text-gray-600">{popupInfo.locationName}</p>
                            <Button
                                className="w-full text-center bg-primary text-primary-foreground text-sm font-medium py-2 px-4 rounded-md hover:bg-primary/90 no-underline h-auto"
                                onClick={() => router.push(`/events/${popupInfo.id}`)}
                            >
                                Ver Detalhes
                            </Button>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}

