"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Image as ImageIcon, Loader2, MapPin, Tag, Text, Upload, Wand2, Users, MessageSquare, Palette, Lock, Globe, DollarSign } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { generateEventDetails, GenerateEventDetailsInput } from "@/ai/flows/generate-event-details";

import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Location } from "@/components/EventMapCreator";
import dynamic from 'next/dynamic';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DynamicColorCircle } from "@/components/DynamicColorCircle";
import { TicketLotsManager, TicketLotInput } from "@/components/event/TicketLotsManager";

const DynamicEventMapCreator = dynamic(() => import('@/components/EventMapCreator'), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded-lg bg-muted animate-pulse" />,
});


const eventSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres.").transform(val => val.charAt(0).toUpperCase() + val.slice(1)),
  description: z.string().min(20, "A descrição deve ter pelo menos 20 caracteres."),
  locationName: z.string().min(3, "O nome do local é obrigatório."),
  location: z.custom<Location | null>(val => val !== null, "Por favor, busque e defina uma localização no mapa."),
  date: z.date({ required_error: "A data é obrigatória." }),
  time: z.string().min(1, "A hora é obrigatória."),
  tags: z.array(z.string()).min(1, "Selecione pelo menos uma tag."),
  image: z.any().optional(),
  maxParticipants: z.coerce.number().min(2, "O evento deve ter pelo menos 2 participantes.").optional().or(z.literal('')),
  isChatEnabled: z.boolean().default(true),
  privacy: z.enum(["public", "private"]).default("public"),
  price: z.coerce.number().min(0, "O preço não pode ser negativo.").default(0),
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const PREDEFINED_TAGS = [
  "Festa", "Show", "Bar", "Esporte", "Gastronomia", "Arte", "Tecnologia", "Networking", "Ao Ar Livre", "Jogos", "Cinema", "Dança"
];

