"use client";

import 'leaflet/dist/leaflet.css';
import { type Event } from '@/lib/types';
import L from 'leaflet';
import { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import ReactDOMServer from 'react-dom/server';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';


const createCustomIcon = (color: string) => {
    const markerHtml = ReactDOMServer.renderToString(
        <div className="relative cursor-pointer transition-transform hover:scale-110">
            <MapPin size={40} className="text-background drop-shadow-lg" fill="hsl(var(--background))" strokeWidth={1} />
            <MapPin size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%]" style={{ color }} fill={color} strokeWidth={1.5} stroke="hsl(var(--background))" />
        </div>
    );

    return L.divIcon({
        html: markerHtml,
        className: 'bg-transparent border-none',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
};


interface InteractiveMapProps {
    events: Event[];
    zoom?: number;
    className?: string;
    singleEvent?: boolean;
}

export function InteractiveMap({ events, zoom = 13, className, singleEvent = false }: InteractiveMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const router = useRouter();

    const defaultCenter = useMemo(() => ({ lat: -23.5505, lng: -46.6333 }), []); // São Paulo

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: zoom,
                scrollWheelZoom: !singleEvent,
                zoomControl: !singleEvent,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            }).addTo(map);

            if (singleEvent) {
                map.dragging.disable();
                map.touchZoom.disable();
                map.doubleClickZoom.disable();
                map.boxZoom.disable();
                map.keyboard.disable();
            }

            mapInstanceRef.current = map;
            markersLayerRef.current = L.layerGroup().addTo(map);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update markers and view when events change
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersLayer = markersLayerRef.current;
        if (!map || !markersLayer) return;

        // Clear existing markers
        markersLayer.clearLayers();

        const validEvents = events.filter(e => typeof e.latitude === 'number' && typeof e.longitude === 'number');

        if (validEvents.length > 0) {
            validEvents.forEach(event => {
                const primaryColor = event.primaryColor ? `hsl(${event.primaryColor})` : 'hsl(var(--primary))';
                const customIcon = createCustomIcon(primaryColor);

                const marker = L.marker([event.latitude!, event.longitude!], { icon: customIcon });

                if (!singleEvent) {
                    const popupContent = document.createElement('div');
                    popupContent.className = 'w-48 p-0 m-0 font-sans';
                    popupContent.innerHTML = `
                        <h3 class="font-bold text-base mb-1 text-foreground">${event.title}</h3>
                        <p class="text-xs text-muted-foreground mb-2">${event.locationName}</p>
                    `;

                    const button = document.createElement('button');
                    button.innerHTML = "Ver Detalhes";
                    button.className = 'w-full text-center bg-primary text-primary-foreground text-sm font-medium py-2 px-4 rounded-md hover:bg-primary/90 no-underline';
                    button.onclick = () => router.push(`/events/${event.id}`);

                    popupContent.appendChild(button);

                    marker.bindPopup(popupContent, {
                        className: 'custom-leaflet-popup'
                    });
                }
                markersLayer.addLayer(marker);
            });

            if (!singleEvent) {
                const bounds = L.latLngBounds(validEvents.map(e => [e.latitude!, e.longitude!]));
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                }
            } else {
                map.setView([validEvents[0].latitude!, validEvents[0].longitude!], 15);
            }
        } else if (!singleEvent) {
            map.setView(defaultCenter, zoom);
        }

    }, [events, singleEvent, router, defaultCenter, zoom]);


    return (
        <div ref={mapContainerRef} className={cn("w-full h-full z-0", className)} />
    );
}

