"use client";

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';
import { EventCard } from '@/components/EventCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
        const filtered = events.filter(event => {
            const eventDate = new Date(event.date);
            return (
                eventDate.getDate() === selectedDate.getDate() &&
                eventDate.getMonth() === selectedDate.getMonth() &&
                eventDate.getFullYear() === selectedDate.getFullYear()
            );
        });
        setFilteredEvents(filtered);
    }, [selectedDate, events]);

    const tileClassName = ({ date, view }: any) => {
        if (view === 'month') {
            const hasEvent = events.some(event => {
                const eventDate = new Date(event.date);
                return (
                    eventDate.getDate() === date.getDate() &&
                    eventDate.getMonth() === date.getMonth() &&
                    eventDate.getFullYear() === date.getFullYear()
                );
            });
            return hasEvent ? 'has-event' : null;
        }
    };

    return (
        <AppLayout>
            <div className="pb-24 md:pb-4">
                <PageHeader title="Calendário de Eventos" />
                <main className="px-4 max-w-6xl mx-auto pt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-card rounded-lg p-4 border border-border/20">
                            <Calendar
                                onChange={(value) => setSelectedDate(value as Date)}
                                value={selectedDate}
                                tileClassName={tileClassName}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4">
                                Eventos em {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h2>

                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(2)].map((_, i) => (
                                        <Skeleton key={i} className="h-64 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : filteredEvents.length > 0 ? (
                                <motion.div
                                    className="space-y-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
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
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>Nenhum evento nesta data</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <style jsx global>{`
          .react-calendar {
            border: none !important;
            font-family: inherit;
          }
          .react-calendar__tile--active {
            background: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
          }
          .react-calendar__tile--now {
            background: hsl(var(--muted)) !important;
          }
          .react-calendar__tile.has-event {
            position: relative;
          }
          .react-calendar__tile.has-event::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: hsl(var(--primary));
          }
        `}</style>
            </div>
        </AppLayout>
    );
}
