"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventRequestsListProps {
    eventId: string;
}

interface RequestUser {
    id: string;
    name: string;
    email: string;
    avatar: string;
    bio: string;
    relationshipStatus: 'single' | 'dating' | 'married' | 'complicated' | 'not_specified';
    requestStatus: 'pending';
}

export function EventRequestsList({ eventId }: EventRequestsListProps) {
    const [requests, setRequests] = useState<RequestUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const { data, error } = await supabase
                    .from('attendees')
                    .select('user_id, status, users(*)')
                    .eq('event_id', eventId)
                    .eq('status', 'pending');

                if (error) throw error;

                if (data) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedRequests = data.map((item: any) => ({
                        id: item.users.id,
                        name: item.users.name,
                        email: item.users.email,
                        avatar: item.users.avatar,
                        bio: item.users.bio,
                        relationshipStatus: item.users.relationship_status || 'not_specified',
                        requestStatus: item.status
                    }));
                    setRequests(mappedRequests);
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [eventId]);

    const handleAction = async (userId: string, action: 'confirm' | 'reject') => {
        setProcessingId(userId);

        // Optimistic Update
        const originalRequests = [...requests];
        setRequests(prev => prev.filter(r => r.id !== userId));

        try {
            if (action === 'confirm') {
                const { error } = await supabase
                    .from('attendees')
                    .update({ status: 'confirmed' })
                    .eq('event_id', eventId)
                    .eq('user_id', userId);

                if (error) throw error;
                toast({ title: "Participação confirmada!" });
            } else {
                const { error } = await supabase
                    .from('attendees')
                    .delete() // Rejecting removes the request entirely
                    .eq('event_id', eventId)
                    .eq('user_id', userId);

                if (error) throw error;
                toast({ title: "Solicitação recusada." });
            }
        } catch (error) {
            console.error(`Error ${action} request:`, error);
            toast({ variant: "destructive", title: "Erro ao processar solicitação." });
            // Revert
            setRequests(originalRequests);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    if (requests.length === 0) {
        return <div className="text-center p-6 text-muted-foreground">Nenhuma solicitação pendente.</div>;
    }

    return (
        <div className="bg-card rounded-xl border border-border mt-6">
            <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Solicitações Pendentes
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                </h3>
            </div>
            <ScrollArea className="h-[300px]">
                <div className="p-2 space-y-2">
                    {requests.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.relationshipStatus !== 'not_specified' ? user.relationshipStatus : ''}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-200"
                                    onClick={() => handleAction(user.id, 'reject')}
                                    disabled={!!processingId}
                                >
                                    <X size={16} />
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleAction(user.id, 'confirm')}
                                    disabled={!!processingId}
                                >
                                    <Check size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