export default function CreateEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTheme] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [themeColors] = useState<{ primary: string; background: string; secondary: string; } | null>(null);
  const [customTag, setCustomTag] = useState("");
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
      location: null,
      time: "",
      tags: [],
      maxParticipants: '',
      isChatEnabled: true,
      privacy: "public",
      price: 0,
    },
  });

  const handleLocationChange = useCallback((location: Location) => {
    form.setValue("location", location, { shouldValidate: true });
  }, [form]);


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue("image", dataUri);
        // Comentado: geração automática de tema requer GEMINI_API_KEY
        // generateThemeFromImage(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };





  const handleAddTag = (tag: string) => {
    const currentTags = form.getValues("tags");
    if (!currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag]);
    }
    setCustomTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleGenerateWithAI = async () => {
    const title = form.getValues("title");
    if (!title || title.length < 5) {
      form.setError("title", { message: "Forneça uma ideia de título com pelo menos 5 caracteres para a IA." });
      return;
    }
    setIsGenerating(true);
    try {
      const input: GenerateEventDetailsInput = { idea: title };
      const result = await generateEventDetails(input);

      form.setValue("description", result.description, { shouldValidate: true });
      form.setValue("locationName", result.location, { shouldValidate: true });

      // Parse date string (DD/MM/YYYY or similar) to Date object if possible, otherwise default to today
      // This is a simplification, robust parsing might be needed depending on AI output format
      const today = new Date();
      form.setValue("date", today, { shouldValidate: true });

      form.setValue("time", result.time, { shouldValidate: true });
      form.setValue("tags", result.tags, { shouldValidate: true });

      // Pass address to map component to trigger geocoding
      form.setValue("location", { lat: 0, lng: 0, address: result.location });

      toast({
        title: "Detalhes gerados com IA!",
        description: "Os campos foram preenchidos. Revise e ajuste se necessário.",
      });

    } catch (error) {
      console.error("Error generating event with AI:", error);
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível gerar os detalhes. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const onSubmit = async (data: EventFormValues) => {
    if (!authUser) {
      toast({
        variant: "destructive",
        title: "Você não está logado!",
        description: "Por favor, faça login para criar um evento.",
      });
      return;
    }

    if (!data.location) {
      toast({
        variant: "destructive",
        title: "Localização Inválida",
        description: "Por favor, busque e defina uma localização no mapa.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = imagePreview;

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
      } else if (!imageUrl) {
        imageUrl = `https://placehold.co/1280x720.png?text=${encodeURIComponent(data.title)}`;
      }

      // Combine date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      const eventDateTime = new Date(data.date);
      eventDateTime.setHours(hours, minutes, 0, 0);

      const { data: eventData, error: insertError } = await supabase
        .from('events')
        .insert({
          title: data.title,
          description: data.description,
          image_url: imageUrl,
          date: eventDateTime.toISOString(), // Keep for legacy if needed
          date_time: eventDateTime.toISOString(), // New standard field
          location: data.location.address,
          location_name: data.locationName,
          organizer_id: authUser.id,
          tags: data.tags.map(tag => tag.trim().toLowerCase()),
          vibes: { hot: 0, cold: 0 },
          max_participants: data.maxParticipants ? Number(data.maxParticipants) : null,
          is_chat_enabled: data.isChatEnabled,
          privacy: data.privacy,
          primary_color: data.primaryColor || null,
          background_color: data.backgroundColor || null,
          secondary_color: data.secondaryColor || null,
          price: data.price,
          currency: 'BRL'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (lots.length > 0) {
        const { error: lotsError } = await supabase
          .from('event_lots')
          .insert(lots.map(lot => ({
            event_id: eventData.id,
            name: lot.name,
            price: lot.price,
            quantity: lot.quantity,
            start_date: lot.startDate,
            active: lot.active
          })));

        if (lotsError) {
          console.error("Error inserting lots:", lotsError);
          // Optional: delete event or show warning, but for now just warn
          toast({
            variant: "destructive",
            title: "Erro ao criar lotes",
            description: "O evento foi criado, mas houve um erro ao salvar os lotes de ingressos."
          });
        }
      }

      toast({
        title: "Evento Criado com Sucesso!",
        description: `Seu evento "${data.title}" foi publicado.`,
      });

      router.push(`/events/${eventData.id}`);

    } catch (error) {
      console.error("Error adding document: ", error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      toast({
        variant: "destructive",
        title: "Erro ao Criar Evento",
        description: `Não foi possível salvar o evento. ${errorMessage}`,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="pb-24 md:pb-4">
        <PageHeader title="Crie seu Rolê" subtitle="Divulgue sua festa, encontro ou evento" />
        <main className="px-4 max-w-2xl mx-auto">
          <Card className="bg-card/50">
            <CardContent className="p-4 md:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("Validation Errors:", JSON.stringify(errors, null, 2)))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Evento</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Text className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input {...field} placeholder="Ex: Festa de Rock com tema anos 80" className="pl-10 pr-24" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                              onClick={handleGenerateWithAI}
                              disabled={isGenerating}
                            >
                              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                              Gerar
                            </Button>
                          </div>
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
                          <Textarea {...field} placeholder="Conte mais sobre o que vai rolar no seu evento..." className="min-h-[120px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Banner do Evento</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0 relative">
                        {imagePreview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <FormField
                          control={form.control}
                          name="image"
                          render={() => (
                            <FormItem>
                              <FormControl>
                                <Button asChild variant="outline" className="w-full">
                                  <Label className="cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Carregar Imagem
                                    <Input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={handleImageChange}
                                    />
                                  </Label>
                                </Button>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {isGeneratingTheme && (
                          <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analisando cores...</span>
                          </div>
                        )}

                        {themeColors && (
                          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                            <Palette className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Cores do tema:</span>
                            <DynamicColorCircle color={themeColors.primary} />
                            <DynamicColorCircle color={themeColors.background} />
                            <DynamicColorCircle color={themeColors.secondary} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="locationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Local</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input {...field} placeholder="Ex: Bar do Zé, Parque da Cidade" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço e Mapa</FormLabel>
                        <FormControl>
                          <DynamicEventMapCreator
                            onLocationChange={handleLocationChange}
                            initialAddress={field.value?.address}
                          />
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
                          <FormLabel>Preço do Ingresso (R$)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input {...field} type="number" placeholder="0.00" className="pl-10" step="0.01" min="0" />
                            </div>
                          </FormControl>
                          <FormDescription>Deixe 0 para evento gratuito</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Only show lot manager if price is > 0 or if lots exist */}
                    {(form.watch("price") > 0 || lots.length > 0) && (
                      <div className="col-span-1 md:col-span-2 pt-2 pb-4">
                        <TicketLotsManager
                          lots={lots}
                          onChange={setLots}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº Máximo de Pessoas</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input {...field} type="number" placeholder="Ilimitado" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
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
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input {...field} type="time" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags do Rolê</FormLabel>
                          <FormDescription>
                            Selecione tags que combinam com seu evento ou adicione novas.
                          </FormDescription>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {PREDEFINED_TAGS.map(tag => (
                                  <Badge
                                    key={tag}
                                    variant={field.value.includes(tag) ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-primary/90"
                                    onClick={() => field.value.includes(tag) ? handleRemoveTag(tag) : handleAddTag(tag)}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Adicionar tag personalizada..."
                                    className="pl-9"
                                    value={customTag}
                                    onChange={(e) => setCustomTag(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (customTag.trim()) {
                                          handleAddTag(customTag.trim());
                                        }
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => {
                                    if (customTag.trim()) {
                                      handleAddTag(customTag.trim());
                                    }
                                  }}
                                  disabled={!customTag.trim()}
                                >
                                  Adicionar
                                </Button>
                              </div>

                              {field.value.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/30 rounded-md border border-dashed">
                                  <span className="text-xs text-muted-foreground w-full mb-1">Selecionadas:</span>
                                  {field.value.map(tag => (
                                    <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                                      {tag}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                      >
                                        <Loader2 className="w-3 h-3 opacity-0" /> {/* Spacer hack */}
                                        <span className="absolute inset-0 flex items-center justify-center text-xs">×</span>
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="privacy"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Privacidade do Evento</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="public" />
                              </FormControl>
                              <div className="flex-1">
                                <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                                  <Globe className="w-4 h-4 text-primary" />
                                  Público
                                </FormLabel>
                                <FormDescription>
                                  Qualquer pessoa pode ver e participar do evento.
                                </FormDescription>
                              </div>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="private" />
                              </FormControl>
                              <div className="flex-1">
                                <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                                  <Lock className="w-4 h-4 text-primary" />
                                  Privado
                                </FormLabel>
                                <FormDescription>
                                  Apenas convidados ou pessoas aprovadas podem ver detalhes.
                                </FormDescription>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="isChatEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg p-3 bg-muted/50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Habilitar Chat do Rolê
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Permitir que os participantes conversem entre si.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />


                  <Button type="submit" className="w-full font-bold text-lg h-12" disabled={isSubmitting || isGenerating || isGeneratingTheme || authLoading}>
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Publicar Evento"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppLayout >
  );
}
