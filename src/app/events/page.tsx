"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, List, Map, X as XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/EventCard';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/PageHeader';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

const MapComponent = dynamic(() => import('@/components/MapComponent').then(mod => mod.MapComponent), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-lg" />,
});


export default function EventFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userData, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState({
    música: false,
    arte: false,
    esportes: false,
    tecnologia: false,
  });
  const [view, setView] = useState<'list' | 'map'>('list');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait until authentication status is resolved
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const eventsData = data.map(event => ({
            ...event,
            organizerId: event.organizer_id,
            image: event.image_url,
            locationName: event.location_name,
            maxParticipants: event.max_participants,
            isChatEnabled: event.is_chat_enabled,
            primaryColor: event.primary_color,
            backgroundColor: event.background_color,
            secondaryColor: event.secondary_color,
          } as Event));
          setEvents(eventsData);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [authLoading]);

  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const activeFilters = Object.entries(filters)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key);

    if (activeFilters.length > 0) {
      filtered = filtered.filter(event =>
        event.tags && event.tags.some(tag => activeFilters.includes(tag))
      );
    }

    return filtered;
  }, [searchQuery, filters, events]);

  const eventsWithCoords = useMemo(() => {
    return filteredEvents.filter(event => typeof event.latitude === 'number' && typeof event.longitude === 'number');
  }, [filteredEvents]);


  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <div className="md:hidden">
          <PageHeader title="Eventos" />
        </div>
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm p-4 border-b border-border">
          <div className="flex items-center gap-2 md:gap-4 max-w-7xl mx-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, local..."
                className="pl-10 h-10 bg-card/50 focus:bg-background pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                  onClick={() => setSearchQuery('')}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="flex-shrink-0 border-primary text-primary hover:bg-primary/10 h-10 w-10">
                      <Filter className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filtrar por Tags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={filters.música} onCheckedChange={() => handleFilterChange('música')}>Música</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.arte} onCheckedChange={() => handleFilterChange('arte')}>Arte</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.esportes} onCheckedChange={() => handleFilterChange('esportes')}>Esportes</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.tecnologia} onCheckedChange={() => handleFilterChange('tecnologia')}>Tecnologia</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="bg-muted h-10 w-px mx-2 hidden md:block" />
              <div className="hidden md:flex items-center gap-1 rounded-full p-1 bg-card/50 border">
                <Button
                  size="sm"
                  variant={view === 'list' ? 'default' : 'ghost'}
                  onClick={() => setView('list')}
                  className="rounded-full px-4"
                >
                  <List className="w-4 h-4 mr-2" />
                  Lista
                </Button>
                <Button
                  size="sm"
                  variant={view === 'map' ? 'default' : 'ghost'}
                  onClick={() => setView('map')}
                  className="rounded-full px-4"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Mapa
                </Button>
              </div>
            </div>
          </div>
          <div className="md:hidden flex items-center gap-2 pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 flex-shrink-0 border-primary text-primary hover:bg-primary/10 h-10">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtrar Eventos
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)]">
                <DropdownMenuLabel>Filtrar por Tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={filters.música} onCheckedChange={() => handleFilterChange('música')}>Música</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.arte} onCheckedChange={() => handleFilterChange('arte')}>Arte</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.esportes} onCheckedChange={() => handleFilterChange('esportes')}>Esportes</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.tecnologia} onCheckedChange={() => handleFilterChange('tecnologia')}>Tecnologia</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1 rounded-full p-1 bg-card/50 border">
              <Button
                size="icon"
                variant={view === 'list' ? 'default' : 'ghost'}
                onClick={() => setView('list')}
                className="rounded-full"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={view === 'map' ? 'default' : 'ghost'}
                onClick={() => setView('map')}
                className="rounded-full"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-grow"
                ref={scrollRef}
              >
                <div className="p-4 pt-4 pb-24 md:pb-4 space-y-6">
                  <AnimatePresence>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
                      {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ))
                      ) : filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                          <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                          >
                            <EventCard
                              event={event}
                              isSaved={userData?.savedEvents?.includes(event.id) || false}
                            />
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-10 col-span-full">
                          <p className="text-muted-foreground">Nenhum evento encontrado.</p>
                          <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
                        </div>
                      )}
                    </div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="map"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100vh-200px)] rounded-lg overflow-hidden border border-border/20 shadow-inner"
              >
                <MapComponent events={eventsWithCoords} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
