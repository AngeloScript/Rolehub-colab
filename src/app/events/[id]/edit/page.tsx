"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TicketLotsManager, TicketLotInput } from "@/components/event/TicketLotsManager";


const eventSchema = z.object({
    title: z.string().min(5, "O título deve ter pelo menos 5 caracteres.").transform(val => val.charAt(0).toUpperCase() + val.slice(1)),
    description: z.string().min(20, "A descrição deve ter pelo menos 20 caracteres."),
    locationName: z.string().min(3, "O nome do local é obrigatório."),
    // location: z.custom<Location | null>(val => val !== null, "Por favor, busque e defina uma localização no mapa."), // Disabled for edit to simplify
    date: z.date({ required_error: "A data é obrigatória." }),
    time: z.string().min(1, "A hora é obrigatória."),
    tags: z.array(z.string()).min(1, "Selecione pelo menos uma tag."),
    // image: z.any().optional(), // Not updating form value for image in this simplified version to avoid schema issues locally
    maxParticipants: z.coerce.number().min(2, "O evento deve ter pelo menos 2 participantes.").optional().or(z.literal('')),
    isChatEnabled: z.boolean().default(true),
    privacy: z.enum(["public", "private"]).default("public"),
    price: z.coerce.number().min(0, "O preço não pode ser negativo.").default(0),
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    secondaryColor: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function EditEventPage() {
    const params = useParams();
    const eventId = typeof params.id === 'string' ? params.id : '';

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [lots, setLots] = useState<TicketLotInput[]>([]);
    const router = useRouter();
    const { toast } = useToast();
    const { user: authUser, loading: authLoading } = useAuth();

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: "",
            description: "",
            locationName: "",
            // location: null,
            time: "",
            tags: [],
            maxParticipants: '',
            isChatEnabled: true,
            privacy: "public",
            price: 0,
        },
    });

    // Fetch Event Data
    useEffect(() => {
        if (!eventId || authLoading) return;
        if (!authUser) {
            return;
        }

        const fetchEvent = async () => {
            try {
                const { data: event, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (error) throw error;
                if (event.organizer_id !== authUser.id) {
                    toast({ variant: 'destructive', title: 'Acesso negado', description: 'Você não é o organizador deste evento.' });
                    router.push(`/events/${eventId}`);
                    return;
                }

                // Fetch Lots
                const { data: lotsData } = await supabase
                    .from('event_lots')
                    .select('*')
                    .eq('event_id', eventId);

                if (lotsData) {
                    setLots(lotsData.map(l => ({
                        id: l.id,
                        name: l.name,
                        price: l.price,
                        quantity: l.quantity,
                        startDate: l.start_date ? l.start_date.split('T')[0] : '',
                        active: l.active
                    })));
                }

                // Set Form Values
                const eventDate = new Date(event.date_time || event.date); // Use date_time if available
                form.reset({
                    title: event.title,
                    description: event.description,
                    locationName: event.location_name,
                    // location: { address: event.location, lat: 0, lng: 0 },
                    date: eventDate,
                    time: format(eventDate, 'HH:mm'),
                    tags: event.tags || [],
                    maxParticipants: event.max_participants || '',
                    isChatEnabled: event.is_chat_enabled,
                    privacy: event.privacy,
                    price: event.price || 0,
                    primaryColor: event.primary_color,
                    backgroundColor: event.background_color,
                    secondaryColor: event.secondary_color
                });
                setImagePreview(event.image_url);

            } catch (error) {
                console.error("Error fetching event:", error);
                toast({ variant: 'destructive', title: 'Erro ao carregar evento' });
                router.push('/events');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();

    }, [eventId, authUser, authLoading, router, form, toast]);


    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUri = reader.result as string;
                setImagePreview(dataUri);
                // form.setValue("image", dataUri); // Not updating form value for image in this simplified version to avoid schema issues locally
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: EventFormValues) => {
        if (!authUser) return;
        setIsSubmitting(true);

        try {
            let imageUrl = imagePreview;

            // Upload if new image
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${authUser.id}-${Math.random()}.${fileExt}`;
                const filePath = `events/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('rolehub')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('rolehub')
                    .getPublicUrl(filePath);

                imageUrl = urlData.publicUrl;
            }

            // Combine date and time
            const [hours, minutes] = data.time.split(':').map(Number);
            const eventDateTime = new Date(data.date);
            eventDateTime.setHours(hours, minutes, 0, 0);

            const { error: updateError } = await supabase
                .from('events')
                .update({
                    title: data.title,
                    description: data.description,
                    image_url: imageUrl,
                    date: eventDateTime.toISOString(),
                    date_time: eventDateTime.toISOString(),
                    // location: data.location?.address, // Skipping location update complexity for now
                    location_name: data.locationName,
                    tags: data.tags.map(tag => tag.trim().toLowerCase()),
                    max_participants: data.maxParticipants ? Number(data.maxParticipants) : null,
                    is_chat_enabled: data.isChatEnabled,
                    privacy: data.privacy,
                    price: data.price,
                    // Colors if changed/generated (not fully implemented in edit yet, but keeping structure)
                })
                .eq('id', eventId);

            if (updateError) throw updateError;

            // Handle Lots Sync
            // Strategy:
            // 1. Identify new lots (numeric/random ID that doesn't exist in DB? Or just use upsert)
            // 2. Identify deleted lots (exist in DB but not in current list) -> Delete
            // 3. Upsert current list.

            // For simplicity/robustness:
            // We can upsert all valid lots.
            // NOTE: We need real UUIDs for DB updates. Frontend generates temp IDs.
            // If lot.id is NOT a UUID (e.g. short random string), it's new -> insert (let DB gen UUID)
            // If lot.id IS UUID, it's existing -> update.

            // Better approach for now: Delete all lots for this event and re-insert?
            // RLS might block deleting if sold? Assuming no sales yet specifically tracked by lot ID in this MVP.
            // Let's try upsert logic.

            // Actually, since we don't track lot_id on ticket sale yet in this plan, we can just sync.
            // But preserving IDs is good practice.

            // Let's simplified sync:
            // We need to know which IDs to keep.

            const uuidLots = lots.filter(l => l.id && l.id.length > 20); // Simple check for UUID-ish length
            const uuidList = uuidLots.map(l => l.id);

            if (uuidList.length > 0) {
                await supabase.from('event_lots').delete().eq('event_id', eventId).not('id', 'in', `(${uuidList.join(',')})`);
            } else {
                // If no UUID lots left, delete all
                await supabase.from('event_lots').delete().eq('event_id', eventId);
            }

            // Upsert/Insert
            const lotsToUpsert = lots.map(lot => {
                const isNew = lot.id.length < 20;
                return {
                    id: isNew ? undefined : lot.id, // Let DB generate if new
                    event_id: eventId,
                    name: lot.name,
                    price: lot.price,
                    quantity: lot.quantity,
                    start_date: lot.startDate,
                    active: lot.active
                };
            });

            if (lotsToUpsert.length > 0) {
                const { error: lotError } = await supabase.from('event_lots').upsert(lotsToUpsert);
                if (lotError) console.error("Error updating lots:", lotError);
            }

            toast({
                title: "Evento Atualizado!",
                description: "As alterações foram salvas com sucesso.",
            });

            router.push(`/events/${eventId}`);

        } catch (error) {
            console.error("Error updating event: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao Atualizar",
                description: "Não foi possível salvar as alterações."
            });
            setIsSubmitting(false);
        }
    };

    if (isLoading || authLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="pb-24 md:pb-4">
                <PageHeader title="Editar Evento" subtitle={`Editando: ${form.getValues('title')}`} />
                <main className="px-4 max-w-2xl mx-auto">
                    <Card className="bg-card/50">
                        <CardContent className="p-4 md:p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                    {/* Reusing fields structure from Create Page - abbreviated for this edit */}

                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Título do Evento</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descrição</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} className="min-h-[120px]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Image Upload Simplified */}
                                    <div className="space-y-2">
                                        <Label>Banner</Label>
                                        <div className="flex gap-4">
                                            {imagePreview &&
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-md" />
                                            }
                                            <Input type="file" onChange={handleImageChange} accept="image/*" />
                                        </div>
                                    </div>


                                    {/* Location, Date, Time, etc */}
                                    <FormField
                                        control={form.control}
                                        name="locationName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Local</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preço Base (R$)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.01" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="maxParticipants"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Máx. Participantes</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Lots Manager */}
                                    <div className="pt-2 pb-4">
                                        <TicketLotsManager lots={lots} onChange={setLots} />
                                    </div>


                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Data</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className={cn(!field.value && "text-muted-foreground")}>
                                                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Data"}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Hora</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="time" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full font-bold text-lg h-12" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full" onClick={() => router.back()}>
                                        Cancelar
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </AppLayout>
    );
}
