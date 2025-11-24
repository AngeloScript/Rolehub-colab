"use client";

import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
    eventId: string;
    eventTitle: string;
    eventDescription?: string;
}

export function ShareButton({ eventId, eventTitle, eventDescription }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const eventUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/events/${eventId}`
        : '';

    const shareText = `Confira esse evento: ${eventTitle}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            setCopied(true);
            toast({
                variant: "success",
                title: "Link copiado!",
                description: "O link do evento foi copiado para a área de transferência"
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao copiar",
                description: "Não foi possível copiar o link"
            });
        }
    };

    const handleWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${eventUrl}`)}`;
        window.open(url, '_blank');
    };

    const handleTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`;
        window.open(url, '_blank');
    };

    const handleFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
        window.open(url, '_blank');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copiado!' : 'Copiar link'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleWhatsApp}>
                    <span className="mr-2">💬</span>
                    WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTwitter}>
                    <span className="mr-2">🐦</span>
                    Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFacebook}>
                    <span className="mr-2">📘</span>
                    Facebook
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
