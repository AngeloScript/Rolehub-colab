
"use client";

import { useState, useEffect, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button'; // Ensure Button is imported
import { Lock, Loader2 } from 'lucide-react';
import type { Comment, Event } from '@/lib/types';

import { EventHeader } from '@/components/event/EventHeader';
import { EventInfo } from '@/components/event/EventInfo';
import { EventActions } from '@/components/event/EventActions';
import { EventLocation } from '@/components/event/EventLocation';
import { EventComments } from '@/components/event/EventComments';
import { EventVibeCheck } from '@/components/event/EventVibeCheck';
import { EventAttendees } from '@/components/EventAttendees';
import { EventCountdown } from '@/components/event/EventCountdown';
import { EventGallery } from '@/components/event/EventGallery';
import { EventTips } from '@/components/event/EventTips';
import { ClientOnly } from '@/components/ClientOnly';
import { EventRequestsList } from '@/components/event/EventRequestsList';
import { EventLotsEditor } from '@/components/event/EventLotsEditor';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, userData, loading: authLoading, refreshUserData } = useAuth();
  const { toast } = useToast();
  const eventId = typeof params.id === 'string' ? params.id : '';

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [vibeVote, setVibeVote] = useState<'hot' | 'cold' | null>(null);

  const isSaved = useMemo(() => userData?.savedEvents?.includes(eventId) || false, [userData, eventId]);
  const isGoing = useMemo(() => event?.confirmedAttendees?.includes(authUser?.id || '') || false, [event, authUser]);
  const [isRequestPending, setIsRequestPending] = useState(false);

  useEffect(() => {
    async function checkPendingStatus() {
      if (!event || !authUser) return;
      const { data } = await supabase
        .from('attendees')
        .select('status')
        .eq('event_id', event.id)
        .eq('user_id', authUser.id)
        .single();

      if (data && data.status === 'pending') {
        setIsRequestPending(true);
      }
    }
    checkPendingStatus();
  }, [event, authUser]);

  useEffect(() => {
    if (!eventId || authLoading) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);

    const fetchEventData = async () => {
      if (!eventId) return;
      setIsLoading(true);

      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*, organizer:users!organizer_id(id, name, avatar, bio)') // Join with organizer, specific fields only
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;

        // Map Supabase data to Event type
        const mappedEvent: Event = {
          ...eventData,
          organizerId: eventData.organizer_id,
          image: eventData.image_url,
          locationName: eventData.location_name,
          maxParticipants: eventData.max_participants,
          isChatEnabled: eventData.is_chat_enabled,
          primaryColor: eventData.primary_color,
          backgroundColor: eventData.background_color,
          secondaryColor: eventData.secondary_color,
          privacy: eventData.privacy || 'public',
          confirmedAttendees: [], // Will fetch separately
        };

        // Fetch confirmed attendees IDs
        const { data: attendeesData } = await supabase
          .from('attendees')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('status', 'confirmed');

        if (attendeesData) {
          mappedEvent.confirmedAttendees = attendeesData.map(a => a.user_id);
          mappedEvent.participants = attendeesData.length;
        } else {
          mappedEvent.participants = 0;
        }

        setEvent(mappedEvent);

        // Fetch comments
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (commentsData) {
          setComments(commentsData.map(c => ({
            id: c.id,
            text: c.text,
            author: c.user_name, // Assuming we store user_name or join with users
            authorId: c.user_id,
            avatar: c.user_avatar,
            timestamp: c.created_at,
            likes: c.likes || []
          })));
        }

      } catch (error) {
        console.error("Error fetching event details:", error);
        toast({ variant: 'destructive', title: "Erro ao carregar evento" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, authLoading, toast]);

  const handleVoteVibe = async (type: 'hot' | 'cold') => {
    if (!event || !authUser) return;

    try {
      // Fetch current vibes data
      const { data: currentEvent, error: fetchError } = await supabase
        .from('events')
        .select('vibes')
        .eq('id', event.id)
        .single();

      if (fetchError) throw fetchError;

      const currentVibes = currentEvent.vibes || { hot: 0, cold: 0 };
      const newVibes = { ...currentVibes };

      // If user already voted for this type, do nothing
      if (vibeVote === type) return;

      // If user is changing vote, decrement old vote
      if (vibeVote) {
        newVibes[vibeVote] = Math.max(0, (newVibes[vibeVote] || 0) - 1);
      }

      // Increment new vote
      newVibes[type] = (newVibes[type] || 0) + 1;

      // Update database
      const { error: updateError } = await supabase
        .from('events')
        .update({ vibes: newVibes })
        .eq('id', event.id);

      if (updateError) throw updateError;

      // Update local state
      setVibeVote(type);
      setEvent({ ...event, vibes: newVibes });

    } catch (error) {
      console.error("Error voting vibe:", error);
      toast({ variant: 'destructive', title: 'Erro ao votar' });
    }
  }

  const handleSaveToggle = async () => {
    if (!authUser) {
      toast({ variant: "destructive", title: "Faça login para salvar eventos" });
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      let newSavedEvents = [...(userData?.savedEvents || [])];

      if (isSaved) {
        newSavedEvents = newSavedEvents.filter(id => id !== eventId);
        toast({ title: "Evento removido dos salvos" });
      } else {
        newSavedEvents.push(eventId);
        toast({ title: "Evento salvo com sucesso!" });
      }

      const { error } = await supabase
        .from('users')
        .update({ saved_events: newSavedEvents })
        .eq('id', authUser.id);

      if (error) throw error;

    } catch (error) {
      console.error("Error toggling save state:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Tente novamente mais tarde." });
    } finally {
      setIsSaving(false);
      await refreshUserData();
    }
  };

  const createNotification = async (userId: string, type: 'event_confirmation' | 'event_comment', text: string, link: string) => {
    if (userId === authUser?.id) return; // Don't notify self
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type,
        text,
        link,
        read: false,
        sender_name: userData?.name || 'Alguém',
        sender_avatar: userData?.avatar || ''
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const handleGoingToggle = async () => {
    if (!authUser) {
      toast({ variant: "destructive", title: "Faça login para confirmar presença" });
      return;
    }
    if (isConfirming || !event) return;

    setIsConfirming(true);

    try {
      if (isGoing) {
        // LEAVE event (Cancel attendance)
        const { error } = await supabase
          .from('attendees')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', authUser.id);

        if (error) throw error;

        // Optimistic frontend update
        setEvent(prev => prev ? ({
          ...prev,
          confirmedAttendees: prev.confirmedAttendees.filter(id => id !== authUser.id),
          participants: Math.max(0, prev.participants - 1)
        }) : null);
        setIsRequestPending(false); // Reset pending state if they leave (even if they were pending)

        toast({ title: "Você não vai mais" });

      } else {
        // JOIN event
        const isPrivate = event.privacy === 'private';
        const initialStatus = isPrivate ? 'pending' : 'confirmed';

        // Check if there's already a pending request to be sure
        if (isRequestPending) {
          toast({ title: "Solicitação já enviada.", description: "Aguarde a aprovação." });
          setIsConfirming(false);
          return;
        }

        const { error } = await supabase
          .from('attendees')
          .insert({
            event_id: event.id,
            user_id: authUser.id,
            status: initialStatus
          });

        if (error) throw error;

        if (isPrivate) {
          // Logic for PRIVATE event
          setIsRequestPending(true);
          toast({ title: "Solicitação enviada!", description: "Aguarde a aprovação do organizador." });

          // Notify organizer
          if (event.organizerId) {
            await createNotification(
              event.organizerId,
              'event_confirmation',
              `<strong>${userData?.name}</strong> pediu para participar do evento <strong>${event.title}</strong>`,
              `/events/${event.id}`
            );
          }

        } else {
          // Logic for PUBLIC event
          setEvent(prev => prev ? ({
            ...prev,
            confirmedAttendees: [...prev.confirmedAttendees, authUser.id],
            participants: prev.participants + 1
          }) : null);

          toast({ title: "Presença confirmada!" });
        }
      }

    } catch (error) {
      console.error("Error updating presence:", error);
      toast({ variant: "destructive", title: "Erro ao atualizar", description: "Tente novamente mais tarde." });
    } finally {
      setIsConfirming(false);
    }
  };

  // Deprecated/Merged: handleRequestAccess is now handled by handleGoingToggle logic
  // keeping it as a wrapper if needed or removing usage.
  const handleRequestAccess = handleGoingToggle;

  const handleBuyTicket = async (lotId?: string, price?: number, lotName?: string) => {
    if (!authUser || !event) {
      toast({ title: "Faça login para comprar", variant: "destructive" });
      return;
    }

    setIsConfirming(true);

    try {
      // 1. Call API to create Payment Preference
      const title = lotName ? `Ingresso: ${event.title} - ${lotName}` : `Ingresso: ${event.title}`;
      const finalPrice = price !== undefined ? price : (event.price || 0);

      const response = await fetch('/api/payments/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          title: title,
          price: finalPrice,
          quantity: 1,
          userId: authUser.id,
          email: authUser.email,
          payerFirstName: userData?.name.split(' ')[0] || 'Visitante',
          payerLastName: userData?.name.split(' ').slice(1).join(' ') || '',
          lotId: lotId // Optional, sending if selected
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao iniciar pagamento");

      // 2. Save pending event ID to handle success later
      localStorage.setItem('rolehub_pending_event_id', event.id);
      if (lotId) localStorage.setItem('rolehub_pending_lot_id', lotId);

      // 3. Redirect to Mercado Pago Checkout
      if (data.init_point) {
        router.push(data.init_point);
      } else {
        throw new Error("Link de pagamento não gerado");
      }

    } catch (error) {
      console.error("Error buying ticket:", error);
      toast({
        variant: "destructive",
        title: "Erro ao iniciar compra",
        description: error instanceof Error ? error.message : "Tente novamente."
      });
      setIsConfirming(false);
    }
  }

  const handleCheckIn = async () => {
    if (!authUser || !event) return;

    if (isCheckedIn) {
      toast({ title: "Você já fez check-in hoje!" });
      return;
    }

    const isCloseEnough = true;

    if (!isCloseEnough) {
      toast({ variant: "destructive", title: "Você está muito longe!", description: "Precisa estar no local do evento para fazer check-in." });
      return;
    }

    setIsCheckedIn(true);

    try {
      // Increment check-ins in users table
      // We need a stored procedure or just fetch-update for now since we don't have increment easily without RPC
      // Or we can just ignore the count for now and focus on the action
      // Let's try to use an RPC if available, or just update.
      // For simplicity, let's just update local state and assume success or do a fetch-update.

      const { data: userData } = await supabase.from('users').select('check_ins').eq('id', authUser.id).single();
      const currentCheckIns = userData?.check_ins || 0;

      await supabase.from('users').update({ check_ins: currentCheckIns + 1 }).eq('id', authUser.id);

      toast({ title: "Check-in realizado!", description: `Você fez check-in em "${event.title}".` });
    } catch (error) {
      console.error("Error checking in:", error);
      setIsCheckedIn(false);
      toast({ variant: "destructive", title: "Erro ao fazer check-in" });
    }
  }

  const handlePostComment = async (text: string) => {
    if (text.trim() && authUser && event) {
      setIsPostingComment(true);
      try {
        const { data: newComment, error } = await supabase
          .from('comments')
          .insert({
            event_id: eventId,
            user_id: authUser.id,
            user_name: userData?.name || 'Usuário',
            user_avatar: userData?.avatar,
            text: text,
            likes: []
          })
          .select()
          .single();

        if (error) throw error;

        if (event.organizerId) {
          await createNotification(
            event.organizerId,
            'event_comment',
            `<strong>${userData?.name}</strong> comentou no seu evento <strong>${event.title}</strong>`,
            `/events/${event.id}`
          );
        }

        const mappedComment: Comment = {
          id: newComment.id,
          text: newComment.text,
          author: newComment.user_name,
          authorId: newComment.user_id,
          avatar: newComment.user_avatar,
          timestamp: newComment.created_at,
          likes: []
        };

        setComments(prev => [mappedComment, ...prev]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Error posting comment:", error);
        toast({ variant: 'destructive', title: 'Erro ao postar comentário.', description: errorMessage });
      } finally {
        setIsPostingComment(false);
      }
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!authUser || !event) return;

    const comment = comments.find(c => String(c.id) === String(commentId));
    if (!comment) return;

    const isLiked = comment.likes?.includes(authUser.id);
    let newLikes = [...(comment.likes || [])];

    if (isLiked) {
      newLikes = newLikes.filter(id => id !== authUser.id);
    } else {
      newLikes.push(authUser.id);
    }

    // Optimistic update
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: newLikes } : c));

    await supabase
      .from('comments')
      .update({ likes: newLikes })
      .eq('id', commentId);
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      // Manually delete related records first to avoid FK constraints
      const { error: commentsError } = await supabase.from('comments').delete().eq('event_id', event.id);
      if (commentsError) throw commentsError;

      const { error: attendeesError } = await supabase.from('attendees').delete().eq('event_id', event.id);
      if (attendeesError) throw attendeesError;

      const { error: ticketsError } = await supabase.from('tickets').delete().eq('event_id', event.id);
      if (ticketsError) throw ticketsError;

      const { error: photosError } = await supabase.from('event_photos').delete().eq('event_id', event.id);
      if (photosError) throw photosError;

      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;

      toast({
        title: "Evento Excluído",
        description: `O evento "${event.title}" foi removido com sucesso.`
      });
      router.push('/events');
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: "Não foi possível excluir o evento. Tente novamente."
      });
    }
  };



  const isOrganizer = String(authUser?.id) === String(event?.organizerId);
  const [isEventTodayClient, setIsEventTodayClient] = useState(false);

  useEffect(() => {
    if (!event?.date) return;
    // Prioritize fullDate if available
    const dateToUse = event.fullDate || event.date;
    let eventDate;
    if (dateToUse.includes('T')) { // ISO string
      eventDate = new Date(dateToUse);
    } else { // Fallback for "DD MMM" - less reliable without year
      const parts = dateToUse.split(' ');
      if (parts.length === 2) {
        // Assuming "DD MMM" format, add current year
        eventDate = new Date(`${parts[0]} ${parts[1]} ${new Date().getFullYear()}`);
      } else {
        eventDate = new Date(dateToUse); // Try parsing directly
      }
    }
    const today = new Date();
    setIsEventTodayClient(eventDate.toDateString() === today.toDateString());
  }, [event?.date, event?.fullDate]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <Skeleton className="absolute top-4 left-4 h-9 w-9 rounded-full" />
        <Skeleton className="h-80 w-full mb-6" />
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Separator />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (!event) {
    notFound();
  }

  const themeId = `event-theme-${event.id}`;

  return (
    <>
      <style>{`
        .${themeId} {
          --page-primary: ${event.primaryColor || 'var(--primary)'};
          --page-secondary: ${event.secondaryColor || 'var(--secondary)'};
        }
      `}</style>
      <div className={themeId}>
        <ClientOnly>
          <motion.div
            className="min-h-screen bg-background text-foreground pb-24 md:pb-0 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 z-0 opacity-50">
              <motion.div
                className="absolute inset-[-200%] w-[400%] h-[400%] bg-[radial-gradient(circle_farthest-side_at_50%_50%,hsl(var(--page-primary)/0.15),transparent)]"
                animate={{
                  transform: [
                    'translate(-50%, -50%) rotate(0deg) scale(1)',
                    'translate(-50%, -50%) rotate(180deg) scale(1.2)',
                    'translate(-50%, -50%) rotate(360deg) scale(1)',
                  ],
                }}
                transition={{
                  duration: 40,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'mirror',
                }}
              />
              <motion.div
                className="absolute inset-[-200%] w-[400%] h-[400%] bg-[radial-gradient(circle_farthest-side_at_50%_50%,hsl(var(--page-secondary)/0.1),transparent)]"
                animate={{
                  transform: [
                    'translate(-50%, -50%) rotate(0deg) scale(1)',
                    'translate(-50%, -50%) rotate(-180deg) scale(1.3)',
                    'translate(-50%, -50%) rotate(-360deg) scale(1)',
                  ],
                }}
                transition={{
                  duration: 50,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 5,
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
                <Breadcrumbs items={[
                  { label: "Eventos", href: "/events" },
                  { label: event.title, active: true }
                ]} />
              </div>

              <EventHeader
                event={event}
                isOrganizer={isOrganizer}
                onDelete={handleDeleteEvent}
              />

              {event.privacy === 'private' && !isOrganizer && !isGoing ? (
                <main className="max-w-3xl mx-auto p-4 md:p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h1 className="text-2xl font-bold">Este evento é privado</h1>
                  <p className="text-muted-foreground text-lg">
                    Os detalhes deste evento são visíveis apenas para convidados confirmados.
                  </p>
                  {!authUser && (
                    <Button onClick={() => router.push('/login')} variant="secondary" className="mt-4">
                      Fazer Login
                    </Button>
                  )}
                  {/* 
                     Request Access Logic
                   */}
                  {authUser && !isOrganizer && !isGoing && isRequestPending && (
                    <Button disabled variant="secondary" className="mt-4 cursor-default">
                      <Loader2 className="w-4 h-4 mr-2" />
                      Solicitação Enviada
                    </Button>
                  )}
                  {authUser && !isOrganizer && !isGoing && !isRequestPending && (
                    <Button onClick={handleRequestAccess} className="mt-4" disabled={isConfirming}>
                      {isConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Solicitar Acesso
                    </Button>
                  )}
                </main>
              ) : (

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto p-4 md:p-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Organizer Request List */}
                    {isOrganizer && event.privacy === 'private' && (
                      <EventRequestsList eventId={event.id} />
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-grow w-full">
                        <EventInfo
                          event={event}
                          isEventToday={isEventTodayClient}
                          isCheckedIn={isCheckedIn}
                          authUser={userData}
                          onCheckIn={handleCheckIn}
                        />
                      </div>
                      <EventActions
                        eventId={event.id}
                        eventTitle={event.title}
                        eventDescription={event.description}
                        isGoing={isGoing}
                        isConfirming={isConfirming}
                        isSaved={isSaved}
                        isSaving={isSaving}
                        onToggleGoing={handleGoingToggle}
                        onToggleSave={handleSaveToggle}
                        price={event.price}
                        currency={event.currency}
                        onBuyTicket={handleBuyTicket}
                        requestStatus={isRequestPending ? 'pending' : null}
                      />
                      {isOrganizer && event.price && event.price > 0 && (
                        <div className="md:self-center">
                          <EventLotsEditor eventId={event.id} currency={event.currency} />
                        </div>
                      )}
                    </div>

                    <Separator className="bg-border/20" />

                    <EventLocation event={event} />

                    <EventGallery eventId={event.id} eventDate={event.date} />

                    <EventComments
                      event={event}
                      comments={comments}
                      authUser={userData}
                      onPostComment={handlePostComment}
                      onLikeComment={handleLikeComment}
                      isPostingComment={isPostingComment}
                      isGoing={isGoing}
                    />
                  </div>

                  <div className="space-y-6">
                    <EventCountdown eventDate={event.fullDate || event.date} eventTime={event.time} />

                    <EventAttendees eventId={event.id} />

                    <EventVibeCheck
                      event={event}
                      vibes={event.vibes}
                      vibeVote={vibeVote}
                      onVote={handleVoteVibe}
                      authUser={authUser}
                    />

                    <EventTips />
                  </div>
                </main>
              )}
            </div>
          </motion.div>
        </ClientOnly>
      </div>
    </>
  );
}
