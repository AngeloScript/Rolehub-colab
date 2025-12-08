"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const reactions = [
    { emoji: '👍', label: 'Curtir', value: 'like' },
    { emoji: '❤️', label: 'Amar', value: 'love' },
    { emoji: '😂', label: 'Engraçado', value: 'haha' },
    { emoji: '😮', label: 'Uau', value: 'wow' },
    { emoji: '😢', label: 'Triste', value: 'sad' },
];

interface ReactionButtonProps {
    commentId: string;
    currentReactions?: Record<string, string[]>; // { like: ['userId1', 'userId2'], love: [...] }
    userId?: string;
    onReact: (commentId: string, reaction: string) => Promise<void>;
}

export function ReactionButton({ commentId, currentReactions = {}, userId, onReact }: ReactionButtonProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [isReacting, setIsReacting] = useState(false);

    const getUserReaction = () => {
        if (!userId) return null;
        for (const [reaction, users] of Object.entries(currentReactions)) {
            if (users.includes(userId)) return reaction;
        }
        return null;
    };

    const userReaction = getUserReaction();

    const handleReaction = async (reactionValue: string) => {
        if (!userId || isReacting) return;
        setIsReacting(true);
        setShowPicker(false);
        try {
            await onReact(commentId, reactionValue);
        } finally {
            setIsReacting(false);
        }
    };

    const getTotalReactions = () => {
        return Object.values(currentReactions).reduce((sum, users) => sum + users.length, 0);
    };

    const totalReactions = getTotalReactions();

    return (
        <div className="relative">
            <button
                onClick={() => setShowPicker(!showPicker)}
                className={cn(
                    "text-xs px-2 py-1 rounded-full transition-colors flex items-center gap-1",
                    userReaction
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground"
                )}
            >
                {userReaction ? reactions.find(r => r.value === userReaction)?.emoji : '👍'}
                {totalReactions > 0 && <span className="font-medium">{totalReactions}</span>}
            </button>

            {showPicker && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-full shadow-lg p-2 flex gap-1 z-10"
                >
                    {reactions.map((reaction) => (
                        <button
                            key={reaction.value}
                            onClick={() => handleReaction(reaction.value)}
                            className="hover:scale-125 transition-transform text-2xl p-1"
                            title={reaction.label}
                        >
                            {reaction.emoji}
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
