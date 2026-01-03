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
    markerVariant?: 'pin' | 'bubble';
    onEventSelect?: (event: Event) => void;
}

export function InteractiveMap({ events, zoom = 13, className, singleEvent = false, markerVariant = 'pin', onEventSelect }: InteractiveMapProps) {
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
                            anchor={markerVariant === 'bubble' ? 'center' : 'bottom'}
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                if (onEventSelect) {
                                    onEventSelect(event);
                                } else if (!singleEvent) {
                                    setPopupInfo(event);
                                }
                            }}
                        >
                            {markerVariant === 'bubble' ? (
                                <div className="group relative cursor-pointer transform transition-all duration-300 hover:scale-110 hover:z-50">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg bg-background relative z-10 transition-transform group-hover:scale-105">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={event.image_url || event.image || '/placeholder-event.jpg'}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60';
                                            }}
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border border-white z-20 shadow-sm">
                                        <MapPin size={12} className="text-primary-foreground" />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative cursor-pointer transition-transform hover:scale-110">
                                    <MapPin size={40} className="text-background drop-shadow-lg" fill="hsl(var(--background))" strokeWidth={1} />
                                    <MapPin size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%]" style={{ color: primaryColor }} fill={primaryColor} strokeWidth={1.5} stroke="hsl(var(--background))" />
                                </div>
                            )}
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

