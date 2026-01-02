
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
    if (!message) return null;

    const isImage = message?.mediaType === 'image' && message?.mediaUrl;

    // Safe date formatting
    let timeDisplay = '...';
    try {
        if (message?.timestamp) {
            timeDisplay = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    } catch (e) {
        console.warn("Invalid date in message bubble", e);
    }

    return (
        <div className={cn("flex w-full mb-4", isMe ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm relative group",
                    isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                )}
            >
                {/* Media Content */}
                {isImage && (
                    <div className="mb-2 rounded-lg overflow-hidden relative w-full aspect-square md:aspect-video max-h-64">
                        <Image
                            src={message.mediaUrl!}
                            alt="Image attachment"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {/* Text Content */}
                {message?.text && <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{message.text}</p>}

                {/* Metadata (Time + Status) */}
                <div className={cn(
                    "flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70",
                    isMe ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                    <span>
                        {timeDisplay}
                    </span>
                </div>
            </div>
            {/* Logic Extracted as requested */}
            {(() => {
                // Robust Status Normalization
                const isRead = message?.status?.toLowerCase() === 'read';
                return (
                    isMe && (
                        <div className="absolute right-0 bottom-0 mr-1 mb-0.5">
                            <span className="flex items-center">
                                {isRead ? (
                                    // Visual Debug: Force Neon Green
                                    <CheckCheck
                                        className="w-3.5 h-3.5"
                                        style={{ color: '#00FF00', stroke: '#00FF00' }}
                                        strokeWidth={2.5}
                                    />
                                ) : (message?.status === 'delivered') ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                                ) : (
                                    <Check className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                                )}
                            </span>
                        </div>
                    )
                );
            })()}
        </div>
    );
}

