"use client";

import { useEffect, useState } from "react";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { InteractiveMap } from "@/components/InteractiveMap";
import { EventDrawer } from "@/components/event/EventDrawer";
import { supabase } from "@/lib/supabase";
import { Event } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function ExplorePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                // Fetch upcoming events
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .gte('date_time', new Date().toISOString()) // Only future events
                    .order('date_time', { ascending: true })
                    .limit(50);

                if (error) {
                    console.error("Error fetching events:", error);
                } else if (data) {
                    // Map DB fields to Event type if necessary, usually partial match is enough if types.ts is aligned.
                    // Assuming types.ts aligns or we map manually if needed.
                    // For now casting, but in production we should map properly if column names differ (e.g. image_url vs image)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedEvents: Event[] = data.map((e: any) => ({
                        ...e,
                        image: e.image_url || e.image, // Fallback
                        locationName: e.location_name || e.location,
                        participants: e.participants_count || 0, // Assuming a count field or trigger
                    }));
                    setEvents(mappedEvents);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <SidebarNav />
            <main className="flex-1 md:ml-64 relative h-screen overflow-hidden flex flex-col">
                <div className="absolute top-4 left-4 md:left-8 z-10">
                    <h1 className="text-2xl font-bold text-white drop-shadow-md bg-black/50 px-3 py-1 rounded-lg backdrop-blur-sm">Explorar</h1>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-full w-full bg-muted/20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <InteractiveMap
                            events={events}
                            markerVariant="bubble"
                            onEventSelect={setSelectedEvent}
                            className="bg-card"
                        />
                    </div>
                )}

                <EventDrawer
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            </main>
        </div>
    );
}
