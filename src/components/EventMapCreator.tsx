
"use client";

import { useState, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, MapRef, MarkerDragEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, MapPin } from 'lucide-react';
import { MAPBOX_TOKEN } from '@/lib/mapbox-config';
import mapboxgl from 'mapbox-gl';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface EventMapCreatorProps {
  onLocationChange: (location: Location) => void;
  initialAddress?: string | null;
}

export default function EventMapCreator({ onLocationChange, initialAddress }: EventMapCreatorProps) {
  const mapRef = useRef<MapRef>(null);

  const [address, setAddress] = useState(initialAddress || '');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number, lng: number } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -47.879,
    latitude: -15.788,
    zoom: 4
  });

  const updateLocation = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        const displayAddress = data.display_name || 'Localização ajustada manualmente';
        setAddress(displayAddress);
        onLocationChange({
          lat,
          lng,
          address: displayAddress
        });
      }).catch(error => {
        console.error('Erro na geocodificação reversa:', error);
        onLocationChange({
          lat,
          lng,
          address: 'Localização ajustada manualmente'
        });
      });
  }, [onLocationChange]);

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
    const { lat, lng } = event.lngLat;
    updateLocation(lat, lng);
  }, [updateLocation]);

  // Handle map click
  const handleMapClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
    const { lat, lng } = event.lngLat;
    updateLocation(lat, lng);
  }, [updateLocation]);

  // Geocodificação: Converte endereço em coordenadas
  const geocodeAddress = useCallback(async (addr: string) => {
    if (!addr.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (mapRef.current) {
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
        } else {
          setViewState(prev => ({ ...prev, longitude, latitude, zoom: 15 }));
        }

        setMarkerPosition({ lat: latitude, lng: longitude });

        onLocationChange({
          lat: latitude,
          lng: longitude,
          address: display_name
        });
      } else {
        alert("Endereço não encontrado. Por favor, tente um endereço mais específico.");
      }
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      alert("Ocorreu um erro ao buscar o endereço.");
    }
  }, [onLocationChange]);

  // Handle search on Enter key press  // Handle search on Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress(address);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite o endereço completo e pressione Enter"
          className="flex-1"
        />
        <Button
          onClick={() => geocodeAddress(address)}
          type="button"
          size="icon"
          aria-label="Buscar endereço"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>

      <div className="h-72 w-full rounded-lg overflow-hidden border relative">
        <Map
          {...viewState}
          ref={mapRef}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-left" />
          {markerPosition && (
            <Marker
              longitude={markerPosition.lng}
              latitude={markerPosition.lat}
              draggable
              onDragEnd={handleMarkerDragEnd}
              anchor="bottom"
            >
              <MapPin className="text-red-500 w-8 h-8 -translate-y-1/2 drop-shadow-md" fill="currentColor" />
            </Marker>
          )}
        </Map>
      </div>

      {markerPosition && (
        <div className="text-xs text-muted-foreground">
          <strong>Coordenadas:</strong> {markerPosition.lat.toFixed(5)}, {markerPosition.lng.toFixed(5)}
          <br />
          <span className="italic">Você pode arrastar o pino ou clicar no mapa para ajustar a localização exata.</span>
        </div>
      )}
    </div>
  );
}
