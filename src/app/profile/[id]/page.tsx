"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ArrowLeft, Mail, Check, UserPlus, MessageCircle, PartyPopper, Lock, Clock } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventCard } from '@/components/EventCard';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function UserProfilePage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = useParams() as any;
    const router = useRouter();
    const userId = typeof params.id === 'string' ? params.id : '';
    const { user: authUser, userData } = useAuth();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [organizedEvents, setOrganizedEvents] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

    useEffect(() => {
        if (!userId) return;

        // Redirect to own profile if id matches
        if (authUser && userId === authUser.id) {
            router.push('/profile');
            return;
        }

        const fetchUser = async () => {
            setLoading(true);
            try {
                const { data: userSnap, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;

                if (userSnap) {
                    setUser({
                        id: userSnap.id,
                        name: userSnap.name,
                        email: userSnap.email,
                        avatar: userSnap.avatar,
                        bio: userSnap.bio,
                        relationshipStatus: userSnap.relationship_status,
                        savedEvents: userSnap.saved_events || [],
                        following: userSnap.following || [],
                        followers: userSnap.followers || 0,
                        checkIns: userSnap.check_ins || 0,
                        isMock: false,
                        isPrivate: userSnap.is_private // Map from DB
                    } as User);

                    // Check for pending follow request if private and not following and authenticated
                    if (authUser && userSnap.is_private && !(userData?.following?.includes(userSnap.id))) {
                        const { data: request } = await supabase
                            .from('follow_requests')
                            .select('id')
                            .eq('follower_id', authUser.id)
                            .eq('target_id', userSnap.id)
                            .eq('status', 'pending')
                            .single();

                        if (request) setHasRequested(true);
                    }

                    // Fetch organized events
                    const { data: eventsData } = await supabase
                        .from('events')
                        .select('*')
                        .eq('organizer_id', userId);

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
                console.error("Error fetching user:", error);
                toast({ variant: "destructive", title: "Usuário não encontrado" });
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId, authUser, userData, router, toast]);

    useEffect(() => {
        if (userData && user) {
            setIsFollowing(userData.following?.includes(user.id) || false);
        }
    }, [userData, user]);

    const handleFollowToggle = async () => {
        if (!authUser || !user || isUpdatingFollow) return;

        setIsUpdatingFollow(true);
        try {
            // Case 1: Private Account Logic
            if (user.isPrivate) {
                if (isFollowing) {
                    // Unfollow logic (Standard)
                    await performUnfollow();
                } else {
                    if (hasRequested) {
                        // CT: Cancel Request
                        const { error } = await supabase
                            .from('follow_requests')
                            .delete()
                            .eq('follower_id', authUser.id)
                            .eq('target_id', user.id);

                        if (error) throw error;
                        setHasRequested(false);
                        toast({ title: "Solicitação cancelada" });
                    } else {
                        // CT: Send Request
                        const { error } = await supabase
                            .from('follow_requests')
                            .insert({
                                follower_id: authUser.id,
                                target_id: user.id
                            });

                        if (error) throw error;
                        setHasRequested(true);
                        toast({ title: "Solicitação enviada" });

                        // Optional: Notify logic here
                        await supabase.from('notifications').insert({
                            user_id: user.id,
                            type: 'new_follower', // Reuse or add 'follow_request'
                            text: `<strong>${userData?.name}</strong> quer seguir você.`,
                            read: false,
                            sender_name: userData?.name || 'Alguém',
                            sender_avatar: userData?.avatar || '',
                            link: `/profile/${authUser.id}`
                        });
                    }
                }
            } else {
                // Case 2: Public Account Logic (Standard)
                if (isFollowing) {
                    await performUnfollow();
                } else {
                    await performFollow();
                }
            }

        } catch (error) {
            console.error("Error updating follow:", error);
            toast({ variant: "destructive", title: "Erro ao atualizar" });
        } finally {
            setIsUpdatingFollow(false);
        }
    };

    const performFollow = async () => {
        if (!authUser || !user) return;
        // ... (Existing follow logic refactored)
        const { data: currentUserData } = await supabase.from('users').select('following').eq('id', authUser.id).single();
        const { data: targetUserData } = await supabase.from('users').select('followers').eq('id', user.id).single();

        const currentFollowing = currentUserData?.following || [];
        const currentFollowers = targetUserData?.followers || 0;

        if (!currentFollowing.includes(user.id)) {
            const newFollowing = [...currentFollowing, user.id];
            const newFollowers = currentFollowers + 1;

            await supabase.from('users').update({ following: newFollowing }).eq('id', authUser.id);
            await supabase.from('users').update({ followers: newFollowers }).eq('id', user.id);

            setIsFollowing(true);
            setUser(prev => prev ? ({ ...prev, followers: newFollowers }) : null);
            toast({ title: `Agora você está seguindo ${user.name}` });

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
    }

    const performUnfollow = async () => {
        if (!authUser || !user) return;

        const { data: currentUserData } = await supabase.from('users').select('following').eq('id', authUser.id).single();
        const { data: targetUserData } = await supabase.from('users').select('followers').eq('id', user.id).single();

        const currentFollowing = currentUserData?.following || [];
        const currentFollowers = targetUserData?.followers || 0;

        if (currentFollowing.includes(user.id)) {
            const newFollowing = currentFollowing.filter((id: string) => id !== user.id);
            const newFollowers = Math.max(0, currentFollowers - 1);

            await supabase.from('users').update({ following: newFollowing }).eq('id', authUser.id);
            await supabase.from('users').update({ followers: newFollowers }).eq('id', user.id);

            setIsFollowing(false);
            setUser(prev => prev ? ({ ...prev, followers: newFollowers }) : null);
            toast({ title: `Você deixou de seguir ${user.name}` });
        }
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="pb-24 md:pb-4 flex items-center justify-center h-[80vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!user) {
        return (
            <AppLayout>
                <div className="pb-24 md:pb-4 flex flex-col items-center justify-center h-[80vh] gap-4">
                    <p className="text-muted-foreground">Usuário não encontrado</p>
                    <Button onClick={() => router.back()}>Voltar</Button>
                </div>
            </AppLayout>
        );
    }

    const relationshipStatusIcon = user.relationshipStatus === 'dating'
        ? <Heart className="w-4 h-4 text-red-500 fill-current" />
        : user.relationshipStatus === 'single'
            ? <Heart className="w-4 h-4 text-muted-foreground" />
            : null;

    return (
        <AppLayout>
            <div className="pb-24 md:pb-4">
                <div className="px-4 pt-4">
                    <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                </div>

                <main className="px-4 max-w-2xl mx-auto space-y-6">
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 border-4 border-primary mb-4">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <h1 className="text-2xl font-headline font-bold flex items-center gap-2 justify-center">
                            {user.name}
                            {relationshipStatusIcon && <div className="p-1.5 bg-card/80 rounded-full">{relationshipStatusIcon}</div>}
                        </h1>

                        <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1 justify-center">
                            <Mail className="w-3 h-3" /> {user.email}
                        </div>

                        <p className="italic text-muted-foreground mt-4 max-w-md">&quot;{user.bio}&quot;</p>

                        <div className="flex items-center justify-center gap-8 mt-6">
                            <div className="text-center">
                                <p className="font-bold text-xl">{user.following?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Seguindo</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-xl">{user.followers || 0}</p>
                                <p className="text-sm text-muted-foreground">Seguidores</p>
                            </div>
                        </div>

                        {authUser && (
                            <div className="flex gap-3 mt-6 w-full max-w-sm">
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
                                    ) : hasRequested ? (
                                        <Clock className="mr-2" />
                                    ) : user.isPrivate ? (
                                        <Lock className="mr-2" />
                                    ) : (
                                        <UserPlus className="mr-2" />
                                    )}

                                    {isFollowing ? 'Seguindo' : hasRequested ? 'Solicitado' : user.isPrivate ? 'Solicitar' : 'Seguir'}
                                </Button>
                                <Link href={`/messages/${user.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        <MessageCircle className="mr-2" />
                                        Mensagem
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {user.isPrivate && !isFollowing ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-t border-border/50">
                            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                                <Lock className="w-8 h-8 text-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Esta conta é privada</h3>
                                <p className="text-muted-foreground">Siga esta conta para ver seus eventos e detalhes.</p>
                            </div>
                        </div>
                    ) : (
                        <Tabs defaultValue="organized" className="w-full">
                            <TabsList className="grid w-full grid-cols-1 bg-card/50">
                                <TabsTrigger value="organized">Eventos Organizados</TabsTrigger>
                            </TabsList>
                            <TabsContent value="organized" className="mt-6 space-y-4">
                                {organizedEvents.length > 0 ? (
                                    organizedEvents.map(event => (
                                        <EventCard key={event.id} event={event} isSaved={userData?.savedEvents?.includes(event.id) || false} />
                                    ))
                                ) : (
                                    <div className="text-muted-foreground text-center py-12 flex flex-col items-center gap-3 bg-card/30 rounded-xl border border-dashed border-border/50">
                                        <PartyPopper className="w-10 h-10 opacity-50" />
                                        <p>{user.name} não organizou nenhum evento ainda.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
