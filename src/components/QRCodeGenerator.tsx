"use client";

import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download } from 'lucide-react';

interface QRCodeGeneratorProps {
    eventId: string;
    eventTitle: string;
}

export function QRCodeGenerator({ eventId }: QRCodeGeneratorProps) {
    const checkInUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/events/${eventId}/checkin`
        : '';

    const downloadQR = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `qrcode-${eventId}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code Check-in
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code para Check-in</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="bg-white p-4 rounded-lg">
                        <QRCodeSVG
                            id="qr-code-svg"
                            value={checkInUrl}
                            size={256}
                            level="H"
                            includeMargin
                        />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                        Participantes podem escanear este QR Code para fazer check-in no evento
                    </p>
                    <Button onClick={downloadQR} variant="secondary" className="gap-2">
                        <Download className="w-4 h-4" />
                        Baixar QR Code
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
