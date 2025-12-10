"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Marker, Popup, GeolocateControl, MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '@/lib/types';
import { MAPBOX_TOKEN } from '@/lib/mapbox-config';

interface MapComponentProps {
    events: Event[];
    singleEvent?: boolean;
}

export function MapComponent({ events, singleEvent = false }: MapComponentProps) {
    const mapRef = useRef<MapRef>(null);
    const [popupInfo, setPopupInfo] = useState<Event | null>(null);

    const validEvents = useMemo(() =>
        events.filter(e => typeof e.latitude === 'number' && typeof e.longitude === 'number'),
        [events]);

    useEffect(() => {
        if (!mapRef.current) return;

        if (validEvents.length > 0) {
            if (validEvents.length === 1) {
                mapRef.current.flyTo({ center: [validEvents[0].longitude!, validEvents[0].latitude!], zoom: 15 });
            } else {
                const bounds = new mapboxgl.LngLatBounds();
                validEvents.forEach(e => bounds.extend([e.longitude!, e.latitude!]));

                mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
            }
        }
    }, [validEvents]);

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: -46.633308,
                    latitude: -23.550520,
                    zoom: 12
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                {!singleEvent && (
                    <GeolocateControl
                        position="bottom-right"
                        positionOptions={{ enableHighAccuracy: true }}
                        trackUserLocation={true}
                    />
                )}

                {validEvents.map((event) => (
                    <Marker
                        key={event.id}
                        longitude={event.longitude!}
                        latitude={event.latitude!}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation();
                            setPopupInfo(event);
                        }}
                    >
                        {/* Default marker is fine, or customize if needed. Using default for now to be distinct from InteractiveMap if they are used differently, or I could match InteractiveMap style. 
                             The original MapComponent used the default Leaflet blue marker. 
                             React-map-gl default marker is red.
                         */}
                    </Marker>
                ))}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.longitude!}
                        latitude={popupInfo.latitude!}
                        onClose={() => setPopupInfo(null)}
                        className="text-foreground"
                    >
                        <div className="p-2">
                            <h3 className="font-bold text-sm mb-1 text-black">{popupInfo.title}</h3>
                            <p className="text-xs text-gray-600 mb-2">{popupInfo.locationName || 'Localização definida'}</p>
                            <a href={`/events/${popupInfo.id}`} className="text-xs text-blue-600 hover:underline">Ver detalhes</a>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}
