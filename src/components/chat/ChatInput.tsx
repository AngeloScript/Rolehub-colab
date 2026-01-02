
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Smile, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ChatInputProps {
    onSendMessage: (text: string, mediaUrl?: string, mediaType?: 'image' | 'audio' | 'video') => void;
    isLoading?: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleSend = () => {
        if ((!message.trim()) || isLoading || isUploading) return;
        onSendMessage(message);
        setMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Arquivo muito grande", description: "O limite é 5MB." });
            return;
        }

        setIsUploading(true);
        try {
            const fileName = `chat/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('rolehub') // Using same bucket for demo
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('rolehub').getPublicUrl(fileName);

            // Send immediately as media message
            onSendMessage('', data.publicUrl, 'image');

        } catch (error) {
            console.error("Upload error:", error);
            toast({ variant: "destructive", title: "Erro ao enviar imagem" });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div className="p-3 bg-background border-t flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                aria-label="Anexar arquivo"
            />
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-5 h-5" />
            </Button>

            <div className="relative flex-grow">
                <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma mensagem..."
                    className="pr-10 rounded-full bg-muted/50 border-none focus-visible:ring-1"
                    disabled={isLoading || isUploading}
                />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full text-muted-foreground hover:bg-transparent">
                    <Smile className="w-5 h-5" />
                </Button>
            </div>

            <Button
                onClick={handleSend}
                disabled={(!message.trim() && !isUploading) || isLoading}
                size="icon"
                className="shrink-0 rounded-full"
            >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
        </div>
    );
}
