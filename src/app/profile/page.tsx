"use client";

import { useState, useEffect, useRef } from 'react';
import { Camera, Edit, LogOut, Save, Loader2, PartyPopper, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/EventCard';
import { PageHeader } from '@/components/PageHeader';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import type { User, Event } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClientOnly } from "@/components/ClientOnly";
import { FollowRequestsSection } from '@/components/profile/FollowRequestsSection';

const ProfileSkeleton = () => (
  <div className="pb-24 md:pb-4">
    <PageHeader title="Meu Perfil" />
    <main className="px-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 pt-8 pb-4">
        <Skeleton className="w-24 h-24 rounded-full border-4 border-primary" />
        <div className="flex-grow w-full space-y-2">
          <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-full max-w-md mx-auto md:mx-0" />
        </div>
      </div>
      <div className="flex items-center justify-center md:justify-start gap-6 py-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-20" />)}
      </div>
      <Separator className="my-4" />
      <Skeleton className="h-10 w-full" />
    </main>
  </div>
);


export default function ProfilePage() {
  const { user: authUser, userData, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [editedUser, setEditedUser] = useState<Partial<User>>({});

  const [organizedEvents, setOrganizedEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const router = useRouter();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = userData;

  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name,
        bio: user.bio,
        relationshipStatus: user.relationshipStatus,
        isPrivate: user.isPrivate || false
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchUserEvents = async () => {
      // Wait for authentication to complete
      if (authLoading || !user) {
        setIsLoadingEvents(true);
        return;
      }

      setIsLoadingEvents(true);

      try {
        // Fetch organized events
        const { data: orgEvents, error: orgError } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', user.id);

        if (orgError) throw orgError;

        const mappedOrgEvents = (orgEvents || []).map(event => ({
          ...event,
          organizerId: event.organizer_id,
          image: event.image_url,
          locationName: event.location_name,
          maxParticipants: event.max_participants,
          isChatEnabled: event.is_chat_enabled,
          primaryColor: event.primary_color,
          backgroundColor: event.background_color,
          secondaryColor: event.secondary_color,
        }));
        setOrganizedEvents(mappedOrgEvents as Event[]);

        // Fetch saved events
        if (user.savedEvents && user.savedEvents.length > 0) {
          const { data: savEvents, error: savError } = await supabase
            .from('events')
            .select('*')
            .in('id', user.savedEvents.slice(0, 30)); // Supabase also has limits, but let's keep the slice for now

          if (savError) throw savError;

          const mappedSavEvents = (savEvents || []).map(event => ({
            ...event,
            organizerId: event.organizer_id,
            image: event.image_url,
            locationName: event.location_name,
            maxParticipants: event.max_participants,
            isChatEnabled: event.is_chat_enabled,
            primaryColor: event.primary_color,
            backgroundColor: event.background_color,
            secondaryColor: event.secondary_color,
          }));
          setSavedEvents(mappedSavEvents as Event[]);
        } else {
          setSavedEvents([]);
        }

        // Fetch attending events
        // We need to query the 'attendees' table for this
        const { data: attendingData, error: attError } = await supabase
          .from('attendees')
          .select('event_id, events(*)')
          .eq('user_id', user.id)
          .eq('status', 'confirmed');

        if (attError) throw attError;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attEvents = attendingData.map((item: any) => {
          const event = item.events;
          return {
            ...event,
            organizerId: event.organizer_id,
            image: event.image_url,
            locationName: event.location_name,
            maxParticipants: event.max_participants,
            isChatEnabled: event.is_chat_enabled,
            primaryColor: event.primary_color,
            backgroundColor: event.background_color,
            secondaryColor: event.secondary_color,
          };
        });
        setAttendingEvents(attEvents as Event[]);

      } catch (error) {
        console.error("Error fetching user events:", error);
        toast({ variant: 'destructive', title: "Erro ao buscar eventos" });
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchUserEvents();
  }, [user, authLoading, toast]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: "single" | "dating" | "married" | "complicated" | "not_specified") => {
    setEditedUser({ ...editedUser, relationshipStatus: value });
  };

  const handleSaveChanges = async () => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editedUser.name,
          bio: editedUser.bio,
          relationship_status: editedUser.relationshipStatus,
          is_private: editedUser.isPrivate
        })
        .eq('id', authUser.id);

      if (error) throw error;
      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user data: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar suas informações. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "O tamanho máximo é 5MB." });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Arquivo inválido", description: "Por favor, selecione uma imagem." });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const filePath = `public/${authUser.id}-${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from('rolehub')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('rolehub')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) throw new Error("Could not get public URL for the image.");

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: urlData.publicUrl })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      toast({ title: "Foto de perfil atualizada!" });

    } catch (error) {
      console.error("Error uploading image: ", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: `Não foi possível enviar sua foto. Detalhes: ${errorMessage}`,
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <AppLayout>
        <ProfileSkeleton />
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <ProfileSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ClientOnly fallback={<ProfileSkeleton />}>
        <motion.div
          className="pb-24 md:pb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageHeader title="Meu Perfil" actionIcon={LogOut} onAction={handleLogout} />

          <main className="px-4 max-w-4xl mx-auto">
            {/* Follow Requests Section */}
            {user.isPrivate && (
              <FollowRequestsSection userId={user.id} />
            )}

            <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 pt-8 pb-4">
              <div className="relative flex-shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                  disabled={isUploadingAvatar}
                  aria-label="Upload profile picture"
                />
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={user.avatar || ""} alt={user.name} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-muted">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <Button
                  size="icon"
                  className="absolute bottom-0 -right-2 rounded-full w-8 h-8 bg-secondary hover:bg-secondary/90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-grow w-full">
                {!isEditing && (
                  <div className="flex justify-center md:justify-end mb-4 md:mb-0 md:absolute md:top-8 md:right-4">
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/tickets">
                        <Ticket className="w-4 h-4" />
                        Meus Ingressos
                      </Link>
                    </Button>
                  </div>
                )}
                {!isEditing ? (
                  <>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <h2 className="text-2xl font-bold font-headline">{user.name}</h2>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>

                    {user.relationshipStatus && user.relationshipStatus !== 'not_specified' && (
                      <div className="flex items-center gap-2 mt-2 justify-center md:justify-start text-sm font-medium text-primary">
                        {user.relationshipStatus === 'single' && <span>💔 Solteiro(a)</span>}
                        {user.relationshipStatus === 'dating' && <span>❤️ Namorando</span>}
                        {user.relationshipStatus === 'married' && <span>💍 Casado(a)</span>}
                        {user.relationshipStatus === 'complicated' && <span>🌀 É complicado</span>}
                      </div>
                    )}

                    <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto md:mx-0 whitespace-pre-wrap">{user.bio || "Sem biografia."}</p>
                  </>
                ) : (
                  <div className="space-y-4 text-left">
                    <Input
                      type="text"
                      name="name"
                      value={editedUser.name}
                      onChange={handleFieldChange}
                      className="text-2xl font-bold font-headline h-12"
                      autoFocus
                    />
                    <Textarea
                      name="bio"
                      value={editedUser.bio}
                      onChange={handleFieldChange}
                      placeholder="Conte um pouco sobre você..."
                      className="min-h-[80px]"
                    />
                    <div>
                      <Label className="font-semibold mb-2 block text-sm">Status de Relacionamento</Label>
                      <RadioGroup
                        value={editedUser.relationshipStatus || "not_specified"}
                        onValueChange={handleStatusChange}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="single" id="r1" />
                          <Label htmlFor="r1" className="cursor-pointer flex items-center gap-2">💔 Solteiro(a)</Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="dating" id="r2" />
                          <Label htmlFor="r2" className="cursor-pointer flex items-center gap-2">❤️ Namorando</Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="married" id="r3" />
                          <Label htmlFor="r3" className="cursor-pointer flex items-center gap-2">💍 Casado(a)</Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="complicated" id="r4" />
                          <Label htmlFor="r4" className="cursor-pointer flex items-center gap-2">🌀 É complicado</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="private-mode"
                          aria-label="Conta Privada"
                          checked={editedUser.isPrivate || false}
                          onChange={(e) => setEditedUser({ ...editedUser, isPrivate: e.target.checked })}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="private-mode" className="font-semibold cursor-pointer">Conta Privada</Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-2">
                        Se ativado, apenas seus seguidores poderão ver seus eventos e detalhes.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => setIsEditing(false)} variant="outline">Cancelar</Button>
                      <Button onClick={handleSaveChanges} className="w-full bg-primary hover:bg-primary/90" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6 py-2">
              <div className="text-center">
                <p className="font-bold text-lg">{user.following?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Seguindo</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{user.followers || 0}</p>
                <p className="text-sm text-muted-foreground">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{organizedEvents.length}</p>
                <p className="text-sm text-muted-foreground">Eventos</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{user.checkIns || 0}</p>
                <p className="text-sm text-muted-foreground">Check-ins</p>
              </div>
            </div>

            <Separator className="my-4" />

            <Tabs defaultValue="attending" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-card/50">
                <TabsTrigger value="attending">Eu Vou</TabsTrigger>
                <TabsTrigger value="saved">Salvos</TabsTrigger>
                <TabsTrigger value="organized">Meus Eventos</TabsTrigger>
              </TabsList>

              <TabsContent value="attending" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingEvents ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)
                  ) : attendingEvents.length > 0 ? (
                    attendingEvents.map(event => (
                      <EventCard key={event.id} event={event} isSaved={user.savedEvents?.includes(event.id)} />
                    ))
                  ) : (
                    <div className="text-muted-foreground col-span-full text-center py-8 flex flex-col items-center gap-2">
                      <PartyPopper className="w-10 h-10" />
                      <p className="font-semibold">Você não confirmou presença em nenhum evento.</p>
                      <p className="text-sm">Bora sair de casa?</p>
                      <Button asChild className="mt-4" variant="link">
                        <Link href="/events">Ver eventos</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="saved" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingEvents ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)
                  ) : savedEvents.length > 0 ? (
                    savedEvents.map(event => (
                      <EventCard key={event.id} event={event} isSaved={true} />
                    ))
                  ) : (
                    <div className="text-muted-foreground col-span-full text-center py-8 flex flex-col items-center gap-2">
                      <PartyPopper className="w-10 h-10" />
                      <p className="font-semibold">Nenhum evento salvo ainda</p>
                      <p className="text-sm">Explore a cidade e salve os rolês que mais gostar!</p>
                      <Button asChild className="mt-4" variant="link">
                        <Link href="/events">Encontrar eventos</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="organized" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingEvents ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)
                  ) : organizedEvents.length > 0 ? (
                    organizedEvents.map(event => (
                      <EventCard key={event.id} event={event} isSaved={user.savedEvents?.includes(event.id)} />
                    ))
                  ) : (
                    <div className="text-muted-foreground col-span-full text-center py-8 flex flex-col items-center gap-2">
                      <PartyPopper className="w-10 h-10" />
                      <p className="font-semibold">Você ainda não criou nenhum evento.</p>
                      <p className="text-sm">Que tal começar agora?</p>
                      <Button asChild className="mt-4">
                        <Link href="/events/create">Criar meu primeiro rolê</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

          </main>
        </motion.div>
      </ClientOnly>
    </AppLayout>
  );
}
