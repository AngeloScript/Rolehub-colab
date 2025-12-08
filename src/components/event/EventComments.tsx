"use client";

import { useState } from 'react';
import { Send, Loader2, MessageSquare, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import type { Event, Comment, User } from '@/lib/types';
import { EventChat } from './EventChat';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThumbsUp as ThumbsUpSolid } from 'lucide-react';

interface EventCommentsProps {
    event: Event;
    comments: Comment[];
    authUser: User | null;
    onPostComment: (text: string) => void;
    onLikeComment: (id: string) => void;
    isPostingComment: boolean;
    isGoing: boolean;
}

const formatRelativeTime = (isoString: string) => {
    try {
        const date = parseISO(isoString);
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
        return "agora mesmo";
    }
};

const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
        }
        return part;
    });
};

export function EventComments({
    event,
    comments,
    authUser,
    onPostComment,
    onLikeComment,
    isPostingComment,
    isGoing
}: EventCommentsProps) {
    const [newComment, setNewComment] = useState('');

    const handlePost = () => {
        onPostComment(newComment);
        setNewComment('');
    };

    return (
        <Tabs defaultValue="comments" className="w-full">
            <TabsList className={cn("grid w-full bg-card/50", event.isChatEnabled ? "grid-cols-2" : "grid-cols-1")}>
                <TabsTrigger value="comments">
                    Comentários <span className='ml-2 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5'>{comments?.length || 0}</span>
                </TabsTrigger>
                {event.isChatEnabled && <TabsTrigger value="chat">Chat do Rolê</TabsTrigger>}
            </TabsList>
            <TabsContent value="comments" className="mt-6">
                <div className="space-y-4">
                    {authUser && (
                        <div className="flex gap-2">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={authUser.avatar || undefined} alt={authUser.name || ''} />
                                <AvatarFallback>{(authUser.name || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="w-full flex items-start gap-2">
                                <Textarea
                                    placeholder="Deixe seu comentário..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="bg-card/50 flex-grow"
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePost())}
                                    disabled={isPostingComment}
                                />
                                <Button onClick={handlePost} size="icon" className="flex-shrink-0 h-10 w-10" style={{ '--primary': 'var(--page-primary)' } as React.CSSProperties} disabled={isPostingComment}>
                                    {isPostingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    )}
                    {comments.length === 0 && !isPostingComment && (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2" />
                            <p>Nenhum comentário ainda.</p>
                            <p className="text-sm">Seja o primeiro a dizer algo!</p>
                        </div>
                    )}
                    {comments.map((comment) => {
                        const isLiked = authUser && comment.likes?.includes(authUser.id);
                        return (
                            <div key={comment.id} className="flex gap-3 items-start">
                                <UserProfileDialog userId={comment.authorId}>
                                    <Avatar className="w-10 h-10 cursor-pointer">
                                        <AvatarImage src={comment.avatar} alt={comment.author || 'Usuário'} />
                                        <AvatarFallback>{(comment.author || 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </UserProfileDialog>
                                <div className="bg-card/50 p-3 rounded-lg w-full">
                                    <div className="flex items-center justify-between">
                                        <UserProfileDialog userId={comment.authorId}>
                                            <p className="font-semibold text-foreground text-sm cursor-pointer hover:underline">{comment.author}</p>
                                        </UserProfileDialog>
                                        <p className="text-xs text-muted-foreground">{formatRelativeTime(comment.timestamp)}</p>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">{linkify(comment.text)}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <button
                                            onClick={() => onLikeComment(comment.id)}
                                            className={cn("flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors", isLiked && "text-primary")}
                                            disabled={!authUser}
                                            aria-label="Curtir comentário"
                                        >
                                            {isLiked ? <ThumbsUpSolid className="w-4 h-4 fill-current" /> : <ThumbsUp className="w-4 h-4" />}
                                            <span>{comment.likes?.length || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </TabsContent>
            {event.isChatEnabled && (
                <TabsContent value="chat" className="mt-6">
                    <EventChat eventId={event.id} isGoing={isGoing} />
                </TabsContent>
            )}
        </Tabs>
    );
}
