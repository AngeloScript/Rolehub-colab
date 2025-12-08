"use client";

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';
import { EventCard } from '@/components/EventCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ptBR } from 'date-fns/locale';
import { format, isSameDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const { userData } = useAuth();

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*');

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
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
        if (!selectedDate) return;

        const filtered = events.filter(event => {
            if (!event.date) return false;
            // Handle both ISO strings and "DD MMM" format if needed, but preferably ISO
            const eventDate = new Date(event.date);
            if (isNaN(eventDate.getTime())) {
                // Try to parse "DD MMM" format manually if needed, or skip
                // For now assuming ISO or standard format that Date constructor handles
                return false;
            }
            return isSameDay(eventDate, selectedDate);
        });
        setFilteredEvents(filtered);
    }, [selectedDate, events]);

    // Function to check if a day has events for the calendar modifier
    const hasEvent = (date: Date) => {
        return events.some(event => {
            if (!event.date) return false;
            const eventDate = new Date(event.date);
            return isSameDay(eventDate, date);
        });
    };

    return (
        <AppLayout>
            <div className="pb-24 md:pb-8 min-h-screen bg-background">
                <PageHeader title="Calendário de Eventos" />
                <main className="px-4 max-w-7xl mx-auto pt-6">
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Calendar Section */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <div className="sticky top-24">
                                <Card className="border-border/40 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                                    <CardContent className="p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            locale={ptBR}
                                            className="w-full flex justify-center p-4"
                                            modifiers={{ hasEvent: (date) => hasEvent(date) }}
                                            modifiersStyles={{
                                                hasEvent: {
                                                    fontWeight: 'bold',
                                                    textDecoration: 'underline',
                                                    textDecorationColor: 'hsl(var(--primary))',
                                                    textDecorationThickness: '3px',
                                                    textUnderlineOffset: '4px'
                                                }
                                            }}
                                        />
                                    </CardContent>
                                </Card>

                                <div className="mt-6 bg-card/30 p-4 rounded-lg border border-border/20">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-primary" />
                                        Legenda
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        <span>Dias com eventos</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Events List Section */}
                        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                                    {selectedDate ? (
                                        <>
                                            Eventos em <span className="text-primary">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                                        </>
                                    ) : (
                                        "Selecione uma data"
                                    )}
                                </h2>
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
                                </Badge>
                            </div>

                            {loading ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[...Array(4)].map((_, i) => (
                                        <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    {filteredEvents.length > 0 ? (
                                        <motion.div
                                            key={selectedDate?.toISOString()}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="grid md:grid-cols-2 gap-6"
                                        >
                                            {filteredEvents.map(event => (
                                                <EventCard
                                                    key={event.id}
                                                    event={event}
                                                    isSaved={userData?.savedEvents?.includes(event.id) || false}
                                                />
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-20 text-center bg-card/30 rounded-2xl border-2 border-dashed border-border/30"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                                <CalendarDays className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">Nenhum evento encontrado</h3>
                                            <p className="text-muted-foreground max-w-md">
                                                Não há rolês marcados para este dia. Que tal criar um?
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
