import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EventGalleryProps {
    eventId: string;
    eventDate: string; // To check if upload should be allowed
}

interface Photo {
    id: string;
    url: string;
    caption?: string;
    user_id: string;
    authorName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    created_at: any;
}

export function EventGallery({ eventId }: EventGalleryProps) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const fetchPhotos = async () => {
            const { data, error } = await supabase
                .from('event_photos')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching photos:", error);
            } else if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const photos = data.map((photo: any) => ({
                    id: photo.id,
                    url: photo.url,
                    user_id: photo.user_id,
                    authorName: photo.author_name || 'Usuário',
                    created_at: photo.created_at,
                    caption: photo.caption
                }));
                setPhotos(photos);
            }
            setIsLoading(false);
        };

        fetchPhotos();
    }, [eventId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Arquivo muito grande", description: "Máximo 5MB." });
            return;
        }

        setIsUploading(true);
        try {
            const filePath = `events/${eventId}/${user.id}-${Date.now()}`;
            const { error: uploadError } = await supabase.storage.from('rolehub').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('rolehub').getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('event_photos')
                .insert({
                    event_id: eventId,
                    url: urlData.publicUrl,
                    user_id: user.id,
                    author_name: user.user_metadata?.name || 'Anônimo'
                });

            if (dbError) throw dbError;

            toast({ title: "Foto adicionada!" });
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast({ variant: "destructive", title: "Erro no upload" });
        } finally {
            setIsUploading(false);
        }
    };

    // Allow upload only if event has started (simplified check) or user is organizer (not checked here for simplicity, allowing all logged in users)
    // Ideally check against event date.
    const canUpload = !!user;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Galeria
                </h3>
                {canUpload && (
                    <div className="relative">
                        <input
                            type="file"
                            id="gallery-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                        <Button size="sm" variant="outline" disabled={isUploading} asChild>
                            <label htmlFor="gallery-upload" className="cursor-pointer">
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Adicionar Foto
                            </label>
                        </Button>
                    </div>
                )}
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-32 rounded-md" />)
                    ) : photos.length > 0 ? (
                        photos.map((photo) => (
                            <Dialog key={photo.id}>
                                <DialogTrigger asChild>
                                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity">
                                        <Image
                                            src={photo.url}
                                            alt={`Foto por ${photo.authorName}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-black/90 border-none">
                                    <div className="relative h-[80vh] w-full">
                                        <Image
                                            src={photo.url}
                                            alt={`Foto por ${photo.authorName}`}
                                            fill
                                            className="object-contain"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                            <p className="text-sm font-medium">Foto por {photo.authorName}</p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-32 w-full text-muted-foreground text-sm px-8">
                            Nenhuma foto ainda. Seja o primeiro a postar!
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
