
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Users, Loader2 } from 'lucide-react';
import { type Event } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

type EventCardProps = {
  event: Event;
  isSaved: boolean;
};

export function EventCard({ event, isSaved: initialIsSaved }: EventCardProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    // Robust parsing needed, but keeping existing logic for now inside effect
    const eventDate = new Date(event.date.replace(/(\d{2}) ([A-Z]{3})/, '$2 $1, ') + new Date().getFullYear()).toDateString();
    setIsLive(today === eventDate);
  }, [event.date]);

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);


  const handleSaveToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!authUser) {
      toast({ variant: "destructive", title: "Faça login para salvar eventos" });
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Fetch fresh data to avoid race conditions
      const { data: currentUserData, error: fetchError } = await supabase
        .from('users')
        .select('saved_events')
        .eq('id', authUser.id)
        .single();

      if (fetchError) {
        console.error('Error fetching saved events:', JSON.stringify(fetchError, null, 2));
        throw new Error(`Fetch error: ${JSON.stringify(fetchError)}`);
      }
      if (!currentUserData) {
        console.error('No user data returned for saved events');
        throw new Error('User data not found');
      }
      const currentSavedEvents = currentUserData.saved_events || [];

      const isCurrentlySaved = currentSavedEvents.includes(event.id);
      let newSavedEvents: string[];

      if (isCurrentlySaved) {
        newSavedEvents = currentSavedEvents.filter((id: string) => id !== event.id);
        toast({ title: "Evento removido dos salvos" });
        setIsSaved(false);
      } else {
        newSavedEvents = [...currentSavedEvents, event.id];
        toast({ title: "Evento salvo com sucesso!" });
        setIsSaved(true);
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ saved_events: newSavedEvents })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (_error: any) {
      console.error("Error toggling save state:", JSON.stringify(_error, null, 2));
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: _error?.message || "Tente novamente mais tarde."
      });
      // Revert optimistic update on error
      setIsSaved(isSaved);
    } finally {
      setIsSaving(false);
    }
  }, [authUser, event.id, isSaved, isSaving, toast]);

  const cardStyle = {
    '--event-primary-color': event.primaryColor ? `hsl(${event.primaryColor})` : 'hsl(var(--primary))',
  } as React.CSSProperties;


  return (
    <Link href={`/events/${event.id}`} className="block group relative" style={cardStyle}>
      <motion.div
        className="overflow-hidden rounded-lg border bg-card/50 h-full flex flex-col relative"
        whileHover={{ y: -5, boxShadow: "0px 10px 20px hsla(var(--primary)/0.1)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <Image
            src={event.image}
            alt={event.title}
            width={600}
            height={338}
            className="w-full object-cover aspect-video group-hover:scale-105 transition-transform duration-300"
            data-ai-hint={event.imageHint}
            priority={true}
          />
          <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1.5 rounded-md font-headline text-primary text-center leading-none">
            <p className="text-base font-bold">
              {(() => {
                try {
                  // If event.date is "DD MMM" format from earlier regex or ISO, try to handle
                  // But simplify: just try to parse via Date or split
                  const d = new Date(event.date);
                  if (isNaN(d.getTime())) {
                    // Fallback for "DD MMM" string if it's not full date
                    return event.date.split(' ')[0] + ' ' + (event.date.split(' ')[1] || '');
                  }
                  return format(d, "dd MMM", { locale: ptBR }).toUpperCase();
                } catch {
                  return event.date.split(' ')[0];
                }
              })()}
            </p>
          </div>
          {isLive && (
            <div className="absolute top-2 left-2 bg-red-600/80 backdrop-blur-sm px-2 py-1 rounded-md font-bold text-xs text-white uppercase tracking-widest animate-pulse">
              AO VIVO
            </div>
          )}
        </div>
        <div className="p-4 space-y-3 flex flex-col flex-grow z-10">
          <h3 className="text-lg font-headline font-bold text-foreground group-hover:text-[var(--event-primary-color)] transition-colors leading-tight">
            {event.title}
          </h3>
          <p className="text-xs text-muted-foreground -mt-2">{event.locationName}</p>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">{event.participants} confirmados</span>
          </div>

          <div className="flex items-center mt-auto pt-2 justify-between">
            <div className="text-xs space-x-1">
              {event.tags.slice(0, 3).map(tag => (
                <span key={tag} className="inline-block px-2 py-1 bg-muted/50 text-muted-foreground rounded-full hover:bg-primary/20 hover:text-primary transition-colors">#{tag}</span>
              ))}
            </div>

            <motion.button
              onClick={handleSaveToggle}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300",
                isSaved ? "bg-[var(--event-primary-color)] text-primary-foreground" : "bg-muted text-[var(--event-primary-color)]",
              )}
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              whileHover={{ scale: 1.1 }}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
