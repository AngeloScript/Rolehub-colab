"use client";

import React from 'react';
import { Flame, Snowflake, ThumbsUp, ThumbsDown, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User } from '@/lib/types';
import { Event } from '@/lib/types';

interface EventVibeCheckProps {
    event: Event;
    vibeVote: 'hot' | 'cold' | null;
    onVote: (type: 'hot' | 'cold') => void;
    authUser: any; // Using any to be flexible with Firebase User vs Custom User, or strictly User | null
}

export function EventVibeCheck({ event, vibeVote, onVote, authUser }: EventVibeCheckProps) {
    const totalVibes = (event.vibes?.hot || 0) + (event.vibes?.cold || 0);
    const hotPercentage = totalVibes > 0 ? ((event.vibes?.hot || 0) / totalVibes) * 100 : 50;

    return (
        <div className="bg-card/50 rounded-lg p-4 border border-border/50">
            <h3 className="text-lg font-headline font-semibold mb-4 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-[hsl(var(--page-primary))]" />
                Qual a vibe?
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-medium">
                    <span className="flex items-center gap-1.5"><Snowflake className="w-4 h-4 text-blue-400" /> Tranquilo</span>
                    <span className="flex items-center gap-1.5">Bombando <Flame className="w-4 h-4 text-orange-400" /></span>
                </div>
                <Progress value={hotPercentage} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-orange-400" />
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={vibeVote === 'cold' ? 'secondary' : 'outline'}
                        className="w-full"
                        onClick={() => onVote('cold')}
                        disabled={!!vibeVote || !authUser}
                        style={{ '--secondary': 'var(--page-secondary)' } as React.CSSProperties}
                    >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Tranquilo
                    </Button>
                    <Button
                        size="sm"
                        variant={vibeVote === 'hot' ? 'secondary' : 'outline'}
                        className="w-full"
                        onClick={() => onVote('hot')}
                        disabled={!!vibeVote || !authUser}
                        style={{ '--secondary': 'var(--page-secondary)' } as React.CSSProperties}
                    >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Bombando
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">{totalVibes} votos</p>
            </div>
        </div>
    );
}
