"use client";

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Event } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GoogleMapComponentProps {
    events: Event[];
    singleEvent?: boolean;
}

function MapBounds({ events }: { events: Event[] }) {
    const map = useMap();

    useEffect(() => {
        if (events.length > 0) {
            const validEvents = events.filter(
                (e) => typeof e.latitude === 'number' && typeof e.longitude === 'number'
            );

            if (validEvents.length === 1) {
                map.setView([validEvents[0].latitude!, validEvents[0].longitude!], 15);
            } else if (validEvents.length > 1) {
                const bounds = L.latLngBounds(
                    validEvents.map((e) => [e.latitude!, e.longitude!])
                );
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [events, map]);

    return null;
}

function LocateButton() {
    const map = useMap();

    const handleLocate = () => {
        map.locate({ setView: true, maxZoom: 14 });
    };

    return (
        <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg z-[1000]"
            onClick={handleLocate}
            title="Perto de mim"
        >
            <Crosshair className="w-5 h-5" />
        </Button>
    );
}

export function GoogleMapComponent({ events, singleEvent = false }: GoogleMapComponentProps) {
    const defaultCenter: [number, number] = [-23.550520, -46.633308];
    const [isMounted, setIsMounted] = useState(false);
    const [mapKey] = useState(() => `map-${Date.now()}`);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Carregando mapa...</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                key={mapKey}
                center={defaultCenter}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
                className="rounded-lg"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBounds events={events} />

                {events.map((event) =>
                    typeof event.latitude === 'number' && typeof event.longitude === 'number' ? (
                        <Marker key={event.id} position={[event.latitude, event.longitude]}>
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                                    <p className="text-xs text-gray-600 mb-2">{event.locationName}</p>
                                    <Link
                                        href={`/events/${event.id}`}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Ver detalhes
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                )}

                {!singleEvent && <LocateButton />}
            </MapContainer>
        </div>
    );
}
