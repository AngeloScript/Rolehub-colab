
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search } from 'lucide-react';

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [address, setAddress] = useState(initialAddress || '');
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);


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
        const newPosition: [number, number] = [parseFloat(lat), parseFloat(lon)];

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(newPosition, 15);
        }

        if (markerRef.current) {
          markerRef.current.setLatLng(newPosition);
        } else if (mapInstanceRef.current) {
          markerRef.current = L.marker(newPosition, { draggable: true })
            .addTo(mapInstanceRef.current)
            .on('dragend', handleMarkerDrag);
        }

        setMarkerPosition(newPosition);
        onLocationChange({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
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

  // Handle search on Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress(address);
    }
  };

  // Efeito para geocodificar o endereço inicial ou quando ele muda a partir do "Gerar com IA"
  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      geocodeAddress(initialAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);


  // Atualiza coordenadas quando o marcador é arrastado
  const handleMarkerDrag = (e: L.LeafletEvent) => {
    const marker = e.target as L.Marker;
    const newPos = marker.getLatLng();
    const newPosition: [number, number] = [newPos.lat, newPos.lng];
    setMarkerPosition(newPosition);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
      .then(res => res.json())
      .then(data => {
        const displayAddress = data.display_name || 'Localização ajustada manualmente';
        setAddress(displayAddress);
        onLocationChange({
          lat: newPos.lat,
          lng: newPos.lng,
          address: displayAddress
        });
      }).catch(error => {
        console.error('Erro na geocodificação reversa:', error);
        onLocationChange({
          lat: newPos.lat,
          lng: newPos.lng,
          address: 'Localização ajustada manualmente'
        });
      });
  };

  // Efeito para inicializar o mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([-15.788, -47.879], 4);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);

      // Adicionar listener de clique
      mapInstanceRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
        setMarkerPosition(newPosition);

        if (markerRef.current) {
          markerRef.current.setLatLng(newPosition);
        } else if (mapInstanceRef.current) {
          markerRef.current = L.marker(newPosition, { draggable: true })
            .addTo(mapInstanceRef.current)
            .on('dragend', handleMarkerDrag);
        }

        // Trigger reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
          .then(res => res.json())
          .then(data => {
            const displayAddress = data.display_name || 'Localização ajustada manualmente';
            setAddress(displayAddress);
            onLocationChange({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              address: displayAddress
            });
          }).catch(error => {
            console.error('Erro na geocodificação reversa:', error);
            onLocationChange({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              address: 'Localização ajustada manualmente'
            });
          });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [handleMarkerDrag, onLocationChange]);

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

      <div className="h-72 w-full rounded-lg overflow-hidden border" ref={mapContainerRef} />

      {markerPosition && (
        <div className="text-xs text-muted-foreground">
          <strong>Coordenadas:</strong> {markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}
          <br />
          <span className="italic">Você pode arrastar o pino para ajustar a localização exata.</span>
        </div>
      )}
    </div>
  );
}
