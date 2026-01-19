"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import Image from "next/image";
import { Heart, Mail, UserPlus, MessageCircle, Loader2, Check, PartyPopper } from "lucide-react";
import { Button } from './ui/button';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCard } from './EventCard';

type UserProfileDialogProps = {
  user?: User;
  userId?: string; // Can pass userId to fetch user
  children: React.ReactNode;
};

export function UserProfileDialog({ user: initialUser, userId, children }: UserProfileDialogProps) {
  const { user: authUser, userData, updateLocalUserData } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [user, setUser] = useState<User | undefined>(initialUser);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organizedEvents, setOrganizedEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchFullUser = async (id: string) => {
      setIsLoadingUser(true);
      try {
        const { data: fetchedUser, error } = await supabase
          .from('users')
          .select('id, name, email, avatar, bio, relationship_status, followers, following, is_private, check_ins')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (fetchedUser) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedUser: User = {
            id: fetchedUser.id,
            name: fetchedUser.name,
            email: fetchedUser.email,
            avatar: fetchedUser.avatar,
            bio: fetchedUser.bio,
            relationshipStatus: fetchedUser.relationship_status,
            followers: fetchedUser.followers,
            following: fetchedUser.following,
            checkIns: fetchedUser.check_ins,
            isPrivate: fetchedUser.is_private,
            savedEvents: [] // Not fetching saved events in this query
          };
          setUser(mappedUser);

          // Fetch organized events
          // Fetch organized events
          const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .eq('organizer_id', id);

          if (eventsData) {
            setOrganizedEvents(eventsData.map(event => ({
              ...event,
              organizerId: event.organizer_id,
              image: event.image_url,
              locationName: event.location_name,
              maxParticipants: event.max_participants,
              isChatEnabled: event.is_chat_enabled,
              primaryColor: event.primary_color,
              backgroundColor: event.background_color,
              secondaryColor: event.secondary_color,
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoadingUser(false);
        setIsLoadingEvents(false);
      }
    }

    if (initialUser) {
      setUser(initialUser);
      fetchFullUser(initialUser.id);
    } else if (userId) {
      fetchFullUser(userId);
    }
  }, [initialUser, userId]);


  useEffect(() => {
    if (userData && user) {
      setIsFollowing(userData.following?.includes(user.id) || false);
    }
  }, [userData, user]);

  // ... (rest of component state)

  const handleFollowToggle = async () => {
    if (!authUser || !user || authUser.id === user.id) return;

    // Prevent multiple clicks while updating
    if (isUpdatingFollow) return;

    setIsUpdatingFollow(true);

    // 1. Snapshot previous state
    const previousIsFollowing = isFollowing;
    const previousFollowers = user.followers || 0;
    const previousUserData = { ...userData };

    // 2. Calculate new state
    const newIsFollowing = !previousIsFollowing;
    const newFollowers = newIsFollowing
      ? previousFollowers + 1
      : Math.max(0, previousFollowers - 1);

    // 3. Apply Optimistic Updates GLOBALLY and LOCALLY
    // Local component state
    setIsFollowing(newIsFollowing);
    setUser(prev => prev ? ({ ...prev, followers: newFollowers }) : undefined);

    // Global auth context state (so other screens update instantly)
    let newFollowingList = [...(userData?.following || [])];
    if (newIsFollowing) {
      if (!newFollowingList.includes(user.id)) newFollowingList.push(user.id);
    } else {
      newFollowingList = newFollowingList.filter(id => id !== user.id);
    }
    updateLocalUserData({ following: newFollowingList });


    // Show instant feedback
    toast({
      title: newIsFollowing
        ? `Agora você está seguindo ${user.name}`
        : `Você deixou de seguir ${user.name}`
    });

    try {
      // 4. Perform DB Operations in Background

      // Get current following list from DB to be safe (or rely on what we just calculated if we trust it)
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('following')
        .eq('id', authUser.id)
        .single();

      if (currentUserError) throw currentUserError;

      let currentFollowing = currentUserData.following || [];

      if (newIsFollowing) {
        if (!currentFollowing.includes(user.id)) {
          currentFollowing = [...currentFollowing, user.id];
          // Create notification
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'new_follower',
            text: `<strong>${userData?.name}</strong> começou a seguir você.`,
            read: false,
            sender_name: userData?.name || 'Alguém',
            sender_avatar: userData?.avatar || '',
            link: `/profile/${authUser.id}`
          });
        }
      } else {
        currentFollowing = currentFollowing.filter((id: string) => id !== user.id);
      }

      // Update 'following' on authUser
      const { error: updateFollowingError } = await supabase
        .from('users')
        .update({ following: currentFollowing })
        .eq('id', authUser.id);

      if (updateFollowingError) throw updateFollowingError;

      // Update 'followers' count on target user
      const { error: updateFollowersError } = await supabase
        .from('users')
        .update({ followers: newFollowers })
        .eq('id', user.id);

      if (updateFollowersError) console.warn("Could not update followers count (RLS?):", updateFollowersError);

    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: "Desfazendo alteração..." });

      // 5. Revert optimistic updates on error
      setIsFollowing(previousIsFollowing);
      setUser(prev => prev ? ({ ...prev, followers: previousFollowers }) : undefined);
      updateLocalUserData({ following: previousUserData.following }); // Revert global state
    } finally {
      setIsUpdatingFollow(false);
    }
  }

  if (!user && !userId) {
    return <>{children}</>;
  }

  const relationshipStatusIcon = user?.relationshipStatus === 'dating'
    ? <Heart className="w-4 h-4 text-red-500 fill-current" />
    : user?.relationshipStatus === 'single'
      ? <Heart className="w-4 h-4 text-muted-foreground" />
      : null;


  const renderContent = () => {
    if (isLoadingUser || !user) {
      return (
        <DialogHeader className="pt-8 items-center text-center">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-7 w-40 mt-4" />
          <Skeleton className="h-4 w-52 mt-2" />
          <div className="py-4 text-center">
            <Skeleton className="h-10 w-60" />
          </div>
        </DialogHeader>
      )
    }
    return (
      <>
        <DialogHeader className="pt-8 items-center text-center">
          <Image
            src={user.avatar}
            alt={user.name}
            width={96}
            height={96}
            className="rounded-full border-4 border-primary mb-4"
          />
          <DialogTitle className="text-2xl font-headline flex items-center gap-2">
            {user.name}
            {relationshipStatusIcon && <div className="p-1.5 bg-card/80 rounded-full">{relationshipStatusIcon}</div>}
          </DialogTitle>
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <Mail className="w-3 h-3" /> {user.email}
          </div>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="italic text-muted-foreground">&quot;{user.bio}&quot;</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center">
              <p className="font-bold text-lg">{user.following?.length || 0}</p>
              <p className="text-muted-foreground">Este usuário ainda não participou de nenhum rolê.</p></div>
            <div className="text-center">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <span className="font-bold text-foreground">{(user as any).followers || 0}</span>
              <p className="text-sm text-muted-foreground">&quot;Adoro festivais de música e conhecer gente nova!&quot;</p>
            </div>
          </div>
        </div>
        {authUser && authUser.id !== user.id && (
          <div className="flex gap-2 pt-4">
            <Button
              variant={isFollowing ? 'secondary' : 'default'}
              className="flex-1"
              onClick={handleFollowToggle}
              disabled={isUpdatingFollow}
            >
              {isUpdatingFollow ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : isFollowing ? (
                <Check className="mr-2" />
              ) : (
                <UserPlus className="mr-2" />
              )}
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </Button>
            <Link href={`/messages/${user.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <MessageCircle className="mr-2" />
                Mensagem
              </Button>
            </Link>
          </div>
        )}
        <Tabs defaultValue="organized" className="w-full pt-4">
          <TabsList className="grid w-full grid-cols-1 bg-card/50">
            <TabsTrigger value="organized">Eventos Organizados</TabsTrigger>
          </TabsList>
          <TabsContent value="organized" className="mt-4">
            <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
              {isLoadingEvents ? (
                [...Array(1)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)
              ) : organizedEvents.length > 0 ? (
                organizedEvents.map(event => (
                  <EventCard key={event.id} event={event} isSaved={userData?.savedEvents?.includes(event.id) || false} />
                ))
              ) : (
                <div className="text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
                  <PartyPopper className="w-10 h-10" />
                  <p className="font-semibold">{user.name} não organizou nenhum evento ainda.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
