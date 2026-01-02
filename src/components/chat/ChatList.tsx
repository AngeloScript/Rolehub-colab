
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatConversation } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface ChatListProps {
    conversations: ChatConversation[];
}

export function ChatList({ conversations }: ChatListProps) {
    return (
        <div className="space-y-1">
            {conversations.map((conv) => (
                <Link
                    key={conv.id}
                    href={`/messages/${conv.otherUser?.id || conv.id}`}
                    className="block"
                >
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0 cursor-pointer">
                        <div className="relative">
                            <Avatar className="w-12 h-12 border">
                                <AvatarImage src={conv.otherUser?.avatar} />
                                <AvatarFallback>{conv.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            {/* Status Indicator (Mock) -> Could use real status if available */}
                            {/* <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span> */}
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-semibold text-sm md:text-base truncate">{conv.otherUser?.name || 'Usuário'}</h3>
                                {conv.lastMessageTimestamp && (
                                    <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                                        {formatDistanceToNow(new Date(conv.lastMessageTimestamp), { addSuffix: false, locale: ptBR })}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs md:text-sm text-muted-foreground truncate leading-snug max-w-[90%]">
                                    {conv.lastMessage || 'Inicie a conversa...'}
                                </p>
                                {/* Unread Badge (Mock) */}
                                {conv.unread && (
                                    <span className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                                        1
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
