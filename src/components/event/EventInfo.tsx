"use client";

import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { Separator } from '@/components/ui/separator';
import type { Event, User } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';

interface EventInfoProps {
    event: Event;
    isEventToday: boolean;
    isCheckedIn: boolean;
    authUser: User | null;
    onCheckIn: () => void;
}

const formatEventDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        // Check if it's an ISO string or valid date format
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        }

        // Fallback for "DD MMM" format (legacy/AI generated)
        const [day, month] = dateString.split(' ');
        if (!day || !month) return dateString;

        const monthIndex = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].indexOf(month.toUpperCase());
        if (monthIndex === -1) return dateString;

        const year = new Date().getFullYear();
        const customDate = new Date(year, monthIndex, parseInt(day));

        // If date has passed this year, assume next year
        if (customDate < new Date() && customDate.getMonth() < new Date().getMonth()) {
            customDate.setFullYear(year + 1);
        }
        return format(customDate, "dd 'de' MMMM", { locale: ptBR });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString;
    }
}

const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
        }
        return part;
    });
};

import { motion } from 'framer-motion';

// ... imports

export function EventInfo({ event, isEventToday, isCheckedIn, authUser, onCheckIn }: EventInfoProps) {
    const [formattedDate, setFormattedDate] = useState(event.date);

    useEffect(() => {
        setFormattedDate(formatEventDate(event.date));
    }, [event.date]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-5 h-5 text-[hsl(var(--page-primary))]" />
                    <span className="font-medium text-foreground">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="w-5 h-5 text-[hsl(var(--page-primary))]" />
                    <span className="font-medium text-foreground">{event.time}</span>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground col-span-2">
                    <MapPin className="w-5 h-5 text-[hsl(var(--page-primary))] mt-0.5 shrink-0" />
                    <span className="font-medium text-foreground">{event.locationName}</span>
                </div>
            </motion.div>

            {isEventToday && authUser && (
                <motion.div variants={item}>
                    <Button
                        variant={isCheckedIn ? "secondary" : "default"}
                        size="lg"
                        className="w-full md:w-auto"
                        onClick={onCheckIn}
                        style={{ '--primary': 'var(--page-primary)', '--secondary': 'var(--page-secondary)' } as React.CSSProperties}
                        disabled={isCheckedIn}
                    >
                        <CheckCircle className="mr-2" />
                        {isCheckedIn ? "Checked-in" : "Check-in"}
                    </Button>
                </motion.div>
            )}

            <motion.div variants={item}>
                <Separator className="bg-border/20" />
            </motion.div>

            <motion.div variants={item}>
                <div className="flex items-center gap-4 mb-4">
                    {event.organizer && (
                        <UserProfileDialog user={event.organizer}>
                            <Avatar className="w-12 h-12 cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
                                <AvatarImage src={event.organizer.avatar} alt={event.organizer.name} />
                                <AvatarFallback>{event.organizer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </UserProfileDialog>
                    )}
                    <div>
                        <p className="text-sm text-muted-foreground">Organizado por</p>
                        <p className="font-semibold text-foreground">{event.organizer?.name || 'Anônimo'}</p>
                    </div>
                </div>
                <h2 className="text-xl font-headline font-semibold mb-3 text-[hsl(var(--page-primary))]">Sobre este evento</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{linkify(event.description)}</p>
            </motion.div>
        </motion.div>
    );
}
